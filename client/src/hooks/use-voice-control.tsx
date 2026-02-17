import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface VoiceControlContextType {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  supported: boolean;
}

const VoiceControlContext = createContext<VoiceControlContextType | null>(null);

export const VoiceControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
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
        console.log("Voice Command Received:", transcript);
        handleCommand(transcript);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recog.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      setRecognition(recog);
      setSupported(true);
    }
  }, []);

  const handleCommand = useCallback((command: string) => {
    // Navigation commands
    if (command.includes("go to dashboard")) {
      setLocation("/dashboard");
      toast({ title: "Voice Command", description: "Navigating to Dashboard" });
    } else if (command.includes("go to my cases") || command.includes("go to cases")) {
      setLocation("/my-cases");
      toast({ title: "Voice Command", description: "Navigating to My Cases" });
    } else if (command.includes("go to ai search") || command.includes("go to search")) {
      setLocation("/ai-search/legal-research");
      toast({ title: "Voice Command", description: "Navigating to AI Search" });
    } else if (command.includes("go to document generation") || command.includes("go to generate document")) {
      setLocation("/document-generation/letters");
      toast({ title: "Voice Command", description: "Navigating to Document Generation" });
    } else if (command.includes("go to document analyzer") || command.includes("go to analyzer")) {
      setLocation("/document-analyzer");
      toast({ title: "Voice Command", description: "Navigating to Document Analyzer" });
    } else if (command.includes("go to medical intelligence") || command.includes("go to medical")) {
      setLocation("/medical-intelligence");
      toast({ title: "Voice Command", description: "Navigating to Medical Intelligence" });
    } else if (command.includes("go to demand letter")) {
      setLocation("/demand-letter");
      toast({ title: "Voice Command", description: "Navigating to Demand Letter" });
    } else if (command.includes("go to discovery tools") || command.includes("go to discovery")) {
      setLocation("/discovery-tools");
      toast({ title: "Voice Command", description: "Navigating to Discovery Tools" });
    } else if (command.includes("go to saved documents") || command.includes("go to documents")) {
      setLocation("/saved-documents");
      toast({ title: "Voice Command", description: "Navigating to Saved Documents" });
    } else if (command.includes("go to transcription")) {
      setLocation("/transcription");
      toast({ title: "Voice Command", description: "Navigating to Transcription" });
    } else if (command.includes("go to video call")) {
      setLocation("/video-call");
      toast({ title: "Voice Command", description: "Navigating to Video Call" });
    }

    // Click commands
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
        toast({ title: "Voice Command", description: `Clicking "${target}"` });
      } else {
        toast({ title: "Voice Command", description: `Could not find "${target}"`, variant: "destructive" });
      }
    }
  }, [setLocation, toast]);

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        setIsListening(true);
        toast({ title: "Voice Control Active", description: "Listening for commands..." });
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      toast({ title: "Voice Control Inactive", description: "Stopped listening." });
    }
  };

  return (
    <VoiceControlContext.Provider value={{ isListening, startListening, stopListening, supported }}>
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
