import {
  getPendingJournalistsService,
  approveJournalistService,
  rejectJournalistService,
} from "../services/admin.service.js";

// GET /api/admin/journalists/pending
export const getPendingJournalists = async (req, res) => {
  try {
    const pending = await getPendingJournalistsService();
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/journalists/:journalistId/approve
export const approveJournalist = async (req, res) => {
  try {
    const { journalistId } = req.params;
    const approved = await approveJournalistService(journalistId);
    res.status(200).json({
      message: "Journalist approved successfully",
      journalist: approved,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/admin/journalists/:journalistId/reject
export const rejectJournalist = async (req, res) => {
  try {
    const { journalistId } = req.params;
    await rejectJournalistService(journalistId);
    res.status(200).json({ message: "Journalist rejected successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
