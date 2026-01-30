import express from "express";
import {
  getPendingJournalists,
  approveJournalist,
  rejectJournalist,
} from "../controllers/admin.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Only authenticated admins can access these routes
router.use(authenticate, authorizeRoles("ADMIN"));

router.get("/journalists/pending", getPendingJournalists);
router.patch("/journalists/:journalistId/approve", approveJournalist);
router.delete("/journalists/:journalistId/reject", rejectJournalist);

export default router;
