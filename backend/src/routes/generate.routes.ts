import { Router } from "express";
import { generateArchitecture, generateQuiz } from "../controllers/generate.controller";
import { optionalAuth } from "../middlewares/auth";
import { getHistory } from '../controllers/history.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.post("/", optionalAuth, generateArchitecture);
router.get('/architectures', requireAuth, getHistory);
router.post("/quiz", optionalAuth, generateQuiz);

export default router;