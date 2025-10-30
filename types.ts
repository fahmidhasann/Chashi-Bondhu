
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisResult {
  status: 'healthy' | 'diseased' | 'irrelevant';
  diseaseName: string;
  description: string;
  controlMeasures?: string[];
  preventativeMeasures?: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  groundingChunks?: GroundingChunk[];
}