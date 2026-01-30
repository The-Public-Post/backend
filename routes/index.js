import express from "express";
import authRoutes from "./auth.routes.js";
import articleRoutes from "./article.routes.js";
import journalistRoutes from "./journalist.routes.js";
import adminRoutes from "./admin.routes.js";
import quizRoutes from "./quiz.routes.js";
import houseRoutes from "./house.routes.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/articles", articleRoutes);
router.use("/journalist", journalistRoutes);
router.use("/admin", adminRoutes);
router.use("/quiz", quizRoutes);
router.use("/house", houseRoutes);

export default router;
