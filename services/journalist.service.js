import prisma from "../prisma/client.js";

/**
 * Apply as a Journalist
 * @param {string} userId - ID of the currently logged-in user
 * @returns {Object} JournalistProfile
 */
export const applyAsJournalistService = async (userId) => {
  // 1️⃣ Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 2️⃣ Check if user already has the house set as JOURNALIST
  if (user.house === "JOURNALIST") {
    throw new Error("User is already a Journalist");
  }

  // 3️⃣ Check if a pending application already exists
  const existingProfile = await prisma.journalistProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new Error("Journalist application already submitted");
  }

  // 4️⃣ Create journalist profile (initially unverified)
  const journalistProfile = await prisma.journalistProfile.create({
    data: {
      userId,
      verified: false,
      credibilityScore: 0,
    },
  });

  return journalistProfile;
};
