import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function ArticleDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  
  // Get source and id from URL parameters
  const id = params.id;
  const source = params.source || "medlineplus";

  // Define interface for the article
  interface Article {
    id: string;
    title: string;
    description: string;
    date: string;
    url: string;
    imageUrl: string;
    category: string;
    source: string;
  }

  // Use the new endpoint that gets a specific article
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [`/api/articles/${source}/${id}`],
    enabled: !!id && !!source,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Article Not Found</h1>
            <p className="text-neutral-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/articles")}>Back to Articles</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Our standardized article format with the new API endpoint 
  // already converts all sources to the same format
  const { 
    title = "Health Article", 
    description = "No content available", 
    date = new Date().toISOString(),
    url = "#",
    imageUrl,
    category = "Health",
  } = article;
  
  const getSourceName = () => {
    switch (source) {
      case "medlineplus":
        return "MedlinePlus";
      case "dailymed":
        return "DailyMed";
      case "wikipedia":
        return "Wikipedia";
      case "datagov":
        return "U.S. Open-Data";
      case "openfda":
        return "OpenFDA";
      default:
        return "Health Source";
    }
  };
  
  const sourceName = getSourceName();
  const articleUrl = url;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-primary-500">{sourceName}</Badge>
                <span className="text-sm text-neutral-500">{formatDate(date)}</span>
              </div>
              
              <h1 className="text-3xl font-bold text-neutral-900 mb-6 font-heading">{title}</h1>
              
              <div className="prose prose-lg max-w-none mt-6">
                <div className="float-right ml-6 mb-6">
                  <img 
                    src={imageUrl || `https://source.unsplash.com/random/400x300/?ayurveda,${category || 'medicine'}`} 
                    alt={title} 
                    className="rounded-lg max-w-[200px]"
                    onError={(e) => {
                      e.currentTarget.src = `https://source.unsplash.com/random/400x300/?ayurveda,${category || 'medicine'}`;
                    }}
                  />
                </div>
                
                <div className="text-neutral-700 whitespace-pre-line">
                  {description}
                </div>
              </div>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Button onClick={() => setLocation("/articles")}>
                  <i className="ri-arrow-left-line mr-2"></i>
                  Back to Articles
                </Button>
                {articleUrl !== "#" && (
                  <a 
                    href={articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="outline">
                      View Original Source
                      <i className="ri-external-link-line ml-2"></i>
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Related Topics */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Related Topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start p-6 h-auto" onClick={() => setLocation("/treatments")}>
                <div className="flex items-start">
                  <i className="ri-medicine-bottle-line text-2xl text-primary-500 mr-4"></i>
                  <div className="text-left">
                    <h3 className="font-medium">Explore Treatments</h3>
                    <p className="text-sm text-neutral-600 mt-1">Discover Ayurvedic treatments that might help</p>
                  </div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start p-6 h-auto" onClick={() => setLocation("/doctors")}>
                <div className="flex items-start">
                  <i className="ri-user-search-line text-2xl text-primary-500 mr-4"></i>
                  <div className="text-left">
                    <h3 className="font-medium">Find Specialists</h3>
                    <p className="text-sm text-neutral-600 mt-1">Connect with Ayurvedic doctors in your area</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
