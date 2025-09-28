import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Search, FileText, TrendingUp, Scale, Globe, Info } from "lucide-react";

interface LegalSearchForm {
  query: string;
}

interface RiskAnalysisForm {
  caseType: string;
  description: string;
  jurisdiction: string;
  caseValue: string;
}

interface LawAgentForm {
  question: string;
}

interface WebSearchForm {
  query: string;
}

// Tab metadata for comprehensive tool information
const tabsMetadata = {
  'legal-research': {
    id: 'legal-research',
    title: 'AI Legal Research',
    icon: Search,
    shortDescription: 'Search legal databases',
    description: 'Search through comprehensive U.S. legal databases including case law, statutes, regulations, and Supreme Court decisions.',
    features: [
      'Access to federal and state case law',
      'Comprehensive statute and regulation search',
      'Supreme Court decision database',
      'Relevance scoring and citations',
      'Advanced filtering options'
    ],
    useCases: [
      'Finding relevant case precedents',
      'Researching specific legal topics',
      'Analyzing statutory requirements',
      'Preparing legal briefs'
    ]
  },
  'brief-summarizer': {
    id: 'brief-summarizer',
    title: 'Brief Summarizer',
    icon: FileText,
    shortDescription: 'AI document analysis',
    description: 'Upload legal documents and get AI-powered summaries, key point extraction, and risk analysis.',
    features: [
      'PDF, DOC, and TXT file support',
      'Key point extraction',
      'Party identification',
      'Financial terms analysis',
      'Risk assessment'
    ],
    useCases: [
      'Contract review and analysis',
      'Legal brief summarization',
      'Due diligence document review',
      'Quick document understanding'
    ]
  },
  'risk-analysis': {
    id: 'risk-analysis',
    title: 'Risk Analysis',
    icon: TrendingUp,
    shortDescription: 'Predict case outcomes',
    description: 'Analyze your legal case and get AI-powered predictions on success probability, risk factors, and strategic recommendations.',
    features: [
      'Success probability calculation',
      'Risk factor identification',
      'Settlement range estimation',
      'Strategic recommendations',
      'Precedent analysis'
    ],
    useCases: [
      'Case evaluation and strategy',
      'Settlement negotiations',
      'Litigation risk assessment',
      'Client consultation preparation'
    ]
  },
  'law-agent': {
    id: 'law-agent',
    title: 'Law Agent',
    icon: Scale,
    shortDescription: 'Legal Q&A assistant',
    description: 'Ask any legal question and receive comprehensive answers with proper citations, references, and practical advice.',
    features: [
      'Comprehensive legal knowledge',
      'Proper citations and references',
      'Jurisdiction-specific guidance',
      'Practical legal advice',
      'Related concept suggestions'
    ],
    useCases: [
      'Quick legal research',
      'Understanding legal concepts',
      'Getting jurisdictional guidance',
      'Legal consultation support'
    ]
  },
  'web-search': {
    id: 'web-search',
    title: 'Legal Web Search',
    icon: Globe,
    shortDescription: 'Current legal information',
    description: 'Search the web for current legal information, news, updates, and trends with AI-powered summarization.',
    features: [
      'Real-time legal news search',
      'Current legal developments',
      'AI-generated summaries',
      'Related query suggestions',
      'Source credibility indicators'
    ],
    useCases: [
      'Staying updated on legal changes',
      'Finding recent court decisions',
      'Researching legal trends',
      'Current event legal analysis'
    ]
  }
};

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
  const [lawAgentResults, setLawAgentResults] = useState<any>(null);
  const [webSearchResults, setWebSearchResults] = useState<any>(null);

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

  const lawAgentForm = useForm<LawAgentForm>({
    defaultValues: { question: "" }
  });

  const webSearchForm = useForm<WebSearchForm>({
    defaultValues: { query: "" }
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

  const lawAgentMutation = useMutation({
    mutationFn: async (data: LawAgentForm) => {
      const res = await apiRequest("POST", "/api/law-agent", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setLawAgentResults(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Law agent query failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const webSearchMutation = useMutation({
    mutationFn: async (data: WebSearchForm) => {
      const res = await apiRequest("POST", "/api/web-search", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setWebSearchResults(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Web search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLawAgentQuestion = (data: LawAgentForm) => {
    lawAgentMutation.mutate(data);
  };

  const handleWebSearch = (data: WebSearchForm) => {
    webSearchMutation.mutate(data);
  };

  return (
    <SidebarLayout>
      <div className="p-3 md:p-6">
        {/* Enhanced Tab Navigation with Info Icons */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">AI Legal Research Platform</h1>
            <p className="text-muted-foreground text-sm md:text-base">Choose your AI-powered legal tool</p>
          </div>
          
          <TooltipProvider>
            <div className="border border-border rounded-lg bg-background p-2">
              {/* Mobile: Dropdown-style navigation */}
              <div className="block lg:hidden">
                <Select value={activeTab} onValueChange={(value) => switchTab(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const tab = tabsMetadata[activeTab as keyof typeof tabsMetadata];
                          const IconComponent = tab?.icon;
                          return (
                            <>
                              {IconComponent && <IconComponent className="h-4 w-4" />}
                              <span>{tab?.title}</span>
                            </>
                          );
                        })()}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(tabsMetadata).map((tab) => {
                      const IconComponent = tab.icon;
                      return (
                        <SelectItem key={tab.id} value={tab.id}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{tab.title}</div>
                              <div className="text-xs text-muted-foreground">{tab.shortDescription}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop: Tab-style navigation */}
              <div className="hidden lg:block">
                <nav className="flex flex-wrap gap-1">
                  {Object.values(tabsMetadata).map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <div key={tab.id} className="flex items-center">
                        <button
                          onClick={() => switchTab(tab.id)}
                          className={`flex items-center space-x-2 px-4 py-3 rounded-md font-medium text-sm transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                          data-testid={`tab-${tab.id}`}
                        >
                          <IconComponent className="h-4 w-4" />
                          <span className="hidden xl:inline">{tab.title}</span>
                          <span className="xl:hidden">{tab.title.split(' ')[0]}</span>
                        </button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 ml-1 hover:bg-muted"
                              data-testid={`info-${tab.id}`}
                            >
                              <Info className="h-3 w-3" />
                              <span className="sr-only">Info about {tab.title}</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <IconComponent className="h-5 w-5" />
                                <span>{tab.title}</span>
                              </DialogTitle>
                              <DialogDescription className="text-left">
                                {tab.description}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-sm mb-2">Key Features:</h4>
                                <ul className="space-y-1">
                                  {tab.features.map((feature, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                                      <span className="mr-2 text-primary">•</span>
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm mb-2">Common Use Cases:</h4>
                                <ul className="space-y-1">
                                  {tab.useCases.map((useCase, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                                      <span className="mr-2 text-primary">•</span>
                                      {useCase}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile: Info button for selected tab */}
              <div className="block lg:hidden mt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      data-testid={`info-mobile-${activeTab}`}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Learn about {tabsMetadata[activeTab as keyof typeof tabsMetadata]?.title}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    {(() => {
                      const tab = tabsMetadata[activeTab as keyof typeof tabsMetadata];
                      const IconComponent = tab?.icon;
                      return tab ? (
                        <>
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              {IconComponent && <IconComponent className="h-5 w-5" />}
                              <span>{tab.title}</span>
                            </DialogTitle>
                            <DialogDescription className="text-left">
                              {tab.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Key Features:</h4>
                              <ul className="space-y-1">
                                {tab.features.map((feature, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                                    <span className="mr-2 text-primary">•</span>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2">Common Use Cases:</h4>
                              <ul className="space-y-1">
                                {tab.useCases.map((useCase, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                                    <span className="mr-2 text-primary">•</span>
                                    {useCase}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 md:space-y-6">
          {activeTab === 'legal-research' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Search Form */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>AI Legal Research</span>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Search U.S. statutes, case law, and regulations using AI-powered analysis.
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  
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
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl">Search Results</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Upload Form */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Brief Summarizer</span>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Upload legal documents for AI-powered analysis and summarization.
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  
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
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl">Document Analysis</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Analysis Form */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Risk Analysis</span>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Predict legal success chances based on case details and precedent data.
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  
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
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
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

          {activeTab === 'law-agent' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Law Agent Form */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                    <Scale className="h-5 w-5" />
                    <span>Law Agent</span>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Ask any legal question and get comprehensive answers with references and citations.
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  
                  <Form {...lawAgentForm}>
                    <form onSubmit={lawAgentForm.handleSubmit(handleLawAgentQuestion)} className="space-y-4">
                      <FormField
                        control={lawAgentForm.control}
                        name="question"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Question</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ask any legal question (e.g., 'What are the requirements for a valid contract in New York?')"
                                className="min-h-[120px]"
                                data-testid="input-law-question"
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
                        disabled={lawAgentMutation.isPending}
                        data-testid="button-ask-law-agent"
                      >
                        {lawAgentMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-gavel mr-2"></i>
                            Ask Law Agent
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Law Agent Results */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl">Legal Answer</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {lawAgentResults ? (
                    <div className="space-y-4" data-testid="law-agent-results">
                      <div className="border border-border rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2">Answer</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{lawAgentResults.answer}</p>
                      </div>
                      
                      {lawAgentResults.references && (
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2">References & Citations</h4>
                          <div className="space-y-2">
                            {lawAgentResults.references.map((ref: any, index: number) => (
                              <div key={index} className="border-l-2 border-primary pl-3">
                                <p className="text-sm font-medium text-foreground">{ref.title}</p>
                                <p className="text-xs text-primary">{ref.citation}</p>
                                <p className="text-xs text-muted-foreground mt-1">{ref.summary}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {lawAgentResults.keyPoints && (
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2">Key Legal Points</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {lawAgentResults.keyPoints.map((point: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2 text-primary">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-gavel text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">Ask a legal question to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'web-search' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Web Search Form */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Legal Web Search</span>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Search the web for legal information, cases, and current legal news.
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  
                  <Form {...webSearchForm}>
                    <form onSubmit={webSearchForm.handleSubmit(handleWebSearch)} className="space-y-4">
                      <FormField
                        control={webSearchForm.control}
                        name="query"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Search Query</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your legal search query (e.g., 'latest employment law changes 2024')"
                                data-testid="input-web-search"
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
                        disabled={webSearchMutation.isPending}
                        data-testid="button-web-search"
                      >
                        {webSearchMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Searching...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-globe mr-2"></i>
                            Search Web
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Web Search Results */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl">Search Results</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {webSearchResults ? (
                    <div className="space-y-4" data-testid="web-search-results">
                      <div className="text-sm text-muted-foreground mb-4">
                        Found {webSearchResults.totalResults || 0} results
                      </div>
                      {webSearchResults.results?.map((result: any, index: number) => (
                        <div key={index} className="border border-border rounded-lg p-4" data-testid={`web-result-${index}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-foreground hover:text-primary">
                              <a href={result.url} target="_blank" rel="noopener noreferrer">
                                {result.title}
                              </a>
                            </h4>
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                              {result.domain}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{result.snippet}</p>
                          {result.date && (
                            <p className="text-xs text-muted-foreground">Published: {result.date}</p>
                          )}
                        </div>
                      ))}
                      
                      {webSearchResults.summary && (
                        <div className="border border-primary rounded-lg p-4 bg-primary/5">
                          <h4 className="font-medium text-foreground mb-2">AI Summary</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{webSearchResults.summary}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-globe text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">Enter a search query to find legal information</p>
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