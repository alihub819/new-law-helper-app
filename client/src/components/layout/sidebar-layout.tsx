import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, Mic, MicOff, Play, X } from "lucide-react";
import { useState } from "react";
import { useVoiceControl } from "@/hooks/use-voice-control";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  testId: string;
}

const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt", path: "/dashboard", testId: "nav-dashboard" },
  { id: "my-cases", label: "My Cases", icon: "fas fa-briefcase", path: "/my-cases", testId: "nav-my-cases" },
  { id: "ai-search", label: "AI Search", icon: "fas fa-search", path: "/ai-search/legal-research", testId: "nav-ai-search" },
  { id: "document-generation", label: "Document Generation", icon: "fas fa-file-alt", path: "/document-generation/letters", testId: "nav-document-generation" },
  { id: "document-analyzer", label: "Document Analyzer", icon: "fas fa-chart-line", path: "/document-analyzer", testId: "nav-document-analyzer" },
  { id: "medical-intelligence", label: "Medical Intelligence", icon: "fas fa-heartbeat", path: "/medical-intelligence", testId: "nav-medical-intelligence" },
  { id: "demand-letter", label: "Demand Letter", icon: "fas fa-file-contract", path: "/demand-letter", testId: "nav-demand-letter" },
  { id: "discovery-tools", label: "Discovery Tools", icon: "fas fa-balance-scale-right", path: "/discovery-tools", testId: "nav-discovery-tools" },
  { id: "saved-documents", label: "Saved Documents", icon: "fas fa-save", path: "/saved-documents", testId: "nav-saved-documents" },
  { id: "transcription", label: "Transcription", icon: "fas fa-file-audio", path: "/transcription", testId: "nav-transcription" },
  { id: "video-call", label: "Video Call", icon: "fas fa-video", path: "/video-call", testId: "nav-video-call" },
  { id: "appointments", label: "Appointments", icon: "fas fa-calendar-check", path: "/appointments", testId: "nav-appointments" },
  { id: "attorney-settings", label: "Attorney Settings", icon: "fas fa-user-cog", path: "/attorney-settings", testId: "nav-attorney-settings" },
  { id: "practice-interview", label: "Practice Interview", icon: "fas fa-user-graduate", path: "/practice-interview", testId: "nav-practice-interview" }
];

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isListening, startListening, stopListening, supported, lastCommand } = useVoiceControl();

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => logoutMutation.mutate();

  const isActive = (path: string) => path === "/dashboard" ? location === "/dashboard" : location.startsWith(path);

  const handleNavigate = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800">
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-center items-center">
        <i className="fas fa-balance-scale text-2xl text-black dark:text-white mr-2"></i>
        <span className="font-bold text-lg hidden md:block">LawHelper</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 md:p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavigate(item.path)}
                data-testid={item.testId}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors",
                  isActive(item.path)
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-gray-600 hover:text-black hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-800"
                )}
              >
                <i className={`${item.icon} text-lg w-6 text-center`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium" data-testid="text-user-initials">
              {user?.name ? getInitials(user.name) : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-username">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</p>
          </div>
        </div>
        
        <Button
          variant="default"
          size="sm"
          onClick={async () => {
            try {
              const response = await fetch("/api/demo-entry", { method: "POST" });
              const data = await response.json();
              if (data.success) window.location.href = "/dashboard";
            } catch (error) {
              console.error("Demo activation failed:", error);
            }
          }}
          className="w-full mb-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Play className="h-4 w-4 mr-2" /> Activate Demo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> {logoutMutation.isPending ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex text-gray-900 dark:text-gray-100 font-sans">
      <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-64 h-full bg-white dark:bg-zinc-950 flex flex-col shadow-xl">
            <button className="absolute top-4 right-4 p-2 text-gray-500" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="lg:hidden p-2" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {navigationItems.find(item => isActive(item.path))?.label || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {supported && (
                <div className="flex items-center space-x-2">
                  {isListening && lastCommand && (
                    <span className="hidden md:inline text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      "{lastCommand}"
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isListening ? stopListening : startListening}
                    className={cn("rounded-full", isListening ? "text-red-500 animate-pulse" : "text-gray-500")}
                  >
                    {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}