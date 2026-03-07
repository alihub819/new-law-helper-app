import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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

  const getFirstName = (name: string) => name.split(" ")[0];

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-light text-foreground mb-3">
            Welcome back, <span className="font-semibold">{user?.name ? getFirstName(user.name) : "User"}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Your legal research and document analysis hub.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div 
            onClick={() => navigateToAISearch('legal-research')} 
            className="group cursor-pointer p-6 border border-border hover:border-black dark:hover:border-white transition-all bg-card flex flex-col items-start justify-center"
          >
            <i className="fas fa-search text-2xl mb-4 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors"></i>
            <h3 className="font-medium text-lg mb-1">AI Legal Research</h3>
            <p className="text-sm text-muted-foreground">Search case law & statutes</p>
          </div>

          <div 
            onClick={() => navigateToAISearch('brief-summarizer')} 
            className="group cursor-pointer p-6 border border-border hover:border-black dark:hover:border-white transition-all bg-card flex flex-col items-start justify-center"
          >
            <i className="fas fa-file-text text-2xl mb-4 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors"></i>
            <h3 className="font-medium text-lg mb-1">Brief Summarizer</h3>
            <p className="text-sm text-muted-foreground">Upload & analyze documents</p>
          </div>

          <div 
            onClick={() => navigateToAISearch('risk-analysis')} 
            className="group cursor-pointer p-6 border border-border hover:border-black dark:hover:border-white transition-all bg-card flex flex-col items-start justify-center"
          >
            <i className="fas fa-chart-line text-2xl mb-4 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors"></i>
            <h3 className="font-medium text-lg mb-1">Risk Analysis</h3>
            <p className="text-sm text-muted-foreground">Predict case success</p>
          </div>
        </div>

        <div className="border border-border bg-card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-medium">Recent Activity</h2>
          </div>
          <div className="p-0">
            {searchHistory && Array.isArray(searchHistory) && searchHistory.length > 0 ? (
              <div className="divide-y divide-border">
                {searchHistory.slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                        <i className={`fas ${
                          item.type === 'legal-research' ? 'fa-search' :
                          item.type === 'brief-summarizer' ? 'fa-file-text' :
                          'fa-chart-line'
                        } text-gray-500`}></i>
                      </div>
                      <div>
                        <p className="font-medium">{item.query}</p>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {item.type.replace('-', ' ')} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                      View details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <i className="fas fa-history text-3xl text-gray-300 dark:text-gray-700 mb-4"></i>
                <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground mb-6">Start using AI tools to see your recent searches.</p>
                <Button onClick={() => navigateToAISearch()} className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black">
                  Start AI Search
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}