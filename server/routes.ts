import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  searchLegalDatabase, 
  summarizeDocument, 
  analyzeRisk 
} from "./openai";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // AI Legal Research endpoint
  app.post("/api/legal-search", isAuthenticated, async (req, res) => {
    try {
      const { query, filters } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const results = await searchLegalDatabase(query, filters);
      
      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'legal-research',
        query: query,
        results: results,
      });

      res.json(results);
    } catch (error) {
      console.error("Legal search error:", error);
      res.status(500).json({ error: "Failed to search legal database" });
    }
  });

  // Brief Summarizer endpoint
  app.post("/api/summarize-document", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Document file is required" });
      }

      const { summaryType = 'quick' } = req.body;
      
      // Convert file buffer to text (simplified - in real app would use proper document parsing)
      const documentText = req.file.buffer.toString('utf-8');
      
      const summary = await summarizeDocument(documentText, summaryType);
      
      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'brief-summarizer',
        query: req.file.originalname || 'Document uploaded',
        results: summary,
      });

      res.json(summary);
    } catch (error) {
      console.error("Document summarization error:", error);
      res.status(500).json({ error: "Failed to summarize document" });
    }
  });

  // Risk Analysis endpoint
  app.post("/api/analyze-risk", isAuthenticated, async (req, res) => {
    try {
      const { caseType, description, jurisdiction, caseValue } = req.body;
      
      if (!caseType || !description) {
        return res.status(400).json({ error: "Case type and description are required" });
      }

      const analysis = await analyzeRisk({
        caseType,
        description,
        jurisdiction,
        caseValue,
      });
      
      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'risk-analysis',
        query: `${caseType}: ${description.substring(0, 100)}...`,
        results: analysis,
      });

      res.json(analysis);
    } catch (error) {
      console.error("Risk analysis error:", error);
      res.status(500).json({ error: "Failed to analyze risk" });
    }
  });

  // Get search history
  app.get("/api/search-history", isAuthenticated, async (req, res) => {
    try {
      const history = await storage.getSearchHistoryByUserId(req.user!.id);
      res.json(history);
    } catch (error) {
      console.error("Search history error:", error);
      res.status(500).json({ error: "Failed to get search history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
