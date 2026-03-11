import "reflect-metadata"; 

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth.routes";
import generateRoutes from "./routes/generate.routes";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/generate", generateRoutes);

app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ 
        status: "ok", 
        message: "InfraLingo API is running smoothly!" 
    });
});


AppDataSource.initialize()
    .then(() => {
        console.log("📦 Connected to PostgreSQL database successfully.");
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    });

export default app;