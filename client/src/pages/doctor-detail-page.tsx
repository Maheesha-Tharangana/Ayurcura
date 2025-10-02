import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import AppointmentForm from "@/components/doctors/appointment-form";
import { Doctor, Review } from "@shared/schema";
import { createStarRating } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function DoctorDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  
  // Check if we have a valid ID
  if (!id || id === 'undefined') {
    console.error("Invalid doctor ID:", id);
    return (
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Doctor Not Found</h1>
            <p className="text-neutral-600 mb-6">The doctor you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/doctors")}>Back to Doctors</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { data: doctor, isLoading: isLoadingDoctor } = useQuery<Doctor>({
    queryKey: [`/api/doctors/${id}`],
    enabled: !!id,
  });

  const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review[]>({
    queryKey: [`/api/doctors/${id}/reviews`],
    enabled: !!id,
  });

  if (isLoadingDoctor || isLoadingReviews) {
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

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Doctor Not Found</h1>
            <p className="text-neutral-600 mb-6">The doctor you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/doctors")}>Back to Doctors</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      <main className="flex-grow">
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Doctor profile sidebar */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center">
                      <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl mb-4">
                        <i className="ri-user-line"></i>
                      </div>
                      <h1 className="text-2xl font-bold text-center mb-2">{doctor.name}</h1>
                      <p className="text-neutral-600 mb-2">{doctor.specialty} Specialist</p>
                      
                      <div className="flex items-center text-yellow-400 mb-4">
                        {createStarRating(doctor.rating || 0).map((star) => (
                          <span key={star.key}>
                            {star.type === 'full' && <i className="ri-star-fill"></i>}
                            {star.type === 'half' && <i className="ri-star-half-fill"></i>}
                            {star.type === 'empty' && <i className="ri-star-line"></i>}
                          </span>
                        ))}
                        <span className="ml-2 text-neutral-600">({doctor.reviewCount || 0} reviews)</span>
                      </div>
                      
                      <div className="w-full space-y-3 mt-2">
                        <div className="flex items-start text-neutral-600">
                          <i className="ri-map-pin-line mt-1 mr-2"></i>
                          <div>
                            <p className="font-medium">Location</p>
                            <p>{doctor.location}</p>
                            <p className="text-sm">{doctor.address}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start text-neutral-600">
                          <i className="ri-phone-line mt-1 mr-2"></i>
                          <div>
                            <p className="font-medium">Contact</p>
                            <p>{doctor.contactNumber}</p>
                            <p className="text-sm">{doctor.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start text-neutral-600">
                          <i className="ri-time-line mt-1 mr-2"></i>
                          <div>
                            <p className="font-medium">Availability</p>
                            <ul className="text-sm">
                              {doctor.availability && doctor.availability.length > 0 ? (
                                doctor.availability.map((day, index) => (
                                  <li key={index}>{day}</li>
                                ))
                              ) : (
                                <li>Contact for availability</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-6" 
                        onClick={() => {
                          if (user) {
                            setLocation(`/book-appointment/${id}`);
                          } else {
                            setShowAppointmentForm(true);
                          }
                        }}
                        disabled={!user}
                      >
                        Book Appointment
                      </Button>
                      
                      {!user && (
                        <p className="text-sm text-red-500 mt-2">
                          Please log in to book an appointment
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main content */}
              <div className="mt-8 lg:mt-0 lg:col-span-2">
                <Tabs defaultValue="about">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    <TabsTrigger value="appointment">Book Appointment</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about">
                    <Card>
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4">About Dr. {doctor.name}</h2>
                        <p className="text-neutral-700 whitespace-pre-line">{doctor.bio}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="reviews">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-semibold">Patient Reviews</h2>
                          <span className="text-neutral-600">{reviews?.length || 0} reviews</span>
                        </div>
                        
                        {reviews && reviews.length > 0 ? (
                          <div className="space-y-6">
                            {reviews.map((review) => (
                              <div key={review.id} className="border-b border-neutral-200 pb-6 last:border-0">
                                <div className="flex items-center mb-2">
                                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                                    <i className="ri-user-line"></i>
                                  </div>
                                  <div>
                                    <p className="font-medium">Patient {review.userId}</p>
                                    <p className="text-sm text-neutral-500">{review.createdAt ? formatDate(review.createdAt) : 'N/A'}</p>
                                  </div>
                                  <div className="ml-auto flex text-yellow-400">
                                    {createStarRating(review.rating || 0).map((star) => (
                                      <span key={star.key}>
                                        {star.type === 'full' && <i className="ri-star-fill"></i>}
                                        {star.type === 'half' && <i className="ri-star-half-fill"></i>}
                                        {star.type === 'empty' && <i className="ri-star-line"></i>}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-neutral-700">{review.comment}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-neutral-500">No reviews yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="appointment">
                    <Card>
                      <CardContent className="p-6">
                        {user ? (
                          <div className="text-center py-8">
                            <h3 className="text-lg font-medium mb-2">Book an Appointment</h3>
                            <p className="text-neutral-600 mb-4">
                              Please use our dedicated appointment booking page to schedule a consultation with Dr. {doctor.name}
                            </p>
                            <Button onClick={() => setLocation(`/book-appointment/${id}`)}>
                              Go to Booking Page
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <i className="ri-lock-line text-4xl text-neutral-400 mb-2"></i>
                            <h3 className="text-lg font-medium mb-2">Login Required</h3>
                            <p className="text-neutral-600 mb-4">
                              Please log in to book an appointment with Dr. {doctor.name}
                            </p>
                            <Button onClick={() => setLocation("/auth")}>
                              Login to Continue
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                
                {showAppointmentForm && user && (
                  <div className="mt-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold">Book an Appointment</h2>
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowAppointmentForm(false)}
                            size="sm"
                          >
                            <i className="ri-close-line text-lg"></i>
                          </Button>
                        </div>
                        <AppointmentForm doctorId={parseInt(id || "0")} doctorName={doctor.name} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
