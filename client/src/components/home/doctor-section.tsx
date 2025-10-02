import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Doctor } from "@shared/schema";
import DoctorCard from "@/components/doctors/doctor-card";

export default function DoctorSection() {
  const { data: doctors, isLoading } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors?limit=3'],
  });

  return (
    <section className="py-12 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 font-heading">Find Ayurvedic Doctors</h2>
          <p className="mt-4 text-lg text-neutral-600">
            Connect with qualified practitioners near you
          </p>
        </div>

        <div className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-3">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="ml-4 flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="mt-5">
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            ))
          ) : doctors && doctors.length > 0 ? (
            doctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))
          ) : (
            // Fallback placeholders if no doctors are found
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <i className="ri-user-line text-2xl text-primary-600"></i>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-neutral-900">Dr. {index === 0 ? 'Amara Silva' : index === 1 ? 'Dinesh Perera' : 'Nirmala Bandara'}</h3>
                      <div className="mt-1 flex items-center">
                        <span className="text-yellow-400 flex">
                          {Array(5).fill(0).map((_, i) => (
                            <i key={i} className={`${i < 4 ? 'ri-star-fill' : 'ri-star-line'}`}></i>
                          ))}
                        </span>
                        <span className="ml-1 text-sm text-neutral-600">({Math.floor(Math.random() * 50) + 10} reviews)</span>
                      </div>
                      <p className="text-sm text-neutral-600">{index === 0 ? 'Panchakarma' : index === 1 ? 'Rasayana' : 'Kayachikitsa'} Specialist</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-neutral-600">
                      <i className="ri-map-pin-line mr-1"></i>
                      <span>{index === 0 ? 'Colombo' : index === 1 ? 'Kandy' : 'Galle'}, Sri Lanka</span>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-neutral-600">
                      <i className="ri-time-line mr-1"></i>
                      <span>{index % 2 === 0 ? 'Available Today' : 'Next Available: Tomorrow'}</span>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Link href="/doctors">
                      <Button className="w-full">Book Appointment</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/doctors">
            <Button variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-50">
              View All Doctors <i className="ri-arrow-right-line ml-1"></i>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
