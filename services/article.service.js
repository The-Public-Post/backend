import prisma from "../prisma/client.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { triggerAIFactCheck } from "../utils/aiPipeline.js";

// =====================
// Helpers
// =====================
const parseTags = (tagsInput) => {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) return tagsInput;
  try {
    return JSON.parse(tagsInput);
  } catch {
    return [tagsInput];
  }
};

const getMediaType = (result, file) => {
  if (file.mimetype === "application/pdf") return "PDF";
  if (result.resource_type === "video") return "VIDEO";
  return "IMAGE";
};

// =====================
// Article Services
// =====================

// Create Article (Draft or Direct Submit)
export const createArticleService = async (
  userId,
  { title, content, submit },
  files = [],
  tagsInput,
) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { userId },
  });
  if (!journalist) throw new Error("Journalist profile not found");

  const shouldSubmit = submit === true || submit === "true";
  const tags = parseTags(tagsInput);

  const media = [];
  for (const file of files) {
    const uploaded = await uploadToCloudinary(file, "articles");
    media.push({
      type: getMediaType(uploaded, file),
      url: uploaded.secure_url,
    });
  }

  const article = await prisma.$transaction(async (tx) => {
    const created = await tx.article.create({
      data: {
        title,
        content,
        authorId: journalist.id,
        status: shouldSubmit ? "UNDER_REVIEW" : "DRAFT",
        tags: {
          connectOrCreate: tags.map((t) => ({
            where: { name: t },
            create: { name: t },
          })),
        },
      },
    });

    if (media.length) {
      await tx.articleMedia.createMany({
        data: media.map((m) => ({ ...m, articleId: created.id })),
      });
    }

    return created;
  });

  if (shouldSubmit) triggerAIFactCheck(article.id);

  return article;
};

// Update Draft (Save Again or Submit)
export const updateDraftArticleService = async (
  userId,
  articleId,
  { title, content, submit },
  files = [],
  tagsInput,
) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: true },
  });

  if (!article) throw new Error("Article not found");
  if (article.author.userId !== userId) throw new Error("Not authorized");
  if (!["DRAFT", "CORRECTED"].includes(article.status))
    throw new Error("Cannot edit this article");

  const shouldSubmit = submit === true || submit === "true";
  const tags = parseTags(tagsInput);

  await prisma.article.update({
    where: { id: articleId },
    data: {
      title: title ?? article.title,
      content: content ?? article.content,
      status: shouldSubmit ? "UNDER_REVIEW" : article.status,
      tags: {
        set: [],
        connectOrCreate: tags.map((t) => ({
          where: { name: t },
          create: { name: t },
        })),
      },
    },
  });

  if (files.length) {
    await prisma.articleMedia.deleteMany({ where: { articleId } });
    for (const file of files) {
      const uploaded = await uploadToCloudinary(file, "articles");
      await prisma.articleMedia.create({
        data: {
          articleId,
          type: getMediaType(uploaded, file),
          url: uploaded.secure_url,
        },
      });
    }
  }

  if (shouldSubmit) triggerAIFactCheck(articleId);

  return shouldSubmit ? "submitted" : "updated";
};

// Submit Draft
export const submitDraftArticleService = async (userId, articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: true },
  });

  if (!article) throw new Error("Article not found");
  if (article.author.userId !== userId) throw new Error("Not authorized");
  if (!["DRAFT", "CORRECTED"].includes(article.status))
    throw new Error("Cannot submit this article");

  await prisma.article.update({
    where: { id: articleId },
    data: { status: "UNDER_REVIEW" },
  });

  triggerAIFactCheck(articleId);
};

// Get Latest Published Articles
export const getLatestArticlesService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: { include: { user: { select: { id: true, name: true } } } },
      media: true,
      tags: true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });
  const total = await prisma.article.count({ where: { status: "PUBLISHED" } });
  return { data: articles, pagination: { page, limit, total } };
};

// Get Article By ID
export const getArticleByIdService = async (articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: { include: { user: { select: { id: true, name: true } } } },
      media: true,
      tags: true,
      comments: { include: { user: { select: { id: true, name: true } } } },
      factChecks: true,
      flags: true,
    },
  });

  if (!article) throw new Error("Article not found");
  return article;
};

// Get Journalist Articles
export const getJournalistArticlesService = async (journalistId, page = 1) => {
  const skip = (page - 1) * 10;
  return await prisma.article.findMany({
    where: { authorId: journalistId },
    include: { media: true, tags: true, factChecks: true },
    orderBy: { createdAt: "desc" },
    skip,
    take: 10,
  });
};

// Search Articles
export const searchArticlesService = async (query) => {
  const { q, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  return await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { author: { include: { user: true } }, tags: true, media: true },
    orderBy: { createdAt: "desc" },
    skip,
    take: parseInt(limit),
  });
};

// Journalist Dashboard
export const getMyDashboardArticlesService = async (userId) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { userId },
  });
  if (!journalist) throw new Error("Journalist profile not found");

  return await prisma.article.findMany({
    where: { authorId: journalist.id },
    include: { media: true, tags: true, factChecks: true },
    orderBy: { createdAt: "desc" },
  });
};
