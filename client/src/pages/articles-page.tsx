import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layouts/main-layout';
import { fetchArticles } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  source: string;
  category: string;
  url: string;
}

const ARTICLES_PER_PAGE = 9;
const CATEGORIES = ['All', 'Ayurveda', 'Herbal Medicine', 'Yoga', 'Meditation', 'Panchakarma'];

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch articles on mount
  useEffect(() => {
    const getArticles = async () => {
      try {
        setLoading(true);
        const response = await fetchArticles(30); // Fetch 30 articles
        setArticles(response.articles);
        setFilteredArticles(response.articles);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles. Please try again later.');
        setLoading(false);
        
        toast({
          title: 'Error',
          description: 'Failed to load articles. Please try again later.',
          variant: 'destructive'
        });
      }
    };

    getArticles();
  }, [toast]);

  // Filter articles when category or search query changes
  useEffect(() => {
    let result = [...articles];
    
    // Apply category filter
    if (category !== 'All') {
      result = result.filter(article => 
        article.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredArticles(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [category, searchQuery, articles]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  // Generate pagination links
  const getPaginationLinks = () => {
    let links = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
      links.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        links.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-3 py-2 text-sm">...</span>
          </PaginationItem>
        );
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        links.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-3 py-2 text-sm">...</span>
          </PaginationItem>
        );
      }
      
      links.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return links;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Ayurvedic Articles & Research</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore the latest research, studies, and articles on Ayurvedic medicine, 
            herbal remedies, and traditional healing practices.
          </p>
        </div>
        
        {/* Search and filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Input
            placeholder="Search articles..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            // Loading skeletons
            Array.from({ length: ARTICLES_PER_PAGE }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[200px] w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : currentArticles.length > 0 ? (
            currentArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  <img 
                    src={article.imageUrl || `https://source.unsplash.com/random/800x600/?ayurveda,${article.category || 'medicine'}`} 
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = `https://source.unsplash.com/random/800x600/?ayurveda,${article.category || 'medicine'}`;
                    }}
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">
                      {article.date ? new Date(article.date).toLocaleDateString() : 'No date'}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                      {article.category || 'Ayurveda'}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                  <CardDescription className="text-xs">
                    Source: {article.source || 'Unknown'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.description}
                  </p>
                </CardContent>
                <CardFooter>
                  {article.url ? (
                    <Button className="w-full" variant="outline" asChild>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Read Full Article
                      </a>
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline">
                      Read More
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-lg text-muted-foreground">
                No articles found matching your search criteria.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  setSearchQuery('');
                  setCategory('All');
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && filteredArticles.length > ARTICLES_PER_PAGE && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationLink 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </PaginationLink>
              </PaginationItem>
              
              {getPaginationLinks()}
              
              <PaginationItem>
                <PaginationLink 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </MainLayout>
  );
}