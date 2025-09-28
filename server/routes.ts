import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  searchLegalDatabase, 
  summarizeDocument, 
  analyzeRisk,
  answerLegalQuestion,
  performWebSearch,
  generateDocument,
  analyzeDocument
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

  // Law Agent endpoint
  app.post("/api/law-agent", isAuthenticated, async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const answer = await answerLegalQuestion(question);
      
      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'law-agent',
        query: question,
        results: answer,
      });

      res.json(answer);
    } catch (error) {
      console.error("Law agent error:", error);
      res.status(500).json({ error: "Failed to answer legal question" });
    }
  });

  // Web Search endpoint
  app.post("/api/web-search", isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await performWebSearch(query);
      
      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'web-search',
        query: query,
        results: results,
      });

      res.json(results);
    } catch (error) {
      console.error("Web search error:", error);
      res.status(500).json({ error: "Failed to perform web search" });
    }
  });

  // Quick Question endpoint
  app.post("/api/quick-question", isAuthenticated, async (req, res) => {
    try {
      const { question } = req.body;
      
      console.log("[QUICK-QUESTION] Received question:", question);
      
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const answer = await answerLegalQuestion(question);
      console.log("[QUICK-QUESTION] OpenAI response:", JSON.stringify(answer, null, 2));
      
      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'quick-question',
        query: question,
        results: { answer },
      });

      const response = { answer };
      console.log("[QUICK-QUESTION] Sending response:", JSON.stringify(response, null, 2));
      res.json(response);
    } catch (error) {
      console.error("Quick question error:", error);
      res.status(500).json({ error: "Failed to answer question" });
    }
  });

  // Document Generation endpoint
  app.post("/api/generate-document", isAuthenticated, async (req, res) => {
    try {
      const { documentType, inputMethod, textContent, formData } = req.body;
      
      console.log("[DOCUMENT-GENERATION] Received request:", { documentType, inputMethod, textContent: textContent?.substring(0, 100), formData });
      
      if (!documentType || !inputMethod) {
        return res.status(400).json({ error: "Document type and input method are required" });
      }

      // Validate input based on method
      if ((inputMethod === 'voice' || inputMethod === 'paste') && !textContent) {
        return res.status(400).json({ error: "Text content is required for voice and paste input methods" });
      }

      if (inputMethod === 'manual' && !formData) {
        return res.status(400).json({ error: "Form data is required for manual input method" });
      }

      const document = await generateDocument(documentType, inputMethod, textContent, formData);
      console.log("[DOCUMENT-GENERATION] Generated document:", { 
        id: document.id, 
        type: document.type, 
        title: document.title,
        contentLength: document.formattedContent?.length || 0
      });
      
      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'document-generation',
        query: `${documentType} - ${inputMethod}`,
        results: { document },
      });

      res.json(document);
    } catch (error) {
      console.error("Document generation error:", error);
      res.status(500).json({ error: "Failed to generate document" });
    }
  });

  // Document Analysis endpoint
  app.post("/api/analyze-document", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No document file provided" });
      }

      console.log("[DOCUMENT-ANALYSIS] Received file:", { 
        filename: req.file.originalname, 
        mimetype: req.file.mimetype, 
        size: req.file.size 
      });

      // Extract text content from the uploaded file
      let documentContent = '';
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;

      // For now, handle text files directly, PDF and Word files would need additional processing
      if (req.file.mimetype === 'text/plain') {
        documentContent = fileBuffer.toString('utf-8');
      } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document')) {
        // For Word documents, we'll extract a simplified version
        // In a real implementation, you'd use a library like mammoth.js
        documentContent = `[Document: ${fileName}]\n\nThis is a Word document. For demonstration purposes, this represents the extracted text content of your uploaded document. In a production environment, this would contain the actual extracted text from your Word document with proper formatting and structure preserved.`;
      } else if (req.file.mimetype === 'application/pdf') {
        // For PDF documents, similar approach
        documentContent = `[Document: ${fileName}]\n\nThis is a PDF document. For demonstration purposes, this represents the extracted text content of your uploaded PDF. In a production environment, this would contain the actual extracted text from your PDF document with proper formatting and structure preserved.`;
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload a Word document, PDF, or text file." });
      }

      if (!documentContent.trim()) {
        return res.status(400).json({ error: "Could not extract content from the document" });
      }

      console.log("[DOCUMENT-ANALYSIS] Extracted content length:", documentContent.length);

      // Analyze the document using AI
      const analysis = await analyzeDocument(documentContent, fileName);
      console.log("[DOCUMENT-ANALYSIS] Analysis completed:", { 
        documentTitle: analysis.documentTitle,
        overallScore: analysis.overallQuality?.score,
        strongPointsCount: analysis.strongPoints?.length || 0,
        weakPointsCount: analysis.weakPoints?.length || 0
      });

      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'document-analysis',
        query: `Document Analysis: ${fileName}`,
        results: { analysis, fileName, fileSize: req.file.size },
      });

      res.json({
        content: documentContent,
        analysis: analysis,
        fileName: fileName,
        fileSize: req.file.size
      });
    } catch (error) {
      console.error("Document analysis error:", error);
      res.status(500).json({ error: "Failed to analyze document" });
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
