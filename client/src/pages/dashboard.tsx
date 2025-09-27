import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: searchHistory } = useQuery({
    queryKey: ["/api/search-history"],
  });

  const navigateToAISearch = (tab?: string) => {
    if (tab) {
      setLocation(`/ai-search/${tab}`);
    } else {
      setLocation("/ai-search");
    }
  };

  const getFirstName = (name: string) => {
    return name.split(" ")[0];
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name ? getFirstName(user.name) : "User"}!
          </h1>
          <p className="text-muted-foreground">
            Ready to research legal cases and analyze documents with AI-powered tools.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToAISearch('legal-research')} data-testid="card-legal-research">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-search text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Legal Research</h3>
                  <p className="text-sm text-muted-foreground">Search case law, statutes & regulations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToAISearch('brief-summarizer')} data-testid="card-brief-summarizer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-text text-green-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Brief Summarizer</h3>
                  <p className="text-sm text-muted-foreground">Upload & analyze legal documents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToAISearch('risk-analysis')} data-testid="card-risk-analysis">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-red-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Risk Analysis</h3>
                  <p className="text-sm text-muted-foreground">Predict case success probability</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
            {searchHistory && Array.isArray(searchHistory) && searchHistory.length > 0 ? (
              <div className="space-y-4">
                {searchHistory.slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg" data-testid={`activity-item-${index}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <i className={`fas ${
                          item.type === 'legal-research' ? 'fa-search' :
                          item.type === 'brief-summarizer' ? 'fa-file-text' :
                          'fa-chart-line'
                        } text-muted-foreground`}></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.query}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.type.replace('-', ' ')} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${index}`}>
                      <i className="fas fa-eye"></i>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-history text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground mb-4">Start using AI tools to see your recent searches and analyses here.</p>
                <Button onClick={() => navigateToAISearch()} data-testid="button-start-search">
                  <i className="fas fa-search mr-2"></i>
                  Start AI Search
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground mb-1" data-testid="stat-searches">
                {Array.isArray(searchHistory) ? searchHistory.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Searches</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground mb-1" data-testid="stat-documents">
                {Array.isArray(searchHistory) ? searchHistory.filter((item: any) => item.type === 'brief-summarizer').length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Documents Analyzed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground mb-1" data-testid="stat-risks">
                {Array.isArray(searchHistory) ? searchHistory.filter((item: any) => item.type === 'risk-analysis').length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Risk Assessments</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}