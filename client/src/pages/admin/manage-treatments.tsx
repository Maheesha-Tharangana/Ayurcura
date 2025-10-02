import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import TreatmentForm from "@/components/admin/treatment-form";
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
import { Treatment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, PlusCircle, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { treatmentCategories } from "@/lib/utils";

export default function ManageTreatments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all-categories");
  const [isAddTreatmentOpen, setIsAddTreatmentOpen] = useState(false);
  const [isEditTreatmentOpen, setIsEditTreatmentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  
  // Fetch all treatments
  const { data: treatments, isLoading } = useQuery<Treatment[]>({
    queryKey: ['/api/treatments'],
  });
  
  // Delete treatment mutation
  const deleteTreatment = useMutation({
    mutationFn: async (treatmentId: string | number) => {
      console.log(`Attempting to delete treatment with ID: ${treatmentId}`);
      
      const response = await apiRequest("DELETE", `/api/admin/treatments/${treatmentId}`);
      
      if (!response.ok) {
        // Try to parse error response as JSON
        try {
          const errorData = await response.json();
          console.error("Delete treatment error:", errorData);
          throw new Error(errorData.message || "Failed to delete treatment");
        } catch (parseError) {
          // If we can't parse JSON, use the status text
          console.error("Error parsing delete response:", parseError);
          throw new Error(`Failed to delete treatment: ${response.statusText}`);
        }
      }
      
      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/treatments'] });
      toast({
        title: "Treatment Deleted",
        description: "The treatment has been successfully removed from the system.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Delete treatment mutation error:", error);
      toast({
        title: "Deletion Failed",
        description: error.message || "There was an error deleting the treatment. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle treatment deletion
  const handleDeleteTreatment = () => {
    if (selectedTreatment) {
      // Prefer MongoDB _id field if available, otherwise fall back to numeric id
      const idToDelete = selectedTreatment._id ? selectedTreatment._id : selectedTreatment.id;
      
      console.log(`Deleting treatment with ID: ${idToDelete}, type: ${typeof idToDelete}, full treatment:`, selectedTreatment);
      
      // Convert to string if it's an object (some MongoDB ObjectIds may be objects)
      const finalId = typeof idToDelete === 'object' ? String(idToDelete) : idToDelete;
      
      deleteTreatment.mutate(finalId as any);
    }
  };
  
  // Open edit treatment modal
  const handleEditTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setIsEditTreatmentOpen(true);
  };
  
  // Open delete confirmation dialog
  const handleDeleteConfirmation = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter treatments based on search term and category
  const filteredTreatments = treatments?.filter(treatment => {
    const matchesSearch = 
      treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      treatment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || selectedCategory === "all-categories" || treatment.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
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
            <h1 className="text-3xl font-bold text-neutral-900">Manage Treatments</h1>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Treatment Management</CardTitle>
              <CardDescription>
                Add, edit, or remove Ayurvedic treatments from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      placeholder="Search treatments by name or description"
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-64">
                    <Select 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-categories">All Categories</SelectItem>
                        {treatmentCategories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => setIsAddTreatmentOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Treatment
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : !filteredTreatments || filteredTreatments.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="h-16 w-16 rounded-full bg-neutral-100 mx-auto flex items-center justify-center mb-4">
                    <i className="ri-medicine-bottle-line text-2xl text-neutral-400"></i>
                  </div>
                  <h3 className="text-xl font-medium text-neutral-900 mb-2">No Treatments Found</h3>
                  <p className="text-neutral-600 max-w-md mx-auto">
                    {searchTerm || selectedCategory 
                      ? "No treatments match your search criteria. Try using different keywords or filters."
                      : "There are no treatments in the system yet. Click the 'Add Treatment' button to add one."}
                  </p>
                  {(searchTerm || selectedCategory) && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("all-categories");
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Benefits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredTreatments.map((treatment, index) => {
                        // Create a unique key that combines available identifiers
                        const uniqueKey = `treatment-${treatment._id || treatment.id || index}`;
                        return (
                          <tr key={uniqueKey} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {treatment.imageUrl ? (
                                  <img 
                                    src={treatment.imageUrl} 
                                    alt={treatment.name}
                                    className="h-10 w-10 rounded-md object-cover mr-3" 
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center text-primary-700 mr-3">
                                    <i className="ri-medicine-bottle-line text-lg"></i>
                                  </div>
                                )}
                                <div className="text-sm font-medium text-neutral-900">{treatment.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                                {treatment.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-neutral-500 max-w-xs truncate">{treatment.description}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {(treatment.benefits as string[])?.slice(0, 2).map((benefit, idx) => (
                                  <span key={`${uniqueKey}-benefit-${idx}`} className="inline-block px-2 py-1 text-xs bg-neutral-100 text-neutral-800 rounded-full">
                                    {benefit}
                                  </span>
                                ))}
                                {(treatment.benefits as string[])?.length > 2 && (
                                  <span className="inline-block px-2 py-1 text-xs bg-neutral-100 text-neutral-500 rounded-full">
                                    +{(treatment.benefits as string[]).length - 2} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditTreatment(treatment)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteConfirmation(treatment)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Add Treatment Dialog */}
      <Dialog open={isAddTreatmentOpen} onOpenChange={setIsAddTreatmentOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Treatment</DialogTitle>
            <DialogDescription>
              Enter the details of the Ayurvedic treatment to add it to the system
            </DialogDescription>
          </DialogHeader>
          <TreatmentForm 
            onSuccess={() => setIsAddTreatmentOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Treatment Dialog */}
      <Dialog open={isEditTreatmentOpen} onOpenChange={setIsEditTreatmentOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Treatment</DialogTitle>
            <DialogDescription>
              Update the details of {selectedTreatment?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTreatment && (
            <TreatmentForm 
              onSuccess={() => setIsEditTreatmentOpen(false)} 
              editTreatment={selectedTreatment}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Treatment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTreatment?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTreatment}
              disabled={deleteTreatment.isPending}
            >
              {deleteTreatment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete Treatment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}