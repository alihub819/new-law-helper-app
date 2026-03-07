import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Download,
  Trash2,
  Calendar,
  FolderOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type SavedDocument, type DocumentType } from "@shared/schema";

// Local type replaced by shared type import

export default function SavedDocuments() {
  const { toast } = useToast();

  const { data: documents, isLoading } = useQuery<SavedDocument[]>({
    queryKey: ["/api/saved-documents"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/saved-documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-documents"] });
      toast({
        title: "Document Deleted",
        description: "The document has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = (doc: SavedDocument, format: string) => {
    // Format content based on document type
    const formatContent = () => {
      const content = doc.content as any;
      const sections = [];

      // For demand letters, use the letter content directly
      if (doc.documentType === 'demand-letter' && content.letterContent) {
        sections.push({ heading: "Demand Letter", content: content.letterContent });
        if (content.damagesBreakdown) {
          sections.push({
            heading: "Damages Summary",
            content: `Medical Expenses: $${content.damagesBreakdown.medicalExpenses?.toFixed(2) || '0.00'}\n` +
              `Lost Wages: $${content.damagesBreakdown.lostWages?.toFixed(2) || '0.00'}\n` +
              `Total Demand: $${content.damagesBreakdown.total?.toFixed(2) || '0.00'}`,
          });
        }
        return sections;
      }

      // For medical chronology
      if (doc.documentType === 'medical-chronology' && content.entries) {
        sections.push({
          heading: "Medical Treatment Timeline",
          content: content.entries.map((entry: any, idx: number) =>
            `${idx + 1}. ${entry.date || 'N/A'} - ${entry.provider || 'Unknown'}\n` +
            `   Diagnosis: ${entry.diagnosis || 'N/A'}\n` +
            `   Treatment: ${entry.treatment || 'N/A'}`
          ).join('\n\n'),
        });
        return sections;
      }

      // For discovery responses
      if ((doc.documentType === 'discovery-response' || doc.documentType === 'interrogatories') && content.responses) {
        sections.push({
          heading: "Discovery Responses",
          content: content.responses.map((resp: any) =>
            `Response #${resp.number || 'N/A'}\n` +
            `Question: ${resp.question || resp.request || 'N/A'}\n` +
            `Response: ${resp.response || 'N/A'}`
          ).join('\n\n---\n\n'),
        });
        return sections;
      }

      // For medical summaries
      if (doc.documentType === 'medical-summary') {
        if (content.chiefComplaint) sections.push({ heading: "Chief Complaint", content: content.chiefComplaint });
        if (content.currentStatus) sections.push({ heading: "Current Status", content: content.currentStatus });
        if (content.totalMedicalExpenses) sections.push({ heading: "Total Medical Expenses", content: `$${content.totalMedicalExpenses?.toFixed(2)}` });
        return sections;
      }

      // Fallback: try to format object keys nicely
      if (typeof content === 'object') {
        for (const [key, value] of Object.entries(content)) {
          const heading = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          sections.push({
            heading,
            content: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
          });
        }
        return sections;
      }

      return [{ content: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }];
    };

    const exportContent = {
      title: doc.title,
      sections: formatContent(),
      subject: doc.title,
      keywords: [doc.documentType],
    };

    fetch("/api/export-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ format, content: exportContent }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Export failed");
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${format}`;
        a.click();
      })
      .catch(() => {
        toast({
          title: "Export Failed",
          description: "Failed to export document. Please try again.",
          variant: "destructive",
        });
      });
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      "demand-letter": "Demand Letter",
      "medical-chronology": "Medical Chronology",
      "medical-bill-analysis": "Medical Bill Analysis",
      "medical-summary": "Medical Summary",
      "interrogatories": "Interrogatory Responses",
      "request-for-production": "Document Requests",
      "discovery-response": "Discovery Response",
      "legal-brief": "Legal Brief",
      "contract": "Contract",
      "other": "Other Document",
    };
    return labels[type] || type;
  };

  const getDocumentTypeBadgeColor = (type: string) => {
    if (!type) return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    if (type.startsWith("medical")) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (type.startsWith("discovery")) return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    if (type === "demand-letter") return "bg-green-500/10 text-green-600 border-green-500/20";
    return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Saved Documents</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                View and manage all your generated documents
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : !documents || documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No Saved Documents</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Your generated documents will appear here automatically. Try creating a demand letter, medical analysis, or discovery response.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg" data-testid={`title-${doc.id}`}>
                            {doc.title}
                          </CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge
                            variant="outline"
                            className={getDocumentTypeBadgeColor(doc.documentType)}
                            data-testid={`badge-type-${doc.id}`}
                          >
                            {getDocumentTypeLabel(doc.documentType)}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span data-testid={`date-${doc.id}`}>
                              {new Date(doc.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(doc, "pdf")}
                        data-testid={`button-export-pdf-${doc.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(doc, "docx")}
                        data-testid={`button-export-word-${doc.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(doc, "txt")}
                        data-testid={`button-export-txt-${doc.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Text
                      </Button>
                      <div className="flex-1" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${doc.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
