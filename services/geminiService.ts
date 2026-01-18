
import { GoogleGenAI, Type } from "@google/genai";
import { Activity, UserProfile } from "../types";

/**
 * AI optimizes the order and selection of activities already in the database
 * based on the user's explicit preferences and wishlist history.
 * 
 * Includes session caching to prevent redundant API calls and quota exhaustion.
 */
export async function getPersonalizedRanking(user: UserProfile, allActivities: Activity[]): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Safety check for empty data
  if (allActivities.length === 0) return [];

  // Implement Session Caching to prevent hitting 429 quota limits during navigation
  const cacheKey = `minglr_ranking_${user.id}_${allActivities.length}_${user.preferences.join('_')}`;
  const cachedData = sessionStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }

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

    const result = JSON.parse(response.text || "[]");
    
    // Validate result is a string array
    if (Array.isArray(result) && result.length > 0) {
      // Cache the result for the current session
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    }
    
    return allActivities.slice(0, 4).map(a => a.id);
  } catch (error: any) {
    // Check for quota errors (429) specifically
    if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
      console.warn("Gemini API quota exceeded (429). Falling back to default ranking.");
    } else {
      console.error("Personalization Error:", error);
    }
    
    // Return a default slice instead of throwing to keep the UI functional
    return allActivities.slice(0, 4).map(a => a.id);
  }
}
