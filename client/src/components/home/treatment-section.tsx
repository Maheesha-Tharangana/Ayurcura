import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Treatment } from "@shared/schema";
import TreatmentCard from "@/components/treatments/treatment-card";

export default function TreatmentSection() {
  const { data: treatments, isLoading } = useQuery<Treatment[]>({
    queryKey: ['/api/treatments?limit=3'],
  });

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 font-heading">Ayurvedic Treatments</h2>
          <p className="mt-4 text-lg text-neutral-600">
            Discover traditional healing methods for modern health issues
          </p>
        </div>

        <div className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-3">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden border border-neutral-200">
                <Skeleton className="h-48 w-full" />
                <div className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))
          ) : treatments && treatments.length > 0 ? (
            treatments.map((treatment, index) => (
              <TreatmentCard key={`treatment-${treatment.id}-${index}`} treatment={treatment} />
            ))
          ) : (
            // Fallback placeholders if no treatments are found
            [
              {
                title: "Panchakarma",
                description: "A five-fold detoxification treatment to remove toxins and restore balance to the body's systems.",
                image: "https://images.unsplash.com/photo-1545620783-8356e780469d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              },
              {
                title: "Abhyanga",
                description: "A full-body massage with herb-infused oils to improve circulation and promote relaxation.",
                image: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              },
              {
                title: "Shirodhara",
                description: "A gentle pouring of warm oil over the forehead to calm the nervous system and enhance mental clarity.",
                image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              }
            ].map((treatment, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden border border-neutral-200">
                <img 
                  className="h-48 w-full object-cover" 
                  src={treatment.image} 
                  alt={treatment.title} 
                />
                <div className="p-5">
                  <h3 className="text-xl font-medium text-neutral-900 font-heading">{treatment.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {treatment.description}
                  </p>
                  <div className="mt-4">
                    <Link href="/treatments">
                      <span className="text-primary-500 hover:text-primary-600 font-medium flex items-center cursor-pointer">
                        Learn more <i className="ri-arrow-right-line ml-1"></i>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/treatments">
            <Button variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-50">
              View All Treatments <i className="ri-arrow-right-line ml-1"></i>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
