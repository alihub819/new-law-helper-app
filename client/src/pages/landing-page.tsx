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
  CheckCircle2,
  Sparkles,
  TrendingUp,
  DollarSign,
  FileText,
  Search,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

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
    }, 30); // Faster typing speed
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="font-mono text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-wrap">
      {displayText}
      <span className="animate-pulse text-blue-400">|</span>
    </div>
  );
};

// Enhanced Demo Component
const AiDemo = () => {
  const [activeTab, setActiveTab] = useState<"draft" | "analyze" | "search">("draft");
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
      icon: AlertTriangle,
      color: "text-orange-400"
    },
    search: {
      title: "Legal Research",
      input: "What is the statute of limitations for medical malpractice in New York?",
      output: "According to N.Y. C.P.L.R. § 214-a, the statute of limitations for medical malpractice in New York is 2 years and 6 months from the act, omission, or failure complained of...",
      icon: Search,
      color: "text-purple-400"
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

      {/* ROI Section */}
      <section className="py-24 bg-slate-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
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
                "Priority 24/7 Support"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-lg text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-400">LawHelper.ai</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div>
            © 2025 LawHelper Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}