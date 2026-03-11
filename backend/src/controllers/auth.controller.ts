import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: "Email and password are required." });
            return;
        }

        const result = await AuthService.register(email, password);
        res.status(201).json(result);
        
    } catch (error: any) {
        if (error.message === "EMAIL_EXISTS") {
            res.status(400).json({ error: "Email already in use." });
        } else {
            console.error("Registration Error:", error);
            res.status(500).json({ error: "Server error during registration." });
        }
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: "Email and password are required." });
            return;
        }

        const result = await AuthService.login(email, password);
        res.status(200).json(result);

    } catch (error: any) {
        if (error.message === "INVALID_CREDENTIALS") {
            res.status(401).json({ error: "Invalid credentials." });
        } else {
            console.error("Login Error:", error);
            res.status(500).json({ error: "Server error during login." });
        }
    }
};