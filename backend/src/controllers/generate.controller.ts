import { Request, Response } from "express";
import { ArchitectureService } from "../services/architecture.service";
import { GeminiService } from "../services/gemini.service";

export const generateArchitecture = async (req: Request, res: Response) => {
    try {
        const { prompt, targetLanguage, studyMode = false } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        const userId = (req as any).user ? (req as any).user.id : null;

        const result = await ArchitectureService.buildAndLocalize(prompt, targetLanguage || "en", userId, studyMode);

        res.status(200).json(result);
    } catch (error: any) {
        console.error("Generation Error:", error);
        res.status(500).json({ 
            error: error.message || "An unexpected error occurred during generation." 
        });
    }
};

export const generateQuiz = async (req: Request, res: Response) => {
    try {
        const { code, targetLanguage, existingQuestions = [] } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: "Terraform code is required to generate a quiz." });
        }

        const result = await GeminiService.generateMoreQuestions(code, targetLanguage || "en", existingQuestions);

        res.status(200).json(result);
    } catch (error: any) {
        console.error("Quiz Generation Error:", error);
        res.status(500).json({ 
            error: error.message || "An unexpected error occurred during quiz generation." 
        });
    }
};