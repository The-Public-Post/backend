import prisma from "../prisma/client.js";

export const submitQuiz = async (userId, answers) => {
  if (!Array.isArray(answers) || answers.length !== 6) {
    throw new Error("Quiz must contain exactly 6 answers");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.lastQuizTakenAt) {
    const lastTaken = new Date(user.lastQuizTakenAt);
    const now = new Date();
    const oneMonthLater = new Date(lastTaken);
    oneMonthLater.setMonth(lastTaken.getMonth() + 1);

    if (now < oneMonthLater) {
      const daysLeft = Math.ceil((oneMonthLater - now) / (1000 * 60 * 60 * 24));
      throw new Error(`You can retake the quiz in ${daysLeft} day(s)`);
    }
  }

  const totalScore = answers.reduce((sum, val) => sum + val, 0);

  let calculatedLeaning = "CENTER";
  if (totalScore <= 6) calculatedLeaning = "LEFT";
  else if (totalScore <= 12) calculatedLeaning = "CENTER_LEFT";
  else if (totalScore <= 18) calculatedLeaning = "CENTER";
  else if (totalScore <= 24) calculatedLeaning = "CENTER_RIGHT";
  else calculatedLeaning = "RIGHT";

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

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      politicalLeaning: calculatedLeaning,
      lastQuizTakenAt: new Date(),
    },
  });

  return {
    userId: updatedUser.id,
    politicalLeaning: calculatedLeaning,
    lastQuizTakenAt: updatedUser.lastQuizTakenAt,
  };
};
