import { Router } from "express";
import { generateArchitecture } from "../controllers/generate.controller";
import { optionalAuth } from "../middlewares/auth";

const router = Router();

router.post("/", optionalAuth, generateArchitecture);

export default router;