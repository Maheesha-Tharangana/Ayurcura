import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Treatment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TreatmentDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: treatment, isLoading } = useQuery<Treatment>({
    queryKey: [`/api/treatments/${id}`],
    enabled: !!id,
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

  if (!treatment) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Treatment Not Found</h1>
            <p className="text-neutral-600 mb-6">The treatment you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/treatments")}>Back to Treatments</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="relative h-64 sm:h-80 md:h-96 bg-neutral-200">
              {treatment.imageUrl ? (
               <img 
                  src={treatment.imageUrl} 
                  alt={treatment.name} 
                  className="w-full h-full object-cover"
                />

              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <i className="ri-image-line text-5xl"></i>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary-500">{treatment.category}</Badge>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <h1 className="text-3xl font-bold text-neutral-900 mb-4 font-heading">{treatment.name}</h1>
              
              <div className="prose prose-lg max-w-none mt-6">
                <p className="text-neutral-700 whitespace-pre-line">{treatment.description}</p>
              </div>
              
              {treatment.benefits && treatment.benefits.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Key Benefits</h2>
                  <ul className="space-y-2">
                    {treatment.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <i className="ri-check-line text-primary-500 mt-1 mr-2"></i>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {treatment.relatedMedicines && treatment.relatedMedicines.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Related Medicines</h2>
                  <div className="flex flex-wrap gap-2">
                    {treatment.relatedMedicines.map((medicine, index) => (
                      <Badge key={index} variant="outline" className="text-neutral-700">
                        {medicine}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Button onClick={() => setLocation("/treatments")}>
                  <i className="ri-arrow-left-line mr-2"></i>
                  Back to Treatments
                </Button>
                <Button onClick={() => setLocation("/doctors")} variant="outline">
                  Find Specialists
                  <i className="ri-user-search-line ml-2"></i>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">When to Consider</h2>
                <p className="text-neutral-700">
                  This treatment is particularly beneficial for those experiencing:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start">
                    <i className="ri-mental-health-line text-primary-500 mt-1 mr-2"></i>
                    <span>Stress and anxiety-related conditions</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-heart-pulse-line text-primary-500 mt-1 mr-2"></i>
                    <span>Circulatory and cardiovascular issues</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-psychotherapy-line text-primary-500 mt-1 mr-2"></i>
                    <span>Mind-body imbalances</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-hand-heart-line text-primary-500 mt-1 mr-2"></i>
                    <span>General wellness and preventive care</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">What to Expect</h2>
                <p className="text-neutral-700">
                  During your {treatment.name} treatment:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start">
                    <i className="ri-time-line text-primary-500 mt-1 mr-2"></i>
                    <span>Typical sessions last 60-90 minutes</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-calendar-line text-primary-500 mt-1 mr-2"></i>
                    <span>Usually recommended once or twice weekly</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-emotion-line text-primary-500 mt-1 mr-2"></i>
                    <span>Comfortable, relaxing experience</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-user-settings-line text-primary-500 mt-1 mr-2"></i>
                    <span>Personalized to your specific health needs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
