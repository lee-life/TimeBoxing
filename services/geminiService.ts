import { GoogleGenAI, Type } from "@google/genai";
import { SuggestionResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSchedule = async (
  brainDump: string,
  currentSchedule: any[],
  startHour: string = "06:00",
  endHour: string = "23:00"
): Promise<SuggestionResponse | null> => {
  try {
    const prompt = `
      Act as a strict but encouraging Boxing Coach managing my time.
      I have a 'Sparring Log' (brain dump) of tasks:
      "${brainDump}"

      Please organize my 'Fight Card' (schedule) for the day.
      1. Extract the Top 3 "Main Events" (Priorities).
      2. Create a timeboxed schedule (Rounds).
      
      Constraints:
      - Start time: ${startHour}
      - End time: ${endHour}
      - Use 24h format.
      - Duration in minutes.
      - Categorize tasks (work, personal, health, learn, other).
      - Be efficient. No wasted rounds.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Top 3 Main Events (Priorities)"
            },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING, description: "HH:MM format (24h)" },
                  title: { type: Type.STRING },
                  duration: { type: Type.INTEGER, description: "Duration in minutes" },
                  category: { 
                    type: Type.STRING, 
                    enum: ["work", "personal", "health", "learn", "other"] 
                  },
                  reasoning: { type: Type.STRING, description: "Short reason for this round" }
                },
                required: ["startTime", "title", "duration", "category"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as SuggestionResponse;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
};