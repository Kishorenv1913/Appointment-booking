import { searchKnowledge, generateRagAnswer, seedInitialKnowledgeBase } from "../ragService";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await seedInitialKnowledgeBase();

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { message, conversationId, history = [], context } = body ?? {};

    const msg = message || "Hi";
    const retrievedChunks = await searchKnowledge(msg, { topK: 4 });
    const result = await generateRagAnswer(msg, retrievedChunks, {
      conversationId,
      history,
      liveProviders: context?.providers,
      userBookings: context?.bookings,
    });

    return res.status(200).json({
      reply: result.answer,
      sources: result.sources,
      recommendedProviderId: result.recommendation?.providerId,
      recommendedProviderName: result.recommendation?.providerName,
      recommendedServiceId: result.recommendation?.serviceId,
      recommendedDate: result.recommendation?.dateKey,
      recommendedTime: result.recommendation?.time,
      conversationId: result.conversationId,
      intent: result.intent,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error processing concierge request.";
    return res.status(500).json({ error: errorMsg });
  }
}
