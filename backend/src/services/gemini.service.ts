import { GoogleGenerativeAI } from "@google/generative-ai";
import { LingoDotDevEngine } from "lingo.dev/sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MASTER_LOCALE_MAP: Record<string, string> = {
    ja: 'Japanese', zh: 'Simplified Chinese', ko: 'Korean', es: 'Spanish', fr: 'French',
    de: 'German', ar: 'Arabic', fa: 'Persian', vi: 'Vietnamese', tr: 'Turkish',
    pt: 'Portuguese', ru: 'Russian', hi: 'Hindi', id: 'Indonesian', th: 'Thai',
    en: 'English', it: 'Italian', nl: 'Dutch', pl: 'Polish', sv: 'Swedish',
    uk: 'Ukrainian', cs: 'Czech', ro: 'Romanian', hu: 'Hungarian', el: 'Greek',
    he: 'Hebrew', bn: 'Bengali', mr: 'Marathi', ta: 'Tamil', te: 'Telugu',
    kn: 'Kannada', gu: 'Gujarati', pa: 'Punjabi', ur: 'Urdu', ms: 'Malay',
    tl: 'Tagalog', sw: 'Swahili'
};

const LINGO_TIMEOUT_MS = 30000;

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            if (error?.status === 429) {
                console.warn(`[Gemini] Rate limited (429). Attempt ${attempt}/${maxRetries}. Retrying in ${attempt * 15}s...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 15000));
                continue;
            }
            throw error;
        }
    }
    console.error(`[Gemini] Failed after ${maxRetries} rate limit retries.`);
    throw lastError;
}

async function translateDocsWithFallback(
    docs: string,
    targetLanguage: string,
    languageName: string
): Promise<string> {
    try {
        const lingoDotDev = new LingoDotDevEngine({
            apiKey: process.env.LINGO_API_KEY || ""
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Lingo timeout")), LINGO_TIMEOUT_MS)
        );

        const translationPromise = lingoDotDev.localizeObject({ data: docs }, {
            sourceLocale: "en",
            targetLocale: targetLanguage
        });

        const result = await Promise.race([translationPromise, timeoutPromise]) as any;
        if (result && result.data) return result.data;
    } catch (err) {
        console.error("Lingo docs translation failed or timed out:", err);
    }

    return docs;
}

async function translateQuiz(
    quiz: any[],
    targetLanguage: string,
    languageName: string
): Promise<any[]> {
    if (!quiz || quiz.length === 0) return [];

    try {
        const lingoDotDev = new LingoDotDevEngine({
            apiKey: process.env.LINGO_API_KEY || ""
        });

        const timeoutPromise = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error("Lingo timeout")), LINGO_TIMEOUT_MS)
        );

        const translationPromise = lingoDotDev.localizeObject({ data: quiz }, {
            sourceLocale: "en",
            targetLocale: targetLanguage
        });

        const result = await Promise.race([translationPromise, timeoutPromise]);
        if (result && result.data) return result.data;
    } catch (e) {
        console.error("Lingo quiz translation error:", e);
    }
    
    return quiz;
}

export class GeminiService {
    static async generateInfrastructure(
        prompt: string,
        targetLanguage: string,
        isPremium: boolean,
        studyMode: boolean
    ) {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const languageName = MASTER_LOCALE_MAP[targetLanguage] || "English";

        const docsInstruction = studyMode
            ? `"docs": "A concise Study Guide explaining the architecture (MAX 600 WORDS). CRITICAL RULES: 1. You MUST use strict Markdown formatting (e.g., '## Headers', '* Bullet points'). 2. You MUST use '\\n\\n' to create line breaks and spacing between sections. 3. Keep explanations structured, punchy, and easy to read."`
            : `"docs": "A SHORT, basic summary. CRITICAL: You MUST use proper Markdown spacing (e.g., '## Overview'). Use '\\n\\n' for line breaks. DO NOT write a study guide. Keep it extremely brief."`;

        const quizInstruction = studyMode
            ? `"quiz": [ 
                { 
                    "question": "Write the specific question here in ${languageName}", 
                    "options": ["Option 1 in ${languageName}", "Option 2 in ${languageName}", "Option 3 in ${languageName}", "Option 4 in ${languageName}"], 
                    "correctAnswer": "MUST EXACTLY MATCH THE FULL TEXT OF THE CORRECT OPTION", 
                    "explanation": "Explanation of why it is correct in ${languageName}" 
                } 
              ] (CRITICAL RULES: 1. Generate EXACTLY 3 unique questions. 2. ALL TEXT MUST BE IN ${languageName.toUpperCase()}. 3. The 'correctAnswer' MUST be the exact full string from the options array, DO NOT use a letter like 'A' or 'B'.)`
            : `"quiz": [] (CRITICAL: YOU MUST RETURN AN EMPTY ARRAY. DO NOT GENERATE ANY QUESTIONS. STUDY MODE IS DISABLED.)`;

        const systemInstruction = `
        You are an elite Cloud Solutions Architect. Convert the user's natural language request into a valid cloud infrastructure design.
        
        GUARDRAIL RULE: If the user types a greeting (e.g., "hello", "hi", "how are you") or something entirely unrelated to cloud architecture:
        1. Return a single-node diagram with a friendly greeting icon/label.
        2. Set the "docs" to a polite welcome message explaining that you are an AI Architect ready to design cloud infrastructure for them today.
        3. Keep the "code" as empty comments, "estimatedCost" as "$0/mo", and "quiz" empty.
        
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
            const rawResponseText = await withRetry(async () => {
                const result = await model.generateContent(`${systemInstruction}\n\nUser Request: ${prompt}`);
                return result.response.text();
            });

            const cleanJsonString = rawResponseText
                .replace(/^```json\n?/g, "")
                .replace(/\n?```$/g, "")
                .trim();

            let parsedData = JSON.parse(cleanJsonString);

            if (targetLanguage !== "en" && parsedData.docs) {
                const [translatedDocs, translatedQuiz] = await Promise.all([
                    translateDocsWithFallback(parsedData.docs, targetLanguage, languageName),
                    parsedData.quiz && parsedData.quiz.length > 0
                        ? translateQuiz(parsedData.quiz, targetLanguage, languageName)
                        : Promise.resolve(parsedData.quiz ?? [])
                ]);

                parsedData.docs = translatedDocs;
                parsedData.quiz = translatedQuiz;
            }

            return parsedData;

        } catch (error) {
            console.error("Gemini Generation Error:", error);
            throw new Error(
                "Failed to generate infrastructure from AI. Please try rephrasing your request."
            );
        }
    }

    static async generateMoreQuestions(
        code: string,
        targetLanguage: string,
        existingQuestions: string[]
    ) {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const languageName = MASTER_LOCALE_MAP[targetLanguage] || "English";

        const systemInstruction = `
        You are an elite Cloud Solutions Architect and Technical Trainer. 
        Read the provided Terraform code and generate 5 NEW, challenging multiple-choice questions testing the user's knowledge on this specific architecture.
        
        CRITICAL RULES:
        1. DO NOT repeat any of the 'Existing Questions' provided by the user.
        2. All text (questions, options, explanations) MUST be written in ENGLISH.
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
            const rawResponseText = await withRetry(async () => {
                const result = await model.generateContent(`${systemInstruction}\n\n${prompt}`);
                return result.response.text();
            });
            const cleanJsonString = rawResponseText
                .replace(/^```json\n?/g, "")
                .replace(/\n?```$/g, "")
                .trim();

            const parsedData = JSON.parse(cleanJsonString);
            
            if (targetLanguage !== "en" && parsedData.quiz && parsedData.quiz.length > 0) {
                const translatedQuiz = await translateQuiz(parsedData.quiz, targetLanguage, languageName);
                parsedData.quiz = translatedQuiz;
            }

            return parsedData;
        } catch (error) {
            console.error("Gemini Quiz Generation Error:", error);
            throw new Error("Failed to generate additional questions.");
        }
    }

    static async translateExistingContent(
        docs: string,
        quiz: any[],
        targetLanguage: string
    ) {
        const languageName = MASTER_LOCALE_MAP[targetLanguage] || "English";

        const [localizedDocs, translatedQuiz] = await Promise.all([
            translateDocsWithFallback(docs, targetLanguage, languageName),
            translateQuiz(quiz, targetLanguage, languageName)
        ]);

        return { localizedDocs, quiz: translatedQuiz };
    }
}