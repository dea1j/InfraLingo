import { Router } from "express";
import { generateArchitecture } from "../controllers/generate.controller";
import { optionalAuth } from "../middlewares/auth";
import { getHistory } from '../controllers/history.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.post("/", optionalAuth, generateArchitecture);
router.get('/architectures', requireAuth, getHistory);

export default router;