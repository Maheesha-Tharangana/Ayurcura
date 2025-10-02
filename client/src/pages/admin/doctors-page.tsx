import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { specialties } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminNavbar from "@/components/layout/admin-navbar";
import { Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// Doctor Schema
const doctorFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  specialty: z.string().min(1, { message: "Specialty is required" }),
  location: z.string().min(3, { message: "Location is required" }),
  phone: z.string().min(10, { message: "Valid phone number is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters" }),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(FileList).optional().refine(
    (files) => {
      if (!files || files.length === 0) return true;
      const file = files[0];
      return file && file.type.startsWith('image/');
    }, 
    { message: "File must be an image (jpg, png, etc.)" }
  ),
  consultationFee: z.string().refine(val => !isNaN(Number(val)), {
    message: "Consultation fee must be a number"
  }),
  yearsOfExperience: z.string().refine(val => !isNaN(Number(val)), {
    message: "Years of experience must be a number"
  })
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

export default function AdminDoctorsPage() {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | number | null>(null);

  // Fetch doctors
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["/api/doctors"],
    queryFn: async () => {
      const response = await fetch("/api/doctors");
      if (!response.ok) {
        throw new Error("Failed to fetch doctors");
      }
      return response.json();
    }
  });

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: async (doctor: DoctorFormValues) => {
      // Check if we have an image file to upload
      if (doctor.imageFile && doctor.imageFile.length > 0) {
        // Create a FormData object for file upload
        const formData = new FormData();
        
        // Add all form fields to the FormData
        Object.keys(doctor).forEach(key => {
          if (key === 'imageFile') {
            // Add the file to FormData
            if (doctor.imageFile && doctor.imageFile.length > 0) {
              formData.append('imageFile', doctor.imageFile[0]);
            }
          } else {
            // Add other fields
            formData.append(key, (doctor as any)[key]);
          }
        });
        
        // Make the API request with FormData
        const response = await fetch('/api/admin/doctors', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to add doctor');
        }
        
        return response;
      } else {
        // No file to upload, use the regular API request
        return apiRequest("POST", "/api/admin/doctors", doctor);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Doctor has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add doctor",
        variant: "destructive",
      });
    }
  });

  // Update doctor mutation
  const updateDoctorMutation = useMutation({
    mutationFn: async (data: { id: string | number; doctor: DoctorFormValues }) => {
      // Check if we have an image file to upload
      if (data.doctor.imageFile && data.doctor.imageFile.length > 0) {
        // Create a FormData object for file upload
        const formData = new FormData();
        
        // Add all form fields to the FormData
        Object.keys(data.doctor).forEach(key => {
          if (key === 'imageFile') {
            // Add the file to FormData
            if (data.doctor.imageFile && data.doctor.imageFile.length > 0) {
              formData.append('imageFile', data.doctor.imageFile[0]);
            }
          } else {
            // Add other fields
            formData.append(key, (data.doctor as any)[key]);
          }
        });
        
        // Make the API request with FormData
        const response = await fetch(`/api/admin/doctors/${data.id}`, {
          method: 'PATCH',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to update doctor');
        }
        
        return response;
      } else {
        // No file to upload, use the regular API request
        return apiRequest("PATCH", `/api/admin/doctors/${data.id}`, data.doctor);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Doctor has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      form.reset();
      setIsEditMode(false);
      setCurrentDoctorId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update doctor",
        variant: "destructive",
      });
    }
  });

  // Delete doctor mutation
  const deleteDoctorMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return apiRequest("DELETE", `/api/admin/doctors/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Doctor has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete doctor",
        variant: "destructive",
      });
    }
  });

  // Form setup
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: "",
      specialty: "",
      location: "",
      phone: "",
      email: "",
      bio: "",
      imageUrl: "",
      consultationFee: "",
      yearsOfExperience: ""
    }
  });

  // Handle form submission
  function onSubmit(values: DoctorFormValues) {
    if (isEditMode && currentDoctorId) {
      updateDoctorMutation.mutate({ id: currentDoctorId, doctor: values });
    } else {
      createDoctorMutation.mutate(values);
    }
  }

  // Edit doctor handler with MongoDB support
  function handleEditDoctor(doctor: any) {
    setIsEditMode(true);
    // Use either id or _id from MongoDB
    const doctorId = doctor.id || doctor._id;
    setCurrentDoctorId(doctorId);
    console.log("Editing doctor with ID:", doctorId);
    
    form.reset({
      name: doctor.name,
      specialty: doctor.specialty,
      location: doctor.location,
      phone: doctor.phone || doctor.contactNumber || "",
      email: doctor.email,
      bio: doctor.bio || "",
      imageUrl: doctor.imageUrl || "",
      consultationFee: (doctor.consultationFee || "0").toString(),
      yearsOfExperience: (doctor.yearsOfExperience || "0").toString()
    });
  }

  // Cancel edit mode
  function handleCancelEdit() {
    setIsEditMode(false);
    setCurrentDoctorId(null);
    form.reset();
  }

  // Add useEffect to catch and log MongoDB IDs
  useEffect(() => {
    if (doctors && doctors.length > 0) {
      // Log the format of the first doctor to help with debugging
      console.log("Doctor format:", doctors[0]);
    }
  }, [doctors]);

  return (
    <div className="bg-neutral-50 min-h-screen">
      <AdminNavbar />
      
      <div className="container mx-auto py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Doctor Management</CardTitle>
            <CardDescription>
              Add, edit, and remove Ayurvedic doctors from the platform
            </CardDescription>
          </CardHeader>
        </Card>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{isEditMode ? "Edit Doctor" : "Add New Doctor"}</CardTitle>
                <CardDescription>
                  {isEditMode 
                    ? "Update doctor information in the system" 
                    : "Add a new Ayurvedic doctor to the system"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select specialty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {specialties.map((specialty) => (
                                <SelectItem key={specialty} value={specialty}>
                                  {specialty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Colombo,Sri Lanka" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="consultationFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Consultation Fee (LKR)</FormLabel>
                            <FormControl>
                              <Input placeholder="2990.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="yearsOfExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input placeholder="10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 234 567 8900" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="doctor@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/doctor.jpg" {...field} />
                            </FormControl>
                            <FormDescription>
                              Provide a URL to the doctor's profile image or upload below
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="imageFile"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Upload Profile Image</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => onChange(e.target.files)}
                                {...fieldProps}
                              />
                            </FormControl>
                            <FormDescription>
                              Upload a profile image directly from your computer (JPG, PNG)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biography</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Dr. John is an experienced Ayurvedic practitioner..." 
                              {...field} 
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2 pt-4">
                      {isEditMode ? (
                        <>
                          <Button type="submit" disabled={updateDoctorMutation.isPending}>
                            Update Doctor
                          </Button>
                          <Button type="button" variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button type="submit" disabled={createDoctorMutation.isPending}>
                          Add Doctor
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Doctor List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Doctors List</CardTitle>
                <CardDescription>
                  View and manage all doctors in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <p>No doctors found. Add your first doctor!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doctors.map((doctor: any) => {
                      // Use either id or _id for the key and operations
                      const doctorId = doctor.id || doctor._id;
                      return (
                        <Card key={doctorId} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            {doctor.imageUrl && (
                              <div className="w-full md:w-1/4 h-48 md:h-auto bg-gray-100">
                                <img 
                                  src={doctor.imageUrl} 
                                  alt={doctor.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-4 flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold">{doctor.name}</h3>
                                  <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                                  <p className="text-sm mt-1">{doctor.location}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditDoctor(doctor)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete ${doctor.name}?`)) {
                                        deleteDoctorMutation.mutate(doctorId);
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              
                              <Separator className="my-3" />
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="font-medium">Experience:</p>
                                  <p>{doctor.yearsOfExperience} years</p>
                                </div>
                                <div>
                                  <p className="font-medium">Consultation Fee:</p>
                                  <p>LKR {doctor.consultationFee}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Contact:</p>
                                  <p>{doctor.phone || doctor.contactNumber}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Email:</p>
                                  <p>{doctor.email}</p>
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <p className="font-medium mb-1">Biography:</p>
                                <p className="text-sm text-gray-600">
                                  {doctor.bio ? (doctor.bio.length > 150 ? `${doctor.bio.substring(0, 150)}...` : doctor.bio) : 'No biography available'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}