
import { GoogleGenAI, Type } from "@google/genai";
import { PresentationData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSlidesFromText = async (rawText: string): Promise<PresentationData> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Transform the following text into a professional presentation structure. 
    Break the content into logical slides. Each slide should have a concise title, 3-5 bullet points, and brief speaker notes.
    Provide a suggestion for a professional, high-quality stock photo image description that would complement the slide's content.
    
    TEXT:
    ${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The overall title of the presentation" },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                content: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                speakerNotes: { type: Type.STRING },
                imageDescription: { type: Type.STRING }
              },
              required: ["id", "title", "content", "speakerNotes"]
            }
          }
        },
        required: ["title", "slides"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data as PresentationData;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to structure presentation data.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `A professional, corporate-style high-quality presentation visual: ${prompt}`,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '16:9',
    },
  });

  const base64EncodeString = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64EncodeString}`;
};
