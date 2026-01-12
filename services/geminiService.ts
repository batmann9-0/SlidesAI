
import { GoogleGenAI, Type } from "@google/genai";
import { PresentationData } from "../types";

// Always use the specified initialization format
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Extract text property directly as per guidelines
    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr) as PresentationData;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to structure presentation data.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  // Use gemini-2.5-flash-image by default for image generation as per guidelines
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A professional, corporate-style high-quality presentation visual: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  // Iterate through parts to find the image part as per guidelines
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
  }
  
  throw new Error("No image data found in model response");
};
