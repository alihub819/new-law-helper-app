import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, DollarSign, FileCheck, Download, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

type MedicalResults = {
  chronology: any | null;
  bills: any | null;
  summary: any | null;
};

export default function MedicalIntelligence() {
  const [activeTab, setActiveTab] = useState<keyof MedicalResults>("chronology");
  const [documentText, setDocumentText] = useState<Record<string, string>>({
    chronology: "",
    bills: "",
    summary: "",
  });
  const [results, setResults] = useState<MedicalResults>({
    chronology: null,
    bills: null,
    summary: null,
  });
  const { toast } = useToast();

  const medicalIntelligenceMutation = useMutation({
    mutationFn: async (data: { mode: string; payload: any }) =>
      apiRequest("POST", "/api/medical-intelligence", data),
    onSuccess: (data, variables) => {
      const mode = variables.mode as keyof MedicalResults;
      setResults((prev) => ({ ...prev, [mode]: data }));
      toast({
        title: "Analysis Complete",
        description: "Medical intelligence analysis has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to generate medical intelligence analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    const currentText = documentText[activeTab];
    if (!currentText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter medical record text to analyze.",
        variant: "destructive",
      });
      return;
    }

    medicalIntelligenceMutation.mutate({
      mode: activeTab,
      payload: { documentText: currentText },
    });
  };

  const handleExport = (format: string) => {
    const result = results[activeTab];
    if (!result) return;
    
    const content = {
      title: `Medical ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`,
      sections: [{ heading: "Analysis Results", content: JSON.stringify(result, null, 2) }],
      subject: `Medical Intelligence - ${activeTab}`,
      keywords: ["medical", activeTab, "analysis"],
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
        a.download = `medical_${activeTab}_${Date.now()}.${format}`;
        a.click();
      });
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2" data-testid="heading-medical-intelligence">
              Medical Intelligence Suite
            </h1>
            <p className="text-slate-600 dark:text-slate-300" data-testid="text-description">
              AI-powered medical record analysis for personal injury cases
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3" data-testid="tabs-mode">
              <TabsTrigger value="chronology" data-testid="tab-chronology">
                <FileText className="w-4 h-4 mr-2" />
                Medical Chronology
              </TabsTrigger>
              <TabsTrigger value="bills" data-testid="tab-bills">
                <DollarSign className="w-4 h-4 mr-2" />
                Bill Analyzer
              </TabsTrigger>
              <TabsTrigger value="summary" data-testid="tab-summary">
                <FileCheck className="w-4 h-4 mr-2" />
                Medical Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chronology">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-chronology">Medical Chronology Generator</CardTitle>
                  <CardDescription>
                    Create detailed timeline of medical treatments with ICD and CPT codes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste medical records text here..."
                    value={documentText.chronology}
                    onChange={(e) => setDocumentText((prev) => ({ ...prev, chronology: e.target.value }))}
                    className="min-h-[200px]"
                    data-testid="input-medical-text"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={medicalIntelligenceMutation.isPending}
                    data-testid="button-analyze"
                  >
                    {medicalIntelligenceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Chronology
                  </Button>

                  {results.chronology && results.chronology.timeline && (
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

                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg" data-testid="result-chronology">
                        <h3 className="font-semibold mb-2">Timeline ({results.chronology.totalVisits} visits)</h3>
                        {results.chronology.timeline.slice(0, 5).map((item: any, idx: number) => (
                          <div key={idx} className="border-b py-2" data-testid={`timeline-item-${idx}`}>
                            <div className="font-medium">{item.date} - {item.provider}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {item.diagnosis} | {item.treatment}
                            </div>
                          </div>
                        ))}
                        {results.chronology.timeline.length > 5 && (
                          <p className="text-sm text-slate-500 mt-2">
                            ...and {results.chronology.timeline.length - 5} more entries
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bills">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-bills">Medical Bill Analyzer</CardTitle>
                  <CardDescription>
                    Analyze medical bills and identify charges, payments, and discrepancies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste medical bills text here..."
                    value={documentText.bills}
                    onChange={(e) => setDocumentText((prev) => ({ ...prev, bills: e.target.value }))}
                    className="min-h-[200px]"
                    data-testid="input-bills-text"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={medicalIntelligenceMutation.isPending}
                    data-testid="button-analyze-bills"
                  >
                    {medicalIntelligenceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Analyze Bills
                  </Button>

                  {results.bills && results.bills.summary && (
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" data-testid="button-export-bills-pdf">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button onClick={() => handleExport("docx")} variant="outline" size="sm" data-testid="button-export-bills-docx">
                          <Download className="w-4 h-4 mr-2" />
                          Export Word
                        </Button>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg" data-testid="result-bills">
                        <h3 className="font-semibold mb-4">Billing Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Total Charges</div>
                            <div className="text-2xl font-bold" data-testid="text-total-charges">
                              ${results.bills.summary.totalCharges?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Total Paid</div>
                            <div className="text-2xl font-bold text-green-600" data-testid="text-total-paid">
                              ${results.bills.summary.totalPaid?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Outstanding</div>
                            <div className="text-2xl font-bold text-red-600" data-testid="text-total-outstanding">
                              ${results.bills.summary.totalOutstanding?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Patient Responsibility</div>
                            <div className="text-2xl font-bold" data-testid="text-patient-responsibility">
                              ${results.bills.summary.patientResponsibility?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-summary">Medical Summary Generator</CardTitle>
                  <CardDescription>
                    Create comprehensive medical summary for legal proceedings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste medical information here..."
                    value={documentText.summary}
                    onChange={(e) => setDocumentText((prev) => ({ ...prev, summary: e.target.value }))}
                    className="min-h-[200px]"
                    data-testid="input-summary-text"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={medicalIntelligenceMutation.isPending}
                    data-testid="button-generate-summary"
                  >
                    {medicalIntelligenceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Summary
                  </Button>

                  {results.summary && results.summary.chiefComplaint && (
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" data-testid="button-export-summary-pdf">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button onClick={() => handleExport("docx")} variant="outline" size="sm" data-testid="button-export-summary-docx">
                          <Download className="w-4 h-4 mr-2" />
                          Export Word
                        </Button>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-4" data-testid="result-summary">
                        <div>
                          <h3 className="font-semibold mb-2">Chief Complaint</h3>
                          <p className="text-slate-700 dark:text-slate-300" data-testid="text-chief-complaint">
                            {results.summary.chiefComplaint}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Current Status</h3>
                          <p className="text-slate-700 dark:text-slate-300" data-testid="text-current-status">
                            {results.summary.currentStatus}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Total Medical Expenses</h3>
                          <p className="text-2xl font-bold text-blue-600" data-testid="text-medical-expenses">
                            ${results.summary.totalMedicalExpenses?.toFixed(2) || "0.00"}
                          </p>
                        </div>
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
