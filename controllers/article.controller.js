import prisma from "../prisma/client.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { triggerAIFactCheck } from "../utils/aiPipeline.js";



// heping fns to be called
const getPrismaMediaType = (cloudinaryResult, file) => {
  if (file.mimetype === "application/pdf" || cloudinaryResult.format === "pdf") return "PDF";
  switch (cloudinaryResult.resource_type) {
    case "image": return "IMAGE";
    case "video": return "VIDEO";
    default: return "IMAGE";
  }
};

const parseTags = (tagsInput) => {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) return tagsInput;
  try {
    return JSON.parse(tagsInput);
  } catch {
    return [tagsInput];
  }
};


// this allows both the creation as well as putting draft
export const createArticle = async (req, res) => {
  try {
    const { title, content, submit = false } = req.body;
    const files = req.files || [];
    const tagsList = parseTags(req.body.tags);

    if (!title || !content) return res.status(400).json({ error: "Required fields missing" });

    const journalist = await prisma.journalistProfile.findUnique({
      where: { userId: req.user.userId },
    });
    if (!journalist) return res.status(403).json({ error: "Journalist profile not found" });

    const uploadedMedia = [];
    for (const file of files) {
      const result = await uploadToCloudinary(file, "articles");
      uploadedMedia.push({
        type: getPrismaMediaType(result, file),
        url: result.secure_url,
      });
    }

    const article = await prisma.$transaction(async (tx) => {
      const newArticle = await tx.article.create({
        data: {
          title,
          content,
          authorId: journalist.id,
          status: submit ? "UNDER_REVIEW" : "DRAFT", 
          tags: {
            connectOrCreate: tagsList.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
      });

      if (uploadedMedia.length > 0) {
        await tx.articleMedia.createMany({
          data: uploadedMedia.map((m) => ({
            articleId: newArticle.id,
            type: m.type,
            url: m.url,
          })),
        });
      }
      return newArticle;
    });

    if (submit) {
      triggerAIFactCheck(article.id); 
    }

    res.status(201).json({
      message: submit 
        ? "Article submitted for verification." 
        : "Draft saved.",
      articleId: article.id,
    });

  } catch (error) {
    console.error("createArticle error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//submitting the draft thing
export const submitDraftArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { title, content } = req.body;
    const files = req.files || [];
    const tagsList = parseTags(req.body.tags);

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true },
    });

    if (!article) return res.status(404).json({ error: "Not found" });
    if (article.author.userId !== req.user.userId) return res.status(403).json({ error: "Unauthorized" });

    const uploadedMedia = [];
    for (const file of files) {
      const result = await uploadToCloudinary(file, "articles");
      uploadedMedia.push({
        type: getPrismaMediaType(result, file),
        url: result.secure_url,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: articleId },
        data: {
          title: title ?? article.title,
          content: content ?? article.content,
          // PDF LOGIC: Verification queue 
          status: "UNDER_REVIEW", 
          tags: {
            set: [],
            connectOrCreate: tagsList.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
      });

      if (files.length > 0) {
        await tx.articleMedia.deleteMany({ where: { articleId } });
        await tx.articleMedia.createMany({
          data: uploadedMedia.map((m) => ({
            articleId,
            type: m.type,
            url: m.url,
          })),
        });
      }
    });

    triggerAIFactCheck(articleId);

    res.status(200).json({ message: "Article submitted for verification." });

  } catch (error) {
    console.error("submitDraftArticle error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// only for the updation before the submission
export const updateDraftArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { title, content, submit = false } = req.body;
    const files = req.files || [];
    const tagsList = parseTags(req.body.tags);

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true },
    });

    if (!article) return res.status(404).json({ error: "Article not found" });

    if (article.author.userId !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!["DRAFT", "CORRECTED"].includes(article.status)) {
      return res.status(400).json({
        error: "Article cannot be edited in its current state",
      });
    }

    const uploadedMedia = [];
    for (const file of files) {
      const result = await uploadToCloudinary(file, "articles");
      uploadedMedia.push({
        type: getPrismaMediaType(result, file),
        url: result.secure_url,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: articleId },
        data: {
          title: title ?? article.title,
          content: content ?? article.content,
          status: submit ? "UNDER_REVIEW" : article.status,
          tags: {
            set: [],
            connectOrCreate: tagsList.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
      });

      if (files.length > 0) {
        await tx.articleMedia.deleteMany({ where: { articleId } });
        await tx.articleMedia.createMany({
          data: uploadedMedia.map((m) => ({
            articleId,
            type: m.type,
            url: m.url,
          })),
        });
      }
    });

    if (submit) {
      triggerAIFactCheck(articleId);
    }

    res.status(200).json({
      message: submit
        ? "Corrections submitted for re-verification."
        : "Article updated successfully.",
    });
  } catch (error) {
    console.error("updateDraftArticle error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




// Fetching the articles Controllers

// getting all the latest article..
export const getLatestArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED", 
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            user: { select: { email: true } }, 
            verified: true,
            credibilityScore: true,
          },
        },
        tags: true,
        media: {
          take: 1, 
          where: { type: "IMAGE" },
        },
        _count: {
          select: { comments: true, tips: true },
        },
      },
    });

    const totalCount = await prisma.article.count({
      where: { status: "PUBLISHED" },
    });

    res.status(200).json({
      data: articles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
      },
    });
  } catch (error) {
    console.error("getLatestArticles error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// getting a single article using the article id
export const getArticleById = async (req, res) => {
  try {
    const { articleId } = req.params;

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
          include: {
            user: { select: { email: true } },
          },
        },
        tags: true, 
        media: true,
        factChecks: true, 
        _count: {
          select: { comments: true, flags: true },
        },
      },
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    if (article.status !== "PUBLISHED") {
      if (!req.user || article.author.userId !== req.user.userId) {
        return res.status(403).json({ error: "Access denied. Article is not public." });
      }
    }

    res.status(200).json(article);
  } catch (error) {
    console.error("getArticleById error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// getting the articles which are published(verified) i.e for the normal readers that need to be visible related to a particlar journalist using journaslist id
export const getJournalistArticles = async (req, res) => {
  try {
    const { journalistId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const articles = await prisma.article.findMany({
      where: {
        authorId: journalistId,
        status: {in :["PUBLISHED","REJECTED"]},
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        tags: true,
        media: { take: 1 },
        _count: { select: { comments: true } },
      },
    });

    res.status(200).json(articles);
  } catch (error) {
    console.error("getJournalistArticles error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 4. Search & Filter Articles (Supports Keyword, Bias, AND Tag)
// Usage: /api/articles/search?query=crypto&tag=Finance&bias=LEFT
export const searchArticles = async (req, res) => {
  try {
    const { query, bias, tag } = req.query;

    const whereClause = {
      status: "PUBLISHED",
    };

    //filter by keyboard (either tiltle or content);;;;
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ];
    }

    //filtering by the bias
    if (bias) {
      whereClause.bias = bias;
    }

    // filtering by the tag
    if (tag) {
      whereClause.tags = {
        some: {
          name: { equals: tag, mode: "insensitive" } 
        }
      };
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: {
          select: { user: { select: { email: true } }, credibilityScore: true },
        },
        tags: true, 
        media: { take: 1 },
      },
    });

    res.status(200).json(articles);
  } catch (error) {
    console.error("searchArticles error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// this is for the journalist i.e it can see not pusblished also
export const getMyDashboardArticles = async (req, res) => {
  try {
    const userId = req.user.userId;

    const journalist = await prisma.journalistProfile.findUnique({
      where: { userId },
    });

    if (!journalist) {
      return res.status(404).json({ error: "Journalist profile not found" });
    }

    const articles = await prisma.article.findMany({
      where: {
        authorId: journalist.id,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        tags: true, 
        _count: { select: { comments: true, flags: true } },
        factChecks: { select: { confidence: true, type: true } },
      },
    });

    res.status(200).json(articles);
  } catch (error) {
    console.error("getMyDashboardArticles error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};







