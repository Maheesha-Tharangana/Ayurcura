import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { specialties } from "@/lib/utils";

interface DoctorSearchProps {
  onSearch: (params: { location: string; specialty: string }) => void;
}

export default function DoctorSearch({ onSearch }: DoctorSearchProps) {
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("All Specialties");

  const handleSearch = () => {
    onSearch({ location, specialty });
  };

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <div className="bg-white p-6 shadow-md rounded-lg">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-neutral-700">
              Location
            </label>
            <div className="mt-1 relative rounded-md shadow-sm flex items-center">
              {/* Clickable map icon linking to Google Maps */}
              <a
                href="https://www.google.com/maps/@6.9105454,79.9304626,12z?entry=ttu&g_ep=EgoyMDI1MDUxNS4wIKXMDSoJLDEwMjExNDUzSAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500 hover:text-blue-600"
                aria-label="Open location in Google Maps"
              >
                <i className="ri-map-pin-line text-xl"></i>
              </a>

              <Input
                type="text"
                name="location"
                id="location"
                className="pl-10"
                placeholder="Colombo, Sri Lanka"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-neutral-700">
              Specialty
            </label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger id="specialty" className="w-full">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((spec) => (
                  <SelectItem key={spec} value={spec || "all-specialties"}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <label htmlFor="searchButton" className="block text-sm font-medium text-neutral-700 opacity-0">
              Search
            </label>
            <Button id="searchButton" className="w-full mt-1" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
