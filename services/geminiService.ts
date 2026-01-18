
import { GoogleGenAI, Type } from "@google/genai";
import { FacultyMember, ResearchQuery, SchoolLevel } from "../types";

export class GeminiResearchService {
  async researchSchools(query: ResearchQuery): Promise<{ data: FacultyMember[], sources: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are an elite educational data researcher for the US region.
      
      TARGET REGION: "${query.region}"
      TARGET LEVEL: ${query.level}
      KEYWORDS: "${query.keywords}"
      
      REQUIREMENT:
      Find exactly or as close as possible to ${query.count} faculty/staff members.
      
      SALARY RESEARCH:
      For each person found, provide a "salaryEstimate" string (e.g., "$55,000 - $72,000 per year") based on public salary schedules for that specific district/school and region.
      
      OUTPUT DATA FIELDS PER PERSON:
      - schoolName
      - schoolAddress
      - facultyName (Full Name)
      - position (Job Title)
      - email (Official email)
      - isK12Unified (Boolean: true if school is K-12)
      - sourceUrl (The directory page where data was found)
      - salaryEstimate (Estimated annual salary range)
      
      You MUST return the results as a JSON array named "results".
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    schoolName: { type: Type.STRING },
                    schoolAddress: { type: Type.STRING },
                    facultyName: { type: Type.STRING },
                    position: { type: Type.STRING },
                    email: { type: Type.STRING },
                    isK12Unified: { type: Type.BOOLEAN },
                    sourceUrl: { type: Type.STRING },
                    salaryEstimate: { type: Type.STRING }
                  },
                  required: ["schoolName", "schoolAddress", "facultyName", "position", "email", "isK12Unified", "salaryEstimate"]
                }
              }
            }
          }
        },
      });

      let text = response.text || '{"results": []}';
      let jsonStr = text;
      
      if (text.includes('```json')) {
        jsonStr = text.split('```json')[1].split('```')[0];
      } else if (text.includes('```')) {
        jsonStr = text.split('```')[1].split('```')[0];
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const formattedData: FacultyMember[] = (parsed.results || []).map((item: any, index: number) => ({
        id: `member-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        name: item.facultyName,
        position: item.position,
        email: item.email,
        schoolName: item.schoolName,
        schoolAddress: item.schoolAddress,
        level: query.level,
        isK12Unified: item.isK12Unified,
        sourceUrl: item.sourceUrl || (groundingSources[0]?.web?.uri || ''),
        salaryEstimate: item.salaryEstimate
      }));

      return {
        data: formattedData.slice(0, query.count),
        sources: groundingSources
      };
    } catch (error: any) {
      if (error.message?.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
        throw new Error("QUOTA_EXCEEDED: Batas API tercapai. Silakan gunakan API Key berbayar.");
      }
      throw error;
    }
  }

  async generateTeacherPortrait(name: string, position: string, school: string): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A highly professional, realistic corporate headshot of an educator named ${name} who works as a ${position} at ${school}. 
    The portrait should be front-facing, professional attire (like a blazer or button-down shirt), neutral soft background, high quality, DSLR photography. 
    Infer appropriate gender presentation based on the name ${name}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Error generating portrait:", error);
      return null;
    }
  }
}
