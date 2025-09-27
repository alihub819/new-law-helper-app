import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

interface LegalSearchForm {
  query: string;
}

interface RiskAnalysisForm {
  caseType: string;
  description: string;
  jurisdiction: string;
  caseValue: string;
}

export default function AISearch() {
  const { tab } = useParams<{ tab?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Redirect to default tab if no tab specified
  useEffect(() => {
    if (!tab) {
      setLocation('/ai-search/legal-research');
    }
  }, [tab, setLocation]);
  
  const activeTab = tab || 'legal-research';

  const [searchResults, setSearchResults] = useState<any>(null);
  const [summaryResults, setSummaryResults] = useState<any>(null);
  const [riskResults, setRiskResults] = useState<any>(null);

  const legalSearchForm = useForm<LegalSearchForm>({
    defaultValues: { query: "" }
  });

  const riskAnalysisForm = useForm<RiskAnalysisForm>({
    defaultValues: {
      caseType: "",
      description: "",
      jurisdiction: "",
      caseValue: ""
    }
  });

  const legalSearchMutation = useMutation({
    mutationFn: async (data: LegalSearchForm) => {
      const res = await apiRequest("POST", "/api/legal-search", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const documentSummaryMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/summarize-document", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to summarize document");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setSummaryResults(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Summarization failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const riskAnalysisMutation = useMutation({
    mutationFn: async (data: RiskAnalysisForm) => {
      const res = await apiRequest("POST", "/api/analyze-risk", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setRiskResults(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Risk analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const switchTab = (newTab: string) => {
    setLocation(`/ai-search/${newTab}`);
  };

  const handleLegalSearch = (data: LegalSearchForm) => {
    legalSearchMutation.mutate(data);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    formData.append('document', files[0]);
    formData.append('summaryType', 'detailed');
    
    documentSummaryMutation.mutate(formData);
  };

  const handleRiskAnalysis = (data: RiskAnalysisForm) => {
    riskAnalysisMutation.mutate(data);
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => switchTab('legal-research')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'legal-research'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
                data-testid="tab-legal-research"
              >
                <i className="fas fa-search mr-2"></i>
                AI Legal Research
              </button>
              
              <button
                onClick={() => switchTab('brief-summarizer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'brief-summarizer'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
                data-testid="tab-brief-summarizer"
              >
                <i className="fas fa-file-text mr-2"></i>
                Brief Summarizer
              </button>
              
              <button
                onClick={() => switchTab('risk-analysis')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'risk-analysis'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
                data-testid="tab-risk-analysis"
              >
                <i className="fas fa-chart-line mr-2"></i>
                Risk Analysis
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'legal-research' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Search Form */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">AI Legal Research</h2>
                  <p className="text-muted-foreground mb-6">
                    Search U.S. statutes, case law, and regulations using AI-powered analysis.
                  </p>
                  
                  <Form {...legalSearchForm}>
                    <form onSubmit={legalSearchForm.handleSubmit(handleLegalSearch)} className="space-y-4">
                      <FormField
                        control={legalSearchForm.control}
                        name="query"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Query</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your legal research question (e.g., 'contract breach remedies in California')"
                                className="min-h-[100px]"
                                data-testid="input-legal-query"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={legalSearchMutation.isPending}
                        data-testid="button-search"
                      >
                        {legalSearchMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Searching...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-search mr-2"></i>
                            Search Legal Database
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Search Results */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Search Results</h3>
                  {searchResults ? (
                    <div className="space-y-4" data-testid="search-results">
                      <div className="text-sm text-muted-foreground mb-4">
                        Found {searchResults.totalResults || 0} results in {searchResults.searchTime || "0"} seconds
                      </div>
                      {searchResults.results?.map((result: any, index: number) => (
                        <div key={index} className="border border-border rounded-lg p-4" data-testid={`result-${index}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-foreground">{result.title}</h4>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {result.relevance}% match
                            </span>
                          </div>
                          <p className="text-sm text-primary mb-2">{result.type} • {result.citation}</p>
                          <p className="text-sm text-muted-foreground mb-3">{result.summary}</p>
                          {result.keyPoints && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-foreground mb-1">Key Points:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {result.keyPoints.map((point: string, i: number) => (
                                  <li key={i} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.url && (
                            <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                              <i className="fas fa-external-link-alt mr-1"></i>
                              View Full Document
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">Enter a legal query to start searching</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'brief-summarizer' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upload Form */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Brief Summarizer</h2>
                  <p className="text-muted-foreground mb-6">
                    Upload legal documents for AI-powered analysis and summarization.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Upload Document</Label>
                      <FileUpload
                        onFileChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt"
                        data-testid="file-upload"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported formats: PDF, DOC, DOCX, TXT (Max 50MB)
                      </p>
                    </div>

                    <div className="text-center">
                      {documentSummaryMutation.isPending && (
                        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Analyzing document...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Results */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Document Analysis</h3>
                  {summaryResults ? (
                    <div className="space-y-4" data-testid="summary-results">
                      <div className="border border-border rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2">Document Type</h4>
                        <p className="text-sm text-muted-foreground">{summaryResults.documentType}</p>
                      </div>
                      
                      <div className="border border-border rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2">Summary</h4>
                        <p className="text-sm text-muted-foreground">{summaryResults.summary}</p>
                      </div>
                      
                      {summaryResults.keyPoints && (
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2">Key Points</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {summaryResults.keyPoints.map((point: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2 text-primary">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {summaryResults.legalImplications && (
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2">Legal Implications</h4>
                          <div className="space-y-2">
                            {summaryResults.legalImplications.map((implication: any, index: number) => (
                              <div key={index} className="flex items-start space-x-2">
                                <span className={`inline-block w-2 h-2 rounded-full mt-2 ${
                                  implication.severity === 'high' ? 'bg-red-500' :
                                  implication.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}></span>
                                <div>
                                  <p className="text-sm font-medium text-foreground capitalize">{implication.type}</p>
                                  <p className="text-sm text-muted-foreground">{implication.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-file-text text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">Upload a document to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'risk-analysis' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Analysis Form */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Risk Analysis</h2>
                  <p className="text-muted-foreground mb-6">
                    Predict legal success chances based on case details and precedent data.
                  </p>
                  
                  <Form {...riskAnalysisForm}>
                    <form onSubmit={riskAnalysisForm.handleSubmit(handleRiskAnalysis)} className="space-y-4">
                      <FormField
                        control={riskAnalysisForm.control}
                        name="caseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-case-type">
                                  <SelectValue placeholder="Select case type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="contract">Contract Dispute</SelectItem>
                                <SelectItem value="personal-injury">Personal Injury</SelectItem>
                                <SelectItem value="employment">Employment Law</SelectItem>
                                <SelectItem value="intellectual-property">Intellectual Property</SelectItem>
                                <SelectItem value="real-estate">Real Estate</SelectItem>
                                <SelectItem value="family">Family Law</SelectItem>
                                <SelectItem value="criminal">Criminal Defense</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={riskAnalysisForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the key facts and legal issues of your case"
                                className="min-h-[120px]"
                                data-testid="input-case-description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={riskAnalysisForm.control}
                        name="jurisdiction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jurisdiction</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., California, Federal, New York"
                                data-testid="input-jurisdiction"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={riskAnalysisForm.control}
                        name="caseValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Value (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., $50,000, $1M+"
                                data-testid="input-case-value"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={riskAnalysisMutation.isPending}
                        data-testid="button-analyze"
                      >
                        {riskAnalysisMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-chart-line mr-2"></i>
                            Analyze Risk
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
                  {riskResults ? (
                    <div className="space-y-4" data-testid="risk-results">
                      {/* Success Probability */}
                      <div className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-foreground">Success Probability</h4>
                          <span className="text-2xl font-bold text-primary">{riskResults.successProbability}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${riskResults.successProbability}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Confidence: {riskResults.confidenceLevel}%
                        </p>
                      </div>

                      {/* Risk Factors */}
                      {riskResults.riskFactors && (
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2">Risk Factors</h4>
                          <div className="space-y-2">
                            {riskResults.riskFactors.map((factor: any, index: number) => (
                              <div key={index} className="flex items-start space-x-2">
                                <span className={`inline-block w-2 h-2 rounded-full mt-2 ${
                                  factor.severity === 'high' ? 'bg-red-500' :
                                  factor.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}></span>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{factor.factor}</p>
                                  <p className="text-sm text-muted-foreground">{factor.impact}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {riskResults.recommendations && (
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2">Recommendations</h4>
                          <div className="space-y-3">
                            {riskResults.recommendations.immediate && (
                              <div>
                                <p className="text-sm font-medium text-foreground mb-1">Immediate Actions:</p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {riskResults.recommendations.immediate.map((action: string, index: number) => (
                                    <li key={index} className="flex items-start">
                                      <span className="mr-2 text-primary">•</span>
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {riskResults.recommendations.longterm && (
                              <div>
                                <p className="text-sm font-medium text-foreground mb-1">Long-term Strategy:</p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {riskResults.recommendations.longterm.map((strategy: string, index: number) => (
                                    <li key={index} className="flex items-start">
                                      <span className="mr-2 text-primary">•</span>
                                      <span>{strategy}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Settlement Range */}
                      {riskResults.settlementRange && (
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2">Settlement Estimate</h4>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-xs text-muted-foreground">Low</p>
                              <p className="font-medium">{riskResults.settlementRange.low}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Recommended</p>
                              <p className="font-medium text-primary">{riskResults.settlementRange.recommended}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">High</p>
                              <p className="font-medium">{riskResults.settlementRange.high}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">Enter case details to get risk analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}