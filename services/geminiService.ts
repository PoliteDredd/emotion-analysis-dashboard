import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Emotion, Sentiment } from '../types';

export const analyzeEmotion = async (text: string): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the primary emotion and overall sentiment of the following text. For emotion, classify it as "Joy", "Sadness", "Anger", "Fear", "Surprise", or "Neutral". For sentiment, classify it as "Positive", "Negative", or "Neutral". Provide a confidence score between 0 and 1 for the emotion. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: {
              type: Type.STRING,
              enum: Object.values(Emotion),
              description: 'The primary emotion of the text.'
            },
            sentiment: {
              type: Type.STRING,
              enum: Object.values(Sentiment),
              description: 'The overall sentiment of the text.'
            },
            score: {
              type: Type.NUMBER,
              description: 'Confidence score for the emotion, from 0 to 1.'
            },
          },
          required: ["emotion", "sentiment", "score"]
        },
      },
    });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);

    // Validate the parsed result
    if (
        Object.values(Emotion).includes(result.emotion) && 
        Object.values(Sentiment).includes(result.sentiment) && 
        typeof result.score === 'number'
    ) {
      return result as AnalysisResult;
    } else {
      throw new Error("Invalid response format from Gemini API.");
    }
  } catch (error) {
    console.error("Error analyzing emotion:", error);
    throw new Error("Failed to analyze emotion. Please check your API key and network connection.");
  }
};
