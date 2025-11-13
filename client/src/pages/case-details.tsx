import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  FileText,
  DollarSign,
  Clock,
  MapPin,
} from "lucide-react";
import type { Case } from "@shared/schema";

export default function CaseDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: caseData, isLoading } = useQuery<Case>({
    queryKey: ["/api/cases", id],
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "closed":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex flex-col h-full">
          <div className="bg-card border-b border-border p-4 md:p-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex-1 p-4 md:p-6 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!caseData) {
    return (
      <SidebarLayout>
        <div className="flex flex-col h-full items-center justify-center p-6">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Case Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The case you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => setLocation("/my-cases")} data-testid="button-back-to-cases">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Cases
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/my-cases")}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                {caseData.title}
                <Badge
                  variant="outline"
                  className={getStatusColor(caseData.status)}
                  data-testid="badge-status"
                >
                  {caseData.status}
                </Badge>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Case Number: {caseData.caseNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto space-y-6">
          {/* Case Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Case Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Case Type</p>
                    <p className="text-base font-semibold text-foreground" data-testid="text-case-type">
                      {caseData.caseType}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date Filed</p>
                    <p className="text-base font-semibold text-foreground" data-testid="text-date-filed">
                      {caseData.dateFiled
                        ? new Date(caseData.dateFiled).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                {caseData.courtName && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Court</p>
                      <p className="text-base font-semibold text-foreground" data-testid="text-court">
                        {caseData.courtName}
                      </p>
                    </div>
                  </div>
                )}

                {caseData.leadAttorney && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lead Attorney</p>
                      <p className="text-base font-semibold text-foreground" data-testid="text-attorney">
                        {caseData.leadAttorney}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {caseData.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-base text-foreground" data-testid="text-description">
                    {caseData.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          {(caseData.valueLow || caseData.valueHigh) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Estimated Case Value
                    </p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-value">
                      {caseData.valueLow && caseData.valueHigh
                        ? `$${Number(caseData.valueLow).toLocaleString()} - $${Number(caseData.valueHigh).toLocaleString()}`
                        : caseData.valueLow
                        ? `$${Number(caseData.valueLow).toLocaleString()}+`
                        : `Up to $${Number(caseData.valueHigh).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Case Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {caseData.dateFiled && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <div className="flex-1 w-0.5 bg-border min-h-[40px]" />
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-foreground">Case Filed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(caseData.dateFiled).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Current Status</p>
                    <p className="text-sm text-muted-foreground capitalize">{caseData.status}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setLocation("/document-generation")}
                  data-testid="button-generate-document"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/medical-intelligence")}
                  data-testid="button-medical-tools"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Medical Tools
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/demand-letter")}
                  data-testid="button-demand-letter"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Demand Letter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
