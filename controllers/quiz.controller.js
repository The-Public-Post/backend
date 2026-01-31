import { submitQuiz } from "../services/quiz.service.js";

export const submitQuizController = async (req, res) => {
  try {
    const { quizAnswers } = req.body;
    const userId = req.user.userId; // from authenticate middleware

    const result = await submitQuiz(userId, quizAnswers);

    res.status(200).json({
      message: "Quiz submitted successfully",
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
