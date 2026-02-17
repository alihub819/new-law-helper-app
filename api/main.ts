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
const knowledgeBaseStore = new Map<string, { id: string; userId: string; fileName: string; content: string; fileType: string; createdAt: Date }[]>();

// ============================================
// Express App Setup
// ============================================
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

function isAuthenticated(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Authentication required" });
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
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
