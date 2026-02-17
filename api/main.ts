import express, { type Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, randomUUID } from "crypto";
import { promisify } from "util";
import createMemoryStore from "memorystore";
import * as openaiLib from "./openai.js";
import OpenAI from "openai";
import path from "path";
import fs from "fs";
import multer from "multer";

console.log("[API] Serverless function initializing...");

// ============================================
// Types
// ============================================
interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
}

interface Appointment {
    id: string;
    userId: string;
    clientId?: string;
    clientName: string;
    clientEmail: string;
    date: string; // ISO string
    status: "scheduled" | "completed" | "cancelled";
    type: "consultation" | "review" | "court";
    notes?: string;
    createdAt: Date;
}

interface IntakeForm {
    id: string;
    appointmentId?: string;
    clientName: string;
    clientEmail: string;
    caseType: string;
    data: any;
    aiAnalysis?: any;
    status: "pending" | "submitted" | "analyzed";
    createdAt: Date;
}

// ============================================
// In-Memory Storage (Fallback)
// ============================================
const MemoryStore = createMemoryStore(session);
const users = new Map<string, User>();
const appointments = new Map<string, Appointment>();
const intakeForms = new Map<string, IntakeForm>();
const knowledgeBaseStore = new Map<string, { id: string; userId: string; fileName: string; content: string; fileType: string; createdAt: Date }[]>();

// Production-ready in-memory token store and helpers
const tokens = new Map<string, string>();
function generateToken(): string { return randomUUID(); }
async function hashPassword(password: string, salt?: string): Promise<{ salt: string; hash: string }> {
  const s = salt ?? randomBytes(16).toString('hex');
  const derived = await promisify(scrypt)(password, s, 64) as Buffer;
  return { salt: s, hash: derived.toString('hex') };
}
async function verifyPassword(stored: string, password: string): Promise<boolean> {
  const parts = stored.split('.');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const derived = await promisify(scrypt)(password, salt, 64) as Buffer;
  const computed = derived.toString('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
  } catch {
    return false;
  }
}

// Demo helpers (for powered demos)
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo1234";
let demoUserId: string | null = null;
const demoTokens = new Map<string, string>(); // token -> userId

function ensureDemoUser(): { id: string; name: string; email: string; password: string } {
  // Try to find existing demo user
  const existing = Array.from(users.values()).find(u => u.email === DEMO_EMAIL);
  if (existing) { demoUserId = existing.id; return existing as any; }
  const id = randomUUID();
  const hash = require("crypto").createHash("sha256").update(DEMO_PASSWORD).digest("hex");
  const user = { id, name: "Demo User", email: DEMO_EMAIL, password: `${"salt"}.${hash}`, createdAt: new Date() } as any;
  users.set(id, user);
  demoUserId = id;
  return user;
}

function generateDemoToken(userId: string): string {
  const t = randomUUID();
  demoTokens.set(t, userId);
  return t;
}

// ============================================
// Express App Setup
// ============================================
const app = express();
// Production-friendly request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.info(`[API] ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

function isAuthenticated(req: any, res: any, next: any) {
  // Bearer token authentication first
  const authHeader = (req.headers?.authorization || '').toString();
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // Check production tokens first
    let userId = tokens.get(token);
    // Then check demo tokens
    if (!userId) {
      userId = demoTokens.get(token);
    }
    if (userId) {
      const user = Array.from(users.values()).find(u => u.id === userId);
      if (user) {
        req.user = user;
        req.authToken = token;
        return next();
      }
    }
  }
  // Fallback to session-based auth
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: "Authentication required" });
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
});

// OpenAI client for TTS
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
});

// Helper function to extract text from uploaded files
async function extractText(file: any): Promise<string> {
    try {
        if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
            // For PDFs, return a placeholder - in production would use pdf-parse
            return `[PDF Content: ${file.originalname}]`;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   file.originalname.endsWith('.docx')) {
            // For Word docs, return a placeholder - in production would use mammoth
            return `[Word Document Content: ${file.originalname}]`;
        } else if (file.mimetype.startsWith('text/') || file.originalname.endsWith('.txt')) {
            return file.buffer.toString('utf-8');
        } else {
            return `[File: ${file.originalname}]`;
        }
    } catch (error) {
        console.error("Extract text error:", error);
        return "";
    }
}

// 1. Registration
app.post("/api/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    const exists = Array.from(users.values()).some(u => u.email === email);
    if (exists) return res.status(409).json({ error: "User already exists" });
    const id = randomUUID();
    const { salt, hash } = await hashPassword(password);
    const user: User = { id, name, email, password: `${salt}.${hash}`, createdAt: new Date() };
    users.set(id, user);
    const token = generateToken();
    tokens.set(token, id);
    res.json({ user: { id, name, email }, token });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Login (simple token-based)
app.post("/api/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await verifyPassword(user.password, password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = generateToken();
    tokens.set(token, user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Current user (token or session aware)
app.get("/api/user", isAuthenticated, (req: any, res) => {
  const user = req.user as User;
  if (!user) return res.status(401).json({ error: "Authentication required" });
  res.json({ id: user.id, name: user.name, email: user.email });
});

// 4. Demo login endpoint
app.post("/api/demo-login", async (req: Request, res: Response) => {
  try {
    const user = ensureDemoUser();
    const token = generateDemoToken(user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err: any) {
    console.error("Demo login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Demo entry endpoint (seed comprehensive demo data)
app.post("/api/demo-entry", async (req: Request, res: Response) => {
  try {
    const user = ensureDemoUser();
    const createdItems: any = {
      cases: [],
      clients: [],
      appointments: [],
      documents: [],
      medicalRecords: [],
      knowledgeBase: [],
      searchHistory: []
    };

    // Create demo clients
    const demoClients = [
      { id: randomUUID(), name: "John Smith", email: "john.smith@example.com", phone: "+1 (555) 123-4567", address: "123 Main St, Miami, FL 33101", type: "Individual", notes: "Personal injury client - car accident case" },
      { id: randomUUID(), name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1 (555) 987-6543", address: "456 Oak Ave, Miami, FL 33102", type: "Individual", notes: "Contract dispute - vendor agreement breach" },
      { id: randomUUID(), name: "TechCorp Industries", email: "legal@techcorp.com", phone: "+1 (555) 456-7890", address: "789 Business Blvd, Miami, FL 33103", type: "Corporate", notes: "Corporate client - multiple ongoing matters" },
      { id: randomUUID(), name: "Maria Garcia", email: "maria.g@example.com", phone: "+1 (555) 234-5678", address: "321 Pine St, Miami, FL 33104", type: "Individual", notes: "Medical malpractice case" },
      { id: randomUUID(), name: "Robert Chen", email: "robert.chen@example.com", phone: "+1 (555) 876-5432", address: "654 Elm St, Miami, FL 33105", type: "Individual", notes: "Real estate dispute - property boundary issue" }
    ];
    
    demoClients.forEach(client => {
      clientsStore.set(client.id, { ...client, userId: user.id, createdAt: new Date() });
      createdItems.clients.push(client);
    });

    // Create demo cases with rich data
    const demoCases = [
      {
        id: randomUUID(),
        userId: user.id,
        caseName: "Smith v. Speedy Auto Insurance",
        caseNumber: "2024-PI-001",
        clientName: "John Smith",
        clientId: demoClients[0].id,
        caseType: "personal-injury",
        status: "active",
        description: "Rear-end collision on I-95. Client suffered whiplash and lower back injuries. Medical bills totaling $45,000. Defendant insured by Speedy Auto Insurance.",
        jurisdiction: "Miami-Dade County, FL",
        practiceArea: "Personal Injury",
        leadAttorney: "Demo Attorney",
        opposingParty: "Speedy Auto Insurance",
        opposingCounsel: "Defense Law Group LLP",
        valueLow: "75000",
        valueHigh: "150000",
        dateOpened: new Date("2024-01-15"),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        userId: user.id,
        caseName: "Johnson v. Elite Renovations LLC",
        caseNumber: "2024-CD-002",
        clientName: "Sarah Johnson",
        clientId: demoClients[1].id,
        caseType: "contract-dispute",
        status: "active",
        description: "Home renovation contract breach. Contractor failed to complete kitchen remodel, abandoned project with $35,000 paid but 60% incomplete work.",
        jurisdiction: "Miami-Dade County, FL",
        practiceArea: "Contract Law",
        leadAttorney: "Demo Attorney",
        opposingParty: "Elite Renovations LLC",
        opposingCounsel: "Commercial Defense Partners",
        valueLow: "35000",
        valueHigh: "50000",
        dateOpened: new Date("2024-02-01"),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        userId: user.id,
        caseName: "TechCorp v. DataSecure Inc",
        caseNumber: "2024-IP-003",
        clientName: "TechCorp Industries",
        clientId: demoClients[2].id,
        caseType: "intellectual-property",
        status: "pending",
        description: "Trade secret misappropriation. Former employee took proprietary algorithms to competitor. Seeking injunctive relief and damages.",
        jurisdiction: "Southern District of Florida",
        practiceArea: "Intellectual Property",
        leadAttorney: "Demo Attorney",
        opposingParty: "DataSecure Inc",
        opposingCounsel: "IP Defense Associates",
        valueLow: "250000",
        valueHigh: "500000",
        dateOpened: new Date("2024-02-20"),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        userId: user.id,
        caseName: "Garcia v. Memorial Hospital",
        caseNumber: "2024-MM-004",
        clientName: "Maria Garcia",
        clientId: demoClients[3].id,
        caseType: "medical-malpractice",
        status: "active",
        description: "Surgical error during routine procedure. Wrong site surgery resulting in permanent nerve damage. Extensive medical records to review.",
        jurisdiction: "Miami-Dade County, FL",
        practiceArea: "Medical Malpractice",
        leadAttorney: "Demo Attorney",
        opposingParty: "Memorial Hospital",
        opposingCounsel: "Medical Defense Group",
        valueLow: "500000",
        valueHigh: "1200000",
        dateOpened: new Date("2024-01-10"),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        userId: user.id,
        caseName: "Chen v. Riverside Properties",
        caseNumber: "2024-RE-005",
        clientName: "Robert Chen",
        clientId: demoClients[4].id,
        caseType: "real-estate",
        status: "pending",
        description: "Property boundary dispute with neighboring commercial development. Survey discrepancies and encroachment issues.",
        jurisdiction: "Miami-Dade County, FL",
        practiceArea: "Real Estate",
        leadAttorney: "Demo Attorney",
        opposingParty: "Riverside Properties Inc",
        opposingCounsel: "Real Estate Defense Firm",
        valueLow: "100000",
        valueHigh: "200000",
        dateOpened: new Date("2024-03-01"),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    demoCases.forEach(caseItem => {
      casesStore.set(caseItem.id, caseItem);
      createdItems.cases.push(caseItem);
    });

    // Create demo appointments
    const demoAppointments = [
      { id: randomUUID(), userId: user.id, clientId: demoClients[0].id, clientName: "John Smith", clientEmail: demoClients[0].email, date: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", type: "consultation", notes: "Follow-up on settlement demand", createdAt: new Date() },
      { id: randomUUID(), userId: user.id, clientId: demoClients[1].id, clientName: "Sarah Johnson", clientEmail: demoClients[1].email, date: new Date(Date.now() + 172800000).toISOString(), status: "scheduled", type: "review", notes: "Review contractor counteroffer", createdAt: new Date() },
      { id: randomUUID(), userId: user.id, clientId: demoClients[3].id, clientName: "Maria Garcia", clientEmail: demoClients[3].email, date: new Date(Date.now() + 259200000).toISOString(), status: "scheduled", type: "consultation", notes: "Discuss expert witness findings", createdAt: new Date() }
    ];

    demoAppointments.forEach(appt => {
      appointments.set(appt.id, appt);
      createdItems.appointments.push(appt);
    });

    // Create demo documents
    const demoDocuments = [
      { id: randomUUID(), userId: user.id, caseId: demoCases[0].id, name: "Smith Demand Letter", type: "demand-letter", content: "Demand letter for personal injury case with supporting documentation...", format: "docx", createdAt: new Date(), updatedAt: new Date() },
      { id: randomUUID(), userId: user.id, caseId: demoCases[1].id, name: "Johnson Contract Breach Analysis", type: "legal-analysis", content: "Analysis of renovation contract terms and breach elements...", format: "pdf", createdAt: new Date(), updatedAt: new Date() },
      { id: randomUUID(), userId: user.id, caseId: demoCases[3].id, name: "Garcia Medical Chronology", type: "medical-summary", content: "Timeline of medical treatment and surgical procedure...", format: "pdf", createdAt: new Date(), updatedAt: new Date() }
    ];

    demoDocuments.forEach(doc => {
      documentsStore.set(doc.id, doc);
      createdItems.documents.push(doc);
    });

    // Create demo medical records for Garcia case
    const demoMedicalRecords = [
      { id: randomUUID(), userId: user.id, caseId: demoCases[3].id, documentName: "Surgical Report - March 2024", documentType: "operative-report", summary: "Wrong site surgery performed. Nerve damage documented.", parsedData: { procedures: ["Lumbar discectomy"], complications: ["Wrong level operated", "Nerve impingement"] }, createdAt: new Date(), updatedAt: new Date() },
      { id: randomUUID(), userId: user.id, caseId: demoCases[3].id, documentName: "Physical Therapy Records", documentType: "therapy-notes", summary: "12 weeks of PT post-surgery with limited improvement.", parsedData: { duration: "12 weeks", visits: 24, improvement: "minimal" }, createdAt: new Date(), updatedAt: new Date() },
      { id: randomUUID(), userId: user.id, caseId: demoCases[3].id, documentName: "MRI Imaging Reports", documentType: "imaging", summary: "Post-surgical imaging showing nerve damage at wrong level.", parsedData: { modality: "MRI", findings: ["Nerve compression L4-L5", "Post-surgical changes"] }, createdAt: new Date(), updatedAt: new Date() }
    ];

    demoMedicalRecords.forEach(record => {
      medicalRecordsStore.set(record.id, record);
      createdItems.medicalRecords.push(record);
    });

    // Create demo knowledge base entries
    const demoKnowledgeBase = [
      { id: randomUUID(), userId: user.id, fileName: "Florida PI Statute of Limitations.pdf", content: "Florida Statute 95.11: Actions other than for recovery of real property. (3) WITHIN FOUR YEARS.—An action founded on negligence...", fileType: "application/pdf", createdAt: new Date() },
      { id: randomUUID(), userId: user.id, fileName: "Miami Court Rules 2024.pdf", content: "Local rules for the Eleventh Judicial Circuit of Florida. Case management procedures...", fileType: "application/pdf", createdAt: new Date() }
    ];

    const kbEntries = knowledgeBaseStore.get(user.id) || [];
    demoKnowledgeBase.forEach(entry => {
      kbEntries.push(entry);
      createdItems.knowledgeBase.push(entry);
    });
    knowledgeBaseStore.set(user.id, kbEntries);

    // Create demo search history
    const demoSearchHistory = [
      { id: randomUUID(), userId: user.id, type: "legal-research", query: "Florida rear-end collision liability presumption", results: JSON.stringify({ cases: 5, statutes: 2 }), createdAt: new Date(Date.now() - 86400000) },
      { id: randomUUID(), userId: user.id, type: "quick-question", query: "What is the statute of limitations for contract disputes in Florida?", results: JSON.stringify({ answer: "5 years for written contracts per Florida Statute 95.11(2)(b)" }), createdAt: new Date(Date.now() - 172800000) }
    ];

    const historyEntries = searchHistoryStore.get(user.id) || [];
    demoSearchHistory.forEach(entry => {
      historyEntries.push(entry);
      createdItems.searchHistory.push(entry);
    });
    searchHistoryStore.set(user.id, historyEntries);

    console.log(`[DEMO] Created comprehensive demo environment for user ${user.id}:`, {
      clients: createdItems.clients.length,
      cases: createdItems.cases.length,
      appointments: createdItems.appointments.length,
      documents: createdItems.documents.length,
      medicalRecords: createdItems.medicalRecords.length,
      knowledgeBase: createdItems.knowledgeBase.length,
      searchHistory: createdItems.searchHistory.length
    });

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      demoData: createdItems,
      message: "Full demo environment created successfully. You now have 5 clients, 5 cases, 3 appointments, 3 documents, 3 medical records, and sample knowledge base entries."
    });

  } catch (err: any) {
    console.error("Demo entry error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 6. AI Legal Research & Analysis Routes
app.post("/api/quick-question", isAuthenticated, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question required" });
    const answer = await openaiLib.answerLegalQuestion(question);
    res.json({ answer });
  } catch (error: any) {
    console.error("Quick question error:", error);
    res.status(500).json({ error: error.message || "Failed to answer question" });
  }
});

app.post("/api/legal-search", isAuthenticated, async (req, res) => {
  try {
    const { query, filters, context, useKnowledgeBase } = req.body;
    let searchContext = context || "";
    if (useKnowledgeBase) {
      const userId = (req.user as User).id;
      const entries = knowledgeBaseStore.get(userId) || [];
      searchContext = entries.map(e => `Doc: ${e.fileName}\n${e.content}`).join("\n\n");
    }
    if (!query) return res.status(400).json({ error: "Query required" });
    const results = await openaiLib.searchLegalDatabase(query, filters, searchContext);
    res.json(results);
  } catch (error: any) {
    console.error("Legal Search error:", error);
    res.status(500).json({ error: error.message || "Failed to search" });
  }
});

app.post("/api/summarize-document", isAuthenticated, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Document required" });
    const text = await extractText(req.file);
    if (!text) return res.status(400).json({ error: "Could not extract text" });
    const summary = await openaiLib.summarizeDocument(text);
    res.json({ summary, fileName: req.file.originalname });
  } catch (error: any) {
    console.error("Summarize error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analyze-risk", isAuthenticated, async (req, res) => {
  try {
    const { caseType, description, jurisdiction, caseValue } = req.body;
    if (!caseType || !description) return res.status(400).json({ error: "Case type and description required" });
    const analysis = await openaiLib.analyzeRisk({ caseType, description, jurisdiction, caseValue });
    res.json(analysis);
  } catch (error: any) {
    console.error("Risk analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/law-agent", isAuthenticated, async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ error: "Question required" });
    const answer = await openaiLib.answerLegalQuestion(question, context);
    res.json({ answer });
  } catch (error: any) {
    console.error("Law agent error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/web-search", isAuthenticated, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });
    const results = await openaiLib.performWebSearch(query);
    res.json(results);
  } catch (error: any) {
    console.error("Web search error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Search History
const searchHistoryStore = new Map<string, { id: string; userId: string; type: string; query: string; results: string; createdAt: Date }[]>();

app.get("/api/search-history", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const history = searchHistoryStore.get(userId) || [];
  res.json(history);
});

// 8. Document Management
const documentsStore = new Map<string, { id: string; userId: string; caseId?: string; name: string; type: string; content: string; format: string; createdAt: Date; updatedAt: Date }>();

app.get("/api/documents", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const caseId = req.query.caseId as string | undefined;
  let userDocs = Array.from(documentsStore.values()).filter(d => d.userId === userId);
  if (caseId) {
    userDocs = userDocs.filter(d => d.caseId === caseId);
  }
  res.json(userDocs);
});

app.post("/api/documents", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const { caseId, name, type, content, format } = req.body;
  if (!name || !type) return res.status(400).json({ error: "Name and type required" });
  
  const docId = randomUUID();
  const doc = {
    id: docId,
    userId,
    caseId: caseId || "",
    name,
    type,
    content: content || "",
    format: format || "text",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  documentsStore.set(docId, doc);
  res.json(doc);
});

app.delete("/api/documents/:id", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const doc = documentsStore.get(req.params.id);
  if (!doc || doc.userId !== userId) return res.status(404).json({ error: "Document not found" });
  documentsStore.delete(req.params.id);
  res.json({ success: true });
});

// 9. Saved Documents
const savedDocsStore = new Map<string, { id: string; userId: string; caseId?: string; title: string; documentType: string; content: string; fileFormat: string; createdAt: Date; updatedAt: Date }>();

app.get("/api/saved-documents", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const docs = Array.from(savedDocsStore.values()).filter(d => d.userId === userId);
  res.json(docs);
});

app.delete("/api/saved-documents/:id", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const doc = savedDocsStore.get(req.params.id);
  if (!doc || doc.userId !== userId) return res.status(404).json({ error: "Document not found" });
  savedDocsStore.delete(req.params.id);
  res.json({ success: true });
});

// 10. Export Document
app.post("/api/export-document", isAuthenticated, async (req, res) => {
  try {
    const { content, format, filename } = req.body;
    if (!content || !format) return res.status(400).json({ error: "Content and format required" });
    const exportContent = { content, format, filename: filename || "document", generatedAt: new Date() };
    res.json(exportContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Medical Records
const medicalRecordsStore = new Map<string, { id: string; userId: string; caseId: string; documentName: string; documentType: string; summary: string; parsedData: any; createdAt: Date; updatedAt: Date }>();

app.get("/api/medical-records/:caseId", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const records = Array.from(medicalRecordsStore.values()).filter(r => r.userId === userId && r.caseId === req.params.caseId);
  res.json(records);
});

app.post("/api/medical-records", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const { caseId, documentName, documentType, summary, parsedData } = req.body;
  if (!caseId || !documentName) return res.status(400).json({ error: "Case ID and document name required" });
  
  const recordId = randomUUID();
  const record = {
    id: recordId,
    userId,
    caseId,
    documentName,
    documentType: documentType || "",
    summary: summary || "",
    parsedData: parsedData || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  medicalRecordsStore.set(recordId, record);
  res.json(record);
});

app.delete("/api/medical-records/:id", isAuthenticated, (req, res) => {
  const userId = (req.user as User).id;
  const record = medicalRecordsStore.get(req.params.id);
  if (!record || record.userId !== userId) return res.status(404).json({ error: "Record not found" });
  medicalRecordsStore.delete(req.params.id);
  res.json({ success: true });
});

// 12. Demand Letter
app.post("/api/demand-letter", isAuthenticated, async (req, res) => {
  try {
    const { caseData } = req.body;
    if (!caseData) return res.status(400).json({ error: "Case data required" });
    const result = await openaiLib.generateDemandLetter(caseData);
    res.json(result);
  } catch (error: any) {
    console.error("Demand letter error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 13. Intake Form GET
app.get("/api/intake/:id", async (req, res) => {
  try {
    const form = intakeForms.get(req.params.id);
    if (!form) return res.status(404).json({ error: "Intake form not found" });
    res.json(form);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Document Generation
app.post("/api/generate-document", isAuthenticated, async (req, res) => { // Updated route name to match frontend if needed, check frontend
    // Frontend likely uses /api/document-generation/generate OR /api/generate-document. 
    // server/routes.ts uses /api/generate-document.
    try {
        const { documentType, inputMethod, textContent, formData } = req.body;
        // Map frontend fields if necessary. 
        // Logic from server/openai calls generateDocument(type, method, content, formData)

        // Check if frontend sends 'type' or 'documentType'
        const type = documentType || req.body.type;
        const method = inputMethod || req.body.method;
        const content = textContent || req.body.content;

        const result = await openaiLib.generateDocument(type, method, content, formData);
        res.json(result);
    } catch (error: any) {
        console.error("Doc gen error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 8. Analyze Document (For Document Analyzer Page)
app.post("/api/analyze-document", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Document required" });
        const text = await extractText(req.file);
        if (!text) return res.status(400).json({ error: "Could not extract text" });

        const analysis = await openaiLib.analyzeDocument(text, req.file.originalname);
        res.json({
            content: text,
            analysis: analysis,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
    } catch (error: any) {
        console.error("Analyze doc error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 9. Document Improvement (For Doc Analyzer)
app.post("/api/improve-document-section", isAuthenticated, async (req, res) => {
    try {
        const result = await openaiLib.improveDocumentSection(req.body.type, req.body.item, req.body.documentContent);
        res.json(result);
    } catch (error: any) {
        console.error("Improve doc error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 10. Medical Intelligence
app.post("/api/medical-intelligence", isAuthenticated, async (req, res) => {
    try {
        const result = await openaiLib.runMedicalIntelligence(req.body.mode, req.body.payload);
        res.json(result);
    } catch (error: any) {
        console.error("Medical Intelligence error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 10b. Discovery Tools
app.post("/api/discovery-tools", isAuthenticated, async (req, res) => {
    try {
        const { toolType, caseType, jurisdiction, caseFacts, casePosition } = req.body;
        const result = await openaiLib.generateResponse(toolType, { caseType, jurisdiction, caseFacts, casePosition });
        res.json(result);
    } catch (error: any) {
        console.error("Discovery tools error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 11. Knowledge Base (In-Memory)
app.post("/api/knowledge-base", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "File required" });
        const text = await extractText(req.file);
        const userId = (req.user as User).id;

        const entry = {
            id: randomUUID(),
            title: req.body.title || req.file.originalname,
            content: text,
            fileName: req.file.originalname,
            createdAt: new Date()
        };

        const entries = knowledgeBaseStore.get(userId) || [];
        entries.push(entry);
        knowledgeBase.set(userId, entries);

        res.json(entry);
    } catch (error: any) {
        console.error("KB Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/knowledge-base", isAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    res.json(knowledgeBaseStore.get(userId) || []);
});

app.delete("/api/knowledge-base/:id", isAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    let entries = knowledgeBaseStore.get(userId) || [];
    entries = entries.filter(e => e.id !== req.params.id);
    knowledgeBase.set(userId, entries);
    res.json({ success: true });
});

// 11. Download Document from Medical Intelligence
app.get("/api/medical-intelligence/download/:taskId/:documentId", isAuthenticated, async (req, res) => {
    try {
        const { taskId, documentId } = req.params;

        // In a real implementation, you'd retrieve the document from storage
        // For now, generate a sample report based on the task type
        const reportContent = `# Medical Intelligence Report
## Task ID: ${taskId}
## Document ID: ${documentId}
## Generated: ${new Date().toISOString()}

### Executive Summary
This is a comprehensive medical intelligence report generated for legal purposes.

### Key Findings
- Medical chronology analysis
- Billing review and validation
- Treatment summary and prognosis
- Cost analysis and projections

### Recommendations
1. Further medical evaluation may be necessary
2. Consider independent medical examination
3. Review billing for potential errors
4. Document all communications with healthcare providers

---
*Report generated by Law Helper AI Medical Intelligence Suite*
*Confidential - For Legal Use Only*
`;

        // Set headers for file download
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="medical-report-${taskId}-${documentId}.md"`);
        res.setHeader('Cache-Control', 'no-cache');

        res.send(reportContent);
    } catch (error: any) {
        console.error("Document download error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Voice/Microphone Routes (Enhanced)
// ============================================

// Voice Recording Status
app.get("/api/voice/status", isAuthenticated, (req, res) => {
    res.json({
        microphoneAvailable: true,
        recordingSupported: true,
        transcriptionEnabled: true,
        supportedFormats: ['wav', 'mp3', 'm4a', 'webm']
    });
});

// Start Voice Recording Session
app.post("/api/voice/start", isAuthenticated, (req, res) => {
    try {
        const sessionId = randomUUID();
        // In a real implementation, you'd initialize recording session
        res.json({
            sessionId,
            status: 'recording',
            message: 'Voice recording session started'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Stop Voice Recording Session
app.post("/api/voice/stop/:sessionId", isAuthenticated, (req, res) => {
    try {
        // In a real implementation, you'd process the recorded audio
        res.json({
            sessionId: req.params.sessionId,
            status: 'stopped',
            message: 'Voice recording stopped'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Video Call Routes
// ============================================

// Get Video Call Configuration
app.get("/api/video/config", isAuthenticated, (req, res) => {
    res.json({
        provider: "WebRTC",
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
        ],
        features: {
            screenShare: true,
            recording: false,
            chat: true,
            whiteboard: false
        }
    });
});

// Create Video Call Room
app.post("/api/video/room", isAuthenticated, async (req, res) => {
    try {
        const roomId = randomUUID();
        const roomData = {
            id: roomId,
            name: req.body.roomName || `Interview ${roomId.slice(0, 8)}`,
            participants: [req.user],
            createdAt: new Date(),
            status: 'waiting'
        };

        res.json({
            roomId,
            roomUrl: `/video-call/${roomId}`,
            config: {
                audio: true,
                video: true,
                screenShare: true
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Join Video Call Room
app.post("/api/video/join/:roomId", isAuthenticated, (req, res) => {
    try {
        res.json({
            roomId: req.params.roomId,
            participantId: randomUUID(),
            token: `video_token_${Date.now()}`, // In real implementation, generate secure token
            status: 'connected'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Video Call Signaling (WebRTC)
app.post("/api/video/signal/:roomId", isAuthenticated, (req, res) => {
    try {
        const { type, data, targetParticipant } = req.body;

        // In a real implementation, you'd handle WebRTC signaling
        // For now, just acknowledge the signal
        res.json({
            success: true,
            type,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
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
        const result = await openaiLib.transcribeWithAnalysis(req.file.buffer, req.file.originalname);

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
// Client Management Routes
// ============================================

// Get all clients
app.get("/api/clients", isAuthenticated, (req, res) => {
    const userId = (req.user as User).id;
    // For now, extract unique clients from appointments
    const userAppointments = Array.from(appointments.values())
        .filter(appt => appt.userId === userId);

    const clients = userAppointments.reduce((acc: any[], appt) => {
        const existing = acc.find(c => c.email === appt.clientEmail);
        if (!existing) {
            acc.push({
                id: randomUUID(),
                name: appt.clientName,
                email: appt.clientEmail,
                phone: '',
                address: '',
                createdAt: new Date(),
                lastAppointment: appt.date
            });
        }
        return acc;
    }, []);

    res.json(clients);
});

// Create new client
app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
        const userId = (req.user as User).id;
        const { name, email, phone, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email required" });
        }

        const clientId = randomUUID();
        const client = {
            id: clientId,
            name,
            email,
            phone: phone || '',
            address: address || '',
            createdAt: new Date(),
            lastAppointment: null
        };

        // Store client (in a real app, this would be in a database)
        // For now, we'll create a placeholder appointment to track the client
        const placeholderAppointmentId = randomUUID();
        const placeholderAppointment: Appointment = {
            id: placeholderAppointmentId,
            userId,
            clientId,
            clientName: name,
            clientEmail: email,
            date: new Date().toISOString(),
            status: "completed",
            type: "client-registration",
            notes: "Client registered in system",
            createdAt: new Date()
        };
        appointments.set(placeholderAppointmentId, placeholderAppointment);

        res.json({
            success: true,
            client
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update client
app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email required" });
        }

        const client = {
            id: req.params.id,
            name,
            email,
            phone: phone || '',
            address: address || '',
            updatedAt: new Date()
        };

        res.json({
            success: true,
            client
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get all appointments
app.get("/api/appointments", isAuthenticated, (req, res) => {
    const userId = (req.user as User).id;
    // In a real DB, we'd query by userId. Here we filter the map.
    const userAppointments = Array.from(appointments.values())
        .filter(appt => appt.userId === userId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json(userAppointments);
});

// Create new appointment & generate intake form
app.post("/api/appointments", isAuthenticated, async (req, res) => {
    try {
        const userId = (req.user as User).id;
        const { clientName, clientEmail, date, type, notes, clientId } = req.body;

        console.log('[APPOINTMENT] Creating appointment:', { clientName, clientEmail, date, type });

        if (!clientName || !date) {
            return res.status(400).json({ error: "Client name and date required" });
        }

        // Validate date format
        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        const appointmentId = randomUUID();
        const appointment: Appointment = {
            id: appointmentId,
            userId,
            clientId,
            clientName,
            clientEmail,
            date: appointmentDate.toISOString(),
            status: "scheduled",
            type: type || "consultation",
            notes: notes || '',
            createdAt: new Date()
        };

        appointments.set(appointmentId, appointment);
        console.log('[APPOINTMENT] Created successfully:', appointmentId);

        // Auto-generate Intake Form
        const intakeId = randomUUID();
        const intakeForm: IntakeForm = {
            id: intakeId,
            appointmentId,
            clientName,
            clientEmail,
            caseType: type || "General",
            data: {},
            status: "pending",
            createdAt: new Date()
        };
        intakeForms.set(intakeId, intakeForm);

        res.json({
            success: true,
            appointment,
            intakeLink: `/intake/${intakeId}`
        });
    } catch (error: any) {
        console.error('[APPOINTMENT] Creation failed:', error);
        res.status(500).json({ error: error.message || "Failed to create appointment" });
    }
});

// ============================================
// Case Management Routes (in-memory storage for serverless)
// ============================================
interface Case {
    id: string;
    userId: string;
    caseName: string;
    caseNumber: string;
    clientName: string;
    caseType: string;
    status: string;
    description?: string;
    jurisdiction?: string;
    practiceArea?: string;
    leadAttorney?: string;
    opposingParty?: string;
    opposingCounsel?: string;
    valueLow?: string;
    valueHigh?: string;
    dateOpened: Date;
    createdAt: Date;
    updatedAt: Date;
}

const casesStore = new Map<string, Case>();

app.get("/api/cases", isAuthenticated, (req, res) => {
    const userId = (req.user as User).id;
    const userCases = Array.from(casesStore.values()).filter(c => c.userId === userId);
    res.json(userCases);
});

app.get("/api/cases/:id", isAuthenticated, (req, res) => {
    const userId = (req.user as User).id;
    const caseData = casesStore.get(req.params.id);
    if (!caseData || caseData.userId !== userId) {
        return res.status(404).json({ error: "Case not found" });
    }
    res.json(caseData);
});

app.post("/api/cases", isAuthenticated, (req, res) => {
    try {
        const userId = (req.user as User).id;
        const { 
            caseName, caseNumber, clientName, caseType, status, description,
            jurisdiction, practiceArea, leadAttorney, opposingParty, opposingCounsel,
            valueLow, valueHigh
        } = req.body;

        if (!caseName || !clientName || !caseType) {
            return res.status(400).json({ error: "Case name, client name, and case type are required" });
        }

        const caseId = randomUUID();
        const newCase: Case = {
            id: caseId,
            userId,
            caseName,
            caseNumber: caseNumber || "",
            clientName,
            caseType,
            status: status || "active",
            description: description || "",
            jurisdiction: jurisdiction || "",
            practiceArea: practiceArea || "",
            leadAttorney: leadAttorney || "",
            opposingParty: opposingParty || "",
            opposingCounsel: opposingCounsel || "",
            valueLow: valueLow || "",
            valueHigh: valueHigh || "",
            dateOpened: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        casesStore.set(caseId, newCase);
        console.log('[CASE] Created case:', caseName);
        res.json(newCase);
    } catch (error: any) {
        console.error('[CASE] Create error:', error);
        res.status(500).json({ error: error.message || "Failed to create case" });
    }
});

app.put("/api/cases/:id", isAuthenticated, (req, res) => {
    const userId = (req.user as User).id;
    const existingCase = casesStore.get(req.params.id);
    if (!existingCase || existingCase.userId !== userId) {
        return res.status(404).json({ error: "Case not found" });
    }

    const { 
        caseName, caseNumber, clientName, caseType, status, description,
        jurisdiction, practiceArea, leadAttorney, opposingParty, opposingCounsel,
        valueLow, valueHigh
    } = req.body;

    const updatedCase: Case = {
        ...existingCase,
        caseName: caseName ?? existingCase.caseName,
        caseNumber: caseNumber ?? existingCase.caseNumber,
        clientName: clientName ?? existingCase.clientName,
        caseType: caseType ?? existingCase.caseType,
        status: status ?? existingCase.status,
        description: description ?? existingCase.description,
        jurisdiction: jurisdiction ?? existingCase.jurisdiction,
        practiceArea: practiceArea ?? existingCase.practiceArea,
        leadAttorney: leadAttorney ?? existingCase.leadAttorney,
        opposingParty: opposingParty ?? existingCase.opposingParty,
        opposingCounsel: opposingCounsel ?? existingCase.opposingCounsel,
        valueLow: valueLow ?? existingCase.valueLow,
        valueHigh: valueHigh ?? existingCase.valueHigh,
        updatedAt: new Date(),
    };

    casesStore.set(req.params.id, updatedCase);
    res.json(updatedCase);
});

app.delete("/api/cases/:id", isAuthenticated, (req, res) => {
    const userId = (req.user as User).id;
    const existingCase = casesStore.get(req.params.id);
    if (!existingCase || existingCase.userId !== userId) {
        return res.status(404).json({ error: "Case not found" });
    }
    casesStore.delete(req.params.id);
    res.json({ success: true });
});

// ============================================
// Intake Routes
// ============================================
// Transcription Route (OpenAI Whisper)
// ============================================
app.post("/api/transcribe", isAuthenticated, upload.single('audio'), async (req, res) => {
    try {
        console.log('[TRANSCRIBE] Starting transcription request');

        if (!req.file) {
            console.log('[TRANSCRIBE] No file provided');
            return res.status(400).json({ error: "Audio/video file required" });
        }

        console.log(`[TRANSCRIBE] File received: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);

        // File size check (Whisper max 25MB)
        if (req.file.size > 25 * 1024 * 1024) {
            console.log('[TRANSCRIBE] File too large');
            return res.status(400).json({ error: "File too large. Maximum 25MB for transcription." });
        }

        // Supported formats check
        const supportedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'video/mp4', 'audio/webm'];
        const fileExt = req.file.originalname.toLowerCase().split('.').pop();
        const supportedExts = ['wav', 'mp3', 'm4a', 'mp4', 'webm', 'ogg', 'flac'];

        if (!supportedTypes.includes(req.file.mimetype) && !supportedExts.includes(fileExt || '')) {
            console.log(`[TRANSCRIBE] Unsupported format: ${req.file.mimetype}, ext: ${fileExt}`);
            return res.status(400).json({
                error: "Unsupported file format. Supported: WAV, MP3, M4A, MP4, WebM, OGG, FLAC"
            });
        }

        console.log('[TRANSCRIBE] Starting transcription with OpenAI Whisper');

        // Transcribe with analysis
        const result = await openaiLib.transcribeWithAnalysis(req.file.buffer, req.file.originalname);

        console.log('[TRANSCRIBE] Transcription completed successfully');

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
            fileSize: req.file.size,
            transcriptionId: randomUUID()
        });
    } catch (error: any) {
        console.error("[TRANSCRIBE] Error:", error);
        res.status(500).json({
            error: error.message || "Failed to transcribe audio",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Submit intake form & Trigger AI Analysis
app.post("/api/intake/:id", async (req, res) => {
    try {
        const form = intakeForms.get(req.params.id);
        if (!form) {
            return res.status(404).json({ error: "Intake form not found" });
        }

        const { data } = req.body;
        form.data = data;
        form.status = "submitted";

        // AI Analysis Trigger (Simple version)
        try {
            const analysisPrompt = `Analyze this legal client intake form:
Client: ${form.clientName}
Case Type: ${form.caseType}
Data: ${JSON.stringify(data)}

Provide:
1. Brief case summary
2. Potential legal issues
3. Missing information to ask
4. Risk assessment (Low/Medium/High)

Return JSON.`;

            const aiResponse = await openaiLib.generateResponse([
                { role: "system", content: "You are a senior legal intake specialist." },
                { role: "user", content: analysisPrompt }
            ]);

            // Attempt to parse JSON, fallback to text
            let analysis;
            try {
                analysis = JSON.parse(aiResponse);
            } catch {
                analysis = { raw: aiResponse };
            }

            form.aiAnalysis = analysis;
            form.status = "analyzed";
        } catch (aiError) {
            console.error("AI Analysis failed:", aiError);
            // Continue even if AI fails
        }

        intakeForms.set(form.id, form);
        res.json({ success: true, message: "Intake submitted successfully" });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================
// Static Files (for frontend)
// ============================================
let publicPath: string;
try {
    publicPath = path.join(process.cwd(), "dist", "public");
    if (!fs.existsSync(publicPath)) {
        publicPath = path.join(process.cwd(), "client", "dist");
    }
    if (!fs.existsSync(publicPath)) {
        console.log("[STATIC] No public folder found, skipping static file serving");
        publicPath = "";
    } else {
        console.log("[STATIC] Serving from:", publicPath);
        app.use(express.static(publicPath));
    }
} catch (e) {
    console.error("[STATIC] Error setting up static files:", e);
    publicPath = "";
}

if (publicPath) {
    app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" });
        const indexPath = path.join(publicPath, "index.html");
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send("Not found");
        }
    });
}

// ============================================
// Virtual Front Desk Routes
// ============================================
const WEBSITE_KNOWLEDGE = `
You are the Virtual Front Desk Assistant for LawHelper, an AI-powered legal practice management platform.

PLATFORM CAPABILITIES:
1. AI Legal Research - Search case law, statutes, and legal precedents
2. Document Generation - Create demand letters, contracts, motions, and legal documents
3. Document Analysis - Upload and analyze legal documents with AI
4. Case Management - Organize cases, track deadlines, manage clients
5. Medical Intelligence - Analyze medical records for personal injury cases
6. Discovery Tools - Generate responses to interrogatories and requests for production
7. Transcription - Convert audio/video to text with legal formatting
8. Video Calls - Secure client consultations with recording
9. Voice Control - Navigate the app hands-free with voice commands
10. Knowledge Base - Store and search your legal documents

KEY FEATURES:
- All data is secure and confidential
- Works on desktop and mobile
- Real-time AI assistance
- Export documents in PDF, DOCX, or TXT
- Calendar integration for appointments
- Client intake forms with AI analysis

DOCUMENT TYPES SUPPORTED:
- Demand Letters (Personal Injury, Contract Disputes, Insurance Claims)
- Legal Contracts (Service Agreements, Employment Contracts, NDAs)
- Court Documents (Motions, Briefs, Pleadings)
- Discovery Responses (Interrogatories, Requests for Production, Requests for Admission)
- Business Letters (Demand, Cease & Desist, Notice)
- Personal Documents (Power of Attorney, Affidavits)

HOW TO USE:
- Upload documents for AI analysis
- Ask legal research questions
- Generate documents from templates
- Organize cases and track progress
- Schedule appointments with clients
- Record and transcribe calls

Always be professional, helpful, and guide users to the right features.
`;

app.post("/api/virtual-front-desk", isAuthenticated, async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        const userId = (req.user as User).id;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Prepare conversation for AI
        const messages = [
            {
                role: "system",
                content: WEBSITE_KNOWLEDGE + "\n\nYou are a helpful virtual receptionist. Answer questions about the platform, guide users to features, and provide legal technology assistance. Keep responses concise and actionable."
            },
            ...conversationHistory.slice(-10),
            {
                role: "user",
                content: message
            }
        ];

        // Generate AI response using OpenAI
        const response = await openaiLib.generateResponse(messages);

        const updatedHistory = [
            ...conversationHistory,
            { role: "user", content: message },
            { role: "assistant", content: response }
        ];

        res.json({
            response,
            conversationHistory: updatedHistory,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Virtual Front Desk Error:", error);
        res.status(500).json({
            error: "Failed to process your request",
            message: error.message
        });
    }
});

// Text-to-Speech endpoint
app.post("/api/virtual-front-desk/speak", isAuthenticated, async (req: Request, res: Response) => {
    try {
        const { text, voice = "alloy" } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice,
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        res.set("Content-Type", "audio/mpeg");
        res.send(buffer);

    } catch (error: any) {
        console.error("TTS Error:", error);
        res.status(500).json({ error: "Failed to generate speech" });
    }
});

// ============================================
// Error Handler
// ============================================
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ============================================
// Export for Vercel
// ============================================
// 404 fallback for unknown API routes
app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

export default app;
"// trigger deployment $(date +%s)"  
