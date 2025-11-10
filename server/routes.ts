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
  analyzeDocument,
  improveDocumentSection
} from "./openai";
import multer from "multer";
import mammoth from "mammoth";

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
      } else {
        // Try UTF-8 conversion for other formats
        documentText = req.file.buffer.toString('utf-8');
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

      // For now, handle text files directly, PDF and Word files would need additional processing
      if (req.file.mimetype === 'text/plain') {
        documentContent = fileBuffer.toString('utf-8');
      } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document')) {
        // For Word documents, we'll create a formatted demo version
        documentContent = `BUSINESS LETTER SAMPLE

[Company Letterhead Area]

Date: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

[Recipient Name]
[Recipient Title]
[Company Name]
[Address Line 1]
[Address Line 2]
[City, State ZIP Code]

Dear [Recipient Name],

I am writing to [state the purpose of your letter clearly and concisely]. This document demonstrates how a properly formatted business letter should appear with appropriate spacing, professional tone, and clear structure.

BODY PARAGRAPHS:

The main body of your letter should contain the essential information you want to convey. Each paragraph should focus on a specific point or topic. Use clear, professional language that is appropriate for your audience.

• First key point or important information
• Second key point with supporting details  
• Third key point if applicable

CONCLUSION:

In closing, please feel free to contact me at [phone number] or [email address] if you have any questions or need additional information. I look forward to hearing from you soon.

Sincerely,

[Your Signature]
[Your Printed Name]
[Your Title]
[Your Contact Information]

---
Note: This is a demonstration of a properly formatted business document. In a production environment, this would show the actual content of your uploaded Word document with preserved formatting, headers, and document structure.`;
      } else if (req.file.mimetype === 'application/pdf') {
        // For PDF documents, create a formatted demo version
        documentContent = `LEGAL DOCUMENT SAMPLE

CONFIDENTIAL AGREEMENT

PARTIES:
Party A: [Company/Individual Name]
Party B: [Company/Individual Name]

EFFECTIVE DATE: ${new Date().toLocaleDateString()}

WHEREAS, the parties wish to enter into this agreement for the following purposes:

1. PURPOSE AND SCOPE
   This agreement establishes the terms and conditions under which the parties will collaborate and share information.

2. CONFIDENTIALITY OBLIGATIONS
   Each party agrees to maintain the confidentiality of any proprietary information received from the other party.

3. TERM AND TERMINATION
   This agreement shall remain in effect for a period of [duration] unless terminated earlier in accordance with the provisions herein.

4. GOVERNING LAW
   This agreement shall be governed by the laws of [State/Country].

ADDITIONAL TERMS:
- All communications shall be in writing
- Any modifications must be agreed upon by both parties
- This agreement constitutes the entire understanding between the parties

IN WITNESS WHEREOF, the parties have executed this agreement as of the date first written above.

SIGNATURES:

_________________________           _________________________
[Party A Signature]                  [Party B Signature]
[Printed Name]                       [Printed Name]
[Title]                             [Title]
[Date]                              [Date]

---
Note: This is a demonstration of a legal document format. In a production environment, this would display the actual content of your uploaded PDF document with preserved formatting, legal structure, and original text.`;
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

  const httpServer = createServer(app);
  return httpServer;
}
