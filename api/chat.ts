import type { IncomingMessage, ServerResponse } from "http";
import { searchKnowledge, generateRagAnswer, seedInitialKnowledgeBase } from "../ragService";

export default async function handler(req: any, res: any) {
  // CORS
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

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Please enter a message for the AI assistant." });
    }

    const sanitizedMessage = message.trim();
    const retrievedChunks = await searchKnowledge(sanitizedMessage, { topK: 4 });
    const ragResult = await generateRagAnswer(sanitizedMessage, retrievedChunks, {
      conversationId,
      history,
      liveProviders: context?.providers,
      userBookings: context?.bookings,
    });

    return res.status(200).json(ragResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing chat request.";
    console.error("Vercel Chat API error:", msg);
    return res.status(500).json({ error: msg });
  }
}
