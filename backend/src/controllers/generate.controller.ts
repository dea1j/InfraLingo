import { Request, Response } from "express";
import { ArchitectureService } from "../services/architecture.service";
import { JwtPayload } from "jsonwebtoken";

export const generateArchitecture = async (req: Request, res: Response): Promise<void> => {
    try {
        const { prompt, targetLanguage } = req.body;

        if (!prompt || !targetLanguage) {
            res.status(400).json({ error: "Prompt and targetLanguage are required." });
            return;
        }

        let userId: string | null = null;
        if (req.user && typeof req.user !== 'string') {
            userId = (req.user as JwtPayload).id || null;
        }

        const result = await ArchitectureService.buildAndLocalize(prompt, targetLanguage, userId);

        res.status(200).json(result);
    } catch (error) {
        console.error("Generation Error:", error);
        res.status(500).json({ error: "Failed to generate architecture." });
    }
};