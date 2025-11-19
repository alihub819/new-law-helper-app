import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileQuestion, FileText, CheckSquare, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

type DiscoveryType = "interrogatories" | "requests" | "admissions";
type DiscoveryResults = {
  interrogatories: any | null;
  requests: any | null;
  admissions: any | null;
};

export default function DiscoveryTools() {
  const [activeTab, setActiveTab] = useState<DiscoveryType>("interrogatories");
  const [formData, setFormData] = useState<Record<string, any>>({
    interrogatories: { questions: "", caseFacts: "", jurisdiction: "Federal", caseType: "General" },
    requests: { requests: "", documents: "", jurisdiction: "Federal", caseType: "General" },
    admissions: { admissions: "", casePosition: "", jurisdiction: "Federal", caseType: "General" },
  });
  const [results, setResults] = useState<DiscoveryResults>({
    interrogatories: null,
    requests: null,
    admissions: null,
  });
  const { toast } = useToast();

  const discoveryMutation = useMutation({
    mutationFn: async (data: { type: string; payload: any }) =>
      apiRequest("POST", "/api/discovery-tools", data),
    onSuccess: (data, variables) => {
      const type = variables.type as DiscoveryType;
      setResults((prev) => ({ ...prev, [type]: data }));
      toast({
        title: "Response Generated",
        description: "Discovery responses have been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate discovery responses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    const data = formData[activeTab];
    const requiredField = activeTab === "interrogatories" ? "questions" : 
                         activeTab === "requests" ? "requests" : "admissions";
    
    if (!data[requiredField]?.trim()) {
      toast({
        title: "Input Required",
        description: `Please enter ${activeTab} to generate responses.`,
        variant: "destructive",
      });
      return;
    }

    discoveryMutation.mutate({
      type: activeTab,
      payload: data,
    });
  };

  const handleExport = (format: string) => {
    const result = results[activeTab];
    if (!result) return;
    
    const content = {
      title: `Discovery Responses - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
      sections: [{ heading: "Discovery Responses", content: JSON.stringify(result, null, 2) }],
      subject: `Discovery - ${activeTab}`,
      keywords: ["discovery", activeTab, "responses"],
    };

    fetch("/api/export-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, content }),
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `discovery_${activeTab}_${Date.now()}.${format}`;
        a.click();
      });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [field]: value },
    }));
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2" data-testid="heading-discovery-tools">
              Discovery Response Tools
            </h1>
            <p className="text-slate-600 dark:text-slate-300" data-testid="text-description">
              Generate professional discovery responses with AI assistance
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DiscoveryType)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3" data-testid="tabs-type">
              <TabsTrigger value="interrogatories" data-testid="tab-interrogatories">
                <FileQuestion className="w-4 h-4 mr-2" />
                Interrogatories
              </TabsTrigger>
              <TabsTrigger value="requests" data-testid="tab-requests">
                <FileText className="w-4 h-4 mr-2" />
                Requests for Production
              </TabsTrigger>
              <TabsTrigger value="admissions" data-testid="tab-admissions">
                <CheckSquare className="w-4 h-4 mr-2" />
                Requests for Admission
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interrogatories">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-interrogatories">Interrogatory Responses</CardTitle>
                  <CardDescription>
                    Generate responses to written interrogatories with objections and substantive answers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jurisdiction">Jurisdiction</Label>
                      <Input
                        id="jurisdiction"
                        value={formData.interrogatories.jurisdiction}
                        onChange={(e) => updateFormData("jurisdiction", e.target.value)}
                        data-testid="input-jurisdiction"
                      />
                    </div>
                    <div>
                      <Label htmlFor="caseType">Case Type</Label>
                      <Input
                        id="caseType"
                        value={formData.interrogatories.caseType}
                        onChange={(e) => updateFormData("caseType", e.target.value)}
                        data-testid="input-case-type"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="questions">Interrogatories</Label>
                    <Textarea
                      id="questions"
                      placeholder="Paste interrogatories here (one per line or numbered)..."
                      value={formData.interrogatories.questions}
                      onChange={(e) => updateFormData("questions", e.target.value)}
                      className="min-h-[150px]"
                      data-testid="input-questions"
                    />
                  </div>
                  <div>
                    <Label htmlFor="caseFacts">Case Facts & Information</Label>
                    <Textarea
                      id="caseFacts"
                      placeholder="Provide case facts to generate substantive responses..."
                      value={formData.interrogatories.caseFacts}
                      onChange={(e) => updateFormData("caseFacts", e.target.value)}
                      className="min-h-[100px]"
                      data-testid="input-case-facts"
                    />
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={discoveryMutation.isPending}
                    data-testid="button-generate-interrogatories"
                  >
                    {discoveryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Responses
                  </Button>

                  {results.interrogatories && results.interrogatories.responses && (
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" data-testid="button-export-pdf">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button onClick={() => handleExport("docx")} variant="outline" size="sm" data-testid="button-export-docx">
                          <Download className="w-4 h-4 mr-2" />
                          Export Word
                        </Button>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-4" data-testid="result-interrogatories">
                        {results.interrogatories.responses.slice(0, 3).map((resp: any, idx: number) => (
                          <div key={idx} className="border-b pb-3" data-testid={`response-${idx}`}>
                            <div className="font-semibold mb-1">Interrogatory #{resp.number}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{resp.question}</div>
                            {resp.objections && resp.objections.length > 0 && (
                              <div className="text-sm mb-1">
                                <span className="font-medium">Objections:</span> {resp.objections.join(", ")}
                              </div>
                            )}
                            <div className="text-sm">{resp.response}</div>
                          </div>
                        ))}
                        {results.interrogatories.responses.length > 3 && (
                          <p className="text-sm text-slate-500">
                            ...and {results.interrogatories.responses.length - 3} more responses
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-requests">Requests for Production Responses</CardTitle>
                  <CardDescription>
                    Generate responses to document production requests with privilege log
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jurisdiction-req">Jurisdiction</Label>
                      <Input
                        id="jurisdiction-req"
                        value={formData.requests.jurisdiction}
                        onChange={(e) => updateFormData("jurisdiction", e.target.value)}
                        data-testid="input-jurisdiction-req"
                      />
                    </div>
                    <div>
                      <Label htmlFor="caseType-req">Case Type</Label>
                      <Input
                        id="caseType-req"
                        value={formData.requests.caseType}
                        onChange={(e) => updateFormData("caseType", e.target.value)}
                        data-testid="input-case-type-req"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="requests">Requests for Production</Label>
                    <Textarea
                      id="requests"
                      placeholder="Paste document requests here..."
                      value={formData.requests.requests}
                      onChange={(e) => updateFormData("requests", e.target.value)}
                      className="min-h-[150px]"
                      data-testid="input-requests"
                    />
                  </div>
                  <div>
                    <Label htmlFor="documents">Available Documents</Label>
                    <Textarea
                      id="documents"
                      placeholder="List available documents..."
                      value={formData.requests.documents}
                      onChange={(e) => updateFormData("documents", e.target.value)}
                      className="min-h-[100px]"
                      data-testid="input-documents"
                    />
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={discoveryMutation.isPending}
                    data-testid="button-generate-requests"
                  >
                    {discoveryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Responses
                  </Button>

                  {results.requests && results.requests.responses && (
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" data-testid="button-export-requests-pdf">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button onClick={() => handleExport("docx")} variant="outline" size="sm" data-testid="button-export-requests-docx">
                          <Download className="w-4 h-4 mr-2" />
                          Export Word
                        </Button>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-4" data-testid="result-requests">
                        {results.requests.responses.slice(0, 3).map((resp: any, idx: number) => (
                          <div key={idx} className="border-b pb-3" data-testid={`request-response-${idx}`}>
                            <div className="font-semibold mb-1">Request #{resp.number}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{resp.request}</div>
                            <div className="text-sm">{resp.response}</div>
                          </div>
                        ))}
                        {results.requests.responses.length > 3 && (
                          <p className="text-sm text-slate-500">
                            ...and {results.requests.responses.length - 3} more responses
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admissions">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-admissions">Requests for Admission Responses</CardTitle>
                  <CardDescription>
                    Generate responses to requests for admission (Admit/Deny/Qualified)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jurisdiction-adm">Jurisdiction</Label>
                      <Input
                        id="jurisdiction-adm"
                        value={formData.admissions.jurisdiction}
                        onChange={(e) => updateFormData("jurisdiction", e.target.value)}
                        data-testid="input-jurisdiction-adm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="caseType-adm">Case Type</Label>
                      <Input
                        id="caseType-adm"
                        value={formData.admissions.caseType}
                        onChange={(e) => updateFormData("caseType", e.target.value)}
                        data-testid="input-case-type-adm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="admissions">Requests for Admission</Label>
                    <Textarea
                      id="admissions"
                      placeholder="Paste requests for admission here..."
                      value={formData.admissions.admissions}
                      onChange={(e) => updateFormData("admissions", e.target.value)}
                      className="min-h-[150px]"
                      data-testid="input-admissions"
                    />
                  </div>
                  <div>
                    <Label htmlFor="casePosition">Case Position</Label>
                    <Textarea
                      id="casePosition"
                      placeholder="Describe your case position to guide responses..."
                      value={formData.admissions.casePosition}
                      onChange={(e) => updateFormData("casePosition", e.target.value)}
                      className="min-h-[100px]"
                      data-testid="input-case-position"
                    />
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={discoveryMutation.isPending}
                    data-testid="button-generate-admissions"
                  >
                    {discoveryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Responses
                  </Button>

                  {results.admissions && results.admissions.responses && (
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" data-testid="button-export-admissions-pdf">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button onClick={() => handleExport("docx")} variant="outline" size="sm" data-testid="button-export-admissions-docx">
                          <Download className="w-4 h-4 mr-2" />
                          Export Word
                        </Button>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-4" data-testid="result-admissions">
                        {results.admissions.responses.slice(0, 3).map((resp: any, idx: number) => (
                          <div key={idx} className="border-b pb-3" data-testid={`admission-response-${idx}`}>
                            <div className="font-semibold mb-1">Request #{resp.number}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{resp.request}</div>
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{resp.response}</div>
                            {resp.explanation && (
                              <div className="text-sm mt-1">{resp.explanation}</div>
                            )}
                          </div>
                        ))}
                        {results.admissions.responses.length > 3 && (
                          <p className="text-sm text-slate-500">
                            ...and {results.admissions.responses.length - 3} more responses
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </div>
    </SidebarLayout>
  );
}
