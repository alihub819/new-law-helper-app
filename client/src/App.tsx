import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import AISearch from "@/pages/ai-search";
import DocumentGeneration from "@/pages/document-generation";
import DocumentAnalyzer from "@/pages/document-analyzer";
import MyCases from "@/pages/my-cases";
import LandingPage from "@/pages/landing-page";
import MedicalIntelligence from "@/pages/medical-intelligence";
import DemandLetter from "@/pages/demand-letter";
import DiscoveryTools from "@/pages/discovery-tools";
import CaseDetails from "@/pages/case-details";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/my-cases" component={MyCases} />
      <ProtectedRoute path="/cases/:id" component={CaseDetails} />
      <ProtectedRoute path="/ai-search/:tab?" component={AISearch} />
      <ProtectedRoute path="/document-generation/:tab?" component={DocumentGeneration} />
      <ProtectedRoute path="/document-analyzer" component={DocumentAnalyzer} />
      <ProtectedRoute path="/medical-intelligence" component={MedicalIntelligence} />
      <ProtectedRoute path="/demand-letter" component={DemandLetter} />
      <ProtectedRoute path="/discovery-tools" component={DiscoveryTools} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
