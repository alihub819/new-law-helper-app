import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default function DemandLetter() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    caseType: "Personal Injury",
    claimantName: "",
    defendantName: "",
    incidentDate: "",
    incidentDescription: "",
    injuries: "",
    medicalTreatment: "",
    medicalExpenses: "",
    lostWages: "",
    painMultiplier: "3",
    demandAmount: "",
  });
  const [result, setResult] = useState<any>(null);

  const demandLetterMutation = useMutation({
    mutationFn: async (data: typeof formData) =>
      apiRequest("POST", "/api/demand-letter", data),
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Demand Letter Generated",
        description: "Your demand letter has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate demand letter. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateSettlement = () => {
    const medical = parseFloat(formData.medicalExpenses) || 0;
    const wages = parseFloat(formData.lostWages) || 0;
    const multiplier = parseFloat(formData.painMultiplier) || 3;
    const economic = medical + wages;
    const painSuffering = economic * multiplier;
    const total = economic + painSuffering;
    setFormData({ ...formData, demandAmount: total.toFixed(2) });
  };

  const handleGenerate = () => {
    if (!formData.claimantName || !formData.defendantName || !formData.incidentDate) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in claimant, defendant, and incident date.",
        variant: "destructive",
      });
      return;
    }
    demandLetterMutation.mutate(formData);
  };

  const handleExport = (format: string) => {
    if (!result) return;
    
    const content = {
      title: "Demand Letter",
      sections: [{ heading: "Demand Letter", content: result.letterContent }],
      subject: "Personal Injury Demand Letter",
      keywords: ["demand", "letter", "settlement"],
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
        a.download = `demand_letter_${Date.now()}.${format}`;
        a.click();
      });
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2" data-testid="heading-demand-letter">
              Demand Letter Automation
            </h1>
            <p className="text-slate-600 dark:text-slate-300" data-testid="text-description">
              Generate professional demand letters for personal injury cases
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle data-testid="heading-party-info">Party Information</CardTitle>
              <CardDescription>Enter the parties involved in the case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="claimant">Claimant Name *</Label>
                  <Input
                    id="claimant"
                    value={formData.claimantName}
                    onChange={(e) => setFormData({ ...formData, claimantName: e.target.value })}
                    data-testid="input-claimant"
                  />
                </div>
                <div>
                  <Label htmlFor="defendant">Defendant Name *</Label>
                  <Input
                    id="defendant"
                    value={formData.defendantName}
                    onChange={(e) => setFormData({ ...formData, defendantName: e.target.value })}
                    data-testid="input-defendant"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="incidentDate">Incident Date *</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  data-testid="input-incident-date"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle data-testid="heading-incident-details">Incident Details</CardTitle>
              <CardDescription>Describe the incident and injuries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="incidentDescription">Incident Description</Label>
                <Textarea
                  id="incidentDescription"
                  value={formData.incidentDescription}
                  onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                  placeholder="Describe how the incident occurred..."
                  className="min-h-[100px]"
                  data-testid="input-incident-description"
                />
              </div>
              <div>
                <Label htmlFor="injuries">Injuries Sustained</Label>
                <Textarea
                  id="injuries"
                  value={formData.injuries}
                  onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                  placeholder="List all injuries..."
                  data-testid="input-injuries"
                />
              </div>
              <div>
                <Label htmlFor="medicalTreatment">Medical Treatment</Label>
                <Textarea
                  id="medicalTreatment"
                  value={formData.medicalTreatment}
                  onChange={(e) => setFormData({ ...formData, medicalTreatment: e.target.value })}
                  placeholder="Describe medical treatment received..."
                  data-testid="input-medical-treatment"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle data-testid="heading-damages">
                <Calculator className="w-5 h-5 inline mr-2" />
                Damages & Settlement Calculator
              </CardTitle>
              <CardDescription>Calculate settlement demand based on damages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medicalExpenses">Medical Expenses ($)</Label>
                  <Input
                    id="medicalExpenses"
                    type="number"
                    value={formData.medicalExpenses}
                    onChange={(e) => setFormData({ ...formData, medicalExpenses: e.target.value })}
                    data-testid="input-medical-expenses"
                  />
                </div>
                <div>
                  <Label htmlFor="lostWages">Lost Wages ($)</Label>
                  <Input
                    id="lostWages"
                    type="number"
                    value={formData.lostWages}
                    onChange={(e) => setFormData({ ...formData, lostWages: e.target.value })}
                    data-testid="input-lost-wages"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="painMultiplier">Pain & Suffering Multiplier</Label>
                <Input
                  id="painMultiplier"
                  type="number"
                  step="0.5"
                  min="1"
                  max="5"
                  value={formData.painMultiplier}
                  onChange={(e) => setFormData({ ...formData, painMultiplier: e.target.value })}
                  data-testid="input-pain-multiplier"
                />
                <p className="text-sm text-slate-500 mt-1">Typical range: 1.5-5x economic damages</p>
              </div>
              <Button onClick={calculateSettlement} variant="outline" className="w-full" data-testid="button-calculate">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Settlement Demand
              </Button>
              <div>
                <Label htmlFor="demandAmount">Settlement Demand ($)</Label>
                <Input
                  id="demandAmount"
                  type="number"
                  value={formData.demandAmount}
                  onChange={(e) => setFormData({ ...formData, demandAmount: e.target.value })}
                  data-testid="input-demand-amount"
                  className="text-2xl font-bold"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={handleGenerate}
              disabled={demandLetterMutation.isPending}
              className="flex-1"
              data-testid="button-generate"
            >
              {demandLetterMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Demand Letter
            </Button>
          </div>

          {result && result.letterContent && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle data-testid="heading-result">Generated Demand Letter</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" data-testid="button-export-pdf">
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button onClick={() => handleExport("docx")} variant="outline" size="sm" data-testid="button-export-docx">
                      <Download className="w-4 h-4 mr-2" />
                      Word
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg whitespace-pre-wrap font-mono text-sm" data-testid="result-letter">
                  {result.letterContent}
                </div>
                {result.damagesBreakdown && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-100 dark:bg-slate-700 rounded" data-testid="breakdown-medical">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Medical Expenses</div>
                      <div className="text-xl font-bold">${result.damagesBreakdown.medicalExpenses?.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-4 bg-slate-100 dark:bg-slate-700 rounded" data-testid="breakdown-wages">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Lost Wages</div>
                      <div className="text-xl font-bold">${result.damagesBreakdown.lostWages?.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded" data-testid="breakdown-total">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Total Demand</div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ${result.damagesBreakdown.total?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </SidebarLayout>
  );
}
