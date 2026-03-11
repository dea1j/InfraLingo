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
            console.log(`[Lingo Debug] Attempting to translate to: ${targetLanguage}`);
            console.log(`[Lingo Debug] Sending test ping...`);
            const ping = await lingoEngine.localizeText("Hello, this is a test.", {
                sourceLocale: "en",
                targetLocale: targetLanguage
            });
            console.log(`[Lingo Debug] API is ALIVE! Ping result: ${ping}`);

            console.log(`[Lingo Debug] Sending actual Markdown (${englishMarkdown.length} characters)...`);
            const translatedText = await lingoEngine.localizeText(englishMarkdown, {
                sourceLocale: "en",
                targetLocale: targetLanguage
            });

            return translatedText;

        } catch (error: any) {
            console.error("Lingo.dev Translation Error Details:", error.message || error);
            
            return `> **Lingo.dev API Error:** ${error.message || "500 Internal Server Error"}\n\n${englishMarkdown}`;
        }
    }
}