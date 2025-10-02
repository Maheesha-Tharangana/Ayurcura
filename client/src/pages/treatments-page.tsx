import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import TreatmentCard from "@/components/treatments/treatment-card";
import { Treatment } from "@shared/schema";
import { treatmentCategories } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function TreatmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all-categories") {
      params.append("category", selectedCategory);
    }
    return params.toString() ? `?${params.toString()}` : "";
  };

  const { data: treatments, isLoading, error } = useQuery<Treatment[]>({
    queryKey: [`/api/treatments${buildQueryString()}`],
  });

  const filteredTreatments = treatments?.filter(treatment => 
    treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    treatment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      <main className="flex-grow">
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-neutral-900 font-heading">
                Ayurvedic Treatments
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                Discover traditional healing methods for modern health issues
              </p>
            </div>

            {/* Search & Filter */}
            <div className="mt-8 max-w-3xl mx-auto">
              <div className="bg-white p-6 shadow-md rounded-lg">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label htmlFor="search-treatments">Search Treatments</Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="ri-search-line text-neutral-500"></i>
                      </div>
                      <Input
                        id="search-treatments"
                        placeholder="Search by name or description"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-categories">All Categories</SelectItem>
                        {treatmentCategories.map((category) => (
                          <SelectItem key={category} value={category || "all-categories"}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatments Grid */}
            {isLoading ? (
              <div className="flex justify-center mt-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : error ? (
              <div className="text-center mt-10 text-red-500">
                <p>An error occurred while loading treatments.</p>
                <p className="text-sm">{(error as Error).message}</p>
              </div>
            ) : filteredTreatments && filteredTreatments.length > 0 ? (
              <div className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredTreatments.map((treatment, index) => (
                  <TreatmentCard key={`treatments-page-${treatment.id}-${index}`} treatment={treatment} />
                ))}
              </div>
            ) : (
              <div className="text-center mt-10 p-8 bg-white rounded-lg shadow">
                <i className="ri-search-line text-5xl text-neutral-400 mb-4"></i>
                <h3 className="text-xl font-medium text-neutral-900">No treatments found</h3>
                <p className="mt-2 text-neutral-600">
                  We couldn't find any treatments matching your search criteria. 
                  Please try different keywords or categories.
                </p>
                {(searchTerm || selectedCategory) && (
                  <Button 
                    className="mt-4" 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
