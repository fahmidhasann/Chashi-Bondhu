
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { AnalysisResult, ChatMessage, GroundingChunk } from './types';
import { analyzeCropDisease, generateSpeech, ContentBlockedError, NoAnalysisError, JsonParsingError, ApiError } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import ChatInterface from './components/ChatInterface';
import ApiKeyInstructions from './components/ApiKeyInstructions';
import { translations } from './translations';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });


// Audio decoding utilities from @google/genai documentation
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Structured error state for rich feedback
interface ErrorState {
  titleKey: keyof typeof translations.en;
  messageKey: keyof typeof translations.en;
  type: 'content' | 'analysis' | 'parsing' | 'network' | 'generic';
}

// Component to display typed errors
const ErrorDisplay: React.FC<{ error: ErrorState; t: (key: string) => string; }> = ({ error, t }) => {
    const colorClasses = {
        content: 'border-red-500 text-red-800 dark:text-red-200 bg-red-50 dark:bg-gray-800',
        analysis: 'border-yellow-500 text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-gray-800',
        parsing: 'border-orange-500 text-orange-800 dark:text-orange-200 bg-orange-50 dark:bg-gray-800',
        network: 'border-blue-500 text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-gray-800',
        generic: 'border-gray-500 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800',
    };
    
    const iconColorClasses = {
        content: 'text-red-500',
        analysis: 'text-yellow-500',
        parsing: 'text-orange-500',
        network: 'text-blue-500',
        generic: 'text-gray-500',
    };

    const icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mx-auto mb-3 ${iconColorClasses[error.type]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
  
    return (
      <div className={`text-center p-6 border-l-4 rounded-lg shadow-md w-full animate-fade-in ${colorClasses[error.type]}`}>
        {icon}
        <h3 className="text-xl font-bold mb-2">{t(error.titleKey)}</h3>
        <p className="dark:text-gray-300 text-gray-700">{t(error.messageKey)}</p>
      </div>
    );
};

const PhotoTips: React.FC<{ t: (key: string) => string; }> = ({ t }) => {
  return (
    <div className="w-full bg-teal-50 dark:bg-gray-800 border border-teal-200 dark:border-gray-700 rounded-lg p-4">
      <h4 className="text-md font-semibold text-teal-700 dark:text-teal-300 mb-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        {t('photoTipsTitle')}
      </h4>
      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-inside">
        {[t('tip1'), t('tip2'), t('tip3'), t('tip4')].map((tip, index) => (
            <li key={index} className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 text-teal-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{tip}</span>
            </li>
        ))}
      </ul>
    </div>
  );
};


const App: React.FC = () => {
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatRef = useRef<Chat | null>(null);

  const apiKey = process.env.API_KEY;

  const t = useCallback((key: keyof typeof translations.bn) => {
    return translations[language][key] || translations['en'][key];
  }, [language]);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
        try {
            audioSourceRef.current.stop();
        } catch (e) {
            console.warn("Could not stop audio source", e);
        }
        audioSourceRef.current = null;
    }
    setAudioState('idle');
  }, []);

  useEffect(() => {
    // Browsers require a user interaction to start an AudioContext.
    // We initialize it once on the first click anywhere on the page.
    const initAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
    };
    window.addEventListener('click', initAudioContext, { once: true });
    
    return () => {
        window.removeEventListener('click', initAudioContext);
        stopAudio();
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
        }
    };
  }, [stopAudio]);

  const handleImageSelect = useCallback((file: File) => {
    stopAudio();
    setImageFile(file);
    setAnalysisResult(null);
    setError(null);
    setImageDataUrl(null); // Clear previous image preview
    setUploadProgress(0);   // Start progress indicator

    // Reset chat state
    setChatHistory([]);
    chatRef.current = null;
    setIsChatLoading(false);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentLoaded);
      }
    };

    reader.onloadend = () => {
      setImageDataUrl(reader.result as string);
      setUploadProgress(null); // Hide progress indicator
    };
    
    reader.onerror = (error) => {
      console.error("File reading error:", error);
      setError({
        titleKey: "errorFileRead",
        messageKey: "errorFileReadMessage",
        type: 'generic'
      });
      setUploadProgress(null);
    };

    reader.readAsDataURL(file);
  }, [stopAudio]);
  
  const initializeChat = useCallback((result: AnalysisResult) => {
    if (!apiKey) return;
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = language === 'bn' 
        ? `You are 'Chashi Bondhu', an expert agricultural assistant for farmers in Bangladesh. You are having a conversation about a crop disease that you have just diagnosed. The diagnosis is as follows: ${JSON.stringify(result)}. Your role is to answer follow-up questions, particularly about specific chemical treatments (fungicides, insecticides), their application methods, and where to buy them in Bangladesh. You must use the Google Search tool to find up-to-date information on product availability, suppliers, and purchasing websites, especially within Bangladesh. If you do not know the answer or are uncertain, you must use the search tool. Do not provide information you are not certain about. Base your answers on the search results. If you cannot find the information after searching, clearly state that the information is not available. Always provide safe usage instructions. Respond in simple Bengali, with English technical terms in parentheses. Your responses must be concise and well-organized. When appropriate, use headings (like '### Title'), bullet points (starting with '* '), and bold text (like '**important**') to structure your message for clarity.`
        : `You are 'Chashi Bondhu', an expert agricultural assistant. You are conversing about a crop disease you diagnosed. The diagnosis is: ${JSON.stringify(result)}. Your role is to answer follow-up questions about treatments, application methods, and where to buy them. You must use the Google Search tool for up-to-date information on products and suppliers. Base your answers on search results. If information isn't found, state that clearly. Always provide safety instructions. Respond in simple English. Your responses must be concise and well-organized, using headings (like '### Title'), bullet points (starting with '* '), and bold text (like '**important**') for clarity.`;

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
                tools: [{googleSearch: {}}]
            }
        });
        chatRef.current = chat;
    } catch (e) {
        console.error("Failed to initialize chat:", e);
        setError({
            titleKey: "errorChatInit",
            messageKey: "errorChatInitMessage",
            type: 'generic'
        });
    }
  }, [language, apiKey]);

  const handleAnalyzeClick = async () => {
    if (!imageFile) {
      setError({
        titleKey: "errorNoImage",
        messageKey: "errorNoImageMessage",
        type: 'generic'
      });
      return;
    }

    stopAudio();
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const imageBase64 = await fileToBase64(imageFile);
      const result = await analyzeCropDisease(imageBase64, imageFile.type, language);
      setAnalysisResult(result);
      if (result.status === 'diseased') {
        initializeChat(result);
        const initialBotMessage: ChatMessage = {
            role: 'model',
            parts: [{ text: t('chatInitialMessage') }]
        };
        setChatHistory([initialBotMessage]);
      }
    } catch (err: any) {
        let errorPayload: ErrorState;
        
        if (err instanceof ContentBlockedError) {
            errorPayload = { titleKey: "errorContentBlocked", messageKey: 'errorUnexpected' /* Use generic message key for now */, type: 'content' };
        } else if (err instanceof NoAnalysisError) {
            errorPayload = { titleKey: "errorAnalysisFailed", messageKey: 'errorUnexpected', type: 'analysis' };
        } else if (err instanceof JsonParsingError) {
            errorPayload = { titleKey: "errorInvalidResponse", messageKey: 'errorUnexpected', type: 'parsing' };
        } else if (err instanceof ApiError) {
            errorPayload = { titleKey: "errorConnection", messageKey: 'errorUnexpected', type: 'network' };
        } else {
            errorPayload = { titleKey: "errorUnexpected", messageKey: 'errorUnexpected', type: 'generic' };
        }
        
        // For custom errors, the message from the service layer is more informative
        if (err.message && (err instanceof ContentBlockedError || err instanceof NoAnalysisError || err instanceof JsonParsingError || err instanceof ApiError)) {
            // This is a bit of a hack to show the specific error message from the service
            // A better solution would be to have message keys for each specific service error.
            setAnalysisResult({ status: 'irrelevant', diseaseName: t(errorPayload.titleKey), description: err.message });
        } else {
            setError(errorPayload);
        }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!chatRef.current) return;

    const userMessage: ChatMessage = {
        role: 'user',
        parts: [{ text: message }]
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
        const result = await chatRef.current.sendMessage({ message });
        
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        const modelResponse: ChatMessage = {
            role: 'model',
            parts: [{ text: result.text }],
            groundingChunks: groundingChunks as GroundingChunk[],
        };
        setChatHistory(prev => [...prev, modelResponse]);

    } catch (err) {
        console.error("Chat error:", err);
        const errorMessage: ChatMessage = {
            role: 'model',
            parts: [{ text: t('chatErrorMessage') }]
        };
        setChatHistory(prev => [...prev, errorMessage]);
    } finally {
        setIsChatLoading(false);
    }
  };

  const handleClearChat = useCallback(() => {
    if (analysisResult && analysisResult.status === 'diseased') {
        const initialBotMessage: ChatMessage = {
            role: 'model',
            parts: [{ text: t('chatInitialMessage') }]
        };
        setChatHistory([initialBotMessage]);
        initializeChat(analysisResult); // Re-initialize the chat session
    }
  }, [analysisResult, initializeChat, t]);

  const handlePlayAudio = async (text: string) => {
    if (audioState === 'playing') {
        stopAudio();
        return;
    }
    if (audioState === 'loading') return;

    if (!audioContextRef.current) {
        console.error("AudioContext not initialized. Please click on the page first.");
        setAudioError("Audio context not ready. Please click on the page first and try again.");
        setAudioState('error');
        setTimeout(() => setAudioState('idle'), 5000);
        return;
    }

    setAudioState('loading');
    setAudioError(null);

    try {
      const base64Audio = await generateSpeech(text, language);
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const decodedData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        if (audioSourceRef.current === source) {
            setAudioState('idle');
            audioSourceRef.current = null;
        }
      };

      source.start();
      audioSourceRef.current = source;
      setAudioState('playing');

    } catch (err: any) {
      const message = err.message || "Failed to play audio.";
      setAudioState('error');
      setAudioError(message);
      console.error(err);
      setTimeout(() => {
        if(audioState === 'error') {
          setAudioState('idle');
          setAudioError(null);
        }
      }, 5000);
    }
  };


  const WelcomeState: React.FC = () => (
     <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('welcomeTitle')}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {t('welcomeMessage')}
        </p>
     </div>
  );
  
  const MainContent: React.FC = () => (
    <>
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col space-y-4 items-center">
          <ImageUploader 
            onImageSelect={handleImageSelect} 
            imageDataUrl={imageDataUrl}
            uploadProgress={uploadProgress}
            preparingText={t('preparingImage')}
            uploadPromptText={t('uploadPrompt')}
            formatsText={t('uploadFormats')}
          />
          <PhotoTips t={t} />
          <button
            onClick={handleAnalyzeClick}
            disabled={!imageFile || isLoading}
            className="w-full sm:w-auto px-8 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
          >
            {isLoading ? t('analyzingButton') : t('analyzeButton')}
          </button>
        </div>

        <div className="min-h-[300px]">
           {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          ) : error ? (
            <ErrorDisplay error={error} t={t} />
          ) : analysisResult ? (
             <div className="space-y-8">
               <ResultDisplay
                  result={analysisResult}
                  onPlayAudio={handlePlayAudio}
                  audioState={audioState}
                  audioError={audioError}
                  t={t}
                />
                {analysisResult.status === 'diseased' && chatHistory.length > 0 && (
                  <ChatInterface
                    chatHistory={chatHistory}
                    isChatLoading={isChatLoading}
                    onSendMessage={handleSendMessage}
                    onClearChat={handleClearChat}
                    t={t}
                  />
                )}
             </div>
          ) : (
              <div className="flex items-center justify-center h-full">
                  <WelcomeState />
              </div>
          )}
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 px-4">
        <p>
          <span className="font-bold">Disclaimer:</span> {t('disclaimer')}
        </p>
      </footer>
    </>
  );

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-green-600">
            {t('appTitle')}
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {t('appSubtitle')}
          </p>
          <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setLanguage('bn')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${language === 'bn' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>বাংলা</button>
              <button onClick={() => setLanguage('en')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>English</button>
          </div>
        </header>

        {!apiKey ? <ApiKeyInstructions t={t} /> : <MainContent />}
        
      </div>
    </div>
  );
};

export default App;
