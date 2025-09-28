import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, 
  Search, 
  FileText, 
  TrendingUp, 
  Brain, 
  Shield, 
  Clock, 
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  BookOpen,
  Target,
  Sparkles,
  Rocket,
  Award,
  Globe
} from "lucide-react";
import { Link } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

const slideInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 }
};

const slideInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 }
};

const FloatingCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    {children}
  </motion.div>
);

// Typing Animation Hook
const useTypewriter = (text: string, speed: number = 100) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return displayText;
};

// Floating Particles Component
const FloatingParticles = () => {
  const particles = Array.from({ length: 6 }, (_, i) => i);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 10 + 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Animated Background Gradients
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <motion.div
      className="absolute -inset-10 opacity-30"
      animate={{
        background: [
          "radial-gradient(600px circle at 0% 0%, rgba(59, 130, 246, 0.15), transparent 50%)",
          "radial-gradient(600px circle at 100% 100%, rgba(99, 102, 241, 0.15), transparent 50%)",
          "radial-gradient(600px circle at 50% 50%, rgba(139, 92, 246, 0.15), transparent 50%)",
          "radial-gradient(600px circle at 0% 100%, rgba(59, 130, 246, 0.15), transparent 50%)",
        ],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <motion.div
      className="absolute -inset-10 opacity-20"
      animate={{
        background: [
          "radial-gradient(400px circle at 100% 0%, rgba(168, 85, 247, 0.1), transparent 50%)",
          "radial-gradient(400px circle at 0% 50%, rgba(59, 130, 246, 0.1), transparent 50%)",
          "radial-gradient(400px circle at 100% 50%, rgba(34, 197, 94, 0.1), transparent 50%)",
          "radial-gradient(400px circle at 50% 100%, rgba(168, 85, 247, 0.1), transparent 50%)",
        ],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  </div>
);

export default function LandingPage() {
  const heroText = useTypewriter("Revolutionize Legal Work with AI", 80);
  const [showSecondLine, setShowSecondLine] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowSecondLine(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 relative overflow-hidden">
      <AnimatedBackground />
      <FloatingParticles />
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">LawHelper</span>
            </motion.div>
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/auth">
                  <Button variant="ghost" data-testid="nav-login">Sign In</Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" data-testid="nav-signup">
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Animated Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900 dark:to-indigo-900 dark:text-blue-200 px-6 py-3 text-base">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5 mr-3" />
                  </motion.div>
                  AI-Powered Legal Innovation
                </Badge>
              </motion.div>
              
              {/* Animated Main Heading */}
              <div className="space-y-4">
                <motion.h1 
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <span className="block">{heroText}</span>
                  <motion.span 
                    className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: showSecondLine ? 1 : 0, y: showSecondLine ? 0 : 20 }}
                    transition={{ duration: 0.6 }}
                  >
                    Beyond Expectations
                  </motion.span>
                </motion.h1>
                
                {/* Animated cursor */}
                <motion.span
                  className="inline-block w-1 h-12 bg-blue-600 ml-2"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* Animated Description */}
              <AnimatePresence>
                {showSecondLine && (
                  <motion.p 
                    className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    Experience the future of legal practice with cutting-edge AI that handles research, generates documents, and analyzes contracts at lightning speed.
                  </motion.p>
                )}
              </AnimatePresence>
              
              {/* Enhanced CTA Buttons */}
              <AnimatePresence>
                {showSecondLine && (
                  <motion.div 
                    className="flex flex-col sm:flex-row gap-4 pt-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    <motion.div 
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }} 
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link href="/auth">
                        <Button 
                          size="lg" 
                          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-10 py-5 text-lg rounded-2xl shadow-2xl border-0 relative overflow-hidden group"
                          data-testid="hero-get-started"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6 }}
                          />
                          <span className="relative flex items-center">
                            <Rocket className="mr-3 h-5 w-5" />
                            Launch Your AI Journey
                            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      </Link>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="border-2 border-gradient-to-r from-blue-300 to-purple-300 bg-white/10 backdrop-blur-sm px-10 py-5 text-lg rounded-2xl hover:bg-white/20 transition-all duration-300 group"
                        data-testid="hero-watch-demo"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Globe className="mr-3 h-5 w-5" />
                        </motion.div>
                        Explore Demo
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Stats Pills */}
              <AnimatePresence>
                {showSecondLine && (
                  <motion.div 
                    className="flex flex-wrap gap-4 pt-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                  >
                    {[
                      { icon: Users, label: "10K+ Lawyers", color: "from-green-400 to-emerald-500" },
                      { icon: Clock, label: "95% Time Saved", color: "from-blue-400 to-cyan-500" },
                      { icon: Award, label: "99.9% Accuracy", color: "from-purple-400 to-pink-500" }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        className={`flex items-center space-x-2 bg-gradient-to-r ${stat.color} text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg`}
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <stat.icon className="h-4 w-4" />
                        <span>{stat.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Right Column - Visual Elements */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* Floating Cards Animation */}
              <div className="relative h-96 lg:h-[500px]">
                {/* Main Card */}
                <motion.div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-80 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl"
                  animate={{ 
                    y: [0, -20, 0],
                    rotateY: [0, 5, 0, -5, 0]
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <div className="p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Scale className="h-8 w-8" />
                      <span className="text-2xl font-bold">LawHelper</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/30 rounded-full"></div>
                      <div className="h-2 bg-white/20 rounded-full w-3/4"></div>
                      <div className="h-2 bg-white/20 rounded-full w-1/2"></div>
                    </div>
                  </div>
                </motion.div>

                {/* Satellite Cards */}
                {[
                  { icon: Search, label: "AI Search", position: "top-8 left-4", delay: 0.2 },
                  { icon: FileText, label: "Documents", position: "top-8 right-4", delay: 0.4 },
                  { icon: TrendingUp, label: "Analysis", position: "bottom-8 left-8", delay: 0.6 },
                  { icon: Brain, label: "AI Insights", position: "bottom-8 right-8", delay: 0.8 }
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    className={`absolute ${item.position} w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col items-center justify-center`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: item.delay, duration: 0.5 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <item.icon className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </motion.div>
                ))}

                {/* Orbiting Elements */}
                <motion.div
                  className="absolute top-1/2 left-1/2 w-96 h-96 border border-blue-200/30 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <motion.div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <motion.div className="absolute bottom-0 left-1/2 w-3 h-3 bg-purple-400 rounded-full -translate-x-1/2 translate-y-1/2" />
                  <motion.div className="absolute left-0 top-1/2 w-3 h-3 bg-indigo-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <motion.div className="absolute right-0 top-1/2 w-3 h-3 bg-cyan-400 rounded-full translate-x-1/2 -translate-y-1/2" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful Features for Legal Professionals
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Everything you need to enhance your legal practice with cutting-edge AI technology
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <FloatingCard>
              <Card className="h-full border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-300">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                    <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">AI Legal Search</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    Advanced AI-powered search across legal databases, case law, and statutes with intelligent filtering and relevance ranking.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Quick Questions
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Case Law Research
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Statute Analysis
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FloatingCard>

            <FloatingCard delay={0.1}>
              <Card className="h-full border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors duration-300">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                    <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Document Generation</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    Generate professional legal documents using AI with voice-to-text, template customization, and automated formatting.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Legal Letters
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Contracts & Agreements
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Legal Applications
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FloatingCard>

            <FloatingCard delay={0.2}>
              <Card className="h-full border-2 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transition-colors duration-300">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                    <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Document Analysis</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    Comprehensive AI analysis of legal documents with risk assessment, quality scoring, and improvement suggestions.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Risk Assessment
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Quality Scoring
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Smart Improvements
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FloatingCard>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={slideInLeft}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Why Choose LawHelper?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Join thousands of legal professionals who trust LawHelper to streamline their practice and deliver exceptional results for their clients.
              </p>
              
              <div className="space-y-6">
                <motion.div 
                  className="flex items-start space-x-4"
                  whileHover={{ x: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">10x Faster Research</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Cut research time from hours to minutes with our advanced AI algorithms that understand legal context and nuance.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-4"
                  whileHover={{ x: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Professional Quality</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      All documents meet international USA professional standards with proper formatting and legal precision.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-4"
                  whileHover={{ x: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Precision & Accuracy</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Built on GPT-5 technology with specialized legal training for unmatched accuracy and reliability.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              variants={slideInRight}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="space-y-6">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <Clock className="h-8 w-8 mb-4" />
                    <div className="text-3xl font-bold mb-2">95%</div>
                    <div className="text-blue-100">Time Saved</div>
                  </Card>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <Users className="h-8 w-8 mb-4" />
                    <div className="text-3xl font-bold mb-2">10K+</div>
                    <div className="text-green-100">Happy Lawyers</div>
                  </Card>
                </motion.div>
              </div>
              <div className="space-y-6 mt-12">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <Brain className="h-8 w-8 mb-4" />
                    <div className="text-3xl font-bold mb-2">99.9%</div>
                    <div className="text-purple-100">Accuracy Rate</div>
                  </Card>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white">
                    <BookOpen className="h-8 w-8 mb-4" />
                    <div className="text-3xl font-bold mb-2">1M+</div>
                    <div className="text-orange-100">Documents</div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Legal Practice?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join thousands of legal professionals who are already saving time and delivering better results with LawHelper.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/auth">
                <Button 
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="cta-get-started"
                >
                  Start Your Free Trial Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp}>
              <div className="flex items-center space-x-2 mb-6">
                <Scale className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">LawHelper</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Empowering legal professionals with AI-driven tools for research, document generation, and analysis.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <h3 className="text-lg font-bold mb-6">Product</h3>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">AI Search</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Document Generation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Document Analysis</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <h3 className="text-lg font-bold mb-6">Resources</h3>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <h3 className="text-lg font-bold mb-6">Company</h3>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <p>&copy; 2025 LawHelper. All rights reserved.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}