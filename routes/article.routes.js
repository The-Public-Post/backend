import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeHouse } from "../middleware/house.middleware.js";
import * as controller from "../controllers/article.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ----------------------
// Public routes
// ----------------------
router.get("/latest", controller.getLatestArticles);
router.get("/search", controller.searchArticles);
router.get("/:articleId", controller.getArticleById);
router.get("/journalist/:journalistId", controller.getJournalistArticles);

// ----------------------
// Journalist-only routes
// ----------------------
router.post(
  "/",
  authenticate,
  authorizeHouse("JOURNALIST"),
  upload.array("media"),
  controller.createArticle,
);

router.patch(
  "/:articleId",
  authenticate,
  authorizeHouse("JOURNALIST"),
  upload.array("media"),
  controller.updateDraftArticle,
);

router.post(
  "/:articleId/submit",
  authenticate,
  authorizeHouse("JOURNALIST"),
  controller.submitDraftArticle,
);

router.get(
  "/dashboard/me",
  authenticate,
  authorizeHouse("JOURNALIST"),
  controller.getMyDashboardArticles,
);

export default router;
