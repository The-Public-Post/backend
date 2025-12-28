import prisma from "../prisma/client.js";

export const triggerAIFactCheck = async (articleId) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article || article.status !== "UNDER_REVIEW") return;



    // this is just for checking purpose later on we will make it with the help of the ai api 
    // we will call the AI model with the data we have and need the result in the form given below
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

      if (aiResult.isSafe && aiResult.confidenceScore > 0.9) {
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
