export enum Emotion {
  Joy = 'Joy',
  Sadness = 'Sadness',
  Anger = 'Anger',
  Fear = 'Fear',
  Surprise = 'Surprise',
  Neutral = 'Neutral',
}

export enum Sentiment {
  Positive = 'Positive',
  Negative = 'Negative',
  Neutral = 'Neutral',
}

export interface AnalysisResult {
  emotion: Emotion;
  sentiment: Sentiment;
  score: number; // Confidence score for the emotion
}

export interface AnalysisRecord {
  id: string;
  text: string;
  modelResult: AnalysisResult;
}
