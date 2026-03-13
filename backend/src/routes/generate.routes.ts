import { Router } from "express";
import { generateArchitecture, generateQuiz, translateContent } from "../controllers/generate.controller";
import { optionalAuth, requireAuth } from "../middlewares/auth";
import { getHistory } from '../controllers/history.controller';
import { generateLimiter, translateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post("/", optionalAuth, generateLimiter, generateArchitecture);

router.post("/quiz", optionalAuth, translateLimiter, generateQuiz);
router.post("/translate", requireAuth, translateLimiter, translateContent);

router.get('/architectures', requireAuth, getHistory);

export default router;