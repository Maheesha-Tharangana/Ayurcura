import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { statusColors } from "@/lib/utils";
import { ArrowLeft, Calendar } from "lucide-react";

// Define appointment status type
type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle, Dialog } from "@/components/ui/dialog";
import Navbar from "@/components/layout/navbar";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  
  // Define appointment interface
  interface Appointment {
    _id: string;
    doctorId: {
      _id: string;
      name: string;
      specialty: string;
      location: string;
      consultationFee: number;
      imageUrl?: string;
    };
    userId: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    symptoms: string;
    notes?: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
  }
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Redirect if not logged in
  if (!user) {
    toast({
      title: "Authentication required",
      description: "Please log in to view your appointments",
      variant: "destructive",
    });
    setLocation("/auth");
    return null;
  }

  // Fetch user appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const response = await fetch("/api/appointments");
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      return response.json();
    }
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setOpenDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  });

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter((appointment) => {
    if (activeTab === "all") return true;
    return appointment.status === activeTab;
  });

  // Group appointments by status
  const appointmentCounts = appointments.reduce((acc: Record<string, number>, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, {});

  // Handle view appointment details
  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setOpenDialog(true);
  };

  // Handle cancel appointment
  const handleCancelAppointment = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      cancelAppointmentMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/")}
              className="group"
            >
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:translate-x-[-2px] transition-transform" />
              Back Home
            </Button>
            <h1 className="text-3xl font-bold">My Appointments</h1>
          </div>
          
          <Card className="bg-white mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Manage Appointments</CardTitle>
                  <CardDescription>View and manage all your medical appointments</CardDescription>
                </div>
                <Button 
                  onClick={() => setLocation("/doctors")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book New Appointment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="all" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="flex justify-center mb-4">
                  <TabsList>
                    <TabsTrigger value="all">
                      All
                      <Badge variant="outline" className="ml-2">
                        {appointments.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending
                      <Badge variant="outline" className="ml-2">
                        {appointmentCounts.pending || 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="confirmed">
                      Confirmed
                      <Badge variant="outline" className="ml-2">
                        {appointmentCounts.confirmed || 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      Completed
                      <Badge variant="outline" className="ml-2">
                        {appointmentCounts.completed || 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="cancelled">
                      Cancelled
                      <Badge variant="outline" className="ml-2">
                        {appointmentCounts.cancelled || 0}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="m-0">
                  <AppointmentsList 
                    appointments={filteredAppointments} 
                    isLoading={isLoading}
                    onViewDetails={handleViewDetails}
                    onCancelAppointment={handleCancelAppointment}
                  />
                </TabsContent>
                <TabsContent value="pending" className="m-0">
                  <AppointmentsList 
                    appointments={filteredAppointments} 
                    isLoading={isLoading}
                    onViewDetails={handleViewDetails}
                    onCancelAppointment={handleCancelAppointment}
                  />
                </TabsContent>
                <TabsContent value="confirmed" className="m-0">
                  <AppointmentsList 
                    appointments={filteredAppointments} 
                    isLoading={isLoading}
                    onViewDetails={handleViewDetails}
                    onCancelAppointment={handleCancelAppointment}
                  />
                </TabsContent>
                <TabsContent value="completed" className="m-0">
                  <AppointmentsList 
                    appointments={filteredAppointments} 
                    isLoading={isLoading}
                    onViewDetails={handleViewDetails}
                    onCancelAppointment={handleCancelAppointment}
                  />
                </TabsContent>
                <TabsContent value="cancelled" className="m-0">
                  <AppointmentsList 
                    appointments={filteredAppointments} 
                    isLoading={isLoading}
                    onViewDetails={handleViewDetails}
                    onCancelAppointment={handleCancelAppointment}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Appointment Details Dialog */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="max-w-2xl">
              {selectedAppointment && (
                <>
                  <DialogHeader>
                    <DialogTitle>Appointment Details</DialogTitle>
                    <DialogDescription>
                      Complete information about your appointment
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedAppointment.doctorId.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedAppointment.doctorId.specialty}</p>
                      </div>
                      <Badge className={statusColors[selectedAppointment.status as keyof typeof statusColors]}>
                        {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Date & Time</p>
                        <p className="text-sm">
                          {format(new Date(selectedAppointment.date), "PPP")} at {selectedAppointment.time}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm">{selectedAppointment.doctorId.location}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Consultation Fee</p>
                        <p className="text-sm">LKR{selectedAppointment.doctorId.consultationFee}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Payment Status</p>
                        <Badge variant="outline">
                          {selectedAppointment.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm font-medium">Health Concerns / Symptoms</p>
                      <p className="text-sm mt-1">{selectedAppointment.symptoms}</p>
                    </div>
                    
                    {selectedAppointment.notes && (
                      <div>
                        <p className="text-sm font-medium">Additional Notes</p>
                        <p className="text-sm mt-1">{selectedAppointment.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setOpenDialog(false)}
                    >
                      Close
                    </Button>
                    
                    {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                      <Button 
                        variant="destructive"
                        onClick={() => handleCancelAppointment(selectedAppointment._id)}
                        disabled={cancelAppointmentMutation.isPending}
                      >
                        Cancel Appointment
                      </Button>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

// Appointments List Component
function AppointmentsList({ 
  appointments, 
  isLoading,
  onViewDetails,
  onCancelAppointment
}: { 
  appointments: any[],
  isLoading: boolean,
  onViewDetails: (appointment: any) => void,
  onCancelAppointment: (id: string) => void
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <p>Loading your appointments...</p>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="mb-4 text-center">No appointments found in this category.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {appointments.map((appointment: any) => (
        <Card key={appointment._id} className="overflow-hidden">
          <div className="border-l-4 border-l-primary">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{appointment.doctorId.name}</h3>
                  <p className="text-sm text-muted-foreground">{appointment.doctorId.specialty}</p>
                </div>
                <Badge className={`mt-2 sm:mt-0 ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">{format(new Date(appointment.date), "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm">{appointment.time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm">{appointment.doctorId.location}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(appointment)}
                >
                  View Details
                </Button>
                
                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onCancelAppointment(appointment._id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}