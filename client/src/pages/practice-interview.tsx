import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  MicOff, 
  Send, 
  User, 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  Brain,
  MessageSquare,
  Lightbulb,
  Target,
  Award,
  RotateCcw,
  Save,
  Play,
  Pause,
  Eye,
  EyeOff,
  FileText,
  BarChart3
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InterviewMessage {
  id: string;
  role: "attorney" | "client";
  content: string;
  timestamp: Date;
  metadata?: {
    isLying?: boolean;
    lieAbout?: string;
    emotion?: string;
    hiddenInfo?: string;
    hints?: string[];
    knowledgeGaps?: string[];
  };
}

interface InterviewSession {
  id: string;
  caseType: string;
  difficulty: string;
  messages: InterviewMessage[];
  score: {
    questionsAsked: number;
    liesDetected: number;
    knowledgeGapsIdentified: number;
    followUpQuality: number;
    overallScore: number;
  };
  startedAt: Date;
  endedAt?: Date;
}

const caseTypes = [
  { value: "personal-injury", label: "Personal Injury - Car Accident", difficulty: "standard" },
  { value: "medical-malpractice", label: "Medical Malpractice", difficulty: "complex" },
  { value: "contract-dispute", label: "Contract Dispute", difficulty: "standard" },
  { value: "employment", label: "Employment Law - Wrongful Termination", difficulty: "complex" },
  { value: "slip-fall", label: "Premises Liability - Slip & Fall", difficulty: "standard" },
  { value: "product-liability", label: "Product Liability", difficulty: "complex" },
  { value: "real-estate", label: "Real Estate Dispute", difficulty: "standard" },
  { value: "criminal-defense", label: "Criminal Defense - DUI", difficulty: "complex" },
  { value: "family-law", label: "Family Law - Custody", difficulty: "complex" }
];

export default function PracticeInterview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [savedSessions, setSavedSessions] = useState<InterviewSession[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const startInterview = async (caseType: string, difficulty: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/practice-interview", {
        caseType,
        difficulty,
        previousAnswers: null
      });

      const data = await response.json();
      
      const newSession: InterviewSession = {
        id: Date.now().toString(),
        caseType,
        difficulty,
        messages: [{
          id: "1",
          role: "client",
          content: data.clientResponse || "Hi, thank you for meeting with me. I'm not really sure where to start...",
          timestamp: new Date(),
          metadata: data.internalState ? {
            isLying: data.internalState.isLying,
            lieAbout: data.internalState.lieAbout,
            emotion: data.internalState.emotion,
            hiddenInfo: data.internalState.hiddenInfo,
            hints: data.attorneyHints,
            knowledgeGaps: data.knowledgeGaps
          } : undefined
        }],
        score: {
          questionsAsked: 0,
          liesDetected: 0,
          knowledgeGapsIdentified: 0,
          followUpQuality: 0,
          overallScore: 0
        },
        startedAt: new Date()
      };

      setSession(newSession);
      
      toast({
        title: "🎬 Interview Started",
        description: `Practicing ${caseType.replace('-', ' ')} interview at ${difficulty} level.`,
      });
    } catch (error) {
      toast({
        title: "❌ Failed to Start",
        description: "Could not start practice interview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !session || isLoading) return;

    const attorneyMessage: InterviewMessage = {
      id: Date.now().toString(),
      role: "attorney",
      content: inputMessage,
      timestamp: new Date()
    };

    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, attorneyMessage],
      score: {
        ...prev.score,
        questionsAsked: prev.score.questionsAsked + 1
      }
    } : null);

    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/practice-interview", {
        caseType: session.caseType,
        difficulty: session.difficulty,
        previousAnswers: session.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const data = await response.json();

      const clientMessage: InterviewMessage = {
        id: (Date.now() + 1).toString(),
        role: "client",
        content: data.clientResponse,
        timestamp: new Date(),
        metadata: data.internalState ? {
          isLying: data.internalState.isLying,
          lieAbout: data.internalState.lieAbout,
          emotion: data.internalState.emotion,
          hiddenInfo: data.internalState.hiddenInfo,
          hints: data.attorneyHints,
          knowledgeGaps: data.knowledgeGaps
        } : undefined
      };

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, clientMessage]
      } : null);

      // Update score if lie detected
      if (data.internalState?.isLying) {
        setSession(prev => prev ? {
          ...prev,
          score: {
            ...prev.score,
            liesDetected: prev.score.liesDetected + 1
          }
        } : null);
      }

    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to get client response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = () => {
    if (!session) return;

    const finalSession = {
      ...session,
      endedAt: new Date(),
      score: {
        ...session.score,
        overallScore: Math.round(
          (session.score.questionsAsked * 5) + 
          (session.score.liesDetected * 20) +
          (session.score.knowledgeGapsIdentified * 15)
        )
      }
    };

    setSavedSessions(prev => [finalSession, ...prev]);
    setSession(null);

    toast({
      title: "✅ Interview Complete",
      description: `Practice session saved. Your score: ${finalSession.score.overallScore} points`,
    });
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case "nervous": return "bg-yellow-100 text-yellow-800";
      case "confident": return "bg-green-100 text-green-800";
      case "upset": return "bg-red-100 text-red-800";
      case "evasive": return "bg-orange-100 text-orange-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  if (!session) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <User className="h-10 w-10 text-blue-600" />
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                    Practice Client Interviews
                  </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
                  Sharpen your interview skills with AI-powered client simulations. 
                  Practice detecting lies, identifying knowledge gaps, and asking the right questions.
                </p>
              </div>

              {/* Start Interview Card */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Start New Practice Session
                  </CardTitle>
                  <CardDescription>
                    Select a case type to begin your practice interview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {caseTypes.map((caseType) => (
                      <Button
                        key={caseType.value}
                        variant="outline"
                        className="h-auto py-4 px-4 text-left flex flex-col items-start"
                        onClick={() => startInterview(caseType.value, caseType.difficulty)}
                        disabled={isLoading}
                      >
                        <span className="font-semibold">{caseType.label}</span>
                        <Badge 
                          variant={caseType.difficulty === "complex" ? "destructive" : "secondary"}
                          className="mt-2"
                        >
                          {caseType.difficulty}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Saved Sessions */}
              {savedSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Previous Practice Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {savedSessions.map((savedSession) => (
                        <div 
                          key={savedSession.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <div>
                            <div className="font-medium">
                              {caseTypes.find(ct => ct.value === savedSession.caseType)?.label}
                            </div>
                            <div className="text-sm text-slate-500">
                              {savedSession.messages.length} messages • {savedSession.score.questionsAsked} questions
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {savedSession.score.overallScore}
                            </div>
                            <div className="text-xs text-slate-500">points</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips Card */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Interview Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Detecting Lies
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Watch for inconsistent timelines</li>
                        <li>• Note vague or evasive answers</li>
                        <li>• Ask follow-up questions</li>
                        <li>• Look for changes in emotion</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        Knowledge Gaps
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Identify missing information</li>
                        <li>• Ask about documents and evidence</li>
                        <li>• Clarify dates and timelines</li>
                        <li>• Probe for additional witnesses</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="h-full flex">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold">
                    {caseTypes.find(ct => ct.value === session.caseType)?.label}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Badge variant="outline">{session.difficulty}</Badge>
                    <span>{session.messages.length} messages</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHints(!showHints)}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showHints ? "Hide" : "Show"} Hints
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetadata(!showMetadata)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showMetadata ? "Hide" : "Show"} Analysis
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={endInterview}
                >
                  End Interview
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4 max-w-4xl mx-auto">
                {session.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "attorney" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] ${message.role === "attorney" ? "items-end" : "items-start"}`}>
                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === "attorney"
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-slate-700 border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.role === "client" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                          <span className="text-xs font-medium opacity-75">
                            {message.role === "attorney" ? "You" : "Client"}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Metadata (Client Only) */}
                      {message.role === "client" && showMetadata && message.metadata && (
                        <div className="mt-2 space-y-1">
                          {message.metadata.emotion && (
                            <Badge className={getEmotionColor(message.metadata.emotion)}>
                              Emotion: {message.metadata.emotion}
                            </Badge>
                          )}
                          {message.metadata.isLying && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Lying about: {message.metadata.lieAbout}
                            </Badge>
                          )}
                          {message.metadata.hiddenInfo && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              Hidden: {message.metadata.hiddenInfo}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Hints (Client Only) */}
                      {message.role === "client" && showHints && message.metadata?.hints && (
                        <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs">
                          <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                            <Lightbulb className="w-3 h-3 inline mr-1" />
                            Suggested Questions:
                          </div>
                          <ul className="list-disc list-inside text-blue-700 dark:text-blue-400">
                            {message.metadata.hints.map((hint, idx) => (
                              <li key={idx}>{hint}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Knowledge Gaps */}
                      {message.role === "client" && showHints && message.metadata?.knowledgeGaps && (
                        <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs">
                          <div className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                            <Target className="w-3 h-3 inline mr-1" />
                            Information to Gather:
                          </div>
                          <ul className="list-disc list-inside text-amber-700 dark:text-amber-400">
                            {message.metadata.knowledgeGaps.map((gap, idx) => (
                              <li key={idx}>{gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-700 border rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs text-slate-500">Client is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="bg-white dark:bg-slate-800 border-t p-4">
              <div className="max-w-4xl mx-auto flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your question to the client..."
                  className="flex-1 min-h-[80px]"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="h-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Score & Stats */}
          <div className="w-80 bg-white dark:bg-slate-800 border-l p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Interview Score
            </h3>

            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-blue-600">
                {session.score.overallScore}
              </div>
              <div className="text-sm text-slate-500">Total Points</div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Questions Asked</span>
                  <span className="font-medium">{session.score.questionsAsked}</span>
                </div>
                <Progress value={(session.score.questionsAsked / 20) * 100} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Lies Detected</span>
                  <span className="font-medium text-red-600">{session.score.liesDetected}</span>
                </div>
                <Progress value={(session.score.liesDetected / 5) * 100} className="h-2 bg-red-100" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Knowledge Gaps</span>
                  <span className="font-medium text-amber-600">{session.score.knowledgeGapsIdentified}</span>
                </div>
                <Progress value={(session.score.knowledgeGapsIdentified / 10) * 100} className="h-2 bg-amber-100" />
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Tips
            </h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                  Current Focus
                </div>
                <p className="text-blue-700 dark:text-blue-400">
                  Ask open-ended questions to get the client talking
                </p>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="font-medium text-green-800 dark:text-green-300 mb-1">
                  Good Questions
                </div>
                <ul className="list-disc list-inside text-green-700 dark:text-green-400 space-y-1">
                  <li>"Tell me what happened"</li>
                  <li>"What injuries did you have?"</li>
                  <li>"Who else was there?"</li>
                </ul>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="font-medium text-red-800 dark:text-red-300 mb-1">
                  Avoid
                </div>
                <ul className="list-disc list-inside text-red-700 dark:text-red-400 space-y-1">
                  <li>Leading questions</li>
                  <li>Yes/no questions early</li>
                  <li>Interrupting the client</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
