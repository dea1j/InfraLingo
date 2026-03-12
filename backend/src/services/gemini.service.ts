import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class GeminiService {
    static async generateInfrastructure(prompt: string, targetLanguage: string, isPremium: boolean, studyMode: boolean) {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // Map the code to the actual language name
        const languageMap: Record<string, string> = {
            en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese", ja: "Japanese"
        };
        const languageName = languageMap[targetLanguage] || "English";

        // Calm, clear instructions for normal formatting
        const docsInstruction = studyMode 
            ? `"docs": "A detailed, educational Study Guide explaining the architecture. Use standard Markdown headings (##) and bullet points. Break down the core concepts and explain WHY these specific components were chosen. Write in normal sentence case."`
            : `"docs": "A standard, professional Markdown string explaining the architecture and security warnings. Use normal sentence case and standard Markdown headings."`;

        // NEW: Explicitly force the language onto the initial quiz generation!
        const quizInstruction = studyMode
            ? `"quiz": [ { "question": "Write a specific question...", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Why this is correct" } ] (CRITICAL: GENERATE EXACTLY 3 UNIQUE QUESTIONS HERE. ALL QUIZ TEXT MUST BE IN ${languageName.toUpperCase()})`
            : `"quiz": []`;

        const systemInstruction = `
        You are an elite Cloud Solutions Architect. Convert the user's natural language request into a valid cloud infrastructure design.
        
        Return your response as a strictly valid JSON object. Do not include Markdown wrappers like \`\`\`json.

        The JSON object must EXACTLY match this structure:
        {
            "nodes": [
                { "id": "1", "position": { "x": 0, "y": 0 }, "data": { "label": "AWS VPC" }, "type": "default" }
            ],
            "edges": [
                { "id": "e1-2", "source": "1", "target": "2", "animated": true }
            ],
            "code": "provider \\"aws\\" {\\n  region = \\"us-east-1\\"\\n}\\n\\n...",
            ${docsInstruction},
            "estimatedCost": "$145/mo",
            "costBreakdown": [
                { "component": "Application Load Balancer", "cost": "$25/mo" }
            ],
            ${quizInstruction}
        }

        Formatting Rules:
        1. Write the docs in normal English text with proper capitalization (DO NOT use all caps). Use standard markdown syntax.
        2. Escape all newlines in the code and docs strings using \\n. Do not use actual raw line breaks in the JSON values.
        3. ALWAYS include the provider block (e.g., provider "aws" or provider "google") at the top of the terraform code.
        `;

        try {
            const result = await model.generateContent(`${systemInstruction}\n\nUser Request: ${prompt}`);
            const responseText = result.response.text();
            
            const cleanJsonString = responseText.replace(/^```json\n?/g, "").replace(/\n?```$/g, "").trim();
            
            return JSON.parse(cleanJsonString);
        } catch (error) {
            console.error("Gemini Generation Error:", error);
            throw new Error("Failed to generate infrastructure from AI. Please try rephrasing your request.");
        }
    }

    static async generateMoreQuestions(code: string, targetLanguage: string, existingQuestions: string[]) {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // Tell the AI to output in the user's selected language
        const languageMap: Record<string, string> = {
            en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese", ja: "Japanese"
        };
        const languageName = languageMap[targetLanguage] || "English";

        const systemInstruction = `
        You are an elite Cloud Solutions Architect and Technical Trainer. 
        Read the provided Terraform code and generate 5 NEW, challenging multiple-choice questions testing the user's knowledge on this specific architecture.
        
        CRITICAL RULES:
        1. DO NOT repeat any of the 'Existing Questions' provided by the user.
        2. All text (questions, options, explanations) MUST be written in ${languageName}.
        3. Return a strictly valid JSON object. Do not include Markdown wrappers like \`\`\`json.

        The JSON object must EXACTLY match this structure:
        {
            "quiz": [
                {
                    "question": "Specific question about the architecture",
                    "options": ["A", "B", "C", "D"],
                    "correctAnswer": "A",
                    "explanation": "Detailed explanation of why this is correct."
                }
            ]
        }
        `;

        const prompt = `
        Terraform Code:
        ${code}

        Existing Questions to Avoid:
        ${existingQuestions.length > 0 ? existingQuestions.join(" | ") : "None"}
        `;

        try {
            const result = await model.generateContent(`${systemInstruction}\n\n${prompt}`);
            const responseText = result.response.text();
            
            const cleanJsonString = responseText.replace(/^```json\n?/g, "").replace(/\n?```$/g, "").trim();
            
            return JSON.parse(cleanJsonString);
        } catch (error) {
            console.error("Gemini Quiz Generation Error:", error);
            throw new Error("Failed to generate additional questions.");
        }
    }
}