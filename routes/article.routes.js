import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import multer from "multer";

import {
    createArticle,
    submitDraftArticle,
    updateDraftArticle,
    getLatestArticles,
    getArticleById,
    getJournalistArticles,
    searchArticles,
    getMyDashboardArticles
} from "../controllers/article.controller.js";

const router=express.Router();
const upload=multer({storage:multer.memoryStorage()});


router.get("/latest", getLatestArticles);
router.get("/search", searchArticles);
router.get("/:articleId", getArticleById);
router.get("/journalist/:journalistId", getJournalistArticles);



router.post("/", authenticate, authorizeRoles("JOURNALIST"), upload.array("media"), createArticle);
router.patch("/:articleId", authenticate, authorizeRoles("JOURNALIST"), upload.array("media"), updateDraftArticle);
router.post("/:articleId/submit", authenticate, authorizeRoles("JOURNALIST"), submitDraftArticle);
router.get("/dashboard/me", authenticate, authorizeRoles, getMyDashboardArticles);




export default router;