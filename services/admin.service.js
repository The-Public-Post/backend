import prisma from "../prisma/client.js";

// ==========================
// Journalist Services
// ==========================
export const getPendingJournalistsService = async () => {
  return await prisma.journalistProfile.findMany({
    where: { verified: false },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          house: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};

export const approveJournalistService = async (journalistId) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
    include: { user: true }, // include user to update house
  });
  if (!journalist) throw new Error("Journalist not found");

  await prisma.$transaction([
    prisma.journalistProfile.update({
      where: { id: journalistId },
      data: { verified: true },
    }),
    prisma.user.update({
      where: { id: journalist.userId },
      data: { house: "JOURNALIST" },
    }),
  ]);

  return {
    ...journalist,
    verified: true,
    user: { ...journalist.user, house: "JOURNALIST" },
  };
};

export const rejectJournalistService = async (journalistId) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
  });
  if (!journalist) throw new Error("Journalist not found");

  // Delete profile, user's house stays CITIZEN
  return await prisma.journalistProfile.delete({ where: { id: journalistId } });
};

// ==========================
// Article Review Services
// ==========================
export const getPendingArticlesService = async () => {
  return await prisma.article.findMany({
    where: { status: "UNDER_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        include: {
          user: { select: { id: true, name: true, email: true, house: true } },
        },
      },
      tags: true,
      media: true,
    },
  });
};

export const approveArticleService = async (articleId, adminId) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: "PUBLISHED" },
  });

  await prisma.moderationLog.create({
    data: {
      adminId,
      action: "RESTORE",
      targetId: articleId,
      reason: "Article approved and published",
    },
  });

  return updated;
};

export const rejectArticleService = async (
  articleId,
  adminId,
  reason = "Rejected",
) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: "REJECTED" },
  });

  await prisma.moderationLog.create({
    data: {
      adminId,
      action: "TAKE_DOWN",
      targetId: articleId,
      reason,
    },
  });

  return updated;
};

export const requestCorrectionService = async (articleId, adminId, reason) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: "CORRECTED" },
  });

  await prisma.moderationLog.create({
    data: {
      adminId,
      action: "WARN",
      targetId: articleId,
      reason,
    },
  });

  return updated;
};
