import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Architecture } from "../entities/Architecture";

export const getHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; 

        const architectureRepo = AppDataSource.getRepository(Architecture);
        
        const history = await architectureRepo.find({
            where: { user: { id: userId } },
            order: { createdAt: "DESC" }
        });

        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: "Failed to fetch architecture history." });
    }
};