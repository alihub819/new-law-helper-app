import { Router } from 'express';
import { isAuthenticated } from '../auth';
import { generateResponse } from '../openai';
import { storage } from '../storage';

const router = Router();

// Website knowledge base for the virtual assistant
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

// Virtual Front Desk conversation endpoint
router.post('/virtual-front-desk', isAuthenticated, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user!.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch user's knowledge base to personalize responses
    let userContext = '';
    try {
      const kb = await storage.getKnowledgeBaseByUser(userId);
      if (kb && kb.length > 0) {
        userContext = '\n\nUSER KNOWLEDGE BASE:\n' + 
          kb.slice(0, 3).map(doc => `${doc.fileName}: ${doc.content?.substring(0, 500)}...`).join('\n');
      }
    } catch (e) {
      // Continue without user context
    }

    // Prepare conversation for AI
    const messages = [
      {
        role: 'system',
        content: WEBSITE_KNOWLEDGE + userContext + '\n\nYou are a helpful virtual receptionist. Answer questions about the platform, guide users to features, and provide legal technology assistance. Keep responses concise and actionable.'
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    // Generate AI response
    const response = await generateResponse(messages);

    // Store conversation in history (optional)
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    ];

    res.json({
      response,
      conversationHistory: updatedHistory,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Virtual Front Desk Error:', error);
    res.status(500).json({ 
      error: 'Failed to process your request',
      message: error.message 
    });
  }
});

// Text-to-Speech endpoint for voice responses
router.post('/virtual-front-desk/speak', isAuthenticated, async (req, res) => {
  try {
    const { text, voice = 'alloy' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Import OpenAI for TTS
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);

  } catch (error: any) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Speech-to-Text endpoint for voice input
router.post('/virtual-front-desk/listen', isAuthenticated, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });

    const transcript = await openai.audio.transcriptions.create({
      file: await import('openai').then(m => m.toFile(req.file!.buffer, req.file!.originalname, { type: req.file!.mimetype })),
      model: 'whisper-1',
    });

    res.json({ text: transcript.text });

  } catch (error: any) {
    console.error('STT Error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export default router;
