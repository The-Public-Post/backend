import { submitQuiz } from "../services/quiz.service.js";

export const submitQuizController = async (req, res) => {
  try {
    const { q1, q2, q3, q4, q5, q6 } = req.body;

    const userId = req.user.userId; // coming from authenticate middleware

    const quizResult = await submitQuiz(userId, [q1, q2, q3, q4, q5, q6]);

    res.status(200).json(quizResult);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
