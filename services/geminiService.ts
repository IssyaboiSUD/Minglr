
import { GoogleGenAI, Type } from "@google/genai";
import { Activity, UserProfile } from "../types";

/**
 * AI optimizes the order and selection of activities already in the database
 * based on the user's explicit preferences and wishlist history.
 */
export async function getPersonalizedRanking(user: UserProfile, allActivities: Activity[]): Promise<string[]> {
  // Always use {apiKey: process.env.API_KEY} for initialization as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing. Skipping personalized ranking.");
    return allActivities.slice(0, 4).map(a => a.id);
  }

  try {
    const prompt = `
      User Profile: Likes ${user.preferences.join(", ")}, Wishlist: ${user.wishlist.join(", ")}.
      Task: Rank the following Munich activities by relevance to this user. 
      Return the IDs of the top 4 most relevant activities from this list:
      ${JSON.stringify(allActivities.map(a => ({ id: a.id, name: a.name, category: a.category, description: a.description })))}
      
      Return ONLY a JSON array of strings containing the IDs.
    `;

    // ai.models.generateContent is used correctly for text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    // Directly access the text property as per extracting text guidelines (do not use .text())
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Personalization Error:", error);
    return allActivities.slice(0, 4).map(a => a.id);
  }
}
