import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, Mic, MicOff } from "lucide-react";
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
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "fas fa-tachometer-alt",
    path: "/dashboard",
    testId: "nav-dashboard"
  },
  {
    id: "my-cases",
    label: "My Cases",
    icon: "fas fa-briefcase",
    path: "/my-cases",
    testId: "nav-my-cases"
  },
  {
    id: "ai-search",
    label: "AI Search",
    icon: "fas fa-search",
    path: "/ai-search/legal-research",
    testId: "nav-ai-search"
  },
  {
    id: "document-generation",
    label: "Document Generation",
    icon: "fas fa-file-alt",
    path: "/document-generation/letters",
    testId: "nav-document-generation"
  },
  {
    id: "document-analyzer",
    label: "Document Analyzer",
    icon: "fas fa-chart-line",
    path: "/document-analyzer",
    testId: "nav-document-analyzer"
  },
  {
    id: "medical-intelligence",
    label: "Medical Intelligence",
    icon: "fas fa-heartbeat",
    path: "/medical-intelligence",
    testId: "nav-medical-intelligence"
  },
  {
    id: "demand-letter",
    label: "Demand Letter",
    icon: "fas fa-file-contract",
    path: "/demand-letter",
    testId: "nav-demand-letter"
  },
  {
    id: "discovery-tools",
    label: "Discovery Tools",
    icon: "fas fa-balance-scale-right",
    path: "/discovery-tools",
    testId: "nav-discovery-tools"
  },
  {
    id: "saved-documents",
    label: "Saved Documents",
    icon: "fas fa-save",
    path: "/saved-documents",
    testId: "nav-saved-documents"
  },
  {
    id: "transcription",
    label: "Transcription",
    icon: "fas fa-file-audio",
    path: "/transcription",
    testId: "nav-transcription"
  },
  {
    id: "video-call",
    label: "Video Call",
    icon: "fas fa-video",
    path: "/video-call",
    testId: "nav-video-call"
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: "fas fa-calendar-check",
    path: "/appointments",
    testId: "nav-appointments"
  }
];


export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isListening, startListening, stopListening, supported } = useVoiceControl();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location === "/dashboard";
    }
    return location.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <>
      {/* Sidebar Header - Minimalistic (Empty or small icon) */}
      <div className="p-4 md:p-6 border-b border-border flex justify-center">
        <i className="fas fa-balance-scale text-2xl text-primary"></i>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 md:p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavigate(item.path)}
                data-testid={item.testId}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 md:p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium" data-testid="text-user-initials">
              {user?.name ? getInitials(user.name) : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-username">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full"
          data-testid="button-logout"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          {logoutMutation.isPending ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-64 bg-card border-r border-border flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-full bg-card flex flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-card border-b border-border">
          <div className="px-3 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Mobile Menu Button - Only visible on mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2"
                  onClick={() => setIsMobileMenuOpen(true)}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation menu</span>
                </Button>

                <div>
                  <h2 className="text-base md:text-lg font-semibold text-foreground">
                    {navigationItems.find(item => isActive(item.path))?.label || "Dashboard"}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2 md:space-x-6">
                {/* Voice Control Toggle */}
                {supported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isListening ? stopListening : startListening}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      isListening ? "bg-red-100 text-red-600 animate-pulse" : "text-muted-foreground hover:text-primary"
                    )}
                    title={isListening ? "Stop Voice Control" : "Start Voice Control"}
                  >
                    {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                )}

                {/* Notifications */}
                <button
                  className="text-muted-foreground hover:text-foreground p-1"
                  data-testid="button-notifications"
                >
                  <i className="fas fa-bell text-lg"></i>
                </button>

                {/* Branding - Relocated to Right Side */}
                <div className="hidden md:flex items-center space-x-3 border-l border-border pl-6">
                  <i className="fas fa-balance-scale text-xl text-primary"></i>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    LawHelper
                  </h1>
                </div>

                {/* User info on mobile - simplified */}
                <div className="flex items-center space-x-2 lg:hidden">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">
                      {user?.name ? getInitials(user.name) : "U"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}