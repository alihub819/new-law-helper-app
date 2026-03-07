import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  CircleCheck,
  Sparkles,
  TrendingUp,
  DollarSign,
  FileText,
  Search,
  TriangleAlert,
  Loader2,
  Brain,
  FileSearch,
  Stethoscope,
  BookOpen,
  MessageSquare,
  Video,
  Calendar,
  Users,
  FolderOpen,
  PenTool,
  Mic,
  Phone
} from "lucide-react";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Interactive AI Typer Component
const AiTyper = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayText("");
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, index));
      index++;
      if (index > text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="font-mono text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-wrap">
      {displayText}
      <span className="animate-pulse text-blue-400">|</span>
    </div>
  );
};

// Enhanced Demo Component with More Examples
const AiDemo = () => {
  const [activeTab, setActiveTab] = useState<"draft" | "analyze" | "search" | "medical" | "demand" | "discovery">("draft");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const demos = {
    draft: {
      title: "Draft Contract",
      input: "Draft a Non-Disclosure Agreement for a software developer contractor in California.",
      output: "NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement (the \"Agreement\") is entered into by and between [Company Name] (\"Disclosing Party\") and [Contractor Name] (\"Receiving Party\")...\n\n1. Confidential Information. The Receiving Party agrees that all code, algorithms, and designs...",
      icon: FileText,
      color: "text-blue-400"
    },
    analyze: {
      title: "Analyze Risk",
      input: "Review this lease agreement for tenant liabilities.",
      output: "RISK ANALYSIS REPORT\n\n1. Indemnification Clause: High Risk. The tenant is required to indemnify the landlord for ALL claims, regardless of fault.\n2. Maintenance: Moderate Risk. Tenant responsible for HVAC replacement.\n3. Termination: Low Risk. Standard 30-day notice required.",
      icon: TriangleAlert,
      color: "text-orange-400"
    },
    search: {
      title: "Legal Research",
      input: "What is the statute of limitations for medical malpractice in New York?",
      output: "According to N.Y. C.P.L.R. § 214-a, the statute of limitations for medical malpractice in New York is 2 years and 6 months from the act, omission, or failure complained of...",
      icon: Search,
      color: "text-purple-400"
    },
    medical: {
      title: "Medical Chronology",
      input: "Create a medical chronology from: Patient John Doe, rear-end collision on 1/15/24, ER visit same day, PT 3x/week for 8 weeks, MRI showing herniated disc L4-L5.",
      output: "MEDICAL CHRONOLOGY\n\n01/15/2024 - EMERGENCY DEPARTMENT\n• Chief Complaint: Neck and lower back pain post-MVA\n• Treatment: X-rays negative, prescribed muscle relaxants\n• ICD-10: S13.4XXA, S33.5XXA\n\n01/16/2024 - 03/15/2024: PHYSICAL THERAPY (24 visits)\n• Treatment: Cervical and lumbar traction, therapeutic exercises\n• CPT: 97110, 97140, 97530\n\n02/01/2024 - MRI LUMBAR SPINE\n• Finding: Herniated disc L4-L5 with nerve impingement\n• CPT: 72148",
      icon: Stethoscope,
      color: "text-emerald-400"
    },
    demand: {
      title: "Demand Letter",
      input: "Generate a demand letter for a car accident case where my client suffered whiplash, $15,000 in medical bills, and 2 weeks lost wages. Policy limits are $50,000.",
      output: "DEMAND LETTER\n\nRe: Motor Vehicle Accident - January 15, 2024\nClaim No: ABC-123-456\nPolicy Limit: $50,000\n\nDear Claims Adjuster:\n\nWe represent [Client Name] regarding the motor vehicle accident that occurred on January 15, 2024, when your insured rear-ended our client at the intersection of Main St and Broadway.\n\nLIABILITY:\nYour insured was cited for following too closely (Vehicle Code § 21703). Witness statements confirm your insured failed to stop in time.\n\nDAMAGES:\nMedical Expenses: $15,000.00\nLost Wages: $3,500.00\nPain & Suffering: $25,000.00\nFuture Medical: $6,500.00\nTOTAL DEMAND: $50,000.00 (Policy Limits)\n\nWe request a response within 30 days.",
      icon: FileText,
      color: "text-red-400"
    },
    discovery: {
      title: "Discovery Response",
      input: "Answer interrogatory: 'Describe all injuries you claim resulted from the accident of January 15, 2024.'",
      output: "INTERROGATORY RESPONSE\n\nINTERROGATORY NO. 12:\nDescribe all injuries you claim resulted from the accident of January 15, 2024.\n\nRESPONSE:\nPlaintiff responds as follows:\n\n1. Cervical Strain (Whiplash)\n   - Diagnosed: January 15, 2024 at Memorial Hospital\n   - ICD-10: S13.4XXA\n   - Treatment: 8 weeks physical therapy\n   - Current Status: Resolved with residual stiffness\n\n2. Lumbar Disc Herniation at L4-L5\n   - Diagnosed: February 1, 2024 via MRI\n   - ICD-10: M51.26\n   - Treatment: Epidural steroid injection (2/15/24), ongoing PT\n   - Current Status: Permanent - requires maintenance therapy\n\n3. Anxiety/PTSD related to collision\n   - Diagnosed: January 30, 2024\n   - ICD-10: F43.10\n   - Treatment: Counseling, medication\n   - Current Status: Ongoing treatment",
      icon: BookOpen,
      color: "text-indigo-400"
    }
  };

  const handleRunDemo = (tab: "draft" | "analyze" | "search") => {
    setActiveTab(tab);
    setIsProcessing(true);
    setShowResult(false);
    setTimeout(() => {
      setIsProcessing(false);
      setShowResult(true);
    }, 1500);
  };

  return (
    <Card className="bg-slate-900 border-white/10 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
      <div className="flex border-b border-white/10 bg-black/20">
        {Object.entries(demos).map(([key, demo]) => (
          <button
            key={key}
            onClick={() => handleRunDemo(key as any)}
            className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === key
                ? "bg-white/5 text-white border-b-2 border-blue-500"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
          >
            <demo.icon className="w-4 h-4" />
            {demo.title}
          </button>
        ))}
      </div>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="p-6 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ${demos[activeTab].color}`}>
              {React.createElement(demos[activeTab].icon, { className: "w-5 h-5" })}
            </div>
            <div className="text-sm font-medium text-slate-400">Input Prompt</div>
          </div>
          <div className="text-white text-lg font-light">
            "{demos[activeTab].input}"
          </div>
        </div>

        <div className="flex-1 bg-black/40 p-6 relative overflow-y-auto">
          {isProcessing ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-slate-400 text-sm animate-pulse">Processing Request...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                AI Output
              </div>
              {showResult && <AiTyper text={demos[activeTab].output} />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, features, color }: any) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all h-full"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 mb-4 leading-relaxed">{description}</p>
    <ul className="space-y-2">
      {features.map((feature: string, idx: number) => (
        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
          <CircleCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">LawHelper.ai</span>
          </div>
          <div className="flex gap-6 items-center">
            <Link href="#features">
              <span className="text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:block">Features</span>
            </Link>
            <Link href="#capabilities">
              <span className="text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:block">Capabilities</span>
            </Link>
            <Link href="#for-teams">
              <span className="text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:block">For Teams</span>
            </Link>
            <Link href="#pricing">
              <span className="text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:block">Pricing</span>
            </Link>
            <div className="w-px h-6 bg-white/10 hidden md:block" />
            <Link href="/auth">
              <span className="text-sm font-medium text-white hover:text-blue-400 transition-colors cursor-pointer">Log In</span>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="bg-white text-slate-950 hover:bg-blue-50 hover:text-blue-600 transition-all font-semibold rounded-full px-6">
                Get Access
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Live Demo Available
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                Your AI Legal <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  Superpower.
                </span>
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
                Automate 80% of your legal work. Draft contracts, analyze risks, and conduct research in seconds—with PhD-level precision.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-14 text-lg font-semibold shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="ghost" size="lg" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-full px-8 h-14 text-lg">
                  Watch Demo <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            <div className="pt-8 border-t border-white/10 flex items-center gap-8 text-slate-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>7-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>

          <motion.div
            id="demo"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <AiDemo />
          </motion.div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section id="features" className="py-24 bg-slate-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4">Complete Feature Set</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything You Need to <br />
              <span className="text-blue-400">Practice Law Efficiently</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From AI-powered document generation to client management, LawHelper.ai provides a complete suite of tools designed specifically for attorneys and paralegals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Document Generation */}
            <FeatureCard
              icon={FileText}
              title="AI Document Generation"
              description="Draft contracts, demand letters, motions, and legal documents in seconds using advanced AI models trained on legal language."
              features={[
                "Demand letters with case-specific details",
                "Contract templates for any jurisdiction",
                "Court motions and pleadings",
                "Business correspondence",
                "Discovery responses",
                "Custom template creation"
              ]}
              color="bg-blue-600"
            />

            {/* Legal Research */}
            <FeatureCard
              icon={BookOpen}
              title="AI Legal Research"
              description="Conduct comprehensive legal research with AI that understands case law, statutes, and legal precedents."
              features={[
                "Case law search with relevance scoring",
                "Statute and regulation lookup",
                "Legal precedents analysis",
                "Jurisdiction-specific results",
                "Citation formatting",
                "Research history tracking"
              ]}
              color="bg-purple-600"
            />

            {/* Document Analysis */}
            <FeatureCard
              icon={FileSearch}
              title="Document Analyzer"
              description="Upload and analyze contracts, agreements, and legal documents to identify risks, key clauses, and improvement opportunities."
              features={[
                "Risk assessment and flagging",
                "Key clause identification",
                "Contract comparison",
                "Obligation extraction",
                "Deadline tracking",
                "AI-powered recommendations"
              ]}
              color="bg-orange-600"
            />

            {/* Medical Intelligence */}
            <FeatureCard
              icon={Stethoscope}
              title="Medical Intelligence"
              description="Specialized tools for personal injury attorneys to analyze medical records, bills, and treatment chronologies."
              features={[
                "Medical chronology generation",
                "Bill analysis and validation",
                "ICD-10 and CPT code extraction",
                "Treatment gap identification",
                "LOP (Letter of Protection) analysis",
                "PIP insurance claim review"
              ]}
              color="bg-emerald-600"
            />

            {/* Case Management */}
            <FeatureCard
              icon={FolderOpen}
              title="Case Management"
              description="Organize and track all your cases with an intuitive system designed for legal workflows."
              features={[
                "Case creation and tracking",
                "Client information management",
                "Document organization",
                "Deadline and statute tracking",
                "Case value estimation",
                "Status and workflow management"
              ]}
              color="bg-indigo-600"
            />

            {/* Calendar & Appointments */}
            <FeatureCard
              icon={Calendar}
              title="Calendar & Scheduling"
              description="Manage appointments, court dates, and deadlines with integrated calendaring and client intake forms."
              features={[
                "Appointment scheduling",
                "Court date tracking",
                "Client intake forms",
                "Automated reminders",
                "Calendar sharing",
                "Meeting notes integration"
              ]}
              color="bg-pink-600"
            />
          </div>
        </div>
      </section>

      {/* Quick Use Cases - What You Can Do */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 mb-4">30+ Use Cases</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What You Can <span className="text-amber-400">Do Right Now</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Real tasks you can accomplish with LawHelper.ai today
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText, text: "Draft a demand letter", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: Stethoscope, text: "Analyze medical records", color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { icon: Search, text: "Research case law", color: "text-purple-400", bg: "bg-purple-400/10" },
              { icon: TriangleAlert, text: "Review contracts for risks", color: "text-orange-400", bg: "bg-orange-400/10" },
              { icon: FileText, text: "Create discovery responses", color: "text-indigo-400", bg: "bg-indigo-400/10" },
              { icon: BookOpen, text: "Generate legal memos", color: "text-pink-400", bg: "bg-pink-400/10" },
              { icon: MessageSquare, text: "Practice client interviews", color: "text-cyan-400", bg: "bg-cyan-400/10" },
              { icon: Video, text: "Conduct secure video calls", color: "text-red-400", bg: "bg-red-400/10" },
              { icon: Calendar, text: "Schedule appointments", color: "text-green-400", bg: "bg-green-400/10" },
              { icon: FolderOpen, text: "Organize case files", color: "text-yellow-400", bg: "bg-yellow-400/10" },
              { icon: Mic, text: "Transcribe depositions", color: "text-teal-400", bg: "bg-teal-400/10" },
              { icon: Brain, text: "Get AI legal opinions", color: "text-violet-400", bg: "bg-violet-400/10" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className={`${item.bg} border border-white/10 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-white/20 transition-all`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-white font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Capabilities Section */}
      <section id="capabilities" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 mb-4">Advanced AI Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powered by <span className="text-purple-400">Advanced AI</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Feature List */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Virtual Front Desk</h3>
                    <p className="text-slate-400">
                      AI-powered receptionist trained on your entire website and legal practice. Answers client questions, 
                      guides them to the right features, and provides instant support via voice or text.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Practice Interview Training</h3>
                    <p className="text-slate-400">
                      Sharpen your client interview skills with AI-simulated clients. Features lie detection, 
                      knowledge gap analysis, and real-time coaching to improve your questioning techniques.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Voice Control & Transcription</h3>
                    <p className="text-slate-400">
                      Navigate the entire application hands-free with voice commands. Record and transcribe 
                      client meetings, depositions, and court proceedings with AI accuracy.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shrink-0">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Secure Video Calls</h3>
                    <p className="text-slate-400">
                      Conduct confidential client consultations with end-to-end encrypted video calls. 
                      Includes screen sharing, recording, and real-time transcription capabilities.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Attorney Knowledge Base</h3>
                    <p className="text-slate-400">
                      Customize AI responses with your firm's information, writing style, practice areas, 
                      and preferred terminology. Train the AI to respond like you.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">One-Click Demo Mode</h3>
                    <p className="text-slate-400">
                      Instantly populate your account with realistic AI-generated cases, clients, and documents 
                      for testing, training, or demonstrations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl" />
              <Card className="relative bg-slate-900/80 border-white/10 overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold">AI Assistant</div>
                          <div className="text-sm text-slate-400">Always learning</div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-sm text-slate-400 mb-2">Writing Style</div>
                        <div className="font-medium">Professional & Assertive</div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-sm text-slate-400 mb-2">Practice Areas</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Personal Injury</Badge>
                          <Badge variant="outline">Contract Law</Badge>
                          <Badge variant="outline">Employment</Badge>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-sm text-slate-400 mb-2">Recent Activity</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <CircleCheck className="w-4 h-4 text-emerald-400" />
                            Generated demand letter
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <CircleCheck className="w-4 h-4 text-emerald-400" />
                            Analyzed medical records
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <CircleCheck className="w-4 h-4 text-emerald-400" />
                            Conducted case law search
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* For Teams Section */}
      <section id="for-teams" className="py-24 bg-slate-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-4">Built for Legal Teams</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Perfect for <span className="text-emerald-400">Attorneys & Paralegals</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* For Attorneys */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center">
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">For Attorneys</h3>
                  <p className="text-slate-400">Strategic legal work automation</p>
                </div>
              </div>

              <ul className="space-y-4">
                {[
                  "Draft complex legal arguments and motions",
                  "Conduct comprehensive legal research",
                  "Analyze contracts for risk assessment",
                  "Generate demand letters with case valuation",
                  "Prepare discovery responses efficiently",
                  "Review medical records for malpractice cases",
                  "Train interview skills with AI clients",
                  "Manage case strategy and timelines"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CircleCheck className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Paralegals */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center">
                  <PenTool className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">For Paralegals</h3>
                  <p className="text-slate-400">Efficient case support tools</p>
                </div>
              </div>

              <ul className="space-y-4">
                {[
                  "Organize case files and documents",
                  "Draft routine correspondence",
                  "Schedule appointments and court dates",
                  "Prepare client intake forms",
                  "Transcribe meetings and depositions",
                  "Manage calendar and deadlines",
                  "Coordinate with medical providers",
                  "Track case status and updates"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CircleCheck className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Invest in Efficiency</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Maximize your billable efficiency and reduce overhead with AI-driven workflows.
              <br />Based on 2025 Legal Tech Industry Benchmark.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                label: "Document Review",
                value: "80%",
                suffix: "Faster",
                desc: "Reduce review cycles from days to hours.",
                icon: Clock,
                color: "text-blue-400",
                bg: "bg-blue-400/10",
                border: "border-blue-400/20"
              },
              {
                label: "Contract Analysis",
                value: "15x",
                suffix: "Speed",
                desc: "Identify risks and clauses instantly.",
                icon: Zap,
                color: "text-purple-400",
                bg: "bg-purple-400/10",
                border: "border-purple-400/20"
              },
              {
                label: "Cost Savings",
                value: "13%",
                suffix: "Reduction",
                desc: "Lower external legal spend significantly.",
                icon: DollarSign,
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                border: "border-emerald-400/20"
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className={`p-8 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm transition-all`}
              >
                <div className="flex items-center justify-between mb-8">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <Badge variant="outline" className={`${stat.color} border-current opacity-50`}>Verified</Badge>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className={`text-6xl font-bold ${stat.color}`}>{stat.value}</span>
                  <span className={`text-lg font-medium opacity-80 ${stat.color}`}>{stat.suffix}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{stat.label}</h3>
                <p className="text-slate-400 leading-relaxed">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Real-World Examples Gallery */}
      <section className="py-24 bg-slate-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20 mb-4">Real Examples</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              See It In <span className="text-pink-400">Action</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Real examples of how attorneys and paralegals use LawHelper.ai every day to streamline their practice.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Example 1: Personal Injury Case */}
            <Card className="bg-slate-900 border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-blue-500/20 text-blue-400">Personal Injury</Badge>
                  <span className="text-slate-400 text-sm">Car Accident</span>
                </div>
                <h3 className="text-xl font-bold">From Intake to Demand Letter in 30 Minutes</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <div>
                      <div className="font-medium text-white">Client Interview</div>
                      <p className="text-sm text-slate-400">Used Practice Interview mode to prepare questions. AI flagged potential liability issues.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <div>
                      <div className="font-medium text-white">Medical Records Analysis</div>
                      <p className="text-sm text-slate-400">Uploaded 200+ pages of records. AI extracted ICD codes, treatment timeline, and billed $47,500.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                    <div>
                      <div className="font-medium text-white">Demand Letter Generated</div>
                      <p className="text-sm text-slate-400">AI created demand letter citing specific injuries, treatment gaps, and case law. Ready to send.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Time Saved: 6 hours</span>
                    <span className="text-emerald-400 font-medium">Case Value: $125,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example 2: Contract Review */}
            <Card className="bg-slate-900 border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-orange-500/20 text-orange-400">Contract Law</Badge>
                  <span className="text-slate-400 text-sm">Commercial Lease</span>
                </div>
                <h3 className="text-xl font-bold">Caught Hidden Liability Clause</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                    <TriangleAlert className="w-5 h-5" />
                    AI Risk Alert
                  </div>
                  <p className="text-sm text-slate-300">
                    "Section 14.2 requires tenant to indemnify landlord for ALL claims including landlord's own negligence. This is unenforceable in CA but creates litigation risk."
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CircleCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-white">Identified 3 High-Risk Clauses</div>
                      <p className="text-sm text-slate-400">Indemnification, maintenance obligations, and auto-renewal terms.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CircleCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-white">Suggested Negotiation Points</div>
                      <p className="text-sm text-slate-400">AI provided specific counter-language and legal justification.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CircleCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-white">Client Protected</div>
                      <p className="text-sm text-slate-400">Avoided $50K+ in potential liability exposure.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Review Time: 15 minutes</span>
                    <span className="text-emerald-400 font-medium">Saved: $15,000+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example 3: Legal Research */}
            <Card className="bg-slate-900 border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-purple-500/20 text-purple-400">Legal Research</Badge>
                  <span className="text-slate-400 text-sm">Motion to Compel</span>
                </div>
                <h3 className="text-xl font-bold">Found Winning Precedent in Seconds</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Query</div>
                    <div className="text-white">"Cases where court compelled production of Slack messages in employment discrimination cases in California"</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <div>
                      <div className="font-medium text-white">AI Search Results</div>
                      <p className="text-sm text-slate-400">Found 5 relevant cases including <em>Williams v. Amazon</em> (2023) with nearly identical facts.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <div>
                      <div className="font-medium text-white">Case Brief Generated</div>
                      <p className="text-sm text-slate-400">AI created summary with holding, reasoning, and citation in proper Bluebook format.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Research Time: 20 minutes</span>
                    <span className="text-emerald-400 font-medium">Motion Granted ✓</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example 4: Medical Malpractice */}
            <Card className="bg-slate-900 border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400">Medical Malpractice</Badge>
                  <span className="text-slate-400 text-sm">Surgical Error</span>
                </div>
                <h3 className="text-xl font-bold">Organized 1,200 Pages of Medical Records</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/5 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-emerald-400">47</div>
                      <div className="text-xs text-slate-400">Provider Visits</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-400">128</div>
                      <div className="text-xs text-slate-400">ICD-10 Codes</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-400">$847K</div>
                      <div className="text-xs text-slate-400">Total Billed</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CircleCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-white">Chronology Created</div>
                      <p className="text-sm text-slate-400">AI generated detailed timeline from initial ER visit through 8 surgeries over 18 months.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CircleCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-white">Treatment Gaps Identified</div>
                      <p className="text-sm text-slate-400">Flagged 3-week delay in post-surgical care that worsened outcome.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CircleCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-white">Expert Witness Ready</div>
                      <p className="text-sm text-slate-400">Organized records by issue for expert review. Case settled for $2.4M.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Processing Time: 2 hours</span>
                    <span className="text-emerald-400 font-medium">Settlement: $2.4M</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about LawHelper.ai</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-white/10">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Is my client data secure?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Yes. We use bank-level encryption (AES-256) for all data at rest and in transit. 
                We are SOC 2 Type II compliant and never train AI models on your confidential data. 
                Your information is completely isolated and secure.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-white/10">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Do I need to be tech-savvy to use this?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Not at all. LawHelper.ai is designed with attorneys and paralegals in mind. 
                The interface is intuitive, and you can use voice commands to navigate. 
                Plus, our Virtual Front Desk AI assistant can guide you through any feature.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-white/10">
              <AccordionTrigger className="text-white hover:text-blue-400">
                What types of law does this support?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                LawHelper.ai supports Personal Injury, Contract Law, Employment Law, Medical Malpractice, 
                Real Estate, Family Law, Criminal Defense, and general litigation. You can customize 
                the AI for your specific practice areas in the Attorney Settings.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-white/10">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Yes. We offer a 7-day free trial with no credit card required. After that, 
                you can cancel anytime with no questions asked. We also offer a 30-day money-back guarantee.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-stretch gap-12">

          <div className="flex-1 space-y-8 self-center">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              One simple price for <br />
              <span className="text-blue-400">unlimited power.</span>
            </h2>
            <p className="text-xl text-slate-400">
              No complicated tiers. No hidden usage fees. Get full access to the entire LawHelper suite.
            </p>

            <div className="space-y-4 pt-4">
              {[
                "Unlimited AI Document Drafting",
                "Full Case Law Search Engine",
                "Medical Record Analysis",
                "Real-time Risk Assessment",
                "Practice Interview Training",
                "Video Calls & Transcription",
                "Priority 24/7 Support"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-lg text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CircleCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-b from-slate-800 to-slate-900 border border-blue-500/30 rounded-3xl p-1 shadow-2xl relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-blue-500 blur-[20px]" />
              <div className="bg-slate-900 rounded-[22px] p-8 md:p-12 text-center h-full flex flex-col justify-center">
                <div className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">Pro License</div>
                <div className="flex items-center justify-center text-white mb-2">
                  <span className="text-3xl font-medium opacity-50 align-top mt-2">$</span>
                  <span className="text-7xl font-bold tracking-tighter">250</span>
                </div>
                <div className="text-slate-500 mb-8">One-time payment</div>

                <Link href="/auth">
                  <Button size="lg" className="w-full bg-white text-slate-900 hover:bg-blue-50 h-14 rounded-xl text-lg font-bold shadow-lg shadow-white/10">
                    Get Started Now
                  </Button>
                </Link>
                <div className="mt-6 text-xs text-slate-500">
                  Secure checkout powered by Stripe. 30-day money-back guarantee.
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your <br />
            <span className="text-blue-400">Legal Practice?</span>
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of attorneys and paralegals who are already using LawHelper.ai 
            to work smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-14 text-lg font-semibold">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/demo-login">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-white/20 hover:bg-white/5">
                Try Demo Mode
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-white text-lg">LawHelper.ai</span>
              </div>
              <p className="text-slate-400">
                AI-powered legal practice management for modern attorneys and paralegals.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              © 2025 LawHelper Inc. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
