import { Router } from "express";
import { register, login, githubLogin, githubCallback } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

export default router;