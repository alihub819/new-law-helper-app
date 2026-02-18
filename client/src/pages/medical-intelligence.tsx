import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  DollarSign, 
  FileCheck, 
  Download, 
  Save, 
  Loader2, 
  Mic, 
  MicOff, 
  Upload,
  Brain,
  Shield,
  Stethoscope,
  FileSpreadsheet,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type AnalysisMode = "chronology" | "bills" | "summary" | "lop" | "pip" | "attorney" | "therapist";
type LLMModel = "ai-advanced" | "ai-standard" | "ai-basic";
type Complexity = "standard" | "complex" | "forensic";

interface MedicalResults {
  chronology: any | null;
  bills: any | null;
  summary: any | null;
  lop: any | null;
  pip: any | null;
  attorney: any | null;
  therapist: any | null;
}

interface RAGContext {
  icd10Codes: string[];
  cptCodes: string[];
  providers: string[];
  dates: string[];
  medications: string[];
  totalBilled: number;
}

export default function MedicalIntelligence() {
  const [activeTab, setActiveTab] = useState<AnalysisMode>("chronology");
  const [selectedModel, setSelectedModel] = useState<LLMModel>("ai-advanced");
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [documentText, setDocumentText] = useState<Record<AnalysisMode, string>>({
    chronology: "",
    bills: "",
    summary: "",
    lop: "",
    pip: "",
    attorney: "",
    therapist: "",
  });
  const [results, setResults] = useState<MedicalResults>({
    chronology: null,
    bills: null,
    summary: null,
    lop: null,
    pip: null,
    attorney: null,
    therapist: null,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ragContext, setRagContext] = useState<RAGContext | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Medical Intelligence Mutation with RAG
  const medicalIntelligenceMutation = useMutation({
    mutationFn: async (data: { 
      mode: AnalysisMode; 
      payload: { 
        documentText: string; 
        model: LLMModel;
        complexity: Complexity;
        ragContext?: RAGContext;
        caseType?: string;
      } 
    }) => {
      const response = await apiRequest("POST", "/api/medical-intelligence-advanced", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      const mode = variables.mode;
      setResults((prev) => ({ ...prev, [mode]: data }));
      
      // Update RAG context if provided
      if (data.ragContext) {
        setRagContext(data.ragContext);
      }
      
      toast({
        title: "🧠 Analysis Complete",
        description: `Medical intelligence analysis generated using ${selectedModel} with ${complexity} complexity.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Analysis Failed",
        description: error.message || "Failed to generate medical intelligence analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "🎤 Recording Started",
        description: "Recording your voice... Click stop when done.",
      });
    } catch (error) {
      toast({
        title: "❌ Microphone Error",
        description: "Please allow microphone access to use voice recording.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      toast({
        title: "⏹️ Recording Stopped",
        description: "Transcribing audio...",
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await apiRequest('POST', '/api/transcribe', formData);
      const data = await response.json();
      
      if (data.text) {
        setDocumentText(prev => ({
          ...prev,
          [activeTab]: prev[activeTab] + (prev[activeTab] ? '\n\n' : '') + data.text
        }));
        
        toast({
          title: "✅ Transcription Complete",
          description: `Added ${data.text.length} characters to the document.`,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Transcription Failed",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setDocumentText(prev => ({ ...prev, [activeTab]: text }));
      
      toast({
        title: "📄 File Uploaded",
        description: `${file.name} loaded successfully.`,
      });
    };
    reader.readAsText(file);
  };

  // Analysis Handler
  const handleAnalyze = () => {
    const currentText = documentText[activeTab];
    if (!currentText.trim()) {
      toast({
        title: "⚠️ Input Required",
        description: "Please enter medical record text, record audio, or upload a file to analyze.",
        variant: "destructive",
      });
      return;
    }

    setAnalysisProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    medicalIntelligenceMutation.mutate(
      {
        mode: activeTab,
        payload: { 
          documentText: currentText,
          model: selectedModel,
          complexity: complexity,
          ragContext: ragContext || undefined,
        },
      },
      {
        onSettled: () => {
          clearInterval(progressInterval);
          setAnalysisProgress(100);
          setTimeout(() => setAnalysisProgress(0), 1000);
        }
      }
    );
  };

  // Export Functions
  const handleExport = async (format: 'pdf' | 'docx' | 'txt' | 'json') => {
    const result = results[activeTab];
    if (!result) {
      toast({
        title: "⚠️ No Results",
        description: "Please analyze documents first before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/export-medical-document", {
        format,
        mode: activeTab,
        content: result,
        ragContext,
      });

      if (format === 'json') {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `medical_${activeTab}_analysis_${Date.now()}.json`;
        a.click();
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `medical_${activeTab}_analysis_${Date.now()}.${format}`;
        a.click();
      }

      toast({
        title: "✅ Export Complete",
        description: `Medical analysis exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "❌ Export Failed",
        description: "Failed to export document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format time for recording display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get tab description
  const getTabDescription = (mode: AnalysisMode) => {
    const descriptions: Record<AnalysisMode, { title: string; desc: string; icon: any }> = {
      chronology: { 
        title: "Medical Chronology", 
        desc: "AI-powered timeline with ICD/CPT codes and treatment gaps",
        icon: FileText 
      },
      bills: { 
        title: "Medical Bill Analysis", 
        desc: "Smart billing review with LOP and insurance optimization",
        icon: DollarSign 
      },
      summary: { 
        title: "Medical Summary", 
        desc: "Comprehensive legal medical summary for case evaluation",
        icon: FileCheck 
      },
      lop: { 
        title: "LOP Intelligence", 
        desc: "Letter of Protection analysis and provider negotiation insights",
        icon: Shield 
      },
      pip: { 
        title: "PIP Insurance Smart", 
        desc: "Personal Injury Protection analysis and claim optimization",
        icon: FileSpreadsheet 
      },
      attorney: { 
        title: "Attorney Insights", 
        desc: "Legal strategy recommendations and case value assessment",
        icon: Brain 
      },
      therapist: { 
        title: "Therapist Collaboration", 
        desc: "Treatment planning and progress tracking for therapy notes",
        icon: Stethoscope 
      },
    };
    return descriptions[mode];
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white" data-testid="heading-medical-intelligence">
                  Medical Intelligence Suite
                </h1>
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                  <Brain className="w-3 h-3 mr-1" />
                  AI-Powered
                </Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg" data-testid="text-description">
                Advanced medical record analysis with RAG, LOP/PIP intelligence, and multi-model AI
              </p>
            </div>

            {/* Configuration Bar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">AI Model:</span>
                    <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as LLMModel)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai-basic">Standard AI (Fast)</SelectItem>
                        <SelectItem value="ai-advanced">Advanced AI (Recommended)</SelectItem>
                        <SelectItem value="ai-standard">Professional AI (Complex Cases)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Complexity:</span>
                    <Select value={complexity} onValueChange={(v) => setComplexity(v as Complexity)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="complex">Complex</SelectItem>
                        <SelectItem value="forensic">Forensic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {ragContext && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        RAG Context Active
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalysisMode)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-7" data-testid="tabs-mode">
                <TabsTrigger value="chronology" className="text-xs">
                  <FileText className="w-4 h-4 mr-1" />
                  Chronology
                </TabsTrigger>
                <TabsTrigger value="bills" className="text-xs">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Bills
                </TabsTrigger>
                <TabsTrigger value="summary" className="text-xs">
                  <FileCheck className="w-4 h-4 mr-1" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="lop" className="text-xs">
                  <Shield className="w-4 h-4 mr-1" />
                  LOP
                </TabsTrigger>
                <TabsTrigger value="pip" className="text-xs">
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  PIP
                </TabsTrigger>
                <TabsTrigger value="attorney" className="text-xs">
                  <Brain className="w-4 h-4 mr-1" />
                  Attorney
                </TabsTrigger>
                <TabsTrigger value="therapist" className="text-xs">
                  <Stethoscope className="w-4 h-4 mr-1" />
                  Therapist
                </TabsTrigger>
              </TabsList>

              {(['chronology', 'bills', 'summary', 'lop', 'pip', 'attorney', 'therapist'] as AnalysisMode[]).map((mode) => {
                const tabInfo = getTabDescription(mode);
                const Icon = tabInfo.icon;
                
                return (
                  <TabsContent key={mode} value={mode}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6 text-blue-600" />
                          <div>
                            <CardTitle data-testid={`heading-${mode}`}>{tabInfo.title}</CardTitle>
                            <CardDescription>{tabInfo.desc}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Input Controls */}
                        <div className="flex flex-wrap gap-2">
                          {/* Voice Recording */}
                          <Button
                            variant={isRecording ? "destructive" : "outline"}
                            size="sm"
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isTranscribing}
                          >
                            {isRecording ? (
                              <>
                                <MicOff className="w-4 h-4 mr-2" />
                                Stop ({formatTime(recordingTime)})
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4 mr-2" />
                                Record Voice
                              </>
                            )}
                          </Button>

                          {/* File Upload */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload File
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Medical Document</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <input
                                  type="file"
                                  accept=".txt,.pdf,.doc,.docx,.json"
                                  onChange={handleFileUpload}
                                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {uploadedFile && (
                                  <p className="text-sm text-green-600">
                                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                    {uploadedFile.name} ready
                                  </p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          {isTranscribing && (
                            <Badge variant="secondary" className="animate-pulse">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Transcribing...
                            </Badge>
                          )}
                        </div>

                        {/* Text Input */}
                        <Textarea
                          placeholder={`Paste medical ${mode === 'bills' ? 'bills' : 'records'} text here, or use voice recording/upload...`}
                          value={documentText[mode]}
                          onChange={(e) => setDocumentText((prev) => ({ ...prev, [mode]: e.target.value }))}
                          className="min-h-[200px] font-mono text-sm"
                          data-testid={`input-${mode}-text`}
                        />

                        {/* Progress Bar */}
                        {analysisProgress > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Analyzing with {selectedModel}...</span>
                              <span>{analysisProgress}%</span>
                            </div>
                            <Progress value={analysisProgress} className="h-2" />
                          </div>
                        )}

                        {/* Analyze Button */}
                        <Button
                          onClick={handleAnalyze}
                          disabled={medicalIntelligenceMutation.isPending || !documentText[mode].trim()}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          data-testid={`button-analyze-${mode}`}
                        >
                          {medicalIntelligenceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyze with {selectedModel}
                        </Button>

                        {/* Results Display */}
                        {results[mode] && (
                          <div className="mt-6 space-y-4">
                            {/* Export Buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button onClick={() => handleExport("pdf")} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                              </Button>
                              <Button onClick={() => handleExport("docx")} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export Word
                              </Button>
                              <Button onClick={() => handleExport("txt")} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export Text
                              </Button>
                              <Button onClick={() => handleExport("json")} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export JSON
                              </Button>
                            </div>

                            {/* Results Content */}
                            <ScrollArea className="h-[400px] rounded-lg border bg-slate-50 dark:bg-slate-800 p-4">
                              <ResultsDisplay mode={mode} data={results[mode]} />
                            </ScrollArea>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

// Results Display Component
function ResultsDisplay({ mode, data }: { mode: AnalysisMode; data: any }) {
  if (!data) return null;

  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="mb-4">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        {title}
      </h4>
      <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 p-3 rounded-lg">
        {content}
      </div>
    </div>
  );

  switch (mode) {
    case 'chronology':
      return (
        <div className="space-y-4">
          {data.timeline && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Treatment Timeline ({data.totalVisits || data.timeline.length} visits)</h3>
              </div>
              {data.timeline.map((item: any, idx: number) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-white dark:bg-slate-700 rounded-r-lg">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {item.date} - {item.provider}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    <span className="font-medium">Diagnosis:</span> {item.diagnosis}
                    {item.diagnosisCodes && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {item.diagnosisCodes.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    <span className="font-medium">Treatment:</span> {item.treatment}
                    {item.procedureCodes && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        CPT: {item.procedureCodes.join(', ')}
                      </span>
                    )}
                  </div>
                  {item.treatmentGaps && item.treatmentGaps.length > 0 && (
                    <div className="mt-2 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Gap in treatment: {item.treatmentGaps.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
          {data.summary && renderSection('Summary', data.summary)}
        </div>
      );

    case 'bills':
      return (
        <div className="space-y-4">
          {data.bills && data.bills.map((bill: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="font-semibold text-slate-900 dark:text-white mb-2">
                {bill.provider} - {bill.serviceDate}
              </div>
              {bill.services && bill.services.map((service: any, sidx: number) => (
                <div key={sidx} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-600 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{service.description}</div>
                    <div className="text-xs text-slate-500">
                      CPT: {service.cptCode} | Unit: {service.units || 1}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${service.charge?.toFixed(2)}</div>
                    <div className="text-xs text-green-600">
                      Paid: ${service.paid?.toFixed(2)} | Bal: ${service.balance?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {data.summary && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Billing Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Charges: <span className="font-bold">${data.summary.totalCharges?.toFixed(2)}</span></div>
                <div>Total Paid: <span className="font-bold text-green-600">${data.summary.totalPaid?.toFixed(2)}</span></div>
                <div>Outstanding: <span className="font-bold text-red-600">${data.summary.totalOutstanding?.toFixed(2)}</span></div>
                <div>Insurance Paid: <span className="font-bold">${data.summary.insurancePaid?.toFixed(2)}</span></div>
              </div>
            </div>
          )}
          {data.unusualCharges && data.unusualCharges.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Unusual Charges Detected
              </h4>
              <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300">
                {data.unusualCharges.map((charge: string, idx: number) => (
                  <li key={idx}>{charge}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case 'lop':
      return (
        <div className="space-y-4">
          {data.lopAnalysis && renderSection('LOP Analysis', (
            <div className="space-y-2">
              <p><strong>Provider:</strong> {data.lopAnalysis.providerName}</p>
              <p><strong>Total LOP Amount:</strong> ${data.lopAnalysis.totalLopAmount?.toFixed(2)}</p>
              <p><strong>Reduction Negotiated:</strong> {data.lopAnalysis.reductionPercentage}%</p>
              <p><strong>Recommended Settlement:</strong> ${data.lopAnalysis.recommendedSettlement?.toFixed(2)}</p>
            </div>
          ))}
          {data.negotiationStrategy && renderSection('Negotiation Strategy', data.negotiationStrategy)}
          {data.reductionOpportunities && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">Reduction Opportunities</h4>
              <ul className="list-disc list-inside text-sm">
                {data.reductionOpportunities.map((opp: string, idx: number) => (
                  <li key={idx}>{opp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case 'pip':
      return (
        <div className="space-y-4">
          {data.pipAnalysis && renderSection('PIP Coverage Analysis', (
            <div className="space-y-2">
              <p><strong>Policy Limit:</strong> ${data.pipAnalysis.policyLimit?.toFixed(2)}</p>
              <p><strong>Used to Date:</strong> ${data.pipAnalysis.usedAmount?.toFixed(2)}</p>
              <p><strong>Remaining:</strong> ${data.pipAnalysis.remainingAmount?.toFixed(2)}</p>
              <p><strong>Exhaustion Date:</strong> {data.pipAnalysis.exhaustionDate || 'N/A'}</p>
            </div>
          ))}
          {data.coveredServices && (
            <div className="grid grid-cols-2 gap-2">
              {data.coveredServices.map((service: any, idx: number) => (
                <div key={idx} className={`p-2 rounded text-sm ${service.covered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {service.name}: {service.covered ? '✓ Covered' : '✗ Not Covered'}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'attorney':
      return (
        <div className="space-y-4">
          {data.caseValue && renderSection('Case Value Assessment', (
            <div>
              <p className="text-2xl font-bold text-blue-600">${data.caseValue.estimatedValue?.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Range: ${data.caseValue.rangeLow?.toLocaleString()} - ${data.caseValue.rangeHigh?.toLocaleString()}</p>
            </div>
          ))}
          {data.strengthsAndWeaknesses && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">Strengths</h4>
                <ul className="list-disc list-inside text-sm">
                  {data.strengthsAndWeaknesses.strengths?.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">Weaknesses</h4>
                <ul className="list-disc list-inside text-sm">
                  {data.strengthsAndWeaknesses.weaknesses?.map((w: string, idx: number) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {data.recommendedStrategy && renderSection('Recommended Strategy', data.recommendedStrategy)}
        </div>
      );

    case 'therapist':
      return (
        <div className="space-y-4">
          {data.treatmentPlan && renderSection('Treatment Plan', data.treatmentPlan)}
          {data.progressNotes && data.progressNotes.map((note: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-slate-700 p-3 rounded-lg border">
              <div className="flex justify-between items-start">
                <span className="font-medium">{note.date}</span>
                <Badge variant={note.progress === 'improving' ? 'default' : 'secondary'}>
                  {note.progress}
                </Badge>
              </div>
              <p className="text-sm mt-2">{note.notes}</p>
              {note.functionalGoals && (
                <div className="mt-2 text-xs text-slate-600">
                  Goals: {note.functionalGoals.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]: [string, any]) => (
            <div key={key} className="bg-white dark:bg-slate-700 p-3 rounded-lg">
              <h4 className="font-semibold capitalize mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </div>
            </div>
          ))}
        </div>
      );
  }
}
