import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import axios from "axios";

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

export const githubLogin = (req: Request, res: Response): void => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
        console.error("CRITICAL: GITHUB_CLIENT_ID is missing in .env");
        res.status(500).json({ error: "GitHub OAuth is not configured on the server." });
        return;
    }

    const redirectUri = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
    res.redirect(redirectUri);
};

export const githubCallback = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!code) {
        res.redirect(`${frontendUrl}?error=no_code_provided`);
        return;
    }

    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code as string,
        }, { 
            headers: { Accept: 'application/json' } 
        });

        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            throw new Error("Failed to retrieve access token from GitHub.");
        }

        const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const primaryEmailObj = emailResponse.data.find((e: any) => e.primary);
        const email = primaryEmailObj ? primaryEmailObj.email : emailResponse.data[0]?.email;

        if (!email) {
            res.redirect(`${frontendUrl}?error=no_email_found`);
            return;
        }

        const result = await AuthService.handleGithubAuth(email);

        res.redirect(`${frontendUrl}?token=${result.token}&email=${result.user.email}&id=${result.user.id}`);

    } catch (error) {
        console.error("GitHub Auth Error:", error);
        res.redirect(`${frontendUrl}?error=github_auth_failed`);
    }
};