import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VoiceControlContextType {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  supported: boolean;
  lastCommand: string;
}

const VoiceControlContext = createContext<VoiceControlContextType | null>(null);

// Demo data creation function
const createDemoEnvironment = async () => {
  try {
    const response = await apiRequest("POST", "/api/demo-entry", {});
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to create demo environment:", error);
    throw error;
  }
};

export const VoiceControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("🎤 Voice Command Received:", transcript);
        setLastCommand(transcript);
        handleCommand(transcript);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recog.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({ 
            title: "Microphone Access Denied", 
            description: "Please allow microphone access in your browser settings",
            variant: "destructive" 
          });
        }
      };

      setRecognition(recog);
      setSupported(true);
    }
  }, []);

  const handleCommand = useCallback(async (command: string) => {
    // Demo Mode Commands
    if (command.includes("activate demo") || command.includes("start demo") || command.includes("load demo")) {
      toast({ title: "🎬 Demo Mode", description: "Creating comprehensive demo environment..." });
      try {
        const demoData = await createDemoEnvironment();
        toast({ 
          title: "✅ Demo Ready", 
          description: `Created ${demoData.demoData.cases.length} cases, ${demoData.demoData.clients.length} clients, and more!`,
          duration: 5000
        });
        setLocation("/dashboard");
      } catch (error) {
        toast({ title: "❌ Demo Error", description: "Failed to create demo environment", variant: "destructive" });
      }
      return;
    }

    if (command.includes("demo login") || command.includes("login as demo")) {
      try {
        const response = await apiRequest("POST", "/api/demo-login", {});
        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        toast({ title: "✅ Demo Login", description: "Logged in as Demo User" });
        setLocation("/dashboard");
      } catch (error) {
        toast({ title: "❌ Login Error", description: "Failed to login as demo user", variant: "destructive" });
      }
      return;
    }

    // Virtual Front Desk
    if (command.includes("open assistant") || command.includes("show assistant") || command.includes("virtual desk") || command.includes("front desk")) {
      const vfdButton = document.querySelector('[data-testid="virtual-front-desk-button"]') as HTMLElement;
      if (vfdButton) {
        vfdButton.click();
        toast({ title: "🎙️ Virtual Front Desk", description: "Opening AI assistant..." });
      } else {
        // Try to find by class or other attributes
        const buttons = Array.from(document.querySelectorAll('button'));
        const assistantBtn = buttons.find(btn => btn.textContent?.toLowerCase().includes('assistant') || 
          btn.getAttribute('aria-label')?.toLowerCase().includes('assistant'));
        if (assistantBtn) {
          (assistantBtn as HTMLElement).click();
          toast({ title: "🎙️ Virtual Front Desk", description: "Opening AI assistant..." });
        }
      }
      return;
    }

    // Navigation commands - Pages
    if (command.includes("go to dashboard") || command.includes("open dashboard")) {
      setLocation("/dashboard");
      toast({ title: "📊 Dashboard", description: "Navigating to Dashboard" });
    } 
    else if (command.includes("go to my cases") || command.includes("show my cases") || command.includes("open cases")) {
      setLocation("/my-cases");
      toast({ title: "📁 My Cases", description: "Navigating to My Cases" });
    } 
    else if (command.includes("go to ai search") || command.includes("open ai search") || command.includes("legal research")) {
      setLocation("/ai-search/legal-research");
      toast({ title: "🔍 AI Legal Research", description: "Navigating to AI Search" });
    } 
    else if (command.includes("document generation") || command.includes("generate document") || command.includes("create document")) {
      setLocation("/document-generation/letters");
      toast({ title: "📝 Document Generation", description: "Navigating to Document Generator" });
    } 
    else if (command.includes("document analyzer") || command.includes("analyze document") || command.includes("upload document")) {
      setLocation("/document-analyzer");
      toast({ title: "📄 Document Analyzer", description: "Navigating to Document Analyzer" });
    } 
    else if (command.includes("medical intelligence") || command.includes("medical records")) {
      setLocation("/medical-intelligence");
      toast({ title: "🏥 Medical Intelligence", description: "Navigating to Medical Intelligence" });
    } 
    else if (command.includes("demand letter") || command.includes("create demand letter")) {
      setLocation("/demand-letter");
      toast({ title: "📨 Demand Letter", description: "Navigating to Demand Letter Generator" });
    } 
    else if (command.includes("discovery tools") || command.includes("discovery response")) {
      setLocation("/discovery-tools");
      toast({ title: "⚖️ Discovery Tools", description: "Navigating to Discovery Tools" });
    } 
    else if (command.includes("saved documents") || command.includes("my documents")) {
      setLocation("/saved-documents");
      toast({ title: "📚 Saved Documents", description: "Navigating to Saved Documents" });
    } 
    else if (command.includes("transcription") || command.includes("transcribe")) {
      setLocation("/transcription");
      toast({ title: "🎤 Transcription", description: "Navigating to Transcription" });
    } 
    else if (command.includes("video call") || command.includes("start call")) {
      setLocation("/video-call");
      toast({ title: "📹 Video Call", description: "Navigating to Video Call" });
    }
    else if (command.includes("appointments") || command.includes("calendar") || command.includes("schedule")) {
      setLocation("/appointments");
      toast({ title: "📅 Appointments", description: "Navigating to Appointments" });
    }

    // Case Management Commands
    else if (command.includes("create new case") || command.includes("add case") || command.includes("new case")) {
      setLocation("/my-cases");
      setTimeout(() => {
        const createBtn = document.querySelector('[data-testid="button-create-case"]') as HTMLElement;
        if (createBtn) {
          createBtn.click();
          toast({ title: "➕ New Case", description: "Opening case creation form" });
        } else {
          toast({ title: "New Case", description: "Navigate to My Cases and click 'New Case' button" });
        }
      }, 500);
    }

    // Document Generation Commands
    else if (command.includes("create letter") || command.includes("write letter")) {
      setLocation("/document-generation/letters");
      toast({ title: "✉️ Letter", description: "Navigating to Letter Generator" });
    }
    else if (command.includes("create contract") || command.includes("write contract")) {
      setLocation("/document-generation/contracts");
      toast({ title: "📋 Contract", description: "Navigating to Contract Generator" });
    }
    else if (command.includes("create motion") || command.includes("write motion")) {
      setLocation("/document-generation/motions");
      toast({ title: "⚖️ Motion", description: "Navigating to Motion Generator" });
    }

    // Search Commands
    else if (command.includes("search cases")) {
      toast({ title: "🔍 Search", description: "Activate search on current page" });
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLElement;
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Action Commands
    else if (command.includes("refresh page") || command.includes("reload page")) {
      window.location.reload();
      toast({ title: "🔄 Refresh", description: "Reloading page..." });
    }
    else if (command.includes("go back") || command.includes("back page")) {
      window.history.back();
      toast({ title: "← Back", description: "Going back..." });
    }
    else if (command.includes("scroll down")) {
      window.scrollBy({ top: 500, behavior: 'smooth' });
    }
    else if (command.includes("scroll up")) {
      window.scrollBy({ top: -500, behavior: 'smooth' });
    }
    else if (command.includes("scroll to top")) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast({ title: "⬆️ Top", description: "Scrolled to top" });
    }

    // Help Command
    else if (command.includes("help") || command.includes("what can i say") || command.includes("voice commands")) {
      toast({ 
        title: "🎤 Voice Commands Available", 
        description: "Navigation: 'go to dashboard', 'go to my cases', 'go to ai search', etc. Actions: 'create new case', 'activate demo', 'open assistant', 'search cases'. Say 'help' anytime!",
        duration: 8000
      });
    }

    // Click commands (generic)
    else if (command.startsWith("click ")) {
      const target = command.replace("click ", "").trim();
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]'));

      const match = buttons.find(el => {
        const textContent = el.textContent?.toLowerCase() || "";
        const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
        const title = el.getAttribute("title")?.toLowerCase() || "";
        const value = (el as HTMLInputElement).value?.toLowerCase() || "";

        return textContent.includes(target) ||
               ariaLabel.includes(target) ||
               title.includes(target) ||
               value.includes(target);
      });

      if (match) {
        (match as HTMLElement).click();
        toast({ title: "👆 Click", description: `Clicking "${target}"` });
      } else {
        toast({ title: "❌ Not Found", description: `Could not find "${target}"`, variant: "destructive" });
      }
    }
    
    // Unknown command feedback
    else {
      toast({ 
        title: "🤔 Unknown Command", 
        description: `"${command}" - Say "help" for available commands`,
        variant: "default"
      });
    }
  }, [setLocation, toast]);

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        setIsListening(true);
        toast({ title: "🎤 Voice Control Active", description: "Say 'help' for commands" });
      } catch (e) {
        console.error("Failed to start recognition:", e);
        toast({ title: "❌ Error", description: "Could not start voice recognition", variant: "destructive" });
      }
    } else {
      toast({ title: "❌ Not Supported", description: "Voice recognition not supported in this browser", variant: "destructive" });
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      toast({ title: "🛑 Voice Control Stopped", description: "Voice commands disabled" });
    }
  };

  return (
    <VoiceControlContext.Provider value={{ isListening, startListening, stopListening, supported, lastCommand }}>
      {children}
    </VoiceControlContext.Provider>
  );
};

export const useVoiceControl = () => {
  const context = useContext(VoiceControlContext);
  if (!context) {
    throw new Error("useVoiceControl must be used within a VoiceControlProvider");
  }
  return context;
};
