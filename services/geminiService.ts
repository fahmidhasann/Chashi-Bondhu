
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult } from '../types';

// Custom Error Types for more specific feedback
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


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        type: Type.STRING
      },
    },
    preventativeMeasures: {
        type: Type.ARRAY,
        description: "If the plant is healthy, provide a list of general preventative tips. This field should be omitted if the plant is diseased or the image is irrelevant.",
        items: {
            type: Type.STRING
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
}


export const analyzeCropDisease = async (imageBase64: string, mimeType: string, language: 'bn' | 'en'): Promise<AnalysisResult> => {
  try {
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
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    if (!response.text) {
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
            throw new ContentBlockedError(`The image could not be analyzed due to our safety policies. Please use a different image.`);
        }
        throw new NoAnalysisError("The model could not analyze this image. Please try a clear, well-lit photo.");
    }

    const jsonString = response.text.trim();
    let result: AnalysisResult;

    try {
        result = JSON.parse(jsonString);
    } catch (e) {
        console.error("Error parsing JSON from Gemini:", jsonString);
        throw new JsonParsingError("Received an unexpected response from the model. Please try again later.");
    }

    // Ensure response conforms to the expected optional fields based on status
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
        throw error; // Re-throw custom errors to be caught by the UI layer
    }
    console.error("Error analyzing crop disease:", error);
    // This will catch network errors or other unexpected errors from the SDK
    throw new ApiError("Analysis failed due to a network or server issue. Please check your internet connection and try again.");
  }
};

export const generateSpeech = async (text: string, language: 'bn' | 'en'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
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
    if (!base64Audio) {
      throw new Error("Could not retrieve audio data from the API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("An error occurred while generating audio. Please try again.");
  }
};
