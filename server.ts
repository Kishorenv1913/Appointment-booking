import dotenv from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  searchKnowledge,
  generateRagAnswer,
  ingestDocument,
  deleteDocument,
  getIndexedDocuments,
  getChatbotStats,
  seedInitialKnowledgeBase,
} from "./ragService";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT) || 3000;

// Rate limiting map: ip -> timestamp array
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(req: Request, maxPerMinute = 40): boolean {
  const ip = req.ip || req.socket.remoteAddress || "anonymous";
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < 60000);
  if (timestamps.length >= maxPerMinute) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ============================================================================
// RAG CHATBOT ENDPOINT (Primary RAG Pipeline)
// ============================================================================
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    if (!checkRateLimit(req)) {
      res.status(429).json({ error: "Too many requests. Please slow down and try again shortly." });
      return;
    }

    const { message, conversationId, history = [], context } = req.body ?? {};

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Please enter a message for the AI booking assistant." });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({ error: "Message exceeds maximum allowed length of 2000 characters." });
      return;
    }

    const sanitizedMessage = message.trim();

    // 1. Vector & Semantic Search in Knowledge Base
    const retrievedChunks = await searchKnowledge(sanitizedMessage, {
      topK: 4,
      threshold: 0.28,
    });

    // 2. Generate Grounded Response with LLM (OpenAI / Fallback)
    const ragResult = await generateRagAnswer(sanitizedMessage, retrievedChunks, {
      conversationId,
      history,
      liveProviders: context?.providers,
      userBookings: context?.bookings,
    });

    res.json(ragResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing chat request.";
    console.error("Chat API error:", msg);
    res.status(500).json({ error: msg });
  }
});

// Backward-compatible endpoint for existing AI Concierge calls
app.post("/api/concierge", async (req: Request, res: Response) => {
  try {
    const { message, history = [], context, conversationId } = req.body ?? {};
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Please enter a message for the SlotWise Concierge." });
      return;
    }

    // Run through modern RAG pipeline first
    const retrievedChunks = await searchKnowledge(message, { topK: 4 });
    const ragResult = await generateRagAnswer(message, retrievedChunks, {
      conversationId,
      history,
      liveProviders: context?.providers,
      userBookings: context?.bookings,
    });

    // Format for backwards compatibility with legacy UI expectations
    res.json({
      reply: ragResult.answer,
      sources: ragResult.sources,
      recommendedProviderId: ragResult.recommendation?.providerId,
      recommendedProviderName: ragResult.recommendation?.providerName,
      recommendedServiceId: ragResult.recommendation?.serviceId,
      recommendedDate: ragResult.recommendation?.dateKey,
      recommendedTime: ragResult.recommendation?.time,
      conversationId: ragResult.conversationId,
      intent: ragResult.intent,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reach AI Concierge.";
    console.error("Concierge API error:", msg);
    res.status(500).json({ error: msg });
  }
});

// ============================================================================
// ADMIN KNOWLEDGE BASE MANAGEMENT ENDPOINTS
// ============================================================================

// List all indexed knowledge documents
app.get("/api/knowledge/documents", (_req: Request, res: Response) => {
  try {
    const docs = getIndexedDocuments();
    res.json({ documents: docs, count: docs.length });
  } catch (err: unknown) {
    res.status(500).json({ error: "Failed to list knowledge documents." });
  }
});

// Ingest a document (manual text, FAQ, or uploaded file text)
app.post("/api/knowledge/ingest", async (req: Request, res: Response) => {
  try {
    const { title, content, category, sourceType, providerId, metadata } = req.body ?? {};

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "Document title is required." });
      return;
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Document content is required." });
      return;
    }

    const result = await ingestDocument({
      title: title.trim(),
      content: content.trim(),
      category: category || "General",
      sourceType: sourceType || "upload",
      providerId: providerId || undefined,
      metadata,
    });

    res.json({
      success: true,
      documentId: result.documentId,
      chunksCount: result.chunksCount,
      message: `Document '${title}' successfully ingested and embedded into vector database.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to ingest document.";
    console.error("Ingestion error:", msg);
    res.status(500).json({ error: msg });
  }
});

// Delete a document from vector knowledge base
app.delete("/api/knowledge/documents/:id", async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    if (!documentId) {
      res.status(400).json({ error: "Document ID is required." });
      return;
    }

    const deleted = await deleteDocument(documentId);
    res.json({ success: true, deleted, documentId });
  } catch (err: unknown) {
    res.status(500).json({ error: "Failed to delete knowledge document." });
  }
});

// Re-seed / sync live website knowledge
app.post("/api/knowledge/seed", async (_req: Request, res: Response) => {
  try {
    await seedInitialKnowledgeBase();
    const docs = getIndexedDocuments();
    res.json({ success: true, count: docs.length, documents: docs });
  } catch (err: unknown) {
    res.status(500).json({ error: "Failed to seed knowledge base." });
  }
});

// Chatbot usage & performance statistics
app.get("/api/chat/stats", (_req: Request, res: Response) => {
  try {
    const stats = getChatbotStats();
    res.json(stats);
  } catch (err: unknown) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================
async function startServer() {
  // Pre-seed knowledge base on boot
  try {
    await seedInitialKnowledgeBase();
    console.log("SlotWise RAG knowledge base initialized.");
  } catch (e) {
    console.warn("Notice: Initial knowledge seeding error:", e);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SlotWise server running on http://0.0.0.0:${PORT}`);
    console.log(`RAG AI Chatbot endpoints active on /api/chat and /api/knowledge`);
  });
}

startServer();
