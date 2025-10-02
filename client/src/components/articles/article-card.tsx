import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatDate, truncateText } from "@/lib/utils";

interface ArticleCardProps {
  article: any;
  source: string;
}

export default function ArticleCard({ article, source }: ArticleCardProps) {
  // We now receive standardized article objects from the API
  // These already have title, description, date, imageUrl etc.
  // So we can use them directly
  
  const { 
    title = "Health Article", 
    description = "Information about Ayurvedic health and wellness",
    date = new Date().toISOString(),
    category = "Ayurveda",
    imageUrl
  } = article;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-neutral-200">
      <img 
        className="h-48 w-full object-cover" 
        src={imageUrl || `https://source.unsplash.com/random/800x600/?ayurveda,medicine`} 
        alt={title} 
        onError={(e) => {
          e.currentTarget.src = `https://source.unsplash.com/random/800x600/?ayurveda,medicine`;
        }}
      />
      <div className="p-5">
        <div className="flex items-center mb-3">
          <Badge className="mr-2" variant="outline">
            {category}
          </Badge>
          <span className="text-xs text-neutral-500">
            {formatDate(date)}
          </span>
        </div>
        <h3 className="text-xl font-medium text-neutral-900 font-heading">
          {truncateText(title, 60)}
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          {truncateText(description, 120)}
        </p>
        <div className="mt-4 flex justify-between items-center">
          <Link href={`/articles/${article.source || source}/${article.id ? article.id.replace(/^(wiki-|fda-|medline-|dailymed-)/, '') : ''}`}>
            <span className="text-primary-500 hover:text-primary-600 font-medium flex items-center cursor-pointer">
              Read more <i className="ri-arrow-right-line ml-1"></i>
            </span>
          </Link>
          <div className="flex items-center text-neutral-500">
            <i className="ri-eye-line mr-1"></i>
            <span className="text-xs">{Math.floor(Math.random() * 500)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
