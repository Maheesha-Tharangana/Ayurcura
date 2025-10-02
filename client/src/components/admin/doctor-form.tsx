import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { specialties } from "@/lib/utils";
import { Doctor } from "@shared/schema";

interface DoctorFormProps {
  onSuccess?: () => void;
  editDoctor?: Doctor;
}

const doctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  specialty: z.string().min(1, "Specialty is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(5, "Full address is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters long"),
  contactNumber: z.string().min(7, "Valid contact number is required"),
  email: z.string().email("Must be a valid email address"),
  latitude: z.string().regex(/^-?([1-8]?[0-9]\.{1}\d+|90\.{1}0+)$/, "Must be a valid latitude"),
  longitude: z.string().regex(/^-?((1[0-7][0-9]|[1-9]?[0-9])\.{1}\d+|180\.{1}0+)$/, "Must be a valid longitude"),
  availability: z.array(z.string()).min(1, "At least one availability day is required"),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

export default function DoctorForm({ onSuccess, editDoctor }: DoctorFormProps) {
  const { toast } = useToast();
  const [days, setDays] = useState<string[]>(editDoctor?.availability as string[] || []);
  
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: editDoctor?.name || "",
      specialty: editDoctor?.specialty || "",
      location: editDoctor?.location || "",
      address: editDoctor?.address || "",
      bio: editDoctor?.bio || "",
      contactNumber: editDoctor?.contactNumber || "",
      email: editDoctor?.email || "",
      latitude: editDoctor?.latitude || "",
      longitude: editDoctor?.longitude || "",
      availability: editDoctor?.availability as string[] || [],
    },
  });

  const availableDays = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
  ];

  // Toggle day selection
  const toggleDay = (day: string) => {
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day];
    
    setDays(newDays);
    form.setValue("availability", newDays);
  };

  const createDoctor = useMutation({
    mutationFn: async (values: DoctorFormValues) => {
      const endpoint = editDoctor 
        ? `/api/admin/doctors/${editDoctor.id}` 
        : "/api/admin/doctors";
      
      const method = editDoctor ? "PUT" : "POST";
      
      const response = await apiRequest(method, endpoint, values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: editDoctor ? "Doctor Updated" : "Doctor Added",
        description: editDoctor 
          ? `Dr. ${form.getValues("name")}'s information has been updated.` 
          : `Dr. ${form.getValues("name")} has been added to the system.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (!editDoctor) {
        form.reset();
        setDays([]);
      }
    },
    onError: (error) => {
      toast({
        title: editDoctor ? "Update Failed" : "Addition Failed",
        description: error.message || "There was an error processing your request. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: DoctorFormValues) => {
    createDoctor.mutate(values);
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
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Dr. John Smith" {...field} />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a specialty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {specialties.filter(s => s !== "All Specialties").map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input type="email" placeholder="doctor@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input placeholder="+94 123 456 7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location (City)</FormLabel>
                <FormControl>
                  <Input placeholder="Colombo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Ayurveda St, Colombo, Sri Lanka" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input placeholder="6.9271" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input placeholder="79.8612" {...field} />
                </FormControl>
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
                  placeholder="Brief description of the doctor's experience and expertise..." 
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
          name="availability"
          render={() => (
            <FormItem>
              <FormLabel>Availability</FormLabel>
              <div className="flex flex-wrap gap-2">
                {availableDays.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={days.includes(day) ? "default" : "outline"}
                    onClick={() => toggleDay(day)}
                    className="text-sm"
                  >
                    {day}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full md:w-auto"
          disabled={createDoctor.isPending}
        >
          {createDoctor.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editDoctor ? "Updating Doctor..." : "Adding Doctor..."}
            </>
          ) : (
            <>{editDoctor ? "Update Doctor" : "Add Doctor"}</>
          )}
        </Button>
      </form>
    </Form>
  );
}
