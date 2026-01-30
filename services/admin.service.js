import prisma from "../prisma/client.js";

// Get all pending journalist applications
export const getPendingJournalistsService = async () => {
  return await prisma.journalistProfile.findMany({
    where: { verified: false },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};

// Approve a journalist application
export const approveJournalistService = async (journalistId) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
  });

  if (!journalist) throw new Error("Journalist not found");

  // Only update the verified flag, don't touch User.role
  return await prisma.journalistProfile.update({
    where: { id: journalistId },
    data: { verified: true },
  });
};

// Reject a journalist application
export const rejectJournalistService = async (journalistId) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
  });

  if (!journalist) throw new Error("Journalist not found");

  // Delete the profile; user stays as normal USER
  return await prisma.journalistProfile.delete({
    where: { id: journalistId },
  });
};
