// services/geminiService.ts - Service handling crop disease analysis, streaming chat, and audio TTS
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { AnalysisResult, ChatMessage, GroundingChunk } from '../types';

export class ContentBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentBlockedError';
  }
}

export class NoAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoAnalysisError';
  }
}

export class JsonParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonParsingError';
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class MissingApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingApiKeyError';
  }
}

const analysisSchema: any = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      description: "The status of the image. Must be 'healthy', 'diseased', or 'irrelevant' if the image does not contain a plant, leaf, or crop.",
      enum: ["healthy", "diseased", "irrelevant"],
    },
    diseaseName: {
      type: Type.STRING,
      description: "If diseased, the common name of the disease. If healthy, this should be 'Healthy Plant'. If irrelevant, this should be 'Irrelevant Image'.",
    },
    description: {
      type: Type.STRING,
      description: "A brief description of the findings.",
    },
    controlMeasures: {
      type: Type.ARRAY,
      description: "If the plant is diseased, provide a list of at least three actionable control/cure measures. This field should be omitted if the plant is healthy or the image is irrelevant.",
      items: {
        type: Type.STRING,
      },
    },
    preventativeMeasures: {
      type: Type.ARRAY,
      description: "If the plant is healthy, provide a list of general preventative tips. This field should be omitted if the plant is diseased or the image is irrelevant.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["status", "diseaseName", "description"],
};

const getPrompt = (language: 'bn' | 'en'): string => {
  if (language === 'bn') {
    return `You are an expert agricultural pathologist specializing in farming in Bangladesh. Your audience is local farmers. 
Your entire JSON output, including all string values for keys like 'diseaseName', 'description', etc., MUST be in simple, clear Bengali. 
However, for critical technical terms like disease names or chemical names, you MUST also include the English equivalent in parentheses. For example: 'ম্যানকোজেব (Mancozeb)'.

Your first task is to determine if the uploaded image contains a plant, leaf, or any part of a crop.
- If the image is NOT of a plant/leaf (e.g., it's a picture of a person, an object, etc.), set 'status' to 'irrelevant'. For 'diseaseName', use 'অবান্তর ছবি (Irrelevant Image)'. Provide a friendly explanation in the 'description' field in Bengali, stating that this application is for identifying crop diseases.
- If the image IS of a plant/leaf, analyze it for diseases.

If analyzing a plant/leaf:
- Determine if it is 'healthy' or 'diseased'.
- If 'diseased', identify the disease (both Bengali and English name, e.g., 'আলুর বিলম্বিত ধসা (Late Blight of Potato)'), describe it, and provide actionable control measures.
- If 'healthy', confirm its status with 'diseaseName' as 'সুস্থ উদ্ভিদ (Healthy Plant)', provide a reassuring description, and suggest general preventative measures.

Adhere strictly to the provided JSON schema.`;
  } else {
    return `You are an expert agricultural pathologist. Your audience is farmers. 
Your entire JSON output, including all string values for keys like 'diseaseName', 'description', etc., MUST be in simple, clear English. 
For scientific or non-common technical terms, you may include them in parentheses if it adds clarity.

Your first task is to determine if the uploaded image contains a plant, leaf, or any part of a crop.
- If the image is NOT of a plant/leaf (e.g., a person, an object), set 'status' to 'irrelevant'. Use 'Irrelevant Image' for 'diseaseName'. Provide a friendly explanation in the 'description' field in English.
- If the image IS of a plant/leaf, analyze it for diseases.

If analyzing a plant/leaf:
- Determine if it is 'healthy' or 'diseased'.
- If 'diseased', identify the disease, describe it, and provide actionable control measures.
- If 'healthy', confirm its status with 'diseaseName' as 'Healthy Plant', provide a reassuring description, and suggest general preventative measures.

Adhere strictly to the provided JSON schema.`;
  }
};

/**
 * Check if the Gemini API key is configured (either on Vercel backend or client-side)
 */
export async function checkApiConfiguration(): Promise<boolean> {
  // If client-side key exists
  if (process.env.GEMINI_API_KEY || process.env.API_KEY) {
    return true;
  }
  // Check backend server status
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.configured);
    }
  } catch {
    // If backend not reachable
  }
  return false;
}

/**
 * Analyzes crop disease from image using Vercel Serverless Function or client fallback with gemini-3.8-flash.
 */
export const analyzeCropDisease = async (
  imageBase64: string,
  mimeType: string,
  language: 'bn' | 'en'
): Promise<AnalysisResult> => {
  // 1. Try Vercel Serverless API first (Secure, no API key exposed to browser)
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, language }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.result) {
        return data.result as AnalysisResult;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error === 'API_KEY_MISSING') {
        throw new MissingApiKeyError(errorData.message || 'Gemini API key is not configured.');
      }
      if (errorData.error === 'CONTENT_BLOCKED') {
        throw new ContentBlockedError(errorData.message || 'Image blocked by safety filter.');
      }
      if (errorData.error === 'NO_ANALYSIS') {
        throw new NoAnalysisError(errorData.message || 'Could not analyze image.');
      }
      if (errorData.error === 'PARSE_ERROR') {
        throw new JsonParsingError(errorData.message || 'Failed to parse model response.');
      }
    }
  } catch (err: any) {
    if (
      err instanceof MissingApiKeyError ||
      err instanceof ContentBlockedError ||
      err instanceof NoAnalysisError ||
      err instanceof JsonParsingError
    ) {
      throw err;
    }
    // If /api/analyze failed with 404 or network issue, fallback to client-side SDK if client key exists
    console.warn('Backend /api/analyze call failed, trying client-side fallback if key is present:', err);
  }

  // 2. Client-side SDK fallback with gemini-3.8-flash
  const clientKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!clientKey) {
    throw new MissingApiKeyError(
      'Gemini API key is not configured. Please add GEMINI_API_KEY to your Vercel project environment variables.'
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey: clientKey });
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };
    const textPart = {
      text: getPrompt(language),
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    if (!response.text) {
      const blockReason = response.promptFeedback?.blockReason;
      if (blockReason) {
        throw new ContentBlockedError('The image could not be analyzed due to safety policies.');
      }
      throw new NoAnalysisError('The model could not analyze this image. Please try a clear photo.');
    }

    const result = JSON.parse(response.text.trim()) as AnalysisResult;
    if (result.status === 'healthy') {
      delete result.controlMeasures;
    } else if (result.status === 'diseased') {
      delete result.preventativeMeasures;
    } else if (result.status === 'irrelevant') {
      delete result.controlMeasures;
      delete result.preventativeMeasures;
    }
    return result;
  } catch (error: any) {
    if (error instanceof ContentBlockedError || error instanceof NoAnalysisError || error instanceof JsonParsingError) {
      throw error;
    }
    console.error('Error analyzing crop disease:', error);
    throw new ApiError('Analysis failed due to a network or server issue. Please check your internet connection.');
  }
};

/**
 * Sends a message in the diagnosis chat, with optional real-time token streaming.
 */
export const streamChatMessage = async (
  messages: ChatMessage[],
  diagnosis: AnalysisResult | null,
  language: 'bn' | 'en',
  onChunk: (partialText: string) => void
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  // 1. Try Vercel Serverless streaming endpoint
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        diagnosis,
        language,
        stream: true,
      }),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let groundingChunks: GroundingChunk[] = [];
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'chunk' && data.text) {
                fullText += data.text;
                onChunk(fullText);
              } else if (data.type === 'done') {
                if (data.groundingChunks) {
                  groundingChunks = data.groundingChunks;
                }
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }

      if (fullText) {
        return { text: fullText, groundingChunks };
      }
    }
  } catch (streamErr) {
    console.warn('Streaming chat failed, trying standard call or client fallback:', streamErr);
  }

  // 2. Non-streaming server fallback
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        diagnosis,
        language,
        stream: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.text) {
        onChunk(data.text);
        return { text: data.text, groundingChunks: data.groundingChunks };
      }
    }
  } catch {
    // continue to client fallback
  }

  // 3. Client-side SDK fallback
  const clientKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!clientKey) {
    throw new MissingApiKeyError('Gemini API key is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey: clientKey });
  const contents = messages.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.parts[0]?.text || '' }],
  }));

  const chat = ai.chats.create({
    model: 'gemini-3.8-flash',
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const lastUserMsg = messages[messages.length - 1]?.parts[0]?.text || '';
  const result = await chat.sendMessage({ message: lastUserMsg });
  const text = result.text || '';
  const groundingChunks = (result.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];
  onChunk(text);
  return { text, groundingChunks };
};

/**
 * Generates spoken audio using gemini-3.8-flash-lite-tts or returns null for Web Speech fallback.
 */
export const generateSpeech = async (text: string, language: 'bn' | 'en'): Promise<string> => {
  // 1. Try Vercel Serverless speech endpoint
  try {
    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.audioBase64) {
        return data.audioBase64;
      }
    }
  } catch (err) {
    console.warn('API speech synthesis failed, trying client fallback:', err);
  }

  // 2. Client-side fallback if client key exists
  const clientKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (clientKey) {
    const ai = new GoogleGenAI({ apiKey: clientKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: language === 'bn' ? 'Kore' : 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
  }

  throw new Error('TTS unavailable');
};
