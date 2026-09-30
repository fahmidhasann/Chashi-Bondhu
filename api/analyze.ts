// api/analyze.ts - Crop disease identification endpoint using gemini-3.8-flash
import { GoogleGenAI, Type } from '@google/genai';

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
    const { imageBase64, mimeType = 'image/jpeg', language = 'bn' } = body;

    if (!imageBase64) {
      return sendResponse({ error: 'Missing imageBase64 in request body' }, 400, res);
    }

    const ai = new GoogleGenAI({ apiKey });

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: getPrompt(language),
    };

    // Using latest recommended model: gemini-3.8-flash
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
        return sendResponse(
          {
            error: 'CONTENT_BLOCKED',
            message: 'The image could not be analyzed due to safety policies. Please use a different crop photo.',
          },
          422,
          res
        );
      }
      return sendResponse(
        {
          error: 'NO_ANALYSIS',
          message: 'The model could not analyze this image. Please provide a clear, well-lit photo of the crop leaf.',
        },
        422,
        res
      );
    }

    let result: any;
    try {
      result = JSON.parse(response.text.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini output:', response.text);
      return sendResponse(
        {
          error: 'PARSE_ERROR',
          message: 'Failed to parse model response into JSON.',
          raw: response.text,
        },
        500,
        res
      );
    }

    // Clean up conditional fields according to status
    if (result.status === 'healthy') {
      delete result.controlMeasures;
    } else if (result.status === 'diseased') {
      delete result.preventativeMeasures;
    } else if (result.status === 'irrelevant') {
      delete result.controlMeasures;
      delete result.preventativeMeasures;
    }

    return sendResponse({ success: true, result }, 200, res);
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    return sendResponse(
      {
        error: 'ANALYSIS_FAILED',
        message: error.message || 'Internal server error during crop disease analysis.',
      },
      500,
      res
    );
  }
}
