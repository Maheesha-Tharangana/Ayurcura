import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Doctor } from "@shared/schema";
import { createStarRating } from "@/lib/utils";

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const {
    id,
    name,
    specialty,
    location,
    rating,
    reviewCount,
    availability
  } = doctor;

  const isAvailableToday = availability && availability.length > 0 && 
    availability.some(day => day.toLowerCase().includes("today") || 
      day.toLowerCase().includes(new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()));

  // Make sure we have a valid ID to avoid routing to /doctors/undefined
  const validDoctorId = id || "_id" in doctor ? doctor._id : null;
  
  if (!validDoctorId) {
    console.error("Doctor has no valid ID:", doctor);
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <i className="ri-user-line text-2xl text-primary-600"></i>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-neutral-900">{name}</h3>
            <div className="mt-1 flex items-center">
              <span className="text-yellow-400 flex">
                {createStarRating(rating || 0).map((star, i) => (
                  <span key={i}>
                    {star.type === "full" && <i className="ri-star-fill"></i>}
                    {star.type === "half" && <i className="ri-star-half-fill"></i>}
                    {star.type === "empty" && <i className="ri-star-line"></i>}
                  </span>
                ))}
              </span>
              <span className="ml-1 text-sm text-neutral-600">({reviewCount || 0} reviews)</span>
            </div>
            <p className="text-sm text-neutral-600">{specialty} Specialist</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-neutral-600">
            <i className="ri-map-pin-line mr-1"></i>
            <span>{location}</span>
          </div>
          <div className="flex items-center mt-2 text-sm text-neutral-600">
            <i className="ri-time-line mr-1"></i>
            <span>{isAvailableToday ? 'Available Today' : (availability && availability.length > 0) ? 
              `Next Available: ${availability[0]}` : 'Contact for availability'}</span>
          </div>
        </div>
        <div className="mt-5">
          {validDoctorId ? (
            <Link href={`/doctors/${validDoctorId}`}>
              <Button className="w-full">View Profile</Button>
            </Link>
          ) : (
            <Button className="w-full" disabled>Profile Unavailable</Button>
          )}
        </div>
      </div>
    </div>
  );
}
