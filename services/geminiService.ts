
import { GoogleGenAI, Type } from "@google/genai";
import { SceneAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzePainting = async (base64Image: string): Promise<SceneAnalysis> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Act as a world-class art historian and volumetric analyst. Analyze this painting/image.
  
  1. IDENTIFY: Detect the main subjects, background elements, and decorative objects.
  2. DEPTH: Assign a relative depth (0 = middle ground, -100 = far horizon, 100 = touching the lens).
  3. HISTORY & CONTEXT: For each object, provide a "description" of its visual appearance AND a "historicalContext" which includes the artistic significance, the technique the artist likely used for this specific part, its symbolic meaning, or interesting trivia.
  4. STYLE: Identify the overall "artisticStyle" (e.g., Impressionism, Surrealism, Baroque).
  
  Provide the output in JSON format. All boundingBox coordinates must be 0-100.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                depth: { type: Type.NUMBER },
                description: { type: Type.STRING },
                historicalContext: { type: Type.STRING },
                boundingBox: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: "[y_min, x_min, y_max, x_max] in 0-100 normalized coordinates"
                }
              },
              required: ['name', 'depth', 'description']
            }
          },
          overallAtmosphere: { type: Type.STRING },
          artisticStyle: { type: Type.STRING }
        },
        required: ['objects', 'overallAtmosphere']
      }
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text) as SceneAnalysis;
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    throw new Error("Invalid response from AI analysis");
  }
};
