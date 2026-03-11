import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET environment variable is missing.");
}

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET as string);
        req.user = decoded;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};


export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Unauthorized. Token missing." });
        return;
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET as string);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: "Invalid or expired token." });
    }
};