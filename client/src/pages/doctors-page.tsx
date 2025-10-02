import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import DoctorCard from "@/components/doctors/doctor-card";
import DoctorSearch from "@/components/doctors/doctor-search";
import { Doctor } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function DoctorsPage() {
  const [searchParams, setSearchParams] = useState({
    location: "",
    specialty: ""
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchParams.location) params.append("location", searchParams.location);
    if (searchParams.specialty && searchParams.specialty !== "All Specialties") {
      params.append("specialty", searchParams.specialty);
    }
    return params.toString() ? `?${params.toString()}` : "";
  };

  const { data: doctors, isLoading, error } = useQuery<Doctor[]>({
    queryKey: [`/api/doctors${buildQueryString()}`],
  });

  const handleSearch = (params: { location: string; specialty: string }) => {
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      <main className="flex-grow">
        <section className="py-12 bg-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-neutral-900 font-heading">
                Find Ayurvedic Doctors
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                Connect with qualified practitioners near you
              </p>
            </div>

            <DoctorSearch onSearch={handleSearch} />

            {isLoading ? (
              <div className="flex justify-center mt-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : error ? (
              <div className="text-center mt-10 text-red-500">
                <p>An error occurred while loading doctors.</p>
                <p className="text-sm">{(error as Error).message}</p>
              </div>
            ) : doctors && doctors.length > 0 ? (
              <div className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              <div className="text-center mt-10 p-8 bg-white rounded-lg shadow">
                <i className="ri-search-line text-5xl text-neutral-400 mb-4"></i>
                <h3 className="text-xl font-medium text-neutral-900">No doctors found</h3>
                <p className="mt-2 text-neutral-600">
                  We couldn't find any doctors matching your search criteria. 
                  Please try different keywords or browse all doctors.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
