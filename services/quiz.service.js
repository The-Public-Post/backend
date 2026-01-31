import prisma from "../prisma/client.js";

export const submitQuiz = async (userId, answers) => {
  if (!Array.isArray(answers) || answers.length !== 6) {
    throw new Error("Quiz must contain exactly 6 answers");
  }

  const totalScore = answers.reduce((sum, val) => sum + val, 0);

  let calculatedLeaning = "CENTER";
  if (totalScore <= 6) calculatedLeaning = "LEFT";
  else if (totalScore <= 12) calculatedLeaning = "CENTER_LEFT";
  else if (totalScore <= 18) calculatedLeaning = "CENTER";
  else if (totalScore <= 24) calculatedLeaning = "CENTER_RIGHT";
  else calculatedLeaning = "RIGHT";

  // 1️⃣ Store quiz attempt (history)
  await prisma.quizAttempt.create({
    data: {
      userId,
      q1: answers[0],
      q2: answers[1],
      q3: answers[2],
      q4: answers[3],
      q5: answers[4],
      q6: answers[5],
      totalScore,
      calculatedLeaning,
    },
  });

  // 2️⃣ Update user's current snapshot
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      politicalLeaning: calculatedLeaning,
      lastQuizTakenAt: new Date(),
    },
  });

  return {
    userId: user.id,
    politicalLeaning: calculatedLeaning,
    lastQuizTakenAt: user.lastQuizTakenAt,
  };
};
