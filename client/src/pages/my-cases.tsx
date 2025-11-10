import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Briefcase, Plus, FileText, Calendar, DollarSign, User, MapPin, Trash2, Edit, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { type Case, insertCaseSchema } from "@shared/schema";

// Extend the shared schema for form-specific validation
const caseFormSchema = insertCaseSchema.omit({ userId: true, dateOpened: true }).extend({
  valueLow: z.string().optional().transform(val => val ? val : undefined),
  valueHigh: z.string().optional().transform(val => val ? val : undefined),
});

type CaseFormData = z.infer<typeof caseFormSchema>;

export default function MyCases() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      caseName: "",
      caseNumber: "",
      clientName: "",
      caseType: "",
      status: "active",
      description: "",
      jurisdiction: "",
      practiceArea: "",
      leadAttorney: "",
      opposingParty: "",
      opposingCounsel: "",
      valueLow: "",
      valueHigh: "",
    },
  });

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
    enabled: !!user,
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      const res = await apiRequest("POST", "/api/cases", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Case created",
        description: "Your case has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      await apiRequest("DELETE", `/api/cases/${caseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Case deleted",
        description: "The case has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CaseFormData) => {
    createCaseMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCaseTypeLabel = (type: string) => {
    return type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">My Cases</h1>
              <p className="text-muted-foreground mt-2">Manage and organize all your legal cases</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-case">
                  <Plus className="h-4 w-4" />
                  New Case
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Case</DialogTitle>
                  <DialogDescription>
                    Enter the details for your new legal case
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="caseName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Smith v. Johnson" {...field} data-testid="input-case-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="caseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., CV-2024-001" {...field} data-testid="input-case-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., John Smith" {...field} data-testid="input-client-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="caseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-case-type">
                                  <SelectValue placeholder="Select case type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="personal-injury">Personal Injury</SelectItem>
                                <SelectItem value="contract-dispute">Contract Dispute</SelectItem>
                                <SelectItem value="employment">Employment Law</SelectItem>
                                <SelectItem value="intellectual-property">Intellectual Property</SelectItem>
                                <SelectItem value="real-estate">Real Estate</SelectItem>
                                <SelectItem value="family">Family Law</SelectItem>
                                <SelectItem value="criminal">Criminal Defense</SelectItem>
                                <SelectItem value="medical-malpractice">Medical Malpractice</SelectItem>
                                <SelectItem value="product-liability">Product Liability</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jurisdiction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jurisdiction</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., California, Federal" {...field} data-testid="input-jurisdiction" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Case Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of the case..."
                              className="min-h-[100px]"
                              {...field}
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="leadAttorney"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lead Attorney</FormLabel>
                            <FormControl>
                              <Input placeholder="Attorney name" {...field} data-testid="input-lead-attorney" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="opposingParty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opposing Party</FormLabel>
                            <FormControl>
                              <Input placeholder="Opposing party name" {...field} data-testid="input-opposing-party" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="valueLow"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Value (Low)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 50000" {...field} data-testid="input-value-low" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="valueHigh"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Value (High)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 150000" {...field} data-testid="input-value-high" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          form.reset();
                        }}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCaseMutation.isPending} data-testid="button-submit-case">
                        {createCaseMutation.isPending ? "Creating..." : "Create Case"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Cases</p>
                    <p className="text-3xl font-bold mt-1" data-testid="stat-active-cases">
                      {cases.filter(c => c.status === "active").length}
                    </p>
                  </div>
                  <Briefcase className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Cases</p>
                    <p className="text-3xl font-bold mt-1" data-testid="stat-pending-cases">
                      {cases.filter(c => c.status === "pending").length}
                    </p>
                  </div>
                  <Calendar className="h-10 w-10 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cases</p>
                    <p className="text-3xl font-bold mt-1" data-testid="stat-total-cases">{cases.length}</p>
                  </div>
                  <FileText className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cases List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cases yet</h3>
                <p className="text-muted-foreground mb-4">Create your first case to get started</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-case">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cases.map((caseItem) => (
                <Card key={caseItem.id} className="hover:shadow-lg transition-shadow" data-testid={`case-card-${caseItem.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{caseItem.caseName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                          </Badge>
                          <span className="text-sm">{getCaseTypeLabel(caseItem.caseType)}</span>
                          {caseItem.caseNumber && (
                            <span className="text-sm">• {caseItem.caseNumber}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Client:</span>
                        <span className="font-medium">{caseItem.clientName}</span>
                      </div>
                      {caseItem.jurisdiction && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Jurisdiction:</span>
                          <span className="font-medium">{caseItem.jurisdiction}</span>
                        </div>
                      )}
                      {(caseItem.valueLow || caseItem.valueHigh) && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Value:</span>
                          <span className="font-medium">
                            {caseItem.valueLow && caseItem.valueHigh
                              ? `$${Number(caseItem.valueLow).toLocaleString()} - $${Number(caseItem.valueHigh).toLocaleString()}`
                              : caseItem.valueLow
                              ? `$${Number(caseItem.valueLow).toLocaleString()}+`
                              : `Up to $${Number(caseItem.valueHigh).toLocaleString()}`}
                          </span>
                        </div>
                      )}
                      {caseItem.leadAttorney && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Attorney:</span>
                          <span className="font-medium">{caseItem.leadAttorney}</span>
                        </div>
                      )}
                    </div>
                    {caseItem.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 pt-2">
                        {caseItem.description}
                      </p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/cases/${caseItem.id}`)}
                        data-testid={`button-view-case-${caseItem.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCaseMutation.mutate(caseItem.id)}
                        disabled={deleteCaseMutation.isPending}
                        data-testid={`button-delete-case-${caseItem.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
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
