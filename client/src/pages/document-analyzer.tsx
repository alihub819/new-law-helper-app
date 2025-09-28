import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, AlertCircle, CheckCircle, TrendingUp, AlertTriangle, Lightbulb, Star, Scale, Wand2, Copy, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DocumentAnalysis {
  documentTitle: string;
  documentType: string;
  overallQuality: {
    score: number;
    grade: string;
    summary: string;
  };
  strongPoints: Array<{
    point: string;
    explanation: string;
    category: string;
  }>;
  weakPoints: Array<{
    point: string;
    explanation: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  improvements: Array<{
    area: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  legalInsights: Array<{
    insight: string;
    type: 'compliance' | 'risk' | 'best-practice' | 'warning';
    explanation: string;
  }>;
  recommendations: string[];
}

// Format document content to preserve formatting
const formatDocumentContent = (content: string): string => {
  if (!content) return '';
  
  // Split content into lines and preserve formatting
  const lines = content.split('\n');
  let formattedContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines at the beginning
    if (!line && formattedContent === '') continue;
    
    // Handle different types of content
    if (line.startsWith('[Document:') && line.endsWith(']')) {
      // Document header - skip or style differently
      continue;
    } else if (line.match(/^[A-Z][A-Z\s]+$/)) {
      // All caps lines (likely headers)
      formattedContent += `<h3 style="font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase; font-size: 16px;">${line}</h3>`;
    } else if (line.match(/^[A-Z][a-zA-Z\s]+:$/) || line.match(/^\d+\./)) {
      // Section headers or numbered items
      formattedContent += `<h4 style="font-weight: bold; margin: 15px 0 8px 0; font-size: 15px;">${line}</h4>`;
    } else if (line.startsWith('Dear ') || line.startsWith('To:') || line.startsWith('From:') || line.startsWith('Date:') || line.startsWith('Subject:')) {
      // Letter headers
      formattedContent += `<p style="margin: 8px 0; font-weight: ${line.startsWith('Dear') ? 'normal' : 'bold'};">${line}</p>`;
    } else if (line.match(/^\s*[-•]\s/)) {
      // Bullet points
      formattedContent += `<p style="margin: 5px 0 5px 20px;">${line}</p>`;
    } else if (line.length > 0) {
      // Regular paragraphs
      formattedContent += `<p style="margin: 12px 0; text-align: justify;">${line}</p>`;
    } else {
      // Empty lines for spacing
      formattedContent += '<br/>';
    }
  }
  
  return formattedContent || content.replace(/\n/g, '<br/>');
};

export default function DocumentAnalyzer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Improvement modal state
  const [improvementModal, setImprovementModal] = useState<{
    isOpen: boolean;
    type: 'weak-point' | 'improvement' | null;
    item: any;
    suggestion: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: null,
    item: null,
    suggestion: '',
    isLoading: false
  });

  // Document improvement mutation
  const improvementMutation = useMutation({
    mutationFn: async ({ type, item, documentContent }: { type: string; item: any; documentContent: string }) => {
      const res = await fetch("/api/improve-document-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          item,
          documentContent
        }),
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate improvement");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      setImprovementModal(prev => ({
        ...prev,
        suggestion: data.improvedText,
        isLoading: false
      }));
      toast({
        title: "Improvement generated",
        description: "AI has generated an improved version of this section.",
      });
    },
    onError: (error: Error) => {
      setImprovementModal(prev => ({
        ...prev,
        isLoading: false
      }));
      toast({
        title: "Failed to generate improvement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const res = await fetch("/api/analyze-document", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setDocumentContent(data.content);
      setAnalysis(data.analysis);
      setIsAnalyzing(false);
      toast({
        title: "Document analyzed successfully",
        description: "Your document has been analyzed by our AI legal expert.",
      });
    },
    onError: (error: Error) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'text/plain', // .txt
        'application/pdf' // .pdf
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a Word document (.doc, .docx), PDF, or text file.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      setIsAnalyzing(true);
      uploadMutation.mutate(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setDocumentContent('');
    setAnalysis(null);
    setIsAnalyzing(false);
    setImprovementModal({
      isOpen: false,
      type: null,
      item: null,
      suggestion: '',
      isLoading: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImproveItem = (type: 'weak-point' | 'improvement', item: any) => {
    setImprovementModal({
      isOpen: true,
      type,
      item,
      suggestion: '',
      isLoading: true
    });
    
    improvementMutation.mutate({
      type,
      item,
      documentContent
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The improved text has been copied to your clipboard.",
    });
  };

  const closeImprovementModal = () => {
    setImprovementModal({
      isOpen: false,
      type: null,
      item: null,
      suggestion: '',
      isLoading: false
    });
  };


  const getQualityColor = (score: number) => {
    if (score >= 85) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return "border-l-red-500 bg-red-50";
      case 'medium': return "border-l-yellow-500 bg-yellow-50";
      case 'low': return "border-l-blue-500 bg-blue-50";
      default: return "border-l-gray-500 bg-gray-50";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge variant="secondary">Medium Priority</Badge>;
      case 'low': return <Badge variant="outline">Low Priority</Badge>;
      default: return <Badge variant="outline">Standard</Badge>;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'best-practice': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Document Analyzer</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Upload documents for AI-powered legal analysis and review
              </p>
            </div>
            {(uploadedFile || analysis) && (
              <Button variant="outline" onClick={resetAnalysis} data-testid="button-reset-analysis">
                New Analysis
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden">
          {!uploadedFile && !isAnalyzing && !analysis ? (
            /* Upload Interface */
            <div className="h-full flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6" />
                    Upload Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={handleUploadClick}
                    data-testid="upload-zone"
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Upload Document</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click here or drag and drop your document
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: .doc, .docx, .pdf, .txt (Max 10MB)
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".doc,.docx,.pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="file-input"
                  />
                  
                  <Button 
                    onClick={handleUploadClick}
                    className="w-full"
                    data-testid="button-upload"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : isAnalyzing ? (
            /* Loading State */
            <div className="h-full flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                  <h3 className="text-lg font-medium">Analyzing Document</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI is analyzing "{uploadedFile?.name}" for legal insights...
                  </p>
                  <Progress value={undefined} className="w-full" />
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Split Screen Analysis View */
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Document Content */}
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Content
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFile?.name} ({Math.round((uploadedFile?.size || 0) / 1024)} KB)
                  </p>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <div 
                    className="h-full overflow-auto bg-white p-6 rounded-lg border shadow-sm"
                    style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                    data-testid="document-content"
                  >
                    {documentContent ? (
                      <div className="document-preview">
                        <div className="mb-4 pb-2 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {uploadedFile?.name || "Document Preview"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {uploadedFile?.type} • {Math.round((uploadedFile?.size || 0) / 1024)} KB
                          </p>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none leading-relaxed text-gray-900"
                          style={{
                            fontSize: '14px',
                            lineHeight: '1.6',
                            fontFamily: 'Times, "Times New Roman", serif'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: formatDocumentContent(documentContent)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>Document content will appear here...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Side - AI Analysis */}
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI Legal Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto space-y-6">
                  {analysis && (
                    <>
                      {/* Overall Quality Assessment */}
                      <div className={`p-4 rounded-lg border ${getQualityColor(analysis.overallQuality.score)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Overall Quality Assessment</h3>
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {analysis.overallQuality.grade}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">Score:</span>
                            <span className="text-lg font-bold">{analysis.overallQuality.score}/100</span>
                          </div>
                          <Progress value={analysis.overallQuality.score} className="w-full" />
                        </div>
                        <p className="text-sm">{analysis.overallQuality.summary}</p>
                      </div>

                      {/* Strong Points */}
                      <div>
                        <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Strong Points ({analysis.strongPoints.length})
                        </h3>
                        <div className="space-y-3">
                          {analysis.strongPoints.map((point, index) => (
                            <div key={index} className="border-l-4 border-l-green-500 bg-green-50 p-3 rounded-r-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Star className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-800">{point.point}</span>
                                <Badge variant="outline" className="text-xs">{point.category}</Badge>
                              </div>
                              <p className="text-sm text-green-700 ml-6">{point.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Weak Points */}
                      <div>
                        <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Areas of Concern ({analysis.weakPoints.length})
                        </h3>
                        <div className="space-y-3">
                          {analysis.weakPoints.map((point, index) => (
                            <div key={index} className={`border-l-4 p-3 rounded-r-lg ${getSeverityColor(point.severity)}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-800">{point.point}</span>
                                <Badge variant="outline" className="text-xs">{point.category}</Badge>
                                {getPriorityBadge(point.severity)}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-auto h-6 px-2 text-xs"
                                  onClick={() => handleImproveItem('weak-point', point)}
                                  data-testid={`button-improve-weak-${index}`}
                                >
                                  <Wand2 className="h-3 w-3 mr-1" />
                                  Fix This
                                </Button>
                              </div>
                              <p className="text-sm text-red-700 ml-6">{point.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Improvement Suggestions */}
                      <div>
                        <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Improvement Suggestions ({analysis.improvements.length})
                        </h3>
                        <div className="space-y-3">
                          {analysis.improvements.map((improvement, index) => (
                            <div key={index} className="border-l-4 border-l-blue-500 bg-blue-50 p-3 rounded-r-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-800">{improvement.area}</span>
                                {getPriorityBadge(improvement.priority)}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-auto h-6 px-2 text-xs bg-white"
                                  onClick={() => handleImproveItem('improvement', improvement)}
                                  data-testid={`button-improve-suggestion-${index}`}
                                >
                                  <Wand2 className="h-3 w-3 mr-1" />
                                  Show Example
                                </Button>
                              </div>
                              <p className="text-sm text-blue-700 ml-6">{improvement.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Legal Insights */}
                      <div>
                        <h3 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                          <Scale className="h-5 w-5" />
                          Legal Professional Insights ({analysis.legalInsights.length})
                        </h3>
                        <div className="space-y-3">
                          {analysis.legalInsights.map((insight, index) => (
                            <div key={index} className="border border-purple-200 bg-purple-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                {getInsightIcon(insight.type)}
                                <span className="font-medium text-purple-800 capitalize">{insight.type.replace('-', ' ')}</span>
                              </div>
                              <p className="text-sm text-purple-900 mb-2 font-medium">{insight.insight}</p>
                              <p className="text-sm text-purple-700">{insight.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {analysis.recommendations.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-semibold text-gray-700 mb-3">Final Recommendations</h3>
                            <ul className="space-y-2">
                              {analysis.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Improvement Modal */}
        <Dialog open={improvementModal.isOpen} onOpenChange={closeImprovementModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Document Improvement
              </DialogTitle>
              <DialogDescription>
                {improvementModal.type === 'weak-point' 
                  ? `AI-generated improvement for: "${improvementModal.item?.point}"`
                  : `AI example for: "${improvementModal.item?.area}"`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {improvementModal.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Generating improvement...</span>
                </div>
              ) : improvementModal.suggestion ? (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Original Issue:
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {improvementModal.item?.explanation || improvementModal.item?.suggestion}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        AI Improved Version:
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(improvementModal.suggestion)}
                        data-testid="button-copy-improvement"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      value={improvementModal.suggestion}
                      readOnly
                      className="min-h-[200px] resize-none bg-white border-green-300"
                      data-testid="textarea-improvement"
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>How to use:</strong> Copy the improved text above and replace the corresponding section in your document. 
                      Review and modify as needed to match your specific requirements.
                    </p>
                  </div>
                </div>
              ) : null}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeImprovementModal} data-testid="button-close-improvement">
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}