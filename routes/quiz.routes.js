import express from "express";
import { submitQuizController } from "../controllers/quiz.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /quiz/submit
router.post("/submit", authenticate, submitQuizController);

export default router;
