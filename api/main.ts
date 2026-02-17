import express, { type Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, randomUUID } from "crypto";
import { promisify } from "util";
import createMemoryStore from "memorystore";
import * as openaiLib from "./openai.js";
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
const knowledgeBase = new Map<string, any[]>();

let sessionStore: any;
try {
    sessionStore = new MemoryStore({ checkPeriod: 86400000 });
} catch (e) {
    console.warn("[SESSION] MemoryStore creation failed, using default store");
    sessionStore = null;
}

// ============================================
// Password Utils
// ============================================
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
    try {
        const [hashed, salt] = stored.split(".");
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch {
        return false;
    }
}

// ============================================
// Storage Functions
// ============================================
async function getUser(id: string): Promise<User | undefined> {
    return users.get(id);
}

async function getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(users.values()).find(u => u.email === email);
}

async function createUser(data: { name: string; email: string; password: string }): Promise<User> {
    const id = randomUUID();
    const user: User = { ...data, id, createdAt: new Date() };
    users.set(id, user);
    return user;
}

// ============================================
// Express App Setup
// ============================================
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Session
app.set("trust proxy", 1);
let sessionConfig: any = {
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
};

try {
    if (sessionStore) {
        sessionConfig.store = sessionStore;
    }
} catch (e) {
    console.warn("[SESSION] Using default session store");
}

app.use(session(sessionConfig));

// Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
        try {
            const user = await getUserByEmail(email);
            if (!user) return done(null, false);
            const match = await comparePasswords(password, user.password);
            if (!match) return done(null, false);
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    })
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
    const user = await getUser(id);
    done(null, user || null);
});

// Multer Setup
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper: Extract Text
async function extractText(file: Express.Multer.File): Promise<string> {
    try {
        console.log(`[EXTRACT-TEXT] Name: ${file.originalname}, Mime: ${file.mimetype}, Size: ${file.size}`);
        if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
            return file.buffer.toString('utf-8');
        } else if (file.mimetype.includes('word') || file.originalname.endsWith('.docx')) {
            try {
                const mammothModule = await import("mammoth");
                const mammoth = mammothModule.default || mammothModule;
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                return result.value || "";
            } catch (mammothErr) {
                console.error("[EXTRACT-TEXT] Mammoth error:", mammothErr);
                return "";
            }
        } else if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
            try {
                const pdfParseModule = await import("pdf-parse");
                const PDFParse = (pdfParseModule as any).PDFParse;
                if (PDFParse) {
                    const parser = new PDFParse({ data: file.buffer });
                    const result = await parser.getText();
                    return result.text || "";
                } else {
                    const pdfParser = (pdfParseModule as any).default || pdfParseModule;
                    if (typeof pdfParser === 'function') {
                        const data = await pdfParser(file.buffer);
                        return data.text || "";
                    }
                }
            } catch (pdfErr) {
                console.error("[EXTRACT-TEXT] PDFParse error:", pdfErr);
                return "";
            }
        }
    } catch (e: any) {
        console.error("[EXTRACT-TEXT] Failed", e);
    }
    return "";
}

// ============================================
// Auth Routes
// ============================================
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password required" });
        }

        const existing = await getUserByEmail(email);
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashedPassword = await hashPassword(password);
        const user = await createUser({ name, email, password: hashedPassword });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: "Login failed" });
            res.status(201).json({ id: user.id, name: user.name, email: user.email });
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as User;
    res.json({ id: user.id, name: user.name, email: user.email });
});

app.post("/api/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.json({ success: true });
    });
});

app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    const user = req.user as User;
    res.json({ id: user.id, name: user.name, email: user.email });
});

// Demo Login
app.post("/api/demo-login", async (req, res) => {
    try {
        const demoEmail = "demo@lawhelper.com";
        let user = await getUserByEmail(demoEmail);

        if (!user) {
            const hashedPassword = await hashPassword("demo-password-123");
            user = await createUser({ name: "Demo Attorney", email: demoEmail, password: hashedPassword });
        }

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: "Demo login failed" });
            res.json({ id: user!.id, name: user!.name, email: user!.email });
        });
    } catch (error) {
        console.error("Demo login error:", error);
        res.status(500).json({ error: "Demo login failed" });
    }
});

// ============================================
// API Routes (AI Features) - MATCHING FRONTEND
// ============================================
function isAuthenticated(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Authentication required" });
}

// 1. Quick Question
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

// 2. Legal Search
app.post("/api/legal-search", isAuthenticated, async (req, res) => {
    try {
        const { query, filters, context } = req.body; // useKnowledgeBase logic handled in frontend or needs context
        // Frontend sends: { query, useKnowledgeBase }
        // We should handle useKnowledgeBase if possible
        let searchContext = context || "";

        if (req.body.useKnowledgeBase) {
            const userId = (req.user as User).id;
            const entries = knowledgeBase.get(userId) || [];
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

// 3. Summarize Document
app.post("/api/summarize-document", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Document required" });
        const text = await extractText(req.file);
        if (!text) return res.status(400).json({ error: "Could not extract text" });

        const summary = await openaiLib.summarizeDocument(text, req.body.summaryType || 'quick');
        res.json(summary);
    } catch (error: any) {
        console.error("Summarize error:", error);
        res.status(500).json({ error: error.message || "Failed to summarize" });
    }
});

// 4. Analyze Risk
app.post("/api/analyze-risk", isAuthenticated, async (req, res) => {
    try {
        const analysis = await openaiLib.analyzeRisk(req.body);
        res.json(analysis);
    } catch (error: any) {
        console.error("Risk analysis error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Law Agent
app.post("/api/law-agent", isAuthenticated, async (req, res) => {
    try {
        const result = await openaiLib.answerLegalQuestion(req.body.question);
        res.json(result);
    } catch (error: any) {
        console.error("Law Agent error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Web Search
app.post("/api/web-search", isAuthenticated, async (req, res) => {
    try {
        const result = await openaiLib.performWebSearch(req.body.query);
        res.json(result);
    } catch (error: any) {
        console.error("Web Search error:", error);
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

        const entries = knowledgeBase.get(userId) || [];
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
    res.json(knowledgeBase.get(userId) || []);
});

app.delete("/api/knowledge-base/:id", isAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    let entries = knowledgeBase.get(userId) || [];
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
// Error Handler
// ============================================
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ============================================
// Export for Vercel
// ============================================
export default app;
"// trigger deployment $(date +%s)"  
