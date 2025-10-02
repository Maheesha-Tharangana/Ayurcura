import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Settings, User, Mail, FileText, ClipboardList } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Navbar from "@/components/layout/navbar";
import { statusColors } from "@/lib/utils";

// Define appointment status type
type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

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

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Redirect if not logged in
  if (!user) {
    toast({
      title: "Authentication required",
      description: "Please log in to view your profile",
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
    },
    enabled: !!user,
  });

  // Count active appointments
  const activeAppointments = appointments.filter(
    (appointment: Appointment) => appointment.status === "pending" || appointment.status === "confirmed"
  ).length;

  // Count completed appointments
  const completedAppointments = appointments.filter(
    (appointment: Appointment) => appointment.status === "completed"
  ).length;

  // Get upcoming appointment (first active appointment)
  const upcomingAppointment = appointments.find(
    (appointment: Appointment) => appointment.status === "confirmed" || appointment.status === "pending"
  );

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
            <h1 className="text-3xl font-bold">My Profile</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Info Card */}
            <Card className="bg-white">
              <CardHeader className="text-center pb-2">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-3xl">
                    {getInitials(user.fullName || user.username)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{user.fullName || user.username}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{user.username}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.role && (
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm capitalize">
                        Account type: {user.role}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </CardFooter>
            </Card>
            
            {/* Main Content */}
            <div className="md:col-span-2">
              <Card className="bg-white">
                <CardHeader>
                  <Tabs 
                    defaultValue="overview" 
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="appointments">
                        Appointments
                        {appointments.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {appointments.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Active Appointments</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <span className="text-3xl font-bold">{activeAppointments}</span>
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                {activeAppointments === 1 ? 'Appointment' : 'Appointments'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Completed Visits</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <span className="text-3xl font-bold">{completedAppointments}</span>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                {completedAppointments === 1 ? 'Visit' : 'Visits'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4">Upcoming Appointment</h3>
                      {upcomingAppointment ? (
                        <Card className="overflow-hidden border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">{upcomingAppointment.doctorId.name}</h3>
                                <p className="text-sm text-muted-foreground">{upcomingAppointment.doctorId.specialty}</p>
                              </div>
                              <Badge className={statusColors[upcomingAppointment.status as AppointmentStatus]}>
                                {upcomingAppointment.status.charAt(0).toUpperCase() + upcomingAppointment.status.slice(1)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium">Date</p>
                                <p className="text-sm">{format(new Date(upcomingAppointment.date), "PPP")}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Time</p>
                                <p className="text-sm">{upcomingAppointment.time}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Location</p>
                                <p className="text-sm">{upcomingAppointment.doctorId.location}</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setActiveTab("appointments")}
                              >
                                View All Appointments
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent className="p-6 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <h3 className="text-lg font-medium mb-1">No Upcoming Appointments</h3>
                            <p className="text-muted-foreground mb-4">You don't have any upcoming appointments scheduled.</p>
                            <Button onClick={() => setLocation("/doctors")}>
                              Book an Appointment
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="appointments" className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">My Appointments</h3>
                        <Button onClick={() => setLocation("/appointments")}>
                          Manage Appointments
                        </Button>
                      </div>
                      
                      {isLoading ? (
                        <div className="flex justify-center py-12">
                          <p>Loading your appointments...</p>
                        </div>
                      ) : appointments.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <h3 className="text-lg font-medium mb-1">No Appointments</h3>
                            <p className="text-muted-foreground mb-4">You haven't booked any appointments yet.</p>
                            <Button onClick={() => setLocation("/doctors")}>
                              Book Your First Appointment
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {appointments.slice(0, 5).map((appointment: Appointment) => (
                            <Card key={appointment._id} className="overflow-hidden border-l-4 border-l-primary">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold">{appointment.doctorId.name}</h3>
                                    <p className="text-sm text-muted-foreground">{appointment.doctorId.specialty}</p>
                                  </div>
                                  <Badge className={statusColors[appointment.status as AppointmentStatus]}>
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
                              </CardContent>
                            </Card>
                          ))}
                          
                          {appointments.length > 5 && (
                            <div className="flex justify-center mt-4">
                              <Button 
                                variant="outline"
                                onClick={() => setLocation("/appointments")}
                              >
                                View All {appointments.length} Appointments
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="settings" className="mt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Account Settings</h3>
                          <Card>
                            <CardContent className="p-6">
                              <p className="text-muted-foreground mb-4">
                                Update your account information and preferences.
                              </p>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Full Name</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-2 border rounded-md" 
                                    value={user.fullName || user.username}
                                    disabled
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Email</label>
                                  <input 
                                    type="email" 
                                    className="w-full p-2 border rounded-md" 
                                    value={user.email}
                                    disabled
                                  />
                                </div>
                                <div>
                                  <Button disabled>Update Profile</Button>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Profile editing will be available in a future update.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Preferences</h3>
                          <Card>
                            <CardContent className="p-6">
                              <p className="text-muted-foreground mb-4">
                                Customize your account preferences and notification settings.
                              </p>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">Email Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                      Receive email notifications for appointments
                                    </p>
                                  </div>
                                  <div className="flex items-center h-5">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      checked
                                      disabled
                                    />
                                  </div>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">SMS Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                      Receive text message reminders
                                    </p>
                                  </div>
                                  <div className="flex items-center h-5">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      disabled
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}