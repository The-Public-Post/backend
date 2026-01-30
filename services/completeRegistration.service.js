import prisma from "../prisma/client.js";
import { registerUser } from "./auth.service.js";
import { signToken } from "../utils/jwt.js";

// helper function to calculate political leaning
const calculatePoliticalLeaning = (answers) => {
  const total = answers.reduce((sum, val) => sum + val, 0);
  if (total <= 10) return "LEFT";
  if (total <= 20) return "CENTER_LEFT";
  if (total <= 30) return "CENTER";
  if (total <= 40) return "CENTER_RIGHT";
  return "RIGHT";
};

export const completeRegistration = async ({
  name,
  email,
  password,
  quizAnswers,
  house,
}) => {
  // 1️⃣ register user (reuse existing service)
  const user = await registerUser({ name, email, password });

  // 2️⃣ calculate political leaning
  const politicalLeaning = calculatePoliticalLeaning(quizAnswers);

  // 3️⃣ update user with house and political leaning
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      house,
      politicalLeaning,
      lastQuizTakenAt: new Date(),
    },
  });

  // 4️⃣ save quiz attempt
  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      q1: quizAnswers[0],
      q2: quizAnswers[1],
      q3: quizAnswers[2],
      q4: quizAnswers[3],
      q5: quizAnswers[4],
      q6: quizAnswers[5],
      totalScore: quizAnswers.reduce((a, b) => a + b, 0),
      calculatedLeaning: politicalLeaning,
    },
  });

  // 5️⃣ return JWT token
  const token = signToken({ userId: updatedUser.id, role: updatedUser.role });

  return { token, user: updatedUser };
};
