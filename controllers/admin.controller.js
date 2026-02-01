import * as service from "../services/admin.service.js";

// ==========================
// Journalist Controllers
// ==========================
export const getPendingJournalists = async (req, res) => {
  try {
    const pending = await service.getPendingJournalistsService();
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveJournalist = async (req, res) => {
  try {
    const { journalistId } = req.params;
    const approved = await service.approveJournalistService(journalistId);
    res
      .status(200)
      .json({
        message: "Journalist approved successfully",
        journalist: approved,
      });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectJournalist = async (req, res) => {
  try {
    const { journalistId } = req.params;
    await service.rejectJournalistService(journalistId);
    res.status(200).json({ message: "Journalist rejected successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ==========================
// Article Review Controllers
// ==========================
export const getPendingArticles = async (req, res) => {
  try {
    const articles = await service.getPendingArticlesService();
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const adminId = req.user.userId;
    const article = await service.approveArticleService(articleId, adminId);
    res
      .status(200)
      .json({ message: "Article approved and published", article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;
    const article = await service.rejectArticleService(
      articleId,
      adminId,
      reason,
    );
    res.status(200).json({ message: "Article rejected", article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const requestCorrection = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;
    const article = await service.requestCorrectionService(
      articleId,
      adminId,
      reason,
    );
    res.status(200).json({ message: "Correction requested", article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
