import express from "express";
import { submitQuizController } from "../controllers/quiz.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/submit", authenticate, submitQuizController);
router.post("/retake", authenticate, submitQuizController);

export default router;
