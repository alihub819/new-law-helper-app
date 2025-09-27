import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const { data: searchHistory } = useQuery({
    queryKey: ["/api/search-history"],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigateToAISearch = (tab?: string) => {
    if (tab) {
      setLocation(`/ai-search/${tab}`);
    } else {
      setLocation("/ai-search");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getFirstName = (name: string) => {
    return name.split(" ")[0];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <i className="fas fa-balance-scale text-2xl text-primary"></i>
              <h1 className="text-xl font-semibold text-foreground">LawHub</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-muted-foreground hover:text-foreground" data-testid="button-notifications">
                <i className="fas fa-bell text-lg"></i>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium" data-testid="text-user-initials">
                    {user?.name ? getInitials(user.name) : "U"}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground" data-testid="text-username">
                  {user?.name || "User"}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  data-testid="button-logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, <span data-testid="text-user-firstname">{user?.name ? getFirstName(user.name) : "User"}</span>
          </h2>
          <p className="text-muted-foreground">Access your AI-powered legal research tools</p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigateToAISearch()}
            data-testid="card-legal-research"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-search text-xl text-blue-600"></i>
                </div>
                <i className="fas fa-arrow-right text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Legal Research</h3>
              <p className="text-muted-foreground text-sm">Search through U.S. statutes, case law, and regulations with AI assistance</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigateToAISearch('brief-summarizer')}
            data-testid="card-brief-summarizer"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-text text-xl text-green-600"></i>
                </div>
                <i className="fas fa-arrow-right text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Brief Summarizer</h3>
              <p className="text-muted-foreground text-sm">Upload legal documents and get AI-generated summaries</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigateToAISearch('risk-analysis')}
            data-testid="card-risk-analysis"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-xl text-amber-600"></i>
                </div>
                <i className="fas fa-arrow-right text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Risk Analysis</h3>
              <p className="text-muted-foreground text-sm">Predict legal success chances based on precedent data</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {searchHistory && searchHistory.length > 0 ? (
                searchHistory.map((item: any, index: number) => (
                  <div key={item.id} className="flex items-center space-x-3 py-2" data-testid={`activity-item-${index}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === 'legal-research' ? 'bg-blue-100' :
                      item.type === 'brief-summarizer' ? 'bg-green-100' :
                      'bg-amber-100'
                    }`}>
                      <i className={`text-sm ${
                        item.type === 'legal-research' ? 'fas fa-search text-blue-600' :
                        item.type === 'brief-summarizer' ? 'fas fa-file-text text-green-600' :
                        'fas fa-chart-line text-amber-600'
                      }`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.query}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-2">Start using our AI tools to see your activity here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
