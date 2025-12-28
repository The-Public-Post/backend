import express from "express";
import { applyAsJournalist } from "../controllers/journalist.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router=express.Router();

router.post("/apply", authenticate, applyAsJournalist);

export default router;