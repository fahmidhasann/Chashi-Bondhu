// api/speech.ts - Text-to-Speech endpoint using gemini-3.8-flash-lite-tts
import { GoogleGenAI, Modality } from '@google/genai';

async function parseBody(req: any) {
  if (req && typeof req.json === 'function') {
    return await req.json();
  }
  if (req && req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }
  return {};
}

function sendResponse(data: any, status = 200, res?: any) {
  if (res && typeof res.status === 'function') {
    return res.status(status).json(data);
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: any, res?: any) {
  if (req.method && req.method !== 'POST') {
    return sendResponse({ error: 'Method not allowed' }, 405, res);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return sendResponse(
      {
        error: 'API_KEY_MISSING',
        message: 'Gemini API key is not configured on the server.',
      },
      500,
      res
    );
  }

  try {
    const body = await parseBody(req);
    const { text, language = 'bn' } = body;

    if (!text || typeof text !== 'string') {
      return sendResponse({ error: 'Text string is required' }, 400, res);
    }

    const ai = new GoogleGenAI({ apiKey });

    // Use latest Gemini TTS model
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: language === 'bn' ? 'Kore' : 'Zephyr',
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return sendResponse(
        {
          error: 'NO_AUDIO_DATA',
          message: 'Could not retrieve synthesized audio from model.',
        },
        502,
        res
      );
    }

    return sendResponse({ success: true, audioBase64: base64Audio }, 200, res);
  } catch (error: any) {
    console.error('Error in /api/speech:', error);
    return sendResponse(
      {
        error: 'TTS_FAILED',
        message: error.message || 'Text-to-speech generation failed.',
      },
      500,
      res
    );
  }
}
