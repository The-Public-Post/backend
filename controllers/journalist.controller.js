import { applyAsJournalistService } from "../services/journalist.service.js";

/**
 * POST /journalist/apply
 * Authenticated route: Apply as Journalist
 */
export const applyAsJournalist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const journalist = await applyAsJournalistService(userId);

    res.status(201).json({
      message: "Journalist application submitted",
      journalist,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
