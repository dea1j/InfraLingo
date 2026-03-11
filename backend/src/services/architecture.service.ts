import { AppDataSource } from "../data-source";
import { Architecture } from "../entities/Architecture";
import { GeminiService } from "./gemini.service";
import { LingoService } from "./lingo.service";

export class ArchitectureService {
    private static architectureRepo = AppDataSource.getRepository(Architecture);

    static async buildAndLocalize(prompt: string, targetLanguage: string, userId: string | null) {
        const isPremium = userId !== null;
        
        if (!isPremium) {
            const lowerPrompt = prompt.toLowerCase();
            const blockedKeywords = ["gcp", "google cloud", "azure", "kubernetes", "k8s"];
            
            const hitPaywall = blockedKeywords.some(keyword => lowerPrompt.includes(keyword));
            
            if (hitPaywall) {
                throw new Error("Multi-cloud deployments (GCP/Azure) and advanced orchestrators are premium features. Please sign in to unlock them.");
            }
        }

        console.log(`Calling Gemini (Premium: ${isPremium}) for: "${prompt}"`);
        
        const geminiResult = await GeminiService.generateInfrastructure(prompt, targetLanguage, isPremium);

        console.log(`Translating documentation to: ${targetLanguage}`);
        const localizedDocs = await LingoService.localizeDocs(geminiResult.docs, targetLanguage);

        if (userId) {
            console.log(`Saving to database for user: ${userId}`);
            const newArchitecture = this.architectureRepo.create({
                originalPrompt: prompt,
                targetLanguage: targetLanguage,
                nodesJson: geminiResult.nodes,
                edgesJson: geminiResult.edges,
                terraformCode: geminiResult.code,
                readmeLocalized: localizedDocs,
                user: { id: userId } 
            });
            await this.architectureRepo.save(newArchitecture);
        }

        console.log(`Generation complete!`);
        
        return {
            nodes: geminiResult.nodes,
            edges: geminiResult.edges,
            code: geminiResult.code,
            docs: localizedDocs 
        };
    }
}