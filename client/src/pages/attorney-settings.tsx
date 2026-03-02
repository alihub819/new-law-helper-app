import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings, 
  Building2, 
  UserCircle, 
  FileText, 
  PenTool, 
  Users, 
  Save, 
  Plus, 
  Trash2,
  Sparkles,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Loader2,
  CircleCheck,
  Upload
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  isAttorney: boolean;
}

interface AttorneyProfile {
  // Firm Information
  firmName: string;
  firmAddress: string;
  firmPhone: string;
  firmEmail: string;
  firmWebsite: string;
  
  // Attorney Information
  attorneyName: string;
  barNumber: string;
  title: string;
  directPhone: string;
  directEmail: string;
  
  // Scope of Practice
  practiceAreas: string[];
  jurisdictions: string[];
  caseTypes: string[];
  
  // Writing Style
  writingTone: "formal" | "professional" | "assertive" | "diplomatic" | "aggressive";
  writingStyle: string;
  preferredLanguage: string;
  documentTemplates: string[];
  
  // AI Training
  aiPersonality: string;
  responseStyle: string;
  keyPhrases: string[];
  avoidPhrases: string[];
  
  // Signature
  emailSignature: string;
  documentSignature: string;
  
  // Staff
  staffMembers: StaffMember[];
  
  // Templates
  customTemplates: {
    id: string;
    name: string;
    type: string;
    content: string;
  }[];
}

const defaultProfile: AttorneyProfile = {
  firmName: "",
  firmAddress: "",
  firmPhone: "",
  firmEmail: "",
  firmWebsite: "",
  attorneyName: "",
  barNumber: "",
  title: "Attorney",
  directPhone: "",
  directEmail: "",
  practiceAreas: [],
  jurisdictions: [],
  caseTypes: [],
  writingTone: "professional",
  writingStyle: "",
  preferredLanguage: "English",
  documentTemplates: [],
  aiPersonality: "Professional and thorough legal analyst",
  responseStyle: "Comprehensive yet concise",
  keyPhrases: [],
  avoidPhrases: [],
  emailSignature: "",
  documentSignature: "",
  staffMembers: [],
  customTemplates: []
};

export default function AttorneySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<AttorneyProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPracticeArea, setNewPracticeArea] = useState("");
  const [newJurisdiction, setNewJurisdiction] = useState("");
  const [newCaseType, setNewCaseType] = useState("");
  const [newKeyPhrase, setNewKeyPhrase] = useState("");
  const [newAvoidPhrase, setNewAvoidPhrase] = useState("");
  const [newStaffMember, setNewStaffMember] = useState<Partial<StaffMember>>({});
  const [showStaffDialog, setShowStaffDialog] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/attorney-profile");
      if (response.ok) {
        const data = await response.json();
        setProfile({ ...defaultProfile, ...data });
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/attorney-profile", profile);
      queryClient.invalidateQueries({ queryKey: ["/api/attorney-profile"] });
      toast({
        title: "✅ Profile Saved",
        description: "Your attorney profile and knowledge base have been updated."
      });
    } catch (error) {
      toast({
        title: "❌ Save Failed",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (field: keyof AttorneyProfile, value: string) => {
    if (!value.trim()) return;
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }));
  };

  const removeItem = (field: keyof AttorneyProfile, index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addStaffMember = () => {
    if (!newStaffMember.name) return;
    const staff: StaffMember = {
      id: Date.now().toString(),
      name: newStaffMember.name || "",
      title: newStaffMember.title || "Staff",
      email: newStaffMember.email || "",
      phone: newStaffMember.phone || "",
      isAttorney: newStaffMember.isAttorney || false
    };
    setProfile(prev => ({
      ...prev,
      staffMembers: [...prev.staffMembers, staff]
    }));
    setNewStaffMember({});
    setShowStaffDialog(false);
  };

  const removeStaffMember = (id: string) => {
    setProfile(prev => ({
      ...prev,
      staffMembers: prev.staffMembers.filter(s => s.id !== id)
    }));
  };

  const generateSignature = () => {
    const signature = `${profile.attorneyName}
${profile.title}
${profile.firmName}
${profile.barNumber ? `Bar No. ${profile.barNumber}` : ""}
${profile.directPhone ? `Direct: ${profile.directPhone}` : ""}
${profile.directEmail || profile.firmEmail}
${profile.firmAddress}`;
    
    setProfile(prev => ({
      ...prev,
      emailSignature: signature,
      documentSignature: signature
    }));
    
    toast({
      title: "✅ Signature Generated",
      description: "Email and document signatures have been auto-generated."
    });
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-8 w-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                  Attorney Knowledge Base
                </h1>
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Training
                </Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Configure your firm profile, writing style, and AI training data
              </p>
            </div>

            <Tabs defaultValue="firm" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="firm">
                  <Building2 className="w-4 h-4 mr-2" />
                  Firm Info
                </TabsTrigger>
                <TabsTrigger value="practice">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Practice
                </TabsTrigger>
                <TabsTrigger value="style">
                  <PenTool className="w-4 h-4 mr-2" />
                  Writing Style
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Training
                </TabsTrigger>
                <TabsTrigger value="staff">
                  <Users className="w-4 h-4 mr-2" />
                  Staff
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <FileText className="w-4 h-4 mr-2" />
                  Templates
                </TabsTrigger>
              </TabsList>

              {/* Firm Information */}
              <TabsContent value="firm">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Firm Information
                    </CardTitle>
                    <CardDescription>
                      Your law firm details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Firm Name</Label>
                        <Input
                          value={profile.firmName}
                          onChange={(e) => setProfile(prev => ({ ...prev, firmName: e.target.value }))}
                          placeholder="Smith & Associates Law Firm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input
                          value={profile.firmWebsite}
                          onChange={(e) => setProfile(prev => ({ ...prev, firmWebsite: e.target.value }))}
                          placeholder="www.smithlaw.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={profile.firmAddress}
                        onChange={(e) => setProfile(prev => ({ ...prev, firmAddress: e.target.value }))}
                        placeholder="123 Main Street, Suite 500&#10;Miami, FL 33131"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Main Phone</Label>
                        <Input
                          value={profile.firmPhone}
                          onChange={(e) => setProfile(prev => ({ ...prev, firmPhone: e.target.value }))}
                          placeholder="(305) 555-0123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Main Email</Label>
                        <Input
                          value={profile.firmEmail}
                          onChange={(e) => setProfile(prev => ({ ...prev, firmEmail: e.target.value }))}
                          placeholder="info@smithlaw.com"
                        />
                      </div>
                    </div>

                    <Separator />

                    <h3 className="font-semibold text-lg">Attorney Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Your Name</Label>
                        <Input
                          value={profile.attorneyName}
                          onChange={(e) => setProfile(prev => ({ ...prev, attorneyName: e.target.value }))}
                          placeholder="John Smith"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Select
                          value={profile.title}
                          onValueChange={(value) => setProfile(prev => ({ ...prev, title: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Attorney">Attorney</SelectItem>
                            <SelectItem value="Partner">Partner</SelectItem>
                            <SelectItem value="Associate">Associate</SelectItem>
                            <SelectItem value="Senior Partner">Senior Partner</SelectItem>
                            <SelectItem value="Managing Partner">Managing Partner</SelectItem>
                            <SelectItem value="Of Counsel">Of Counsel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bar Number</Label>
                        <Input
                          value={profile.barNumber}
                          onChange={(e) => setProfile(prev => ({ ...prev, barNumber: e.target.value }))}
                          placeholder="FL Bar #123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Direct Phone</Label>
                        <Input
                          value={profile.directPhone}
                          onChange={(e) => setProfile(prev => ({ ...prev, directPhone: e.target.value }))}
                          placeholder="(305) 555-0456"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Direct Email</Label>
                      <Input
                        value={profile.directEmail}
                        onChange={(e) => setProfile(prev => ({ ...prev, directEmail: e.target.value }))}
                        placeholder="john@smithlaw.com"
                      />
                    </div>

                    <Button onClick={generateSignature} variant="outline">
                      <PenTool className="w-4 h-4 mr-2" />
                      Auto-Generate Signatures
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Practice Areas */}
              <TabsContent value="practice">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Scope of Practice
                    </CardTitle>
                    <CardDescription>
                      Define your practice areas and jurisdictions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Practice Areas */}
                    <div className="space-y-2">
                      <Label>Practice Areas</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newPracticeArea}
                          onChange={(e) => setNewPracticeArea(e.target.value)}
                          placeholder="e.g., Personal Injury"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addItem('practiceAreas', newPracticeArea);
                              setNewPracticeArea("");
                            }
                          }}
                        />
                        <Button 
                          onClick={() => {
                            addItem('practiceAreas', newPracticeArea);
                            setNewPracticeArea("");
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.practiceAreas.map((area, idx) => (
                          <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                            {area}
                            <button 
                              onClick={() => removeItem('practiceAreas', idx)}
                              className="ml-1 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Jurisdictions */}
                    <div className="space-y-2">
                      <Label>Jurisdictions</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newJurisdiction}
                          onChange={(e) => setNewJurisdiction(e.target.value)}
                          placeholder="e.g., Florida State Courts"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addItem('jurisdictions', newJurisdiction);
                              setNewJurisdiction("");
                            }
                          }}
                        />
                        <Button 
                          onClick={() => {
                            addItem('jurisdictions', newJurisdiction);
                            setNewJurisdiction("");
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.jurisdictions.map((jurisdiction, idx) => (
                          <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                            {jurisdiction}
                            <button 
                              onClick={() => removeItem('jurisdictions', idx)}
                              className="ml-1 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Case Types */}
                    <div className="space-y-2">
                      <Label>Case Types You Handle</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newCaseType}
                          onChange={(e) => setNewCaseType(e.target.value)}
                          placeholder="e.g., Motor Vehicle Accidents"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addItem('caseTypes', newCaseType);
                              setNewCaseType("");
                            }
                          }}
                        />
                        <Button 
                          onClick={() => {
                            addItem('caseTypes', newCaseType);
                            setNewCaseType("");
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.caseTypes.map((caseType, idx) => (
                          <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                            {caseType}
                            <button 
                              onClick={() => removeItem('caseTypes', idx)}
                              className="ml-1 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Writing Style */}
              <TabsContent value="style">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      Writing Style & Tone
                    </CardTitle>
                    <CardDescription>
                      Define how AI should write on your behalf
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Writing Tone</Label>
                      <Select
                        value={profile.writingTone}
                        onValueChange={(value: any) => setProfile(prev => ({ ...prev, writingTone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal - Traditional legal writing</SelectItem>
                          <SelectItem value="professional">Professional - Modern business style</SelectItem>
                          <SelectItem value="assertive">Assertive - Strong advocacy</SelectItem>
                          <SelectItem value="diplomatic">Diplomatic - Collaborative approach</SelectItem>
                          <SelectItem value="aggressive">Aggressive - Hard-hitting litigation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Writing Style Description</Label>
                      <Textarea
                        value={profile.writingStyle}
                        onChange={(e) => setProfile(prev => ({ ...prev, writingStyle: e.target.value }))}
                        placeholder="Describe your writing style... (e.g., 'I prefer concise paragraphs, active voice, and clear headings. Avoid flowery language.')"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Language</Label>
                      <Input
                        value={profile.preferredLanguage}
                        onChange={(e) => setProfile(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                        placeholder="English (US), Spanish, etc."
                      />
                    </div>

                    <Separator />

                    <h3 className="font-semibold">Email Signature</h3>
                    <Textarea
                      value={profile.emailSignature}
                      onChange={(e) => setProfile(prev => ({ ...prev, emailSignature: e.target.value }))}
                      placeholder="Your email signature will appear at the bottom of AI-generated emails..."
                      rows={6}
                    />

                    <h3 className="font-semibold">Document Signature</h3>
                    <Textarea
                      value={profile.documentSignature}
                      onChange={(e) => setProfile(prev => ({ ...prev, documentSignature: e.target.value }))}
                      placeholder="Your document signature block..."
                      rows={6}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Training */}
              <TabsContent value="ai">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Training & Personality
                    </CardTitle>
                    <CardDescription>
                      Train the AI to respond like you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>AI Personality</Label>
                      <Textarea
                        value={profile.aiPersonality}
                        onChange={(e) => setProfile(prev => ({ ...prev, aiPersonality: e.target.value }))}
                        placeholder="Describe how the AI should act... (e.g., 'Act as a seasoned personal injury attorney with 20 years of experience. Be confident but respectful.')"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Response Style</Label>
                      <Textarea
                        value={profile.responseStyle}
                        onChange={(e) => setProfile(prev => ({ ...prev, responseStyle: e.target.value }))}
                        placeholder="How should the AI structure responses? (e.g., 'Always provide actionable advice, cite relevant statutes, and suggest next steps.')"
                        rows={3}
                      />
                    </div>

                    {/* Key Phrases */}
                    <div className="space-y-2">
                      <Label>Phrases to Include</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newKeyPhrase}
                          onChange={(e) => setNewKeyPhrase(e.target.value)}
                          placeholder="e.g., 'We strongly advocate'"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addItem('keyPhrases', newKeyPhrase);
                              setNewKeyPhrase("");
                            }
                          }}
                        />
                        <Button 
                          onClick={() => {
                            addItem('keyPhrases', newKeyPhrase);
                            setNewKeyPhrase("");
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.keyPhrases.map((phrase, idx) => (
                          <Badge key={idx} variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                            {phrase}
                            <button 
                              onClick={() => removeItem('keyPhrases', idx)}
                              className="ml-1 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Avoid Phrases */}
                    <div className="space-y-2">
                      <Label>Phrases to Avoid</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newAvoidPhrase}
                          onChange={(e) => setNewAvoidPhrase(e.target.value)}
                          placeholder="e.g., 'I think' or 'Maybe'"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addItem('avoidPhrases', newAvoidPhrase);
                              setNewAvoidPhrase("");
                            }
                          }}
                        />
                        <Button 
                          onClick={() => {
                            addItem('avoidPhrases', newAvoidPhrase);
                            setNewAvoidPhrase("");
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.avoidPhrases.map((phrase, idx) => (
                          <Badge key={idx} variant="destructive" className="flex items-center gap-1">
                            {phrase}
                            <button 
                              onClick={() => removeItem('avoidPhrases', idx)}
                              className="ml-1 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Staff */}
              <TabsContent value="staff">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Staff Members
                    </CardTitle>
                    <CardDescription>
                      Add your team members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
                      <DialogTrigger asChild>
                        <Button className="mb-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Staff Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Staff Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              value={newStaffMember.name || ""}
                              onChange={(e) => setNewStaffMember(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Jane Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={newStaffMember.title || ""}
                              onChange={(e) => setNewStaffMember(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Paralegal"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              value={newStaffMember.email || ""}
                              onChange={(e) => setNewStaffMember(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="jane@firm.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              value={newStaffMember.phone || ""}
                              onChange={(e) => setNewStaffMember(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="(305) 555-0123"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isAttorney"
                              checked={newStaffMember.isAttorney || false}
                              onChange={(e) => setNewStaffMember(prev => ({ ...prev, isAttorney: e.target.checked }))}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="isAttorney">Is Attorney</Label>
                          </div>
                          <Button onClick={addStaffMember} className="w-full">
                            Add Member
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="space-y-2">
                      {profile.staffMembers.map((staff) => (
                        <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {staff.name}
                              {staff.isAttorney && (
                                <Badge variant="secondary" className="text-xs">Attorney</Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-600">{staff.title}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {staff.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {staff.phone}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStaffMember(staff.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Templates */}
              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Templates
                    </CardTitle>
                    <CardDescription>
                      Manage your custom document templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Document templates can be created and managed from the Document Generation page.
                    </p>
                    <Button onClick={() => window.location.href = "/document-generation/templates"}>
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Templates
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={saveProfile}
                disabled={isSaving}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
