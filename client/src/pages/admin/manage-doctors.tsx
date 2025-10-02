import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import DoctorForm from "@/components/admin/doctor-form";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Doctor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, PlusCircle, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStarRating, specialties } from "@/lib/utils";

export default function ManageDoctors() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all-specialties");
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isEditDoctorOpen, setIsEditDoctorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Fetch all doctors
  const { data: doctors, isLoading } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
  });
  
  // Delete doctor mutation
  const deleteDoctor = useMutation({
    mutationFn: async (doctorId: number) => {
      await apiRequest("DELETE", `/api/admin/doctors/${doctorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctors'] });
      toast({
        title: "Doctor Deleted",
        description: "The doctor has been successfully removed from the system.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "There was an error deleting the doctor. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle doctor deletion
  const handleDeleteDoctor = () => {
    if (selectedDoctor) {
      deleteDoctor.mutate(selectedDoctor.id);
    }
  };
  
  // Open edit doctor modal
  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsEditDoctorOpen(true);
  };
  
  // Open delete confirmation dialog
  const handleDeleteConfirmation = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter doctors based on search term and specialty
  const filteredDoctors = doctors?.filter(doctor => {
    const matchesSearch = 
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doctor.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = !selectedSpecialty || selectedSpecialty === "all-specialties" || doctor.specialty === selectedSpecialty;
    
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-neutral-900">Manage Doctors</h1>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Doctor Management</CardTitle>
              <CardDescription>
                Add, edit, or remove Ayurvedic doctors from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      placeholder="Search doctors by name or location"
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-64">
                    <Select 
                      value={selectedSpecialty} 
                      onValueChange={setSelectedSpecialty}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-specialties">All Specialties</SelectItem>
                        {specialties.filter(s => s !== "All Specialties").map((specialty) => (
                          <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => setIsAddDoctorOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Doctor
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : !filteredDoctors || filteredDoctors.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="h-16 w-16 rounded-full bg-neutral-100 mx-auto flex items-center justify-center mb-4">
                    <i className="ri-user-search-line text-2xl text-neutral-400"></i>
                  </div>
                  <h3 className="text-xl font-medium text-neutral-900 mb-2">No Doctors Found</h3>
                  <p className="text-neutral-600 max-w-md mx-auto">
                    {searchTerm || selectedSpecialty 
                      ? "No doctors match your search criteria. Try using different keywords or filters."
                      : "There are no doctors in the system yet. Click the 'Add Doctor' button to add one."}
                  </p>
                  {(searchTerm || selectedSpecialty) && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedSpecialty("all-specialties");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg shadow overflow-hidden">
                    <thead className="bg-neutral-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Specialty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredDoctors.map((doctor) => (
                        <tr key={doctor.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-3">
                                {doctor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-neutral-900">{doctor.name}</div>
                                <div className="text-sm text-neutral-500">{doctor.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                              {doctor.specialty}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {doctor.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-yellow-400 flex">
                                {createStarRating(doctor.rating || 0).map((star, i) => (
                                  <span key={i}>
                                    {star.type === "full" && <i className="ri-star-fill"></i>}
                                    {star.type === "half" && <i className="ri-star-half-fill"></i>}
                                    {star.type === "empty" && <i className="ri-star-line"></i>}
                                  </span>
                                ))}
                              </div>
                              <span className="ml-1 text-sm text-neutral-500">
                                ({doctor.reviewCount})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditDoctor(doctor)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteConfirmation(doctor)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Add Doctor Dialog */}
      <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>
              Enter the details of the Ayurvedic doctor to add them to the system
            </DialogDescription>
          </DialogHeader>
          <DoctorForm 
            onSuccess={() => setIsAddDoctorOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDoctorOpen} onOpenChange={setIsEditDoctorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update the details of Dr. {selectedDoctor?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <DoctorForm 
              onSuccess={() => setIsEditDoctorOpen(false)} 
              editDoctor={selectedDoctor}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Doctor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Dr. {selectedDoctor?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDoctor}
              disabled={deleteDoctor.isPending}
            >
              {deleteDoctor.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete Doctor</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
