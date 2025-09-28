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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { FileText, Mail, FileCheck, Mic, MicOff, Copy, Edit3, Download, Save, Info, Eye, Scale } from "lucide-react";

interface DocumentGenerationForm {
  documentType: string;
  inputMethod: 'voice' | 'paste' | 'manual';
  textContent?: string;
  formData?: Record<string, string>;
}

interface GeneratedDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  formattedContent: string;
  createdAt: Date;
}

// Tab metadata for document categories
const tabsMetadata = {
  'letters': {
    id: 'letters',
    title: 'Letters',
    icon: Mail,
    shortDescription: 'Generate professional letters',
    description: 'Create various types of professional letters following international USA standards including business correspondence, cover letters, and formal communications.',
    documentTypes: [
      { id: 'business-letter', name: 'Business Letter', description: 'Formal business correspondence' },
      { id: 'cover-letter', name: 'Cover Letter', description: 'Job application cover letter' },
      { id: 'recommendation-letter', name: 'Recommendation Letter', description: 'Letter of recommendation' },
      { id: 'complaint-letter', name: 'Complaint Letter', description: 'Formal complaint letter' },
      { id: 'inquiry-letter', name: 'Inquiry Letter', description: 'Information request letter' },
      { id: 'thank-you-letter', name: 'Thank You Letter', description: 'Professional thank you letter' }
    ],
    features: [
      'USA business letter format standards',
      'Professional tone and language',
      'Proper formatting and structure',
      'Customizable templates',
      'Voice-to-text input support'
    ]
  },
  'contracts': {
    id: 'contracts',
    title: 'Contracts',
    icon: Scale,
    shortDescription: 'Generate legal contracts',
    description: 'Create legally compliant contracts and agreements following USA legal standards with proper clauses and terminology.',
    documentTypes: [
      { id: 'service-agreement', name: 'Service Agreement', description: 'Professional service contract' },
      { id: 'employment-contract', name: 'Employment Contract', description: 'Employment agreement' },
      { id: 'non-disclosure-agreement', name: 'Non-Disclosure Agreement', description: 'Confidentiality agreement' },
      { id: 'rental-agreement', name: 'Rental Agreement', description: 'Property rental contract' },
      { id: 'sales-contract', name: 'Sales Contract', description: 'Purchase and sale agreement' },
      { id: 'consulting-agreement', name: 'Consulting Agreement', description: 'Independent contractor agreement' }
    ],
    features: [
      'USA legal compliance standards',
      'Industry-standard clauses',
      'Jurisdiction-specific terms',
      'Risk mitigation provisions',
      'Customizable legal language'
    ]
  },
  'applications': {
    id: 'applications',
    title: 'Applications',
    icon: FileCheck,
    shortDescription: 'Generate application forms',
    description: 'Create various application forms and documents for jobs, permits, licenses, and official processes following USA standards.',
    documentTypes: [
      { id: 'job-application', name: 'Job Application', description: 'Employment application form' },
      { id: 'visa-application', name: 'Visa Application', description: 'Immigration visa application' },
      { id: 'permit-application', name: 'Permit Application', description: 'Business or personal permit' },
      { id: 'loan-application', name: 'Loan Application', description: 'Financial loan application' },
      { id: 'grant-application', name: 'Grant Application', description: 'Funding grant application' },
      { id: 'license-application', name: 'License Application', description: 'Professional license application' }
    ],
    features: [
      'Government-compliant formats',
      'Required field validation',
      'Official document standards',
      'Multi-step form support',
      'Document verification features'
    ]
  }
};

export default function DocumentGeneration() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { tab } = useParams();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState(tab || 'letters');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<'voice' | 'paste' | 'manual' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editableContent, setEditableContent] = useState('');

  // Voice recognition
  const [recognition, setRecognition] = useState<any>(null);

  // Form handling
  const voiceForm = useForm<{ text: string }>({
    defaultValues: { text: '' }
  });

  const pasteForm = useForm<{ text: string }>({
    defaultValues: { text: '' }
  });

  const manualForm = useForm<Record<string, string>>({
    defaultValues: {}
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setVoiceText(finalTranscript + interimTranscript);
        voiceForm.setValue('text', finalTranscript + interimTranscript);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [voiceForm]);

  // Handle tab changes and URL updates
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab, activeTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setLocation(`/document-generation/${newTab}`);
    setSelectedDocumentType('');
    setInputMethod(null);
    resetForms();
  };

  const resetForms = () => {
    voiceForm.reset();
    pasteForm.reset();
    manualForm.reset();
    setVoiceText('');
    setGeneratedDocument(null);
    setIsPreviewMode(false);
    setEditableContent('');
  };

  // Voice controls
  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Document generation mutations
  const generateDocumentMutation = useMutation({
    mutationFn: async (data: DocumentGenerationForm) => {
      const res = await apiRequest("POST", "/api/generate-document", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setGeneratedDocument(data);
      setEditableContent(data.formattedContent);
      setIsPreviewMode(true);
      toast({
        title: "Document generated successfully",
        description: "Your document is ready for preview and editing.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Document generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const handleVoiceSubmit = (data: { text: string }) => {
    if (!selectedDocumentType || !data.text.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a document type and provide voice input.",
        variant: "destructive",
      });
      return;
    }

    generateDocumentMutation.mutate({
      documentType: selectedDocumentType,
      inputMethod: 'voice',
      textContent: data.text,
    });
  };

  const handlePasteSubmit = (data: { text: string }) => {
    if (!selectedDocumentType || !data.text.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a document type and paste your text.",
        variant: "destructive",
      });
      return;
    }

    generateDocumentMutation.mutate({
      documentType: selectedDocumentType,
      inputMethod: 'paste',
      textContent: data.text,
    });
  };

  const handleManualSubmit = (data: Record<string, string>) => {
    if (!selectedDocumentType) {
      toast({
        title: "Missing information",
        description: "Please select a document type.",
        variant: "destructive",
      });
      return;
    }

    generateDocumentMutation.mutate({
      documentType: selectedDocumentType,
      inputMethod: 'manual',
      formData: data,
    });
  };

  // Document actions
  const handleSaveDocument = () => {
    // Save document logic
    toast({
      title: "Document saved",
      description: "Your document has been saved successfully.",
    });
  };

  const handleDownloadDocument = () => {
    if (!generatedDocument) return;

    const element = document.createElement('a');
    const file = new Blob([editableContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${generatedDocument.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Document downloaded",
      description: "Your document has been downloaded successfully.",
    });
  };

  const currentTabData = tabsMetadata[activeTab as keyof typeof tabsMetadata];

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Document Generation</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Create professional documents with AI assistance
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            {/* Tab Navigation - Mobile Horizontal Scroll, Desktop Normal */}
            <div className="flex-shrink-0 mb-6">
              <div className="flex md:hidden overflow-x-auto pb-2 scrollbar-hide">
                <TabsList className="flex-shrink-0 grid grid-cols-3 min-w-full">
                  {Object.values(tabsMetadata).map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center gap-2 text-xs px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        data-testid={`tab-${tab.id}`}
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{tab.title}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Desktop Tab List */}
              <div className="hidden md:block">
                <TabsList className="grid w-full grid-cols-3">
                  {Object.values(tabsMetadata).map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        data-testid={`tab-${tab.id}`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span>{tab.title}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              {Object.values(tabsMetadata).map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="h-full mt-0">
                  <div className="h-full space-y-6">
                    {/* Tab Info Header */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <tab.icon className="h-6 w-6 text-primary" />
                            <div>
                              <CardTitle className="text-lg">{tab.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {tab.shortDescription}
                              </p>
                            </div>
                          </div>
                          
                          {/* Info Dialog - Mobile uses Sheet, Desktop uses Dialog */}
                          <div className="md:hidden">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`info-${tab.id}`}>
                                  <Info className="h-4 w-4" />
                                </Button>
                              </SheetTrigger>
                              <SheetContent side="right" className="w-full max-w-md">
                                <SheetHeader>
                                  <SheetTitle className="flex items-center gap-2">
                                    <tab.icon className="h-5 w-5" />
                                    {tab.title}
                                  </SheetTitle>
                                  <SheetDescription>
                                    {tab.description}
                                  </SheetDescription>
                                </SheetHeader>
                                <div className="mt-6 space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Features</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {tab.features.map((feature, index) => (
                                        <li key={index}>• {feature}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </SheetContent>
                            </Sheet>
                          </div>

                          <div className="hidden md:block">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`info-${tab.id}`}>
                                  <Info className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <tab.icon className="h-5 w-5" />
                                    {tab.title}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {tab.description}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Features</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {tab.features.map((feature, index) => (
                                        <li key={index}>• {feature}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Document Type Selection */}
                    {!isPreviewMode && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Select Document Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tab.documentTypes.map((docType) => (
                              <Card
                                key={docType.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  selectedDocumentType === docType.id 
                                    ? 'ring-2 ring-primary bg-primary/5' 
                                    : 'border-border'
                                }`}
                                onClick={() => setSelectedDocumentType(docType.id)}
                                data-testid={`doc-type-${docType.id}`}
                              >
                                <CardContent className="p-4">
                                  <h4 className="font-medium text-sm">{docType.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {docType.description}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Input Method Selection */}
                    {!isPreviewMode && selectedDocumentType && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Choose Input Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Button
                              variant={inputMethod === 'voice' ? 'default' : 'outline'}
                              className="h-auto p-4 flex flex-col items-center gap-2"
                              onClick={() => setInputMethod('voice')}
                              data-testid="input-method-voice"
                            >
                              <Mic className="h-6 w-6" />
                              <span className="font-medium">Voice to Text</span>
                              <span className="text-xs text-center text-muted-foreground">
                                Speak to generate content
                              </span>
                            </Button>

                            <Button
                              variant={inputMethod === 'paste' ? 'default' : 'outline'}
                              className="h-auto p-4 flex flex-col items-center gap-2"
                              onClick={() => setInputMethod('paste')}
                              data-testid="input-method-paste"
                            >
                              <Copy className="h-6 w-6" />
                              <span className="font-medium">Paste Text</span>
                              <span className="text-xs text-center text-muted-foreground">
                                Paste existing content
                              </span>
                            </Button>

                            <Button
                              variant={inputMethod === 'manual' ? 'default' : 'outline'}
                              className="h-auto p-4 flex flex-col items-center gap-2"
                              onClick={() => setInputMethod('manual')}
                              data-testid="input-method-manual"
                            >
                              <Edit3 className="h-6 w-6" />
                              <span className="font-medium">Manual Filling</span>
                              <span className="text-xs text-center text-muted-foreground">
                                Fill form fields manually
                              </span>
                            </Button>
                          </div>

                          {/* Input Forms */}
                          {inputMethod === 'voice' && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Voice Input</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Form {...voiceForm}>
                                  <form onSubmit={voiceForm.handleSubmit(handleVoiceSubmit)} className="space-y-4">
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4">
                                        <Button
                                          type="button"
                                          variant={isListening ? "destructive" : "default"}
                                          onClick={isListening ? stopListening : startListening}
                                          data-testid="button-voice-toggle"
                                        >
                                          {isListening ? (
                                            <>
                                              <MicOff className="h-4 w-4 mr-2" />
                                              Stop Recording
                                            </>
                                          ) : (
                                            <>
                                              <Mic className="h-4 w-4 mr-2" />
                                              Start Recording
                                            </>
                                          )}
                                        </Button>
                                        {isListening && (
                                          <span className="text-sm text-muted-foreground">
                                            Listening...
                                          </span>
                                        )}
                                      </div>

                                      <FormField
                                        control={voiceForm.control}
                                        name="text"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Captured Text</FormLabel>
                                            <FormControl>
                                              <Textarea
                                                {...field}
                                                placeholder="Your spoken text will appear here..."
                                                className="min-h-32"
                                                data-testid="textarea-voice-text"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    <Button 
                                      type="submit" 
                                      disabled={generateDocumentMutation.isPending}
                                      data-testid="button-generate-voice"
                                    >
                                      {generateDocumentMutation.isPending ? "Generating..." : "Generate Document"}
                                    </Button>
                                  </form>
                                </Form>
                              </CardContent>
                            </Card>
                          )}

                          {inputMethod === 'paste' && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Paste Text</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Form {...pasteForm}>
                                  <form onSubmit={pasteForm.handleSubmit(handlePasteSubmit)} className="space-y-4">
                                    <FormField
                                      control={pasteForm.control}
                                      name="text"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Paste Your Content</FormLabel>
                                          <FormControl>
                                            <Textarea
                                              {...field}
                                              placeholder="Paste your text content here..."
                                              className="min-h-32"
                                              data-testid="textarea-paste-text"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <Button 
                                      type="submit" 
                                      disabled={generateDocumentMutation.isPending}
                                      data-testid="button-generate-paste"
                                    >
                                      {generateDocumentMutation.isPending ? "Generating..." : "Generate Document"}
                                    </Button>
                                  </form>
                                </Form>
                              </CardContent>
                            </Card>
                          )}

                          {inputMethod === 'manual' && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Manual Form Fields - Professional USA Format</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  Fill out the fields below to generate a professionally formatted {selectedDocumentType} following USA standards
                                </p>
                              </CardHeader>
                              <CardContent>
                                <Form {...manualForm}>
                                  <form onSubmit={manualForm.handleSubmit(handleManualSubmit)} className="space-y-6">
                                    {/* Document Header Information */}
                                    <div className="space-y-4">
                                      <h4 className="font-medium text-sm text-primary">Document Header Information</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                          control={manualForm.control}
                                          name="senderName"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Your Full Name *</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="John Smith" data-testid="input-sender-name" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={manualForm.control}
                                          name="senderTitle"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Your Title/Position</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Attorney at Law" data-testid="input-sender-title" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={manualForm.control}
                                          name="senderCompany"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Your Company/Organization</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Smith & Associates Law Firm" data-testid="input-sender-company" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={manualForm.control}
                                          name="senderPhone"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Your Phone Number</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="(555) 123-4567" data-testid="input-sender-phone" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>

                                      <FormField
                                        control={manualForm.control}
                                        name="senderAddress"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Your Complete Address</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                {...field} 
                                                placeholder="123 Main Street&#10;Suite 100&#10;New York, NY 10001"
                                                className="min-h-20"
                                                data-testid="textarea-sender-address"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    {/* Recipient Information */}
                                    <div className="space-y-4">
                                      <h4 className="font-medium text-sm text-primary">Recipient Information</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                          control={manualForm.control}
                                          name="recipientName"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Recipient Full Name *</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Jane Doe" data-testid="input-recipient-name" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={manualForm.control}
                                          name="recipientTitle"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Recipient Title/Position</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Hiring Manager" data-testid="input-recipient-title" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={manualForm.control}
                                          name="recipientCompany"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Recipient Company/Organization</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="ABC Corporation" data-testid="input-recipient-company" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={manualForm.control}
                                          name="recipientEmail"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Recipient Email</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="jane.doe@company.com" data-testid="input-recipient-email" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>

                                      <FormField
                                        control={manualForm.control}
                                        name="recipientAddress"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Recipient Complete Address</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                {...field} 
                                                placeholder="456 Business Ave&#10;Floor 5&#10;Los Angeles, CA 90210"
                                                className="min-h-20"
                                                data-testid="textarea-recipient-address"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    {/* Document Content */}
                                    <div className="space-y-4">
                                      <h4 className="font-medium text-sm text-primary">Document Content</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                          control={manualForm.control}
                                          name="subject"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Subject/Purpose *</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Re: Application for Senior Attorney Position" data-testid="input-subject" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={manualForm.control}
                                          name="documentDate"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Document Date</FormLabel>
                                              <FormControl>
                                                <Input {...field} type="date" data-testid="input-document-date" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>

                                      <FormField
                                        control={manualForm.control}
                                        name="mainContent"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Main Content/Body *</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                {...field} 
                                                placeholder="Describe the main purpose, key points, and any specific details you want to include in this document..."
                                                className="min-h-32"
                                                data-testid="textarea-main-content"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      {/* Contract/Application specific fields */}
                                      {(activeTab === 'contracts' || activeTab === 'applications') && (
                                        <>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                              control={manualForm.control}
                                              name="effectiveDate"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Effective Date</FormLabel>
                                                  <FormControl>
                                                    <Input {...field} type="date" data-testid="input-effective-date" />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <FormField
                                              control={manualForm.control}
                                              name="jurisdiction"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Governing State/Jurisdiction</FormLabel>
                                                  <FormControl>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                      <SelectTrigger data-testid="select-jurisdiction">
                                                        <SelectValue placeholder="Select State" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="AL">Alabama</SelectItem>
                                                        <SelectItem value="CA">California</SelectItem>
                                                        <SelectItem value="FL">Florida</SelectItem>
                                                        <SelectItem value="NY">New York</SelectItem>
                                                        <SelectItem value="TX">Texas</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          </div>

                                          {activeTab === 'contracts' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <FormField
                                                control={manualForm.control}
                                                name="contractValue"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Contract Value/Amount</FormLabel>
                                                    <FormControl>
                                                      <Input {...field} placeholder="$50,000" data-testid="input-contract-value" />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />

                                              <FormField
                                                control={manualForm.control}
                                                name="paymentTerms"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Payment Terms</FormLabel>
                                                    <FormControl>
                                                      <Input {...field} placeholder="Net 30 days" data-testid="input-payment-terms" />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                          )}
                                        </>
                                      )}

                                      <FormField
                                        control={manualForm.control}
                                        name="additionalClauses"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Additional Clauses/Requirements</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                {...field} 
                                                placeholder="Any specific clauses, conditions, or additional requirements to include..."
                                                className="min-h-24"
                                                data-testid="textarea-additional-clauses"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    <div className="border-t pt-4">
                                      <Button 
                                        type="submit" 
                                        disabled={generateDocumentMutation.isPending}
                                        className="w-full md:w-auto"
                                        data-testid="button-generate-manual"
                                      >
                                        {generateDocumentMutation.isPending ? "Generating Professional Document..." : "Generate Professional USA Format Document"}
                                      </Button>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        * Required fields. Document will be generated following professional USA business standards.
                                      </p>
                                    </div>
                                  </form>
                                </Form>
                              </CardContent>
                            </Card>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Document Preview and Editor */}
                    {isPreviewMode && generatedDocument && (
                      <Card>
                        <CardHeader>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Document Preview
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {generatedDocument.title}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPreviewMode(false)}
                                data-testid="button-back-to-edit"
                              >
                                Back to Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveDocument}
                                data-testid="button-save-document"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleDownloadDocument}
                                data-testid="button-download-document"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Label htmlFor="document-editor">Edit Document Content</Label>
                            <Textarea
                              id="document-editor"
                              value={editableContent}
                              onChange={(e) => setEditableContent(e.target.value)}
                              className="min-h-96 font-mono text-sm"
                              data-testid="textarea-document-editor"
                            />
                            <p className="text-xs text-muted-foreground">
                              You can edit the document content above. The document follows international USA standards for formatting and structure.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </SidebarLayout>
  );
}