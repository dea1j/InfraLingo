import { LingoDotDevEngine } from "lingo.dev/sdk";

const apiKey = process.env.LINGO_API_KEY;
if (!apiKey) {
    throw new Error("CRITICAL: LINGO_API_KEY environment variable is missing.");
}

const lingoEngine = new LingoDotDevEngine({ 
    apiKey: apiKey 
});

export class LingoService {
    static async localizeDocs(englishMarkdown: string, targetLanguage: string): Promise<string> {
        if (targetLanguage === "en" || targetLanguage === "en-US") {
            return englishMarkdown;
        }

        try {
            const translatedText = await lingoEngine.localizeText(englishMarkdown, {
                sourceLocale: "en",
                targetLocale: targetLanguage
            });

            return translatedText;
        } catch (error) {
            console.error("Lingo.dev Translation Error:", error);
            return `> **Translation temporarily unavailable.**\n\n${englishMarkdown}`;
        }
    }
}