import prisma from "../prisma/client.js";

export const triggerAIFactCheck = async (articleId) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) return;

    // Safety: Only auto-publish if article was submitted
    if (article.status !== "UNDER_REVIEW") {
      console.log(`Article ${articleId} is not under review. Skipping AI.`);
      return;
    }

    // Mock AI result for testing
    const aiResult = {
      summary: "Content verified. Sources match known databases.",
      confidenceScore: 0.92,
      bias: "NEUTRAL",
      isSafe: true,
    };

    await prisma.$transaction(async (tx) => {
      await tx.factCheck.create({
        data: {
          articleId,
          type: "AI",
          status: aiResult.isSafe ? "APPROVED" : "FLAGGED",
          result: aiResult,
          confidence: aiResult.confidenceScore,
        },
      });

      // Only publish if submitted (UNDER_REVIEW) AND safe
      if (
        article.status === "UNDER_REVIEW" &&
        aiResult.isSafe &&
        aiResult.confidenceScore > 0.9
      ) {
        await tx.article.update({
          where: { id: articleId },
          data: {
            status: "PUBLISHED",
            bias: aiResult.bias,
          },
        });
        console.log(`AI auto-published article ${articleId}`);
      } else {
        console.log(`Article ${articleId} queued for human review`);
      }
    });
  } catch (error) {
    console.error("AI Fact Check Error:", error);
  }
};
