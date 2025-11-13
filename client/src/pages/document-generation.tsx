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

// Document-specific form configurations
const documentFormConfigs: Record<string, {
  name: string;
  category: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'select' | 'email' | 'tel';
    placeholder?: string;
    required?: boolean;
    options?: string[];
    section: string;
  }>;
}> = {
  'business-letter': {
    name: 'Business Letter',
    category: 'letters',
    fields: [
      { name: 'senderName', label: 'Your Full Name', type: 'text', placeholder: 'John Smith', required: true, section: 'sender' },
      { name: 'senderTitle', label: 'Your Title/Position', type: 'text', placeholder: 'Manager', section: 'sender' },
      { name: 'senderCompany', label: 'Your Company', type: 'text', placeholder: 'ABC Corporation', required: true, section: 'sender' },
      { name: 'senderAddress', label: 'Your Address', type: 'textarea', placeholder: '123 Main Street\nSuite 100\nNew York, NY 10001', required: true, section: 'sender' },
      { name: 'senderPhone', label: 'Your Phone', type: 'tel', placeholder: '(555) 123-4567', section: 'sender' },
      { name: 'senderEmail', label: 'Your Email', type: 'email', placeholder: 'john@company.com', section: 'sender' },
      { name: 'recipientName', label: 'Recipient Name', type: 'text', placeholder: 'Jane Doe', required: true, section: 'recipient' },
      { name: 'recipientTitle', label: 'Recipient Title', type: 'text', placeholder: 'Director', section: 'recipient' },
      { name: 'recipientCompany', label: 'Recipient Company', type: 'text', placeholder: 'XYZ Corp', required: true, section: 'recipient' },
      { name: 'recipientAddress', label: 'Recipient Address', type: 'textarea', placeholder: '456 Business Ave\nFloor 5\nLos Angeles, CA 90210', required: true, section: 'recipient' },
      { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Re: Business Proposal', required: true, section: 'content' },
      { name: 'purpose', label: 'Purpose of Letter', type: 'textarea', placeholder: 'State the main purpose and key points...', required: true, section: 'content' },
      { name: 'callToAction', label: 'Call to Action', type: 'textarea', placeholder: 'What do you want the recipient to do?', section: 'content' }
    ]
  },
  'cover-letter': {
    name: 'Cover Letter',
    category: 'letters',
    fields: [
      { name: 'applicantName', label: 'Your Full Name', type: 'text', placeholder: 'John Smith', required: true, section: 'sender' },
      { name: 'applicantAddress', label: 'Your Address', type: 'textarea', placeholder: '123 Main Street\nNew York, NY 10001', required: true, section: 'sender' },
      { name: 'applicantPhone', label: 'Your Phone', type: 'tel', placeholder: '(555) 123-4567', required: true, section: 'sender' },
      { name: 'applicantEmail', label: 'Your Email', type: 'email', placeholder: 'john@email.com', required: true, section: 'sender' },
      { name: 'hiringManager', label: 'Hiring Manager Name', type: 'text', placeholder: 'Jane Doe', section: 'recipient' },
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'ABC Corporation', required: true, section: 'recipient' },
      { name: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: '456 Business Ave\nLos Angeles, CA 90210', section: 'recipient' },
      { name: 'jobTitle', label: 'Job Title', type: 'text', placeholder: 'Senior Software Engineer', required: true, section: 'content' },
      { name: 'jobReference', label: 'Job Reference/ID', type: 'text', placeholder: 'Job #12345', section: 'content' },
      { name: 'experience', label: 'Relevant Experience', type: 'textarea', placeholder: 'Describe your relevant experience and achievements...', required: true, section: 'content' },
      { name: 'skills', label: 'Key Skills', type: 'textarea', placeholder: 'List your most relevant skills...', section: 'content' },
      { name: 'motivation', label: 'Why This Company', type: 'textarea', placeholder: 'Why do you want to work for this company?', section: 'content' }
    ]
  },
  'recommendation-letter': {
    name: 'Recommendation Letter',
    category: 'letters',
    fields: [
      { name: 'recommenderName', label: 'Your Full Name', type: 'text', placeholder: 'Dr. John Smith', required: true, section: 'sender' },
      { name: 'recommenderTitle', label: 'Your Title/Position', type: 'text', placeholder: 'Professor of Computer Science', required: true, section: 'sender' },
      { name: 'recommenderInstitution', label: 'Your Institution/Company', type: 'text', placeholder: 'University of Technology', required: true, section: 'sender' },
      { name: 'recommenderAddress', label: 'Your Address', type: 'textarea', placeholder: '123 University Ave\nTech City, TX 75001', section: 'sender' },
      { name: 'recommenderPhone', label: 'Your Phone', type: 'tel', placeholder: '(555) 123-4567', section: 'sender' },
      { name: 'recommenderEmail', label: 'Your Email', type: 'email', placeholder: 'john.smith@university.edu', required: true, section: 'sender' },
      { name: 'candidateName', label: 'Person Being Recommended', type: 'text', placeholder: 'Jane Doe', required: true, section: 'content' },
      { name: 'relationshipLength', label: 'How Long Have You Known Them', type: 'text', placeholder: '3 years', required: true, section: 'content' },
      { name: 'relationshipContext', label: 'In What Capacity', type: 'text', placeholder: 'Student in my advanced algorithms course', required: true, section: 'content' },
      { name: 'strengths', label: 'Key Strengths', type: 'textarea', placeholder: 'Describe their main strengths and abilities...', required: true, section: 'content' },
      { name: 'specificExamples', label: 'Specific Examples', type: 'textarea', placeholder: 'Provide specific examples of their achievements...', section: 'content' },
      { name: 'recommendation', label: 'Recommendation Level', type: 'select', options: ['Highly Recommend', 'Recommend', 'Recommend with Reservations'], required: true, section: 'content' }
    ]
  },
  'service-agreement': {
    name: 'Service Agreement',
    category: 'contracts',
    fields: [
      { name: 'providerName', label: 'Service Provider Name', type: 'text', placeholder: 'John Smith Consulting LLC', required: true, section: 'provider' },
      { name: 'providerAddress', label: 'Provider Address', type: 'textarea', placeholder: '123 Business St\nNew York, NY 10001', required: true, section: 'provider' },
      { name: 'clientName', label: 'Client Name', type: 'text', placeholder: 'ABC Corporation', required: true, section: 'client' },
      { name: 'clientAddress', label: 'Client Address', type: 'textarea', placeholder: '456 Corporate Blvd\nLos Angeles, CA 90210', required: true, section: 'client' },
      { name: 'serviceDescription', label: 'Service Description', type: 'textarea', placeholder: 'Detailed description of services to be provided...', required: true, section: 'terms' },
      { name: 'contractValue', label: 'Contract Value', type: 'text', placeholder: '$50,000', required: true, section: 'terms' },
      { name: 'paymentTerms', label: 'Payment Terms', type: 'text', placeholder: 'Net 30 days', required: true, section: 'terms' },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true, section: 'terms' },
      { name: 'endDate', label: 'End Date', type: 'date', section: 'terms' },
      { name: 'deliverables', label: 'Key Deliverables', type: 'textarea', placeholder: 'List main deliverables and milestones...', section: 'terms' },
      { name: 'governingLaw', label: 'Governing Law (State)', type: 'select', options: ['Alabama', 'California', 'Florida', 'New York', 'Texas', 'Other'], required: true, section: 'legal' }
    ]
  },
  'employment-contract': {
    name: 'Employment Contract',
    category: 'contracts',
    fields: [
      { name: 'employerName', label: 'Employer/Company Name', type: 'text', placeholder: 'ABC Corporation', required: true, section: 'employer' },
      { name: 'employerAddress', label: 'Employer Address', type: 'textarea', placeholder: '123 Corporate Ave\nNew York, NY 10001', required: true, section: 'employer' },
      { name: 'employeeName', label: 'Employee Name', type: 'text', placeholder: 'John Smith', required: true, section: 'employee' },
      { name: 'employeeAddress', label: 'Employee Address', type: 'textarea', placeholder: '456 Main St\nBrooklyn, NY 11201', required: true, section: 'employee' },
      { name: 'jobTitle', label: 'Job Title', type: 'text', placeholder: 'Senior Software Engineer', required: true, section: 'position' },
      { name: 'department', label: 'Department', type: 'text', placeholder: 'Engineering', section: 'position' },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true, section: 'position' },
      { name: 'salary', label: 'Annual Salary', type: 'text', placeholder: '$120,000', required: true, section: 'compensation' },
      { name: 'payFrequency', label: 'Pay Frequency', type: 'select', options: ['Weekly', 'Bi-weekly', 'Monthly'], required: true, section: 'compensation' },
      { name: 'benefits', label: 'Benefits Package', type: 'textarea', placeholder: 'Health insurance, dental, vision, 401k...', section: 'compensation' },
      { name: 'vacation', label: 'Vacation/PTO Days', type: 'text', placeholder: '20 days per year', section: 'compensation' },
      { name: 'workSchedule', label: 'Work Schedule', type: 'text', placeholder: 'Monday-Friday, 9 AM - 5 PM', section: 'position' },
      { name: 'probationPeriod', label: 'Probation Period', type: 'text', placeholder: '90 days', section: 'position' }
    ]
  },
  'job-application': {
    name: 'Job Application',
    category: 'applications',
    fields: [
      { name: 'applicantName', label: 'Full Name', type: 'text', placeholder: 'John Smith', required: true, section: 'personal' },
      { name: 'applicantAddress', label: 'Complete Address', type: 'textarea', placeholder: '123 Main Street\nNew York, NY 10001', required: true, section: 'personal' },
      { name: 'applicantPhone', label: 'Phone Number', type: 'tel', placeholder: '(555) 123-4567', required: true, section: 'personal' },
      { name: 'applicantEmail', label: 'Email Address', type: 'email', placeholder: 'john@email.com', required: true, section: 'personal' },
      { name: 'ssn', label: 'Social Security Number', type: 'text', placeholder: 'XXX-XX-XXXX', section: 'personal' },
      { name: 'positionApplied', label: 'Position Applied For', type: 'text', placeholder: 'Senior Software Engineer', required: true, section: 'position' },
      { name: 'salaryExpected', label: 'Expected Salary', type: 'text', placeholder: '$120,000', section: 'position' },
      { name: 'availableStartDate', label: 'Available Start Date', type: 'date', required: true, section: 'position' },
      { name: 'education', label: 'Highest Education', type: 'textarea', placeholder: 'Bachelor of Science in Computer Science\nUniversity of Technology, 2020', required: true, section: 'background' },
      { name: 'workExperience', label: 'Work Experience', type: 'textarea', placeholder: 'List your relevant work experience...', required: true, section: 'background' },
      { name: 'skills', label: 'Relevant Skills', type: 'textarea', placeholder: 'JavaScript, React, Node.js, Python...', section: 'background' },
      { name: 'references', label: 'Professional References', type: 'textarea', placeholder: 'Name, Title, Company, Phone, Email for each reference...', section: 'background' }
    ]
  },
  'visa-application': {
    name: 'Visa Application',
    category: 'applications',
    fields: [
      { name: 'applicantName', label: 'Full Legal Name', type: 'text', placeholder: 'John Smith', required: true, section: 'personal' },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'personal' },
      { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', placeholder: 'New York, NY, USA', required: true, section: 'personal' },
      { name: 'nationality', label: 'Nationality', type: 'text', placeholder: 'American', required: true, section: 'personal' },
      { name: 'passportNumber', label: 'Passport Number', type: 'text', placeholder: '123456789', required: true, section: 'personal' },
      { name: 'passportExpiry', label: 'Passport Expiry Date', type: 'date', required: true, section: 'personal' },
      { name: 'currentAddress', label: 'Current Address', type: 'textarea', placeholder: '123 Main Street\nNew York, NY 10001', required: true, section: 'personal' },
      { name: 'visaType', label: 'Visa Type', type: 'select', options: ['Tourist', 'Business', 'Student', 'Work', 'Transit'], required: true, section: 'visa' },
      { name: 'purposeOfTravel', label: 'Purpose of Travel', type: 'textarea', placeholder: 'Business meetings and conferences...', required: true, section: 'visa' },
      { name: 'durationOfStay', label: 'Intended Duration of Stay', type: 'text', placeholder: '2 weeks', required: true, section: 'visa' },
      { name: 'accommodationDetails', label: 'Accommodation Details', type: 'textarea', placeholder: 'Hotel name and address...', section: 'visa' },
      { name: 'financialSupport', label: 'Financial Support', type: 'textarea', placeholder: 'Self-funded, monthly income $8,000...', required: true, section: 'visa' }
    ]
  },
  'pi-car-accident': {
    name: 'Personal Injury - Car Accident',
    category: 'personal-injury',
    fields: [
      { name: 'clientName', label: 'Client Full Name', type: 'text', placeholder: 'John Smith', required: true, section: 'client' },
      { name: 'clientContact', label: 'Client Contact Number', type: 'tel', placeholder: '(555) 123-4567', required: true, section: 'client' },
      { name: 'clientEmail', label: 'Client Email', type: 'email', placeholder: 'client@email.com', section: 'client' },
      { name: 'caseId', label: 'Case ID Number', type: 'text', placeholder: 'PI-2025-001', required: true, section: 'client' },
      { name: 'accidentDate', label: 'Accident Date', type: 'date', required: true, section: 'accident' },
      { name: 'accidentLocation', label: 'Accident Location', type: 'textarea', placeholder: 'Intersection of Main St and 5th Ave, Los Angeles, CA', required: true, section: 'accident' },
      { name: 'vehicleYear', label: 'Client Vehicle Year', type: 'text', placeholder: '2020', section: 'accident' },
      { name: 'vehicleMake', label: 'Client Vehicle Make', type: 'text', placeholder: 'Toyota', section: 'accident' },
      { name: 'vehicleModel', label: 'Client Vehicle Model', type: 'text', placeholder: 'Camry', section: 'accident' },
      { name: 'policeReportNumber', label: 'Police Report Number', type: 'text', placeholder: 'RPT-12345678', section: 'accident' },
      { name: 'accidentDescription', label: 'Accident Description', type: 'textarea', placeholder: 'Detailed description of how the accident occurred...', required: true, section: 'accident' },
      { name: 'injuryType', label: 'Type of Injuries', type: 'textarea', placeholder: 'Whiplash, back pain, contusions...', required: true, section: 'injury' },
      { name: 'injurySeverity', label: 'Injury Severity', type: 'select', options: ['Minor', 'Moderate', 'Severe', 'Critical'], required: true, section: 'injury' },
      { name: 'medicalReports', label: 'Medical Reports/Treatments', type: 'textarea', placeholder: 'List of treating physicians, hospitals, diagnosis, treatment received...', required: true, section: 'injury' },
      { name: 'medicalExpenses', label: 'Total Medical Expenses', type: 'text', placeholder: '$25,000', section: 'injury' },
      { name: 'responsibleParty', label: 'Responsible Party Name', type: 'text', placeholder: 'Jane Doe', required: true, section: 'liability' },
      { name: 'responsiblePartyInsurance', label: 'At-Fault Party Insurance Company', type: 'text', placeholder: 'ABC Insurance Co.', section: 'liability' },
      { name: 'responsiblePartyPolicy', label: 'At-Fault Party Policy Number', type: 'text', placeholder: 'POL-987654', section: 'liability' },
      { name: 'evidenceCollected', label: 'Evidence Collected', type: 'textarea', placeholder: 'Photos, witness statements, traffic camera footage...', required: true, section: 'liability' },
      { name: 'attorneyName', label: 'Attorney Name', type: 'text', placeholder: 'Robert Johnson, Esq.', required: true, section: 'legal' },
      { name: 'firmName', label: 'Law Firm Name', type: 'text', placeholder: 'Johnson & Associates', required: true, section: 'legal' },
      { name: 'attorneyContact', label: 'Attorney Contact', type: 'tel', placeholder: '(555) 999-8888', required: true, section: 'legal' },
      { name: 'attorneyEmail', label: 'Attorney Email', type: 'email', placeholder: 'rjohnson@lawfirm.com', section: 'legal' },
      { name: 'barNumber', label: 'Bar Number', type: 'text', placeholder: 'CA-123456', section: 'legal' },
      { name: 'demandAmount', label: 'Settlement Demand Amount', type: 'text', placeholder: '$150,000', section: 'settlement' },
      { name: 'lostWages', label: 'Lost Wages', type: 'text', placeholder: '$10,000', section: 'settlement' },
      { name: 'painSuffering', label: 'Pain & Suffering Claim', type: 'text', placeholder: '$75,000', section: 'settlement' },
      { name: 'claimSummary', label: 'Claim Summary', type: 'textarea', placeholder: 'Summary of all damages, liability findings, and settlement justification...', required: true, section: 'settlement' }
    ]
  }
};

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
  },
  'personal-injury': {
    id: 'personal-injury',
    title: 'Personal Injury',
    icon: FileText,
    shortDescription: 'Generate PI case documents',
    description: 'Create comprehensive personal injury case documentation including car accidents, medical malpractice, and other tort claims following USA legal standards.',
    documentTypes: [
      { id: 'pi-car-accident', name: 'Car Accident Case', description: 'Personal injury car accident documentation' }
    ],
    features: [
      'USA legal compliance standards',
      'Medical documentation integration',
      'Insurance claim formatting',
      'Settlement calculation support',
      'Attorney representation details'
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
                <TabsList className="flex-shrink-0 grid grid-cols-4 min-w-full">
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
                <TabsList className="grid w-full grid-cols-4">
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

                          {inputMethod === 'manual' && selectedDocumentType && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">
                                  {documentFormConfigs[selectedDocumentType]?.name || selectedDocumentType} - Personalized Form
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  Fill out the specific fields below to generate a professionally formatted {documentFormConfigs[selectedDocumentType]?.name || selectedDocumentType} following USA standards
                                </p>
                              </CardHeader>
                              <CardContent>
                                {documentFormConfigs[selectedDocumentType] ? (
                                  <Form {...manualForm}>
                                    <form onSubmit={manualForm.handleSubmit(handleManualSubmit)} className="space-y-6">
                                      {/* Group fields by section */}
                                      {Object.entries(
                                        documentFormConfigs[selectedDocumentType].fields.reduce((sections, field) => {
                                          if (!sections[field.section]) {
                                            sections[field.section] = [];
                                          }
                                          sections[field.section].push(field);
                                          return sections;
                                        }, {} as Record<string, typeof documentFormConfigs[string]['fields']>)
                                      ).map(([sectionName, fields]) => (
                                        <div key={sectionName} className="space-y-4">
                                          <h4 className="font-medium text-sm text-primary capitalize">
                                            {sectionName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Information
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {fields.map((field) => (
                                              <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                                <FormField
                                                  control={manualForm.control}
                                                  name={field.name}
                                                  render={({ field: formField }) => (
                                                    <FormItem>
                                                      <FormLabel>
                                                        {field.label}
                                                        {field.required && ' *'}
                                                      </FormLabel>
                                                      <FormControl>
                                                        {field.type === 'textarea' ? (
                                                          <Textarea 
                                                            {...formField} 
                                                            placeholder={field.placeholder}
                                                            className="min-h-20"
                                                            data-testid={`textarea-${field.name}`}
                                                          />
                                                        ) : field.type === 'select' ? (
                                                          <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                                            <SelectTrigger data-testid={`select-${field.name}`}>
                                                              <SelectValue placeholder={`Select ${field.label}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                              {field.options?.map((option) => (
                                                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                                                                  {option}
                                                                </SelectItem>
                                                              ))}
                                                            </SelectContent>
                                                          </Select>
                                                        ) : (
                                                          <Input 
                                                            {...formField} 
                                                            type={field.type}
                                                            placeholder={field.placeholder}
                                                            data-testid={`input-${field.name}`}
                                                          />
                                                        )}
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}

                                      <div className="border-t pt-4">
                                        <Button 
                                          type="submit" 
                                          disabled={generateDocumentMutation.isPending}
                                          className="w-full md:w-auto"
                                          data-testid="button-generate-manual"
                                        >
                                          {generateDocumentMutation.isPending ? 
                                            `Generating ${documentFormConfigs[selectedDocumentType]?.name}...` : 
                                            `Generate Professional ${documentFormConfigs[selectedDocumentType]?.name}`
                                          }
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">
                                          * Required fields. Document will be generated following professional USA business standards for {documentFormConfigs[selectedDocumentType]?.name}.
                                        </p>
                                      </div>
                                    </form>
                                  </Form>
                                ) : (
                                  <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                      Personalized form configuration not available for this document type yet.
                                    </p>
                                  </div>
                                )}
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