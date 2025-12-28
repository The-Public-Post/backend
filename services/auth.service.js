import prisma from "../prisma/client.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";


// registering of the user
export const registerUser = async ({ email, password }) => {
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
      password: passwordHash, // temp as we later moved to AuthAccount
      role: "READER",
    },
  });
  return user;
};


// login of the user
export const loginUser = async ({ email, password }) => {
  // 1. find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
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
      role: user.role,
    },
  };
};
