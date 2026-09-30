// api/chat.ts - Chat endpoint with Google Search grounding using gemini-3.8-flash
import { GoogleGenAI } from '@google/genai';

const getSystemInstruction = (diagnosis: any, language: 'bn' | 'en'): string => {
  const diagnosisContext = diagnosis ? JSON.stringify(diagnosis) : 'No prior diagnosis';

  if (language === 'bn') {
    return `You are 'Chashi Bondhu' (চাষী বন্ধু), a helpful and expert agricultural assistant for farmers in Bangladesh. 
You are having a conversation about a crop disease that you have diagnosed: ${diagnosisContext}. 

Your role is to answer follow-up questions, particularly about:
1. Specific chemical treatments (fungicides, insecticides, organic remedies)
2. Safe application methods, dosages, and safety precautions
3. Where to buy them in Bangladesh and local alternatives

You must use the Google Search tool to find up-to-date information on product availability, suppliers, and purchasing websites, especially within Bangladesh. Base your answers on the search results. If you cannot find the information after searching, clearly state that the information is not available. 

Guidelines:
- Always provide safety and handling instructions for any chemical or fungicide.
- Respond in simple, courteous Bengali, with English technical names in parentheses (e.g., ম্যানকোজেব (Mancozeb)).
- Keep responses concise, clear, and well-structured using bullet points (* ) and bold text (**).`;
  } else {
    return `You are 'Chashi Bondhu', an expert agricultural assistant for farmers. 
You are having a conversation about a crop disease diagnosis: ${diagnosisContext}. 

Your role is to answer follow-up questions about treatments, application dosages, organic alternatives, and where to buy products.
You must use the Google Search tool for up-to-date information on products, registered suppliers, and treatments. Base your answers on search results. If information is not found, state that clearly. Always provide safety instructions.

Guidelines:
- Always provide safe usage and handling instructions.
- Respond in clear, accessible English with technical terms clarified.
- Keep responses concise and well-organized using bullet points (* ) and bold text (**).`;
  }
};

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
        message: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Vercel environment variables.',
      },
      500,
      res
    );
  }

  try {
    const body = await parseBody(req);
    const { messages = [], diagnosis, language = 'bn', stream = false } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return sendResponse({ error: 'Messages array is required' }, 400, res);
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = getSystemInstruction(diagnosis, language);

    // Convert client message history format to @google/genai format
    const contents = messages.map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [
        {
          text: Array.isArray(m.parts) && m.parts[0]?.text ? m.parts[0].text : (m.text || ''),
        },
      ],
    }));

    if (stream) {
      // SSE Streaming Response
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      if (res && typeof res.writeHead === 'function') {
        // Node HTTP response streaming
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        });

        let accumulatedChunks: any[] = [];
        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          const gChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (gChunks && gChunks.length > 0) {
            accumulatedChunks = [...accumulatedChunks, ...gChunks];
          }
          if (text) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ type: 'done', groundingChunks: accumulatedChunks })}\n\n`);
        return res.end();
      }

      // Standard Web Streams Response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let accumulatedChunks: any[] = [];
            for await (const chunk of responseStream) {
              const text = chunk.text || '';
              const gChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
              if (gChunks && gChunks.length > 0) {
                accumulatedChunks = [...accumulatedChunks, ...gChunks];
              }
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`));
              }
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done', groundingChunks: accumulatedChunks })}\n\n`)
            );
            controller.close();
          } catch (err: any) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming fallback
    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = result.text || '';
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return sendResponse({ success: true, text, groundingChunks }, 200, res);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return sendResponse(
      {
        error: 'CHAT_FAILED',
        message: error.message || 'Error occurred while communicating with the assistant.',
      },
      500,
      res
    );
  }
}
