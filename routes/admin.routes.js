import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";

import {
    getPendingJournalists,
    approveJournalist,
    rejectJournalist,
}from "../controllers/admin.controller.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router=express.Router();

// router.use(authenticate, authorizeRoles("ADMIN"));// yo har path me check garnai parxa tei bhayera pahilai haldekko
// commented for now for easy testing purpose i will turn it on later on

router.get("/journalists/pending", getPendingJournalists);
router.patch("/journalists/:journalistId/approve", approveJournalist);
router.patch("/journalists/:journalistId/reject", rejectJournalist);

export default router;

