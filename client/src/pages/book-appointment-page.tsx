import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { createStarRating } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Appointment Form Schema
const appointmentFormSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string({
    required_error: "Please select a time slot",
  }),
  symptoms: z.string().min(10, {
    message: "Please describe your symptoms in at least 10 characters",
  }),
  notes: z.string().optional()
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Generate time slots (9 AM to 5 PM, hourly)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    const formattedHour = hour > 12 ? (hour - 12) : hour;
    const amPm = hour >= 12 ? "PM" : "AM";
    slots.push(`${formattedHour}:00 ${amPm}`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { doctorId } = useParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Redirect if not logged in
  if (!user) {
    toast({
      title: "Authentication required",
      description: "Please log in to book an appointment",
      variant: "destructive",
    });
    setLocation("/auth");
    return null;
  }

  // Validate the doctor ID
  if (!doctorId || doctorId === 'undefined') {
    toast({
      title: "Invalid Doctor",
      description: "The doctor you're trying to book doesn't exist.",
      variant: "destructive",
    });
    setLocation("/doctors");
    return null;
  }

  // Fetch doctor details
  const { data: doctor, isLoading: isDoctorLoading } = useQuery({
    queryKey: [`/api/doctors/${doctorId}`],
    queryFn: async () => {
      console.log("Fetching doctor with ID:", doctorId);
      const response = await fetch(`/api/doctors/${doctorId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch doctor details");
      }
      return response.json();
    }
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      return apiRequest("POST", "/api/appointments", {
        doctorId,
        ...data
      });
    },
    onSuccess: (response) => {
      // Parse the response to get the appointment ID
      response.json().then((data) => {
        const appointmentId = data._id || data.id;
        
        if (!appointmentId) {
          throw new Error("No appointment ID returned from server");
        }
        
        toast({
          title: "Appointment Booked",
          description: "Your appointment has been scheduled. Please proceed to payment to confirm.",
        });
        
        // Invalidate both regular appointments and admin appointments
        queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/appointments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        
        // Store the appointment ID in local storage for payment tracking
        localStorage.setItem('current_appointment_id', appointmentId.toString());
        
        // Navigate to payment page with the appointment ID
        setTimeout(() => {
          setLocation(`/payment/${appointmentId}`);
        }, 500);
      }).catch(error => {
        console.error("Failed to parse appointment response:", error);
        toast({
          title: "Booking Completed",
          description: "Your appointment has been scheduled, but we couldn't redirect you to payment. Please check your appointments.",
          variant: "destructive",
        });
        setLocation("/appointments");
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Form setup
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      notes: ""
    }
  });

  // Form submit handler
  function onSubmit(values: AppointmentFormValues) {
    createAppointmentMutation.mutate(values);
  }

  if (isDoctorLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[50vh]">
          <p>Loading doctor details...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold mb-4">Doctor Not Found</h2>
          <p>We couldn't find the doctor you're looking for.</p>
          <Button className="mt-4" onClick={() => setLocation("/doctors")}>
            Browse All Doctors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Book an Appointment</h1>
        <Button 
          variant="outline"
          onClick={() => setLocation(`/doctors/${doctorId}`)}
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Doctor
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctor Details Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Doctor Information</CardTitle>
              <CardDescription>Details about your selected doctor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {doctor.imageUrl && (
                  <div className="w-full h-48 overflow-hidden rounded-md">
                    <img 
                      src={doctor.imageUrl} 
                      alt={doctor.name} 
                      className="w-60 h-62 object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-semibold">{doctor.name}</h3>
                  <p className="text-muted-foreground">{doctor.specialty}</p>
                  <p className="mt-1">{doctor.location}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="font-medium">Experience:</p>
                    <p>{doctor.yearsOfExperience} years</p>
                  </div>
                  <div>
                    <p className="font-medium">Consultation Fee:</p>
                    <p>LKR {doctor.consultationFee}</p>
                  </div>
                </div>
                
                {doctor.reviews && doctor.reviews.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2">Patient Reviews:</p>
                      <div className="flex items-center">
                        {createStarRating(
                          doctor.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / 
                          doctor.reviews.length
                        ).map((star, i) => (
                          <span key={i} className={star.type === "full" ? "text-yellow-500" : "text-gray-300"}>
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm">
                          ({doctor.reviews.length} reviews)
                        </span>
                      </div>
                    </div>
                  </>
                )}
                
                <p className="text-sm mt-2">{doctor.bio}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Appointment Booking Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Your Appointment</CardTitle>
              <CardDescription>
                Please select a date, time, and provide details about your health concerns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Appointment Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setSelectedDate(date);
                                }}
                                disabled={(date) => 
                                  date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                  date > new Date(new Date().setDate(new Date().getDate() + 30))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            You can book appointments up to 30 days in advance
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Time</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!selectedDate}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a time slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot} value={slot}>
                                  {slot}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select your preferred consultation time
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Concerns / Symptoms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe your symptoms or health concerns in detail..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Providing detailed information helps the doctor prepare for your consultation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any other information you'd like to share with the doctor..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include information about allergies, medications, or other relevant details
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full md:w-auto"
                      disabled={createAppointmentMutation.isPending}
                    >
                      {createAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}