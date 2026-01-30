// services/auth.service.js
import prisma from "../prisma/client.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";

// =======================
// REGISTER
// =======================
export const registerUser = async ({ email, password, name }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      role: "USER", // RBAC
      house: "CITIZEN", // user type
      politicalLeaning: "CENTER",
      lastQuizTakenAt: new Date(),
    },
  });

  // Don't return password in API response
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    house: user.house,
    politicalLeaning: user.politicalLeaning,
    lastQuizTakenAt: user.lastQuizTakenAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// =======================
// LOGIN
// =======================
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    throw new Error("Invalid credentials");
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      house: user.house,
      politicalLeaning: user.politicalLeaning,
      lastQuizTakenAt: user.lastQuizTakenAt,
    },
  };
};
