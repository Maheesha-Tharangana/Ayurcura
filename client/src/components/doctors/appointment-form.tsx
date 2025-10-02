import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";
import { Loader2, CalendarIcon } from "lucide-react";

interface AppointmentFormProps {
  doctorId: number;
  doctorName: string;
}

const appointmentSchema = z.object({
  appointmentDate: z.date({
    required_error: "Please select a date and time",
  }),
  appointmentTime: z.string({
    required_error: "Please select a time",
  }),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function AppointmentForm({ doctorId, doctorName }: AppointmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  
  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", 
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
  ];

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      notes: "",
    },
  });

  const createAppointment = useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      // Combine date and time
      const [hours, minutes, period] = values.appointmentTime.match(/(\d+):(\d+)\s(AM|PM)/)?.slice(1) || [];
      const appointmentDate = new Date(values.appointmentDate);
      
      appointmentDate.setHours(
        period === "PM" && hours !== "12" ? parseInt(hours) + 12 : parseInt(hours),
        parseInt(minutes),
        0
      );
      
      const requestData = {
        doctorId,
        appointmentDate: appointmentDate.toISOString(),
        notes: values.notes,
      };
      
      const response = await apiRequest("POST", "/api/appointments", requestData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Booked",
        description: `Your appointment with Dr. ${doctorName} has been scheduled.`,
      });
      form.reset();
      setDate(undefined);
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error booking your appointment. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: AppointmentFormValues) => {
    createAppointment.mutate(values);
  };

  const isDateDisabled = (date: Date) => {
    // Disable weekends and past dates
    return date < new Date() || date.getDay() === 0 || date.getDay() === 6;
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Book an Appointment with Dr. {doctorName}</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="appointmentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Appointment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value)
                          ) : (
                            <span>Select a date</span>
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
                          setDate(date);
                        }}
                        disabled={isDateDisabled}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="appointmentTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Time</FormLabel>
                  <Select
                    disabled={!date}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any specific concerns or information for the doctor..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={createAppointment.isPending}
          >
            {createAppointment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking Appointment...
              </>
            ) : (
              "Book Appointment"
            )}
          </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-sm text-neutral-500">
        <p>
          <i className="ri-information-line mr-1"></i> 
          By booking an appointment, you agree to our cancellation policy. 
          Please cancel at least 24 hours in advance if you cannot make it.
        </p>
      </div>
    </div>
  );
}
