import { Link } from "wouter";
import { Treatment } from "@shared/schema";

interface TreatmentCardProps {
  treatment: Treatment;
}

export default function TreatmentCard({ treatment }: TreatmentCardProps) {
  const { id, name, description, imageUrl } = treatment;
  
  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-neutral-200">
      <div className="h-48 relative">
        {imageUrl ? (
          <img
            className="h-full w-full object-cover"
            src={imageUrl}
            alt={name}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-neutral-100">
            <i className="ri-medicine-bottle-line text-4xl text-neutral-400"></i>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-xl font-medium text-neutral-900 font-heading">{name}</h3>
        <p className="mt-2 text-sm text-neutral-600">
          {truncateDescription(description)}
        </p>
        <div className="mt-4">
          <Link href={`/treatments/${id}`}>
            <span className="text-primary-500 hover:text-primary-600 font-medium flex items-center cursor-pointer">
              Learn more <i className="ri-arrow-right-line ml-1"></i>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
