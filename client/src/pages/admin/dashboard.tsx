import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserRound, UserPlus, StethoscopeIcon, CalendarDays, BarChart3, Settings, CreditCard, Pill } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getQueryFn } from "@/lib/queryClient";
import { MongoFields } from "@shared/schema";

// Define MongoDB document typings for proper type-checking
interface MongoUser extends MongoFields {
  username: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string | Date;
  id?: string | number; // For MongoDB _id field
}

interface MongoDoctor extends MongoFields {
  name: string;
  specialty: string;
  location: string;
  imageUrl?: string;
  consultationFee: number;
  yearsOfExperience: number;
  id?: string | number; // For MongoDB _id field
}

interface MongoAppointment extends MongoFields {
  doctorId: string | number | MongoDoctor;
  userId: string | number | MongoUser;
  date: string | Date;
  time: string;
  status: string;
  paymentStatus: string;
  symptoms: string;
  notes: string;
  createdAt: string | Date;
  appointmentDate?: string | Date; // Legacy field
  id?: string | number; // For MongoDB _id field
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<MongoUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,
    retryDelay: 500,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch all doctors
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<MongoDoctor[]>({
    queryKey: ["/api/doctors"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,
    retryDelay: 500,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Fetch all appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<MongoAppointment[]>({
    queryKey: ["/api/admin/appointments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,
    retryDelay: 500,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const isLoading = isLoadingUsers || isLoadingDoctors || isLoadingAppointments;

  // Calculate dashboard stats
  const stats = {
    totalUsers: users?.length || 0,
    newUsersToday: users?.filter(user => {
      if (!user.createdAt) return false;
      const today = new Date();
      const userDate = new Date(user.createdAt);
      return userDate.getDate() === today.getDate() &&
             userDate.getMonth() === today.getMonth() &&
             userDate.getFullYear() === today.getFullYear();
    }).length || 0,
    totalDoctors: doctors?.length || 0,
    pendingAppointments: appointments?.filter(app => app.status === "pending").length || 0,
    completedAppointments: appointments?.filter(app => app.status === "completed").length || 0,
    cancelledAppointments: appointments?.filter(app => app.status === "cancelled").length || 0,
  };
  
  // Calculate total appointments for percentage calculations (avoid division by zero)
  const totalAppointments = stats.pendingAppointments + stats.completedAppointments + stats.cancelledAppointments;
  const getPercentage = (count: number) => {
    return totalAppointments > 0 ? (count / totalAppointments) * 100 : 0;
  };

  // Get recent appointments
  const recentAppointments = appointments?.slice(0, 5) || [];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
              <p className="text-neutral-600 mt-1">Manage your Ayurvedic health network</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setLocation("/admin/doctors")}>
                <StethoscopeIcon className="mr-2 h-4 w-4" />
                Manage Doctors
              </Button>
              <Button onClick={() => setLocation("/admin/appointments")}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Manage Appointments
              </Button>
              <Button onClick={() => setLocation("/admin/payments")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Payments
              </Button>
              <Button onClick={() => setLocation("/admin/treatments")}>
                <Pill className="mr-2 h-4 w-4" />
                Manage Treatments
              </Button>
              <Button variant="outline" onClick={() => setLocation("/admin/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="treatments">Treatments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UserRound className="h-4 w-4 text-neutral-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-neutral-500 mt-1">
                          {stats.newUsersToday} new today
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Registered Doctors</CardTitle>
                        <StethoscopeIcon className="h-4 w-4 text-neutral-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Across various specialties
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                        <CalendarDays className="h-4 w-4 text-neutral-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats.pendingAppointments + stats.completedAppointments + stats.cancelledAppointments}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          {stats.pendingAppointments} pending
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Appointments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {recentAppointments.length > 0 ? (
                          <div className="space-y-4">
                            {recentAppointments.map((appointment) => (
                              <div key={appointment._id?.toString() || appointment.id?.toString()} className="flex items-center justify-between p-3 bg-neutral-50 rounded-md">
                                <div>
                                  <p className="font-medium">
                                    {typeof appointment.userId === 'object' && appointment.userId?.username 
                                      ? appointment.userId.username 
                                      : `User #${typeof appointment.userId === 'string' ? appointment.userId.substring(0, 8) : appointment.userId}`}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {typeof appointment.doctorId === 'object' && appointment.doctorId?.name 
                                      ? appointment.doctorId.name 
                                      : `Dr. #${typeof appointment.doctorId === 'string' ? appointment.doctorId.substring(0, 8) : appointment.doctorId}`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm">{formatDate(appointment.date || appointment.appointmentDate)}</p>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                    appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                                    appointment.status === "completed" ? "bg-green-100 text-green-800" :
                                    "bg-red-100 text-red-800"
                                  }`}>
                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-neutral-500">
                            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>No recent appointments</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Appointment Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">Pending</span>
                              <span className="text-sm font-medium">{stats.pendingAppointments}</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{ 
                                  width: `${getPercentage(stats.pendingAppointments)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">Completed</span>
                              <span className="text-sm font-medium">{stats.completedAppointments}</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ 
                                  width: `${getPercentage(stats.completedAppointments)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">Cancelled</span>
                              <span className="text-sm font-medium">{stats.cancelledAppointments}</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full"
                                style={{ 
                                  width: `${getPercentage(stats.cancelledAppointments)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="appointments">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">All Appointments</h2>
                <Button onClick={() => setLocation("/admin/appointments")}>
                  Manage Appointments
                </Button>
              </div>
              
              {isLoadingAppointments ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <>
                  {appointments && appointments.length > 0 ? (
                    <div className="space-y-4">
                      {appointments.slice(0, 10).map((appointment) => (
                        <div 
                          key={appointment._id?.toString() || appointment.id?.toString()} 
                          className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200"
                        >
                          <div className="flex flex-col md:flex-row justify-between">
                            <div>
                              <h3 className="font-medium">
                                {typeof appointment.userId === 'object' && appointment.userId?.username 
                                  ? appointment.userId.username 
                                  : typeof appointment.userId === 'string' 
                                    ? `User #${appointment.userId.substring(0, 8)}` 
                                    : `User #${appointment.userId}`}
                              </h3>
                              <p className="text-sm text-neutral-600">
                                {typeof appointment.doctorId === 'object' && appointment.doctorId?.name 
                                  ? appointment.doctorId.name 
                                  : typeof appointment.doctorId === 'string'
                                    ? `Dr. #${appointment.doctorId.substring(0, 8)}`
                                    : `Dr. #${appointment.doctorId}`}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">
                                {formatDate(appointment.date || appointment.appointmentDate)} - {appointment.time}
                              </p>
                            </div>
                            
                            <div className="mt-2 md:mt-0 flex flex-col items-end">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                                appointment.status === "completed" ? "bg-green-100 text-green-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                appointment.paymentStatus === "pending" ? "bg-orange-100 text-orange-800" :
                                appointment.paymentStatus === "completed" ? "bg-emerald-100 text-emerald-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                Payment: {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          {appointment.symptoms && (
                            <div className="mt-2 p-2 bg-neutral-50 rounded text-sm">
                              <p className="font-medium text-xs text-neutral-700">Symptoms:</p>
                              <p className="text-neutral-600">{appointment.symptoms}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {appointments.length > 10 && (
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={() => setLocation("/admin/appointments")}
                        >
                          View All {appointments.length} Appointments
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                      <CalendarDays className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                      <h3 className="text-lg font-medium text-neutral-900">No appointments found</h3>
                      <p className="text-neutral-600 mt-1">There are no appointments in the system yet.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="users">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Registered Users</h2>
                <Button onClick={() => setLocation("/admin/users")}>
                  Manage Users
                </Button>
              </div>
              
              {isLoadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <>
                  {users && users.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.slice(0, 9).map((user) => (
                        <div 
                          key={user._id?.toString() || user.id?.toString()} 
                          className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200"
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center">
                              <UserRound className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <h3 className="font-medium">{user.username}</h3>
                              <p className="text-sm text-neutral-600">{user.email}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-neutral-100">
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-600">Role:</span>
                              <span className={`font-medium ${user.role === 'admin' ? 'text-purple-600' : 'text-neutral-800'}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-neutral-600">Joined:</span>
                              <span className="font-medium">{formatDate(user.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                      <UserRound className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                      <h3 className="text-lg font-medium text-neutral-900">No users found</h3>
                      <p className="text-neutral-600 mt-1">There are no registered users in the system yet.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="treatments">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Ayurvedic Treatments</h2>
                <Button onClick={() => setLocation("/admin/treatments")}>
                  Manage Treatments
                </Button>
              </div>
              
              <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                <Pill className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <h3 className="text-lg font-medium text-neutral-900">Treatments Module</h3>
                <p className="text-neutral-600 mt-1">Manage Ayurvedic treatments, herbs, and therapies.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setLocation("/admin/treatments")}
                >
                  Go to Treatments
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}