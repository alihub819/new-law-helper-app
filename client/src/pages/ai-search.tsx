import { useState } from "react";
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
  const activeTab = tab || 'legal-research';
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-back"
              >
                <i className="fas fa-arrow-left"></i>
              </Button>
              <i className="fas fa-balance-scale text-2xl text-primary"></i>
              <h1 className="text-xl font-semibold text-foreground">LawHub</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-muted-foreground hover:text-foreground" data-testid="button-notifications">
                <i className="fas fa-bell text-lg"></i>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium" data-testid="text-user-initials">
                    {user?.name ? getInitials(user.name) : "U"}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground" data-testid="text-username">
                  {user?.name || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">AI-Powered Legal Research</h2>
          <p className="text-muted-foreground">Advanced legal research and analysis tools powered by artificial intelligence</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              <Button
                variant="ghost"
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === 'legal-research' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
                onClick={() => switchTab('legal-research')}
                data-testid="tab-legal-research"
              >
                <i className="fas fa-search mr-2"></i>
                AI Legal Research
              </Button>
              <Button
                variant="ghost"
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === 'brief-summarizer' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
                onClick={() => switchTab('brief-summarizer')}
                data-testid="tab-brief-summarizer"
              >
                <i className="fas fa-file-text mr-2"></i>
                Brief Summarizer
              </Button>
              <Button
                variant="ghost"
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === 'risk-analysis' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
                onClick={() => switchTab('risk-analysis')}
                data-testid="tab-risk-analysis"
              >
                <i className="fas fa-chart-line mr-2"></i>
                Risk Analysis
              </Button>
            </nav>
          </div>
        </div>

        {/* AI Legal Research Tab */}
        {activeTab === 'legal-research' && (
          <div className="space-y-8">
            <Card>
              <CardContent className="p-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Search Legal Database</h3>
                    <p className="text-muted-foreground">Search U.S. statutes, case law, and regulations using natural language or legal citations</p>
                  </div>

                  <Form {...legalSearchForm}>
                    <form onSubmit={legalSearchForm.handleSubmit(handleLegalSearch)} className="space-y-6">
                      <FormField
                        control={legalSearchForm.control}
                        name="query"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <i className="fas fa-search text-muted-foreground"></i>
                                </div>
                                <Input 
                                  className="w-full pl-10 pr-4 py-4 text-lg"
                                  placeholder="e.g., 'What are the elements of negligence in tort law?' or 'USC Title 15 Section 1'"
                                  data-testid="input-legal-search"
                                  {...field} 
                                />
                                <Button 
                                  type="submit"
                                  className="absolute inset-y-0 right-0 mr-2 my-1"
                                  disabled={legalSearchMutation.isPending}
                                  data-testid="button-search"
                                >
                                  {legalSearchMutation.isPending ? "Searching..." : "Search"}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>

                  {/* Search Filters */}
                  <div className="flex flex-wrap gap-2 mt-6">
                    <Button variant="secondary" size="sm" className="text-sm">
                      Case Law
                    </Button>
                    <Button variant="outline" size="sm" className="text-sm">
                      Federal Statutes
                    </Button>
                    <Button variant="outline" size="sm" className="text-sm">
                      State Laws
                    </Button>
                    <Button variant="outline" size="sm" className="text-sm">
                      Regulations
                    </Button>
                    <Button variant="outline" size="sm" className="text-sm">
                      Supreme Court
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults && (
              <div className="space-y-6">
                {searchResults.results?.map((result: any, index: number) => (
                  <Card key={index} data-testid={`search-result-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-1">{result.title}</h4>
                          <p className="text-sm text-muted-foreground">{result.type} • {result.citation}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {result.relevance}% Relevance
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{result.summary}</p>
                      <div className="flex items-center space-x-4">
                        <Button variant="link" size="sm" className="text-primary hover:underline p-0">
                          <i className="fas fa-external-link-alt mr-1"></i>
                          View Full Case
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-0">
                          <i className="fas fa-bookmark mr-1"></i>
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brief Summarizer Tab */}
        {activeTab === 'brief-summarizer' && (
          <div className="space-y-8">
            <Card>
              <CardContent className="p-8">
                <div className="max-w-4xl mx-auto text-center">
                  <h3 className="text-2xl font-semibold text-foreground mb-2">Document Summarizer</h3>
                  <p className="text-muted-foreground mb-8">Upload legal documents and get AI-generated summaries with key points and legal implications</p>

                  <FileUpload
                    onFileChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                    multiple={false}
                    disabled={documentSummaryMutation.isPending}
                    className="mb-6"
                    data-testid="file-upload-document"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border border-border">
                      <CardContent className="p-4 text-center">
                        <i className="fas fa-bolt text-primary text-xl mb-2"></i>
                        <h5 className="font-medium text-foreground mb-1">Quick Summary</h5>
                        <p className="text-sm text-muted-foreground">Key points and main arguments</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-border">
                      <CardContent className="p-4 text-center">
                        <i className="fas fa-list text-primary text-xl mb-2"></i>
                        <h5 className="font-medium text-foreground mb-1">Detailed Analysis</h5>
                        <p className="text-sm text-muted-foreground">Comprehensive breakdown with citations</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-border">
                      <CardContent className="p-4 text-center">
                        <i className="fas fa-gavel text-primary text-xl mb-2"></i>
                        <h5 className="font-medium text-foreground mb-1">Legal Implications</h5>
                        <p className="text-sm text-muted-foreground">Precedent analysis and risks</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Results */}
            {summaryResults && (
              <Card data-testid="summary-results">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-foreground mb-2">Document Summary</h4>
                    <p className="text-sm text-muted-foreground">{summaryResults.documentType} • Processed just now</p>
                  </div>

                  <div className="space-y-6">
                    {summaryResults.keyPoints && (
                      <div>
                        <h5 className="font-medium text-foreground mb-2">Key Points</h5>
                        <ul className="space-y-2 text-muted-foreground">
                          {summaryResults.keyPoints.map((point: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summaryResults.legalImplications && summaryResults.legalImplications.length > 0 && (
                      <div>
                        <h5 className="font-medium text-foreground mb-2">Legal Implications</h5>
                        {summaryResults.legalImplications.map((implication: any, index: number) => (
                          <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
                            <p className="text-amber-800 text-sm">
                              ⚠️ {implication.type.toUpperCase()}: {implication.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <Button className="flex items-center gap-2" data-testid="button-download-summary">
                        <i className="fas fa-download"></i>
                        Download Summary
                      </Button>
                      <Button variant="ghost" className="flex items-center gap-1" data-testid="button-save-summary">
                        <i className="fas fa-bookmark"></i>
                        Save to Library
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Risk Analysis Tab */}
        {activeTab === 'risk-analysis' && (
          <div className="space-y-8">
            <Card>
              <CardContent className="p-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Legal Risk Analysis</h3>
                    <p className="text-muted-foreground">Predict success probability and identify potential risks based on historical case data and precedents</p>
                  </div>

                  <Form {...riskAnalysisForm}>
                    <form onSubmit={riskAnalysisForm.handleSubmit(handleRiskAnalysis)} className="space-y-6">
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
                                <SelectItem value="contract-dispute">Contract Dispute</SelectItem>
                                <SelectItem value="personal-injury">Personal Injury</SelectItem>
                                <SelectItem value="employment-law">Employment Law</SelectItem>
                                <SelectItem value="intellectual-property">Intellectual Property</SelectItem>
                                <SelectItem value="corporate-law">Corporate Law</SelectItem>
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
                                className="h-32"
                                placeholder="Describe your case, including key facts, parties involved, and legal issues..."
                                data-testid="textarea-case-description"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={riskAnalysisForm.control}
                          name="jurisdiction"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jurisdiction</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-jurisdiction">
                                    <SelectValue placeholder="Select jurisdiction" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="federal">Federal Court</SelectItem>
                                  <SelectItem value="california">California</SelectItem>
                                  <SelectItem value="new-york">New York</SelectItem>
                                  <SelectItem value="texas">Texas</SelectItem>
                                  <SelectItem value="florida">Florida</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={riskAnalysisForm.control}
                          name="caseValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Case Value</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., $100,000"
                                  data-testid="input-case-value"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full flex items-center gap-2" 
                        disabled={riskAnalysisMutation.isPending}
                        data-testid="button-analyze-risk"
                      >
                        <i className="fas fa-chart-line"></i>
                        {riskAnalysisMutation.isPending ? "Analyzing..." : "Analyze Risk"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>

            {/* Risk Analysis Results */}
            {riskResults && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Success Probability */}
                <Card data-testid="success-probability">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Success Probability</h4>
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-green-600 mb-2">{riskResults.successProbability}%</div>
                      <p className="text-muted-foreground">Chance of favorable outcome</p>
                    </div>

                    {riskResults.precedentAnalysis && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">Similar Cases Won</span>
                            <span className="text-muted-foreground">
                              {Math.round(riskResults.precedentAnalysis.similarCases * riskResults.precedentAnalysis.successRate / 100)}/{riskResults.precedentAnalysis.similarCases}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${riskResults.successProbability}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">Jurisdiction Success Rate</span>
                            <span className="text-muted-foreground">{riskResults.precedentAnalysis.successRate}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${riskResults.precedentAnalysis.successRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                <Card data-testid="risk-factors">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Risk Factors</h4>
                    
                    <div className="space-y-4">
                      {riskResults.riskFactors?.map((risk: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            risk.severity === 'high' ? 'bg-red-500' :
                            risk.severity === 'medium' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-foreground capitalize">{risk.severity}</p>
                            <p className="text-sm text-muted-foreground">{risk.factor}</p>
                          </div>
                        </div>
                      ))}

                      {riskResults.strengths && (
                        <div className="mt-6">
                          <p className="font-medium text-foreground mb-2">Strengths</p>
                          {riskResults.strengths.map((strength: string, index: number) => (
                            <div key={index} className="flex items-start space-x-3 mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                              <p className="text-sm text-muted-foreground">{strength}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="lg:col-span-2" data-testid="recommendations">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Recommendations</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {riskResults.recommendations && (
                        <div>
                          <h5 className="font-medium text-foreground mb-2">Strengthen Your Case</h5>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {riskResults.recommendations.immediate?.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {riskResults.settlementRange && (
                        <div>
                          <h5 className="font-medium text-foreground mb-2">Settlement Considerations</h5>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800 text-sm">
                              💡 Consider settlement between {riskResults.settlementRange.low} - {riskResults.settlementRange.high} based on similar case outcomes
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
