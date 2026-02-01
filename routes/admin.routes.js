import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import * as controller from "../controllers/admin.controller.js";

const router = express.Router();

// All routes require ADMIN role
router.use(authenticate, authorizeRoles("ADMIN"));

// ==========================
// Journalist routes
// ==========================
router.get("/journalists/pending", controller.getPendingJournalists);
router.patch(
  "/journalists/:journalistId/approve",
  controller.approveJournalist,
);
router.delete("/journalists/:journalistId/reject", controller.rejectJournalist);

// ==========================
// Article review routes
// ==========================
router.get("/articles/pending", controller.getPendingArticles);
router.patch("/articles/:articleId/approve", controller.approveArticle);
router.patch("/articles/:articleId/reject", controller.rejectArticle);
router.patch("/articles/:articleId/correct", controller.requestCorrection);

export default router;
