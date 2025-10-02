import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, Plus, Image, Upload } from "lucide-react";
import { treatmentCategories } from "@/lib/utils";
import { Treatment } from "@shared/schema";

interface TreatmentFormProps {
  onSuccess?: () => void;
  editTreatment?: Treatment;
}

const treatmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal('')),
  benefits: z.array(z.string()).min(1, "At least one benefit is required"),
  relatedMedicines: z.array(z.string())
});

type TreatmentFormValues = z.infer<typeof treatmentSchema>;

export default function TreatmentForm({ onSuccess, editTreatment }: TreatmentFormProps) {
  const { toast } = useToast();
  const [benefits, setBenefits] = useState<string[]>(editTreatment?.benefits as string[] || []);
  const [newBenefit, setNewBenefit] = useState("");
  const [medicines, setMedicines] = useState<string[]>(editTreatment?.relatedMedicines as string[] || []);
  const [newMedicine, setNewMedicine] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(editTreatment?.imageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      name: editTreatment?.name || "",
      category: editTreatment?.category || "",
      description: editTreatment?.description || "",
      imageUrl: editTreatment?.imageUrl || "",
      benefits: editTreatment?.benefits as string[] || [],
      relatedMedicines: editTreatment?.relatedMedicines as string[] || []
    },
  });

  // Add a new benefit
  const handleAddBenefit = () => {
    if (newBenefit.trim() !== "") {
      const newBenefits = [...benefits, newBenefit.trim()];
      setBenefits(newBenefits);
      form.setValue("benefits", newBenefits);
      setNewBenefit("");
    }
  };

  // Remove a benefit
  const handleRemoveBenefit = (index: number) => {
    const newBenefits = benefits.filter((_, i) => i !== index);
    setBenefits(newBenefits);
    form.setValue("benefits", newBenefits);
  };

  // Add a new related medicine
  const handleAddMedicine = () => {
    if (newMedicine.trim() !== "") {
      const newMedicines = [...medicines, newMedicine.trim()];
      setMedicines(newMedicines);
      form.setValue("relatedMedicines", newMedicines);
      setNewMedicine("");
    }
  };

  // Remove a related medicine
  const handleRemoveMedicine = (index: number) => {
    const newMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(newMedicines);
    form.setValue("relatedMedicines", newMedicines);
  };

  const createTreatment = useMutation({
    mutationFn: async (values: TreatmentFormValues) => {
      console.log('Submitting treatment form with values:', values);
      
      // IMPORTANT: This must always point to the admin.ts route handler for proper file upload support
      const endpoint = editTreatment 
        ? `/api/admin/treatments/${editTreatment.id || editTreatment._id}` 
        : "/api/admin/treatments"; 
      
      const method = editTreatment ? "PATCH" : "POST";
      
      // Always use FormData to ensure proper handling of files and multipart data
      const formData = new FormData();
      
      // Validate required fields before submitting
      if (!values.name?.trim()) {
        throw new Error('Name is required');
      }
      
      if (!values.category?.trim()) {
        throw new Error('Category is required');
      }
      
      if (!values.description?.trim()) {
        throw new Error('Description is required');
      }
      
      if (!values.imageUrl?.trim() && !imageFile) {
        throw new Error('Either an image URL or an uploaded image is required');
      }
      
      // Add all treatment data to form with explicit null checking
      formData.append('name', values.name?.trim() || '');
      formData.append('category', values.category?.trim() || '');
      formData.append('description', values.description?.trim() || '');
      formData.append('imageUrl', values.imageUrl?.trim() || '');
      
      // Handle arrays with proper validation
      const benefits = Array.isArray(values.benefits) ? values.benefits : [];
      const relatedMedicines = Array.isArray(values.relatedMedicines) ? values.relatedMedicines : [];
      
      formData.append('benefits', JSON.stringify(benefits));
      formData.append('relatedMedicines', JSON.stringify(relatedMedicines));
      
      // Add the image file if present
      if (imageFile) {
        console.log('Uploading image file:', imageFile.name);
        formData.append('imageFile', imageFile);
      }
      
      console.log('Making request to:', endpoint);
      console.log('FormData content check - name:', formData.get('name'));
      console.log('FormData content check - category:', formData.get('category'));
      console.log('FormData content check - description:', formData.get('description'));
      console.log('FormData content check - imageUrl:', formData.get('imageUrl'));
      
      // Make the request with form data
      const response = await fetch(endpoint, {
        method: method,
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Treatment creation/update failed:', errorData);
        
        // Show more detailed error information
        if (errorData.errors) {
          const errorMessage = Object.entries(errorData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          throw new Error(`Validation errors: ${errorMessage}`);
        }
        
        if (errorData.missingFields) {
          const missingFields = Object.keys(errorData.missingFields)
            .filter(field => errorData.missingFields[field])
            .join(', ');
          throw new Error(`Missing required fields: ${missingFields}`);
        }
        
        throw new Error(errorData.message || 'Failed to save treatment');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      toast({
        title: editTreatment ? "Treatment Updated" : "Treatment Added",
        description: editTreatment 
          ? `${form.getValues("name")} has been updated.` 
          : `${form.getValues("name")} has been added to the system.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (!editTreatment) {
        form.reset();
        setBenefits([]);
        setMedicines([]);
      }
    },
    onError: (error) => {
      toast({
        title: editTreatment ? "Update Failed" : "Addition Failed",
        description: error.message || "There was an error processing your request. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // We don't need separate image upload anymore as it's handled in createTreatment
  const onSubmit = async (values: TreatmentFormValues) => {
    // Validate values before submitting
    if (!values.name) {
      toast({
        title: "Missing Name",
        description: "Please provide a name for the treatment",
        variant: "destructive"
      });
      return;
    }
    
    if (!values.category) {
      toast({
        title: "Missing Category",
        description: "Please select a category for the treatment",
        variant: "destructive"
      });
      return;
    }
    
    if (!values.description) {
      toast({
        title: "Missing Description",
        description: "Please provide a description for the treatment",
        variant: "destructive"
      });
      return;
    }
    
    // Check for either image URL or image file
    if (!values.imageUrl && !imageFile) {
      toast({
        title: "Missing Image",
        description: "Please either provide an image URL or upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    // Check for at least one benefit
    if (!values.benefits || values.benefits.length === 0) {
      toast({
        title: "Missing Benefits",
        description: "Please add at least one benefit for the treatment",
        variant: "destructive"
      });
      return;
    }
    
    // Pass values to the mutation function
    createTreatment.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Treatment Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter treatment name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {treatmentCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg" {...field} />
                </FormControl>
                <p className="text-sm text-muted-foreground mt-1">Or upload an image file:</p>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    {imagePreview && (
                      <div className="relative w-24 h-24 overflow-hidden rounded-md border border-border">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detailed description of the treatment..." 
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="benefits"
          render={() => (
            <FormItem>
              <FormLabel>Benefits</FormLabel>
              <div className="space-y-2">
                <div className="flex">
                  <Input
                    placeholder="Add a benefit"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddBenefit}
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center bg-primary-100 text-primary-800 rounded-full px-3 py-1">
                      <span className="text-sm">{benefit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 text-primary-800 hover:text-primary-900 hover:bg-transparent"
                        onClick={() => handleRemoveBenefit(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                {form.formState.errors.benefits && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.benefits.message}
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="relatedMedicines"
          render={() => (
            <FormItem>
              <FormLabel>Related Medicines <span className="text-neutral-500 text-sm">(Optional)</span></FormLabel>
              <div className="space-y-2">
                <div className="flex">
                  <Input
                    placeholder="Add a related medicine"
                    value={newMedicine}
                    onChange={(e) => setNewMedicine(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMedicine();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddMedicine}
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {medicines.map((medicine, index) => (
                    <div key={index} className="flex items-center bg-neutral-100 text-neutral-800 rounded-full px-3 py-1">
                      <span className="text-sm">{medicine}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 text-neutral-800 hover:text-neutral-900 hover:bg-transparent"
                        onClick={() => handleRemoveMedicine(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                {form.formState.errors.relatedMedicines && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.relatedMedicines.message}
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full md:w-auto"
          disabled={createTreatment.isPending}
        >
          {createTreatment.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editTreatment ? "Updating Treatment..." : "Adding Treatment..."}
            </>
          ) : (
            <>{editTreatment ? "Update Treatment" : "Add Treatment"}</>
          )}
        </Button>
      </form>
    </Form>
  );
}