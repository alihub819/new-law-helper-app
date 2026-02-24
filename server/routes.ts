import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import {
  searchLegalDatabase,
  summarizeDocument,
  analyzeRisk,
  answerLegalQuestion,
  performWebSearch,
  generateDocument,
  analyzeDocument,
  improveDocumentSection,
  generateResponse
} from "./openai";
import { insertCaseSchema, insertDocumentSchema, insertMedicalRecordSchema, insertKnowledgeBaseSchema, insertAppointmentSchema, insertIntakeFormSchema } from "../shared/schema";
import multer from "multer";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { generatePDF, generateDOCX, generateTXT, type ExportContent } from "./document-export";
import { runMedicalIntelligence, generateDemandLetter, generateDiscoveryResponse, transcribeWithAnalysis } from "./openai";

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
  // Health check endpoint
    app.get("/api/db-status", async (req, res) => {
    try {
      const userCount = await storage.getUserByEmail("demo@lawhelper.com");
      res.json({ status: "connected", demoUserExists: !!userCount });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message || e.toString() });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Setup authentication routes
  setupAuth(app);

  // Demo Login endpoint
  app.post("/api/demo-login", async (req, res, next) => {
    try {
      const demoEmail = "demo@lawhelper.com";
      let user = await storage.getUserByEmail(demoEmail);

      if (!user) {
        // Create demo user if doesn't exist
        const hashedPassword = await hashPassword("demo-password-123");
        user = await storage.createUser({
          name: "Demo Attorney",
          email: demoEmail,
          password: hashedPassword,
        });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    } catch (error: any) {
      console.error("DEMO LOGIN ERROR:", error.message || error);
      res.status(500).json({ error: "Demo login failed: " + (error.message || error) });
    }
  });

  // AI Legal Research endpoint
  app.post("/api/legal-search", isAuthenticated, async (req, res) => {
    try {
      const { query, filters, useKnowledgeBase } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      let context = "";
      if (useKnowledgeBase) {
        const kbEntries = await storage.getKnowledgeBaseByUser(req.user!.id);
        context = kbEntries.map(e => `Document: ${e.title}\nContent: ${e.content}`).join("\n\n");
      }

      const results = await searchLegalDatabase(query, filters, context);

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

      // Extract text based on file type
      let documentText = '';
      const fileType = req.file.mimetype;

      if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        req.file.originalname.endsWith('.docx')) {
        // Use mammoth to extract text from Word documents
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        documentText = result.value;
      } else if (fileType === 'application/msword' || req.file.originalname.endsWith('.doc')) {
        // For older .doc format, attempt text extraction (may not be perfect)
        documentText = req.file.buffer.toString('utf-8');
      } else if (fileType === 'text/plain' || req.file.originalname.endsWith('.txt')) {
        // Plain text files
        documentText = req.file.buffer.toString('utf-8');
      } else if (fileType === 'application/pdf') {
        const parser = new PDFParse({ data: req.file.buffer });
        const data = await parser.getText();
        documentText = data.text;
      } else {
        // Try UTF-8 conversion for other formats
        documentText = req.file.buffer.toString('utf-8');
      }

      if (!documentText.trim()) {
        return res.status(400).json({ error: "Could not extract content from the document" });
      }

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

      // Use proper extraction where possible
      if (req.file.mimetype === 'text/plain') {
        documentContent = fileBuffer.toString('utf-8');
      } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document') || fileName.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        documentContent = result.value;
      } else if (req.file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: fileBuffer });
        const data = await parser.getText();
        documentContent = data.text;
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

  // Document improvement endpoint
  app.post("/api/improve-document-section", isAuthenticated, async (req, res) => {
    try {
      const { type, item, documentContent } = req.body;

      if (!type || !item || !documentContent) {
        return res.status(400).json({ error: "Missing required fields: type, item, documentContent" });
      }

      console.log("[DOCUMENT-IMPROVEMENT] Processing improvement request:", {
        type,
        itemPoint: item.point || item.area,
        contentLength: documentContent.length
      });

      // Generate improvement using AI
      const improvement = await improveDocumentSection(type, item, documentContent);

      console.log("[DOCUMENT-IMPROVEMENT] Improvement generated:", {
        improvedTextLength: improvement.improvedText.length,
        explanation: improvement.explanation
      });

      // Save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'document-improvement',
        query: `${type}: ${item.point || item.area}`,
        results: { improvement, type, item },
      });

      res.json(improvement);
    } catch (error) {
      console.error("Document improvement error:", error);
      res.status(500).json({ error: "Failed to generate improvement" });
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

  // Case Management Routes
  app.get("/api/cases", isAuthenticated, async (req, res) => {
    try {
      const cases = await storage.getCasesByUser(req.user!.id);
      res.json(cases);
    } catch (error) {
      console.error("Get cases error:", error);
      res.status(500).json({ error: "Failed to get cases" });
    }
  });

  app.get("/api/cases/:id", isAuthenticated, async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData || caseData.userId !== req.user!.id) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(caseData);
    } catch (error) {
      console.error("Get case error:", error);
      res.status(500).json({ error: "Failed to get case" });
    }
  });

  app.post("/api/cases", isAuthenticated, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertCaseSchema.parse({
        ...req.body,
        userId: req.user!.id, // Always set userId from authenticated user
      });
      const newCase = await storage.createCase(validatedData);
      res.json(newCase);
    } catch (error) {
      console.error("Create case error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid case data", details: error });
      }
      res.status(500).json({ error: "Failed to create case" });
    }
  });

  app.put("/api/cases/:id", isAuthenticated, async (req, res) => {
    try {
      const existingCase = await storage.getCase(req.params.id);
      if (!existingCase || existingCase.userId !== req.user!.id) {
        return res.status(404).json({ error: "Case not found" });
      }
      // Validate and prevent userId modification
      const { userId: _ignored, ...updateData } = req.body;
      const validatedData = insertCaseSchema.partial().parse(updateData);
      const updatedCase = await storage.updateCase(req.params.id, validatedData);
      res.json(updatedCase);
    } catch (error) {
      console.error("Update case error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid case data", details: error });
      }
      res.status(500).json({ error: "Failed to update case" });
    }
  });

  app.delete("/api/cases/:id", isAuthenticated, async (req, res) => {
    try {
      const existingCase = await storage.getCase(req.params.id);
      if (!existingCase || existingCase.userId !== req.user!.id) {
        return res.status(404).json({ error: "Case not found" });
      }
      await storage.deleteCase(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete case error:", error);
      res.status(500).json({ error: "Failed to delete case" });
    }
  });

  // Document Management Routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const { caseId } = req.query;

      if (caseId) {
        // Verify user owns the case before returning documents
        const caseData = await storage.getCase(caseId as string);
        if (!caseData || caseData.userId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        const documents = await storage.getDocumentsByCase(caseId as string);
        res.json(documents);
      } else {
        const documents = await storage.getDocumentsByUser(req.user!.id);
        res.json(documents);
      }
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req, res) => {
    try {
      // If caseId provided, verify user owns the case
      if (req.body.caseId) {
        const caseData = await storage.getCase(req.body.caseId);
        if (!caseData || caseData.userId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Validate and create document
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const newDoc = await storage.createDocument(validatedData);
      res.json(newDoc);
    } catch (error) {
      console.error("Create document error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid document data", details: error });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.userId !== req.user!.id) {
        return res.status(404).json({ error: "Document not found" });
      }
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Medical Records Routes
  app.get("/api/medical-records/:caseId", isAuthenticated, async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.caseId);
      if (!caseData || caseData.userId !== req.user!.id) {
        return res.status(404).json({ error: "Case not found" });
      }
      const records = await storage.getMedicalRecordsByCase(req.params.caseId);
      res.json(records);
    } catch (error) {
      console.error("Get medical records error:", error);
      res.status(500).json({ error: "Failed to get medical records" });
    }
  });

  app.post("/api/medical-records", isAuthenticated, async (req, res) => {
    try {
      const caseData = await storage.getCase(req.body.caseId);
      if (!caseData || caseData.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate and create medical record
      const validatedData = insertMedicalRecordSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const newRecord = await storage.createMedicalRecord(validatedData);
      res.json(newRecord);
    } catch (error) {
      console.error("Create medical record error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid medical record data", details: error });
      }
      res.status(500).json({ error: "Failed to create medical record" });
    }
  });

  app.delete("/api/medical-records/:id", isAuthenticated, async (req, res) => {
    try {
      const record = await storage.getMedicalRecord(req.params.id);
      if (!record || record.userId !== req.user!.id) {
        return res.status(404).json({ error: "Medical record not found" });
      }
      await storage.deleteMedicalRecord(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete medical record error:", error);
      res.status(500).json({ error: "Failed to delete medical record" });
    }
  });

  // Document Export Routes
  app.post("/api/export-document", isAuthenticated, async (req, res) => {
    try {
      const { format, content } = req.body;

      if (!format || !content) {
        return res.status(400).json({ error: "Format and content are required" });
      }

      if (!["pdf", "docx", "txt"].includes(format)) {
        return res.status(400).json({ error: "Invalid format. Must be pdf, docx, or txt" });
      }

      const exportContent: ExportContent = {
        title: content.title || "LawHelper Document",
        sections: content.sections || [{ content: JSON.stringify(content, null, 2) }],
        metadata: {
          author: req.user!.name,
          subject: content.subject || "Legal Document",
          keywords: content.keywords || [],
        },
      };

      let fileBuffer: Buffer | string;
      let mimeType: string;
      let filename: string;

      switch (format) {
        case "pdf":
          fileBuffer = await generatePDF(exportContent);
          mimeType = "application/pdf";
          filename = `${exportContent.title.replace(/\s+/g, "_")}.pdf`;
          break;
        case "docx":
          fileBuffer = await generateDOCX(exportContent);
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          filename = `${exportContent.title.replace(/\s+/g, "_")}.docx`;
          break;
        case "txt":
          fileBuffer = generateTXT(exportContent);
          mimeType = "text/plain";
          filename = `${exportContent.title.replace(/\s+/g, "_")}.txt`;
          break;
        default:
          return res.status(400).json({ error: "Invalid format" });
      }

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Document export error:", error);
      res.status(500).json({ error: "Failed to export document" });
    }
  });

  // Medical Intelligence Suite Route
  app.post("/api/medical-intelligence", isAuthenticated, async (req, res) => {
    try {
      const { mode, payload } = req.body;

      if (!mode || !payload) {
        return res.status(400).json({ error: "Mode and payload are required" });
      }

      if (!["chronology", "bills", "summary"].includes(mode)) {
        return res.status(400).json({ error: "Invalid mode. Must be chronology, bills, or summary" });
      }

      const result = await runMedicalIntelligence(mode, payload);

      // Save the medical intelligence analysis to the database
      const modeTitle = mode === "chronology" ? "Medical Chronology" :
        mode === "bills" ? "Medical Bills Analysis" : "Medical Summary";

      let docType: any = "other";
      if (mode === "chronology") docType = "medical-chronology";
      else if (mode === "bills") docType = "medical-bill-analysis";
      else if (mode === "summary") docType = "medical-summary";

      await storage.createDocument({
        userId: req.user!.id,
        caseId: payload.caseId || null,
        documentType: docType,
        title: `${modeTitle} - ${new Date().toLocaleDateString()}`,
        content: result,
      });

      res.json(result);
    } catch (error) {
      console.error("Medical intelligence error:", error);
      res.status(500).json({ error: "Failed to process medical intelligence request" });
    }
  });

  // Demand Letter Automation Route
  app.post("/api/demand-letter", isAuthenticated, async (req, res) => {
    try {
      const result = await generateDemandLetter(req.body);

      // Save the generated demand letter to the database
      const caseType = req.body.caseType || "Personal Injury";
      const claimantName = req.body.claimantName || "Unknown";
      await storage.createDocument({
        userId: req.user!.id,
        caseId: req.body.caseId || null,
        documentType: "demand-letter",
        title: `Demand Letter - ${claimantName} (${caseType})`,
        content: result,
      });

      res.json(result);
    } catch (error) {
      console.error("Demand letter generation error:", error);
      res.status(500).json({ error: "Failed to generate demand letter" });
    }
  });

  // Get Saved Documents Route
  app.get("/api/saved-documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocumentsByUser(req.user!.id);
      res.json(documents);
    } catch (error) {
      console.error("Get saved documents error:", error);
      res.status(500).json({ error: "Failed to get saved documents" });
    }
  });

  // Delete Saved Document Route
  app.delete("/api/saved-documents/:id", isAuthenticated, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.userId !== req.user!.id) {
        return res.status(404).json({ error: "Document not found" });
      }
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete saved document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Knowledge Base Routes
  app.get("/api/knowledge-base", isAuthenticated, async (req, res) => {
    try {
      const entries = await storage.getKnowledgeBaseByUser(req.user!.id);
      res.json(entries);
    } catch (error) {
      console.error("Get knowledge base error:", error);
      res.status(500).json({ error: "Failed to get knowledge base" });
    }
  });

  app.post("/api/knowledge-base", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Document file is required" });
      }

      let content = "";
      if (req.file.mimetype === 'text/plain') {
        content = req.file.buffer.toString('utf-8');
      } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document')) {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        content = result.value;
      } else if (req.file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: req.file.buffer });
        const data = await parser.getText();
        content = data.text;
      } else {
        content = req.file.buffer.toString('utf-8');
      }

      const entry = await storage.createKnowledgeBase({
        userId: req.user!.id,
        title: req.body.title || req.file.originalname,
        content: content,
        fileName: req.file.originalname,
      });

      res.json(entry);
    } catch (error) {
      console.error("Create knowledge base error:", error);
      res.status(500).json({ error: "Failed to create knowledge base entry" });
    }
  });

  app.delete("/api/knowledge-base/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKnowledgeBase(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete knowledge base error:", error);
      res.status(500).json({ error: "Failed to delete knowledge base entry" });
    }
  });

  // Discovery Response Tools Route
  app.post("/api/discovery-tools", isAuthenticated, async (req, res) => {
    try {
      const { type, payload } = req.body;

      if (!type || !payload) {
        return res.status(400).json({ error: "Type and payload are required" });
      }

      if (!["interrogatories", "requests", "admissions"].includes(type)) {
        return res.status(400).json({ error: "Invalid type. Must be interrogatories, requests, or admissions" });
      }

      const result = await generateDiscoveryResponse(type, payload);

      // Save the discovery response to the database
      const typeTitle = type === "interrogatories" ? "Interrogatory Responses" :
        type === "requests" ? "Document Production Responses" : "Admission Responses";

      let docType: any = "other";
      if (type === "interrogatories") docType = "interrogatories";
      else if (type === "requests") docType = "request-for-production";
      else if (type === "admissions") docType = "other"; // Admissions not in enum yet, using other

      await storage.createDocument({
        userId: req.user!.id,
        caseId: payload.caseId || null,
        documentType: docType,
        title: `${typeTitle} - ${new Date().toLocaleDateString()}`,
        content: result,
      });

      res.json(result);
    } catch (error) {
      console.error("Discovery response generation error:", error);
      res.status(500).json({ error: "Failed to generate discovery response" });
    }
  });

  // ============================================
  // Transcription Route (OpenAI Whisper)
  // ============================================
  app.post("/api/transcribe", isAuthenticated, upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Audio/video file required" });
      }

      // File size check (Whisper max 25MB)
      if (req.file.size > 25 * 1024 * 1024) {
        return res.status(400).json({ error: "File too large. Maximum 25MB for transcription." });
      }

      // Transcribe with analysis
      const result = await transcribeWithAnalysis(req.file.buffer, req.file.originalname);

      // Optionally save to search history
      await storage.createSearchHistory({
        userId: req.user!.id,
        type: 'transcription',
        query: req.file.originalname,
        results: {
          transcript: result.formattedTranscript.substring(0, 500) + "...",
          duration: result.duration
        },
      });

      res.json({
        success: true,
        transcript: result.formattedTranscript,
        rawText: result.rawText,
        segments: result.segments,
        duration: result.duration,
        analysis: {
          summary: result.summary,
          keyPoints: result.keyPoints,
          actionItems: result.actionItems
        },
        fileName: req.file.originalname,
        fileSize: req.file.size
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: error.message || "Failed to transcribe audio" });
    }
  });

  // ============================================
  // Appointment Scheduler Routes
  // ============================================

  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const appointments = await storage.getAppointments(req.user!.id);
      res.json(appointments);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const data = insertAppointmentSchema.parse({
        ...req.body,
        userId: req.user!.id,
        status: "scheduled"
      });

      const appointment = await storage.createAppointment(data);

      // Create intake form link
      const intakeForm = await storage.createIntakeForm({
        appointmentId: appointment.id,
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        caseType: appointment.type || "consultation",
        status: "pending",
        data: {}
      });

      res.json({
        success: true,
        appointment,
        intakeLink: `/intake/${intakeForm.id}`
      });
    } catch (error) {
      console.error("Create appointment error:", error);
      res.status(400).json({ error: "Invalid appointment data" });
    }
  });


  // ============================================
  // Client Intake Forms (Public Access for Client)
  // ============================================

  app.get("/api/intake/:id", async (req, res) => {
    try {
      const form = await storage.getIntakeForm(req.params.id);
      if (!form) return res.status(404).json({ error: "Intake form not found" });
      res.json(form);
    } catch (error) {
      console.error("Get intake form error:", error);
      res.status(500).json({ error: "Failed to fetch intake form" });
    }
  });

  app.post("/api/intake/:id", async (req, res) => {
    try {
      const { formData } = req.body;
      const form = await storage.getIntakeForm(req.params.id);

      if (!form) return res.status(404).json({ error: "Intake form not found" });

      // Run AI Analysis on submission
      let analysis = null;
      try {
        const aiResponse = await generateResponse([
          { role: "system", content: "You are a legal intake specialist. Analyze this client intake form." },
          { role: "user", content: `Analyze the following intake data and provide a brief summary and potential legal issues:\n${JSON.stringify(formData, null, 2)}` }
        ]);
        analysis = aiResponse;
      } catch (e) {
        console.error("AI Analysis failed:", e);
      }

      const updatedForm = await storage.updateIntakeForm(req.params.id, {
        data: formData,
        status: "completed",
        aiAnalysis: analysis
      });

      res.json({ success: true, form: updatedForm });
    } catch (error) {
      console.error("Submit intake form error:", error);
      res.status(500).json({ error: "Failed to submit intake form" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
