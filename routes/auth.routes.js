import express from "express";
import { register, login } from "../controllers/auth.controller.js";
import { completeRegistrationController } from "../controllers/completeRegistration.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/complete-registration", completeRegistrationController);

export default router;
