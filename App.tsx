// App.tsx - Main Application for Chashi Bondhu
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnalysisResult, ChatMessage, GroundingChunk } from './types';
import {
  analyzeCropDisease,
  streamChatMessage,
  generateSpeech,
  checkApiConfiguration,
  ContentBlockedError,
  NoAnalysisError,
  JsonParsingError,
  ApiError,
  MissingApiKeyError,
} from './services/geminiService';
import { optimizeImage, formatBytes, OptimizedImageResult } from './utils/imageOptimizer';
import ImageUploader, { ImageOptimizationInfo } from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import ChatInterface from './components/ChatInterface';
import ApiKeyInstructions from './components/ApiKeyInstructions';
import { translations } from './translations';

// Audio decoding utilities for Gemini TTS audio playback
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
  numChannels: number
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

interface ErrorState {
  titleKey: keyof typeof translations.en;
  messageKey: keyof typeof translations.en;
  type: 'content' | 'analysis' | 'parsing' | 'network' | 'generic';
  customMessage?: string;
}

const ErrorDisplay: React.FC<{ error: ErrorState; t: (key: string) => string }> = ({ error, t }) => {
  const colorClasses = {
    content: 'border-red-500 text-red-800 dark:text-red-200 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30',
    analysis: 'border-yellow-500 text-yellow-800 dark:text-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30',
    parsing: 'border-orange-500 text-orange-800 dark:text-orange-200 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/30 dark:to-red-900/30',
    network: 'border-blue-500 text-blue-800 dark:text-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30',
    generic: 'border-gray-500 text-gray-800 dark:text-gray-200 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-slate-800',
  };

  const iconColorClasses = {
    content: 'text-red-500',
    analysis: 'text-yellow-500',
    parsing: 'text-orange-500',
    network: 'text-blue-500',
    generic: 'text-gray-500',
  };

  const icon = (
    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-white/50 dark:bg-gray-700/50 flex items-center justify-center ${iconColorClasses[error.type]}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  );

  return (
    <div className={`text-center p-8 border-l-4 rounded-2xl shadow-2xl w-full animate-fade-in ${colorClasses[error.type]}`}>
      {icon}
      <h3 className="text-2xl font-extrabold mb-3">{t(error.titleKey)}</h3>
      <p className="dark:text-gray-300 text-gray-700 text-lg leading-relaxed">
        {error.customMessage || t(error.messageKey)}
      </p>
    </div>
  );
};

const PhotoTips: React.FC<{ t: (key: string) => string }> = ({ t }) => {
  return (
    <div className="w-full bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-2 border-teal-200 dark:border-teal-800 rounded-2xl p-6 shadow-lg">
      <h4 className="text-base font-bold text-teal-700 dark:text-teal-300 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        {t('photoTipsTitle')}
      </h4>
      <ul className="space-y-3">
        {[t('tip1'), t('tip2'), t('tip3'), t('tip4')].map((tip, index) => (
          <li key={index} className="flex items-start gap-3 bg-white/60 dark:bg-gray-800/40 p-3 rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [optimizedBase64, setOptimizedBase64] = useState<string | null>(null);
  const [optimizedMimeType, setOptimizedMimeType] = useState<string>('image/jpeg');
  const [optimizationInfo, setOptimizationInfo] = useState<ImageOptimizationInfo | null>(null);

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

  const t = useCallback(
    (key: keyof typeof translations.bn) => {
      return translations[language][key] || translations['en'][key] || key;
    },
    [language]
  );

  // Check if API key is configured on server or in environment
  useEffect(() => {
    checkApiConfiguration().then((configured) => {
      setIsConfigured(configured);
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        console.warn('Could not stop audio source', e);
      }
      audioSourceRef.current = null;
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setAudioState('idle');
  }, []);

  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
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

  // Handle image upload and client-side optimization
  const handleImageSelect = useCallback(
    async (file: File) => {
      stopAudio();
      setImageFile(file);
      setAnalysisResult(null);
      setError(null);
      setImageDataUrl(null);
      setOptimizedBase64(null);
      setOptimizationInfo(null);
      setUploadProgress(20);

      // Reset chat state
      setChatHistory([]);
      setIsChatLoading(false);

      try {
        setUploadProgress(50);
        // Optimize and resize image on canvas before upload
        const optimized: OptimizedImageResult = await optimizeImage(file, 1280, 0.82);
        setUploadProgress(85);

        setImageDataUrl(optimized.dataUrl);
        setOptimizedBase64(optimized.base64);
        setOptimizedMimeType(optimized.mimeType);
        setOptimizationInfo({
          originalSize: formatBytes(optimized.originalSize),
          optimizedSize: formatBytes(optimized.optimizedSize),
          reductionPercentage: optimized.reductionPercentage,
        });
        setUploadProgress(null);
      } catch (err) {
        console.error('Image optimization failed:', err);
        setError({
          titleKey: 'errorFileRead',
          messageKey: 'errorFileReadMessage',
          type: 'generic',
        });
        setUploadProgress(null);
      }
    },
    [stopAudio]
  );

  const handleAnalyzeClick = async () => {
    if (!optimizedBase64) {
      setError({
        titleKey: 'errorNoImage',
        messageKey: 'errorNoImageMessage',
        type: 'generic',
      });
      return;
    }

    stopAudio();
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeCropDisease(optimizedBase64, optimizedMimeType, language);
      setAnalysisResult(result);
      if (result.status === 'diseased') {
        const initialBotMessage: ChatMessage = {
          role: 'model',
          parts: [{ text: t('chatInitialMessage') }],
        };
        setChatHistory([initialBotMessage]);
      }
    } catch (err: any) {
      console.error('Crop analysis error:', err);
      if (err instanceof MissingApiKeyError) {
        setIsConfigured(false);
        setError({
          titleKey: 'apiKeyRequiredTitle',
          messageKey: 'apiKeyRequiredMessage',
          type: 'generic',
          customMessage: err.message,
        });
      } else if (err instanceof ContentBlockedError) {
        setError({
          titleKey: 'errorContentBlocked',
          messageKey: 'errorUnexpected',
          type: 'content',
          customMessage: err.message,
        });
      } else if (err instanceof NoAnalysisError) {
        setError({
          titleKey: 'errorAnalysisFailed',
          messageKey: 'errorUnexpected',
          type: 'analysis',
          customMessage: err.message,
        });
      } else if (err instanceof JsonParsingError) {
        setError({
          titleKey: 'errorInvalidResponse',
          messageKey: 'errorUnexpected',
          type: 'parsing',
          customMessage: err.message,
        });
      } else {
        setError({
          titleKey: 'errorUnexpected',
          messageKey: 'errorUnexpected',
          type: 'generic',
          customMessage: err.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: messageText }],
    };

    // Prepare placeholder for model response in streaming state
    const placeholderModelMessage: ChatMessage = {
      role: 'model',
      parts: [{ text: '' }],
    };

    const newHistory = [...chatHistory, userMessage, placeholderModelMessage];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const { text, groundingChunks } = await streamChatMessage(
        [...chatHistory, userMessage],
        analysisResult,
        language,
        (incrementalText) => {
          setChatHistory((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'model') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                parts: [{ text: incrementalText }],
              };
            }
            return updated;
          });
        }
      );

      // Finalize with grounding sources
      setChatHistory((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === 'model') {
          updated[lastIdx] = {
            role: 'model',
            parts: [{ text: text || updated[lastIdx].parts[0].text }],
            groundingChunks,
          };
        }
        return updated;
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: t('chatErrorMessage') }],
      };
      setChatHistory((prev) => {
        const updated = [...prev];
        // Replace last placeholder with error message
        if (updated.length > 0 && updated[updated.length - 1].role === 'model') {
          updated[updated.length - 1] = errorMessage;
        } else {
          updated.push(errorMessage);
        }
        return updated;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = useCallback(() => {
    if (analysisResult && analysisResult.status === 'diseased') {
      const initialBotMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: t('chatInitialMessage') }],
      };
      setChatHistory([initialBotMessage]);
    }
  }, [analysisResult, t]);

  const handlePlayAudio = async (text: string) => {
    if (audioState === 'playing') {
      stopAudio();
      return;
    }
    if (audioState === 'loading') return;

    setAudioState('loading');
    setAudioError(null);

    // 1. Try Gemini Neural TTS (gemini-3.8-flash-lite-tts)
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const base64Audio = await generateSpeech(text, language);
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
      return;
    } catch (err: any) {
      console.warn('Gemini TTS failed or unavailable, falling back to Web Speech API:', err);
    }

    // 2. Web Speech API Fallback (Works offline & with zero API quota!)
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'bn' ? 'bn-BD' : 'en-US';
        utterance.rate = 0.95;

        utterance.onstart = () => {
          setAudioState('playing');
        };
        utterance.onend = () => {
          setAudioState('idle');
        };
        utterance.onerror = (e) => {
          console.error('Speech synthesis error:', e);
          setAudioState('idle');
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (speechErr) {
        console.error('Web Speech API error:', speechErr);
      }
    }

    setAudioState('error');
    setAudioError(language === 'bn' ? 'অডিও চালানো যায়নি।' : 'Could not play audio.');
    setTimeout(() => {
      setAudioState('idle');
      setAudioError(null);
    }, 4000);
  };

  const WelcomeState: React.FC = () => (
    <div className="text-center p-8 sm:p-10 bg-gradient-to-br from-white to-teal-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl shadow-xl border-2 border-teal-200 dark:border-teal-800 animate-scale-in">
      <div className="mb-6 flex justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-400 to-green-500 rounded-full flex items-center justify-center shadow-2xl animate-float">
          <svg className="w-12 h-12 sm:w-14 sm:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-green-600 mb-3">
        {t('welcomeTitle')}
      </h2>
      <p className="mt-3 text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
        {t('welcomeMessage')}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
      </div>
    </div>
  );

  const MainContent: React.FC = () => (
    <>
      <main className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${imageFile ? 'bg-teal-600 text-white' : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'}`}>
              1
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('uploadPrompt')}</span>
          </div>
          <div className={`h-1 w-8 sm:w-12 rounded transition-all ${imageFile ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${analysisResult ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
              2
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('analyzeButton')}</span>
          </div>
          <div className={`h-1 w-8 sm:w-12 rounded transition-all ${analysisResult && analysisResult.status === 'diseased' ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${analysisResult && analysisResult.status === 'diseased' && chatHistory.length > 0 ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
              3
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('chatTitle')}</span>
          </div>
        </div>

        {/* Upload Section */}
        {!analysisResult && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
              <ImageUploader
                onImageSelect={handleImageSelect}
                imageDataUrl={imageDataUrl}
                uploadProgress={uploadProgress}
                preparingText={t('preparingImage')}
                uploadPromptText={t('uploadPrompt')}
                formatsText={t('uploadFormats')}
                language={language}
                optimizationInfo={optimizationInfo}
              />

              {imageFile && !isLoading && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleAnalyzeClick}
                    className="px-8 sm:px-12 py-3.5 sm:py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50"
                  >
                    🌾 {t('analyzeButton')}
                  </button>
                </div>
              )}
            </div>

            <PhotoTips t={t} />

            {!imageFile && <WelcomeState />}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <Spinner />
            <p className="mt-6 text-lg font-bold text-teal-600 dark:text-teal-400 animate-pulse">
              {t('analyzingButton')}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {language === 'bn' ? 'Gemini 3.8 Flash দ্বারা নির্ণয় করা হচ্ছে...' : 'Analyzing with Gemini 3.8 Flash...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="animate-fade-in">
            <ErrorDisplay error={error} t={t} />
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setAnalysisResult(null);
                  setImageFile(null);
                  setImageDataUrl(null);
                  setOptimizedBase64(null);
                }}
                className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300"
              >
                {t('uploadPrompt')}
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {analysisResult && !isLoading && !error && (
          <div className="space-y-6 animate-fade-in">
            {/* Image Preview */}
            {imageDataUrl && (
              <div className="flex justify-center">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-teal-500">
                  <img src={imageDataUrl} alt="Analyzed crop" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Results Display */}
            <ResultDisplay
              result={analysisResult}
              onPlayAudio={handlePlayAudio}
              audioState={audioState}
              audioError={audioError}
              t={t}
            />

            {/* Chat Interface */}
            {analysisResult.status === 'diseased' && chatHistory.length > 0 && (
              <ChatInterface
                chatHistory={chatHistory}
                isChatLoading={isChatLoading}
                onSendMessage={handleSendMessage}
                onClearChat={handleClearChat}
                t={t}
              />
            )}

            {/* New Analysis Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setImageFile(null);
                  setImageDataUrl(null);
                  setOptimizedBase64(null);
                  setOptimizationInfo(null);
                  setError(null);
                  setChatHistory([]);
                  stopAudio();
                }}
                className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                🔄 {language === 'bn' ? 'নতুন রোগ বিশ্লেষণ' : 'New Disease Analysis'}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400 px-4">
        <p>
          <span className="font-bold">Disclaimer:</span> {t('disclaimer')}
        </p>
      </footer>
    </>
  );

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10 animate-fade-in">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:rotate-6 transition-transform duration-300">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-green-600 to-emerald-600 animate-gradient">
              {t('appTitle')}
            </span>
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
            {t('appSubtitle')}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg ${
                language === 'bn'
                  ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white scale-105'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg ${
                language === 'en'
                  ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white scale-105'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              English
            </button>
          </div>
        </header>

        {isConfigured === false ? <ApiKeyInstructions t={t} /> : <MainContent />}
      </div>
    </div>
  );
};

export default App;
