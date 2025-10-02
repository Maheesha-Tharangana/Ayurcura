import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
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
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, Doctor, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Search, 
  Check, 
  X, 
  MoreHorizontal, 
  ArrowLeft,
  Calendar,
  UserRound
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatTime } from "@/lib/utils";

// Extend Appointment type to handle MongoDB objects
interface MongoAppointment extends Appointment {
  _id?: string;
  date?: string | Date;
  time?: string;
  doctorId: any; // Could be number or MongoDB object with populated data
  userId: any;   // Could be number or MongoDB object with populated data
}

// Helper function to format MongoDB date objects
const formatMongoDate = (date: any): string => {
  if (!date) return "N/A";
  
  try {
    // Handle both Date objects and strings
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return String(date);
  }
};

// Helper function to format MongoDB time
const formatMongoTime = (date: any): string => {
  if (!date) return "N/A";
  
  try {
    // Handle both Date objects and strings
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting time:', e);
    return String(date);
  }
};

export default function ManageAppointments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<MongoAppointment | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  
  // Fetch all appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<MongoAppointment[]>({
    queryKey: ['/api/admin/appointments'],
  });
  
  // Fetch all doctors
  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
  });
  
  // Fetch all users
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });
  
  // Status update mutation
  const updateStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: number | string, 
      status: string, 
      notes?: string 
    }) => {
      const response = await apiRequest("PATCH", `/api/admin/appointments/${id}/status`, { 
        status, 
        notes 
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appointments'] });
      toast({
        title: "Appointment Updated",
        description: `Status changed to ${newStatus}`,
      });
      setIsUpdateDialogOpen(false);
      setStatusNote("");
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating the appointment status. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Find doctor and user names - handling both MongoDB objects and IDs
  const getDoctorName = (doctorId: any) => {
    // If doctorId is already an object with name (from MongoDB populate)
    if (doctorId && typeof doctorId === 'object' && doctorId.name) {
      return doctorId.name;
    }
    
    // Otherwise look it up in doctors array
    const doctor = doctors?.find(doc => 
      doc.id === doctorId || 
      doc._id === doctorId || 
      doc._id?.toString() === doctorId?.toString()
    );
    return doctor ? doctor.name : `Doctor ${doctorId}`;
  };
  
  const getUserName = (userId: any) => {
    // If userId is already an object with username or email (from MongoDB populate)
    if (userId && typeof userId === 'object') {
      return userId.fullName || userId.username || userId.email || 'User';
    }
    
    // Otherwise look it up in users array
    const user = users?.find(u => 
      u.id === userId || 
      u._id === userId || 
      u._id?.toString() === userId?.toString()
    );
    return user ? user.fullName || user.username : `User ${userId}`;
  };
  
  // Handle status update
  const handleStatusUpdate = () => {
    if (selectedAppointment && newStatus) {
      updateStatus.mutate({
        id: selectedAppointment.id || selectedAppointment._id as string,
        status: newStatus,
        notes: statusNote
      });
    }
  };
  
  // Open update dialog
  const openStatusUpdateDialog = (appointment: MongoAppointment, initialStatus?: string) => {
    setSelectedAppointment(appointment);
    setNewStatus(initialStatus || appointment.status);
    setStatusNote(appointment.notes || "");
    setIsUpdateDialogOpen(true);
  };
  
  // Filter appointments based on search term and status
  const filteredAppointments = appointments?.filter(appointment => {
    // Handle doctors and users not being loaded yet
    const doctorName = doctors ? getDoctorName(appointment.doctorId) : `Doctor #${appointment.doctorId}`;
    const userName = users ? getUserName(appointment.userId) : `User #${appointment.userId}`;
    
    // Search through relevant fields
    const matchesSearch = 
      doctorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status if selected
    const matchesStatus = !statusFilter || statusFilter === "all" || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

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
            <h1 className="text-3xl font-bold text-neutral-900">Manage Appointments</h1>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Appointment Management</CardTitle>
              <CardDescription>
                View and manage all patient appointments in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      placeholder="Search by doctor, patient or notes"
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-64">
                    <Select 
                      value={statusFilter} 
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Button 
                    onClick={() => setLocation("/doctors")}
                    className="flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14"></path>
                    </svg>
                    Create Appointment
                  </Button>
                </div>
              </div>
              
              {isLoadingAppointments ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : !filteredAppointments || filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="h-16 w-16 rounded-full bg-neutral-100 mx-auto flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-medium text-neutral-900 mb-2">No Appointments Found</h3>
                  <p className="text-neutral-600 max-w-md mx-auto">
                    {searchTerm || statusFilter 
                      ? "No appointments match your search criteria. Try using different keywords or filters."
                      : "There are no appointments in the system yet."}
                  </p>
                  {(searchTerm || statusFilter) && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("");
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Notes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment._id || appointment.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            #{appointment._id?.toString().slice(-4) || appointment.id.toString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 mr-3">
                                <UserRound className="h-4 w-4" />
                              </div>
                              <div className="text-sm font-medium text-neutral-900">
                                {getUserName(appointment.userId)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {getDoctorName(appointment.doctorId)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">
                              {appointment.date 
                                ? formatMongoDate(appointment.date) 
                                : formatDate(appointment.appointmentDate)}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {appointment.time 
                                ? appointment.time 
                                : appointment.date 
                                  ? formatMongoTime(appointment.date) 
                                  : formatTime(appointment.appointmentDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-neutral-500 max-w-xs truncate">
                              {appointment.notes || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {appointment.status === "pending" && (
                                  <DropdownMenuItem 
                                    onClick={() => openStatusUpdateDialog(appointment, "confirmed")}
                                    className="text-blue-600"
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Confirm
                                  </DropdownMenuItem>
                                )}
                                {(appointment.status === "pending" || appointment.status === "confirmed") && (
                                  <DropdownMenuItem 
                                    onClick={() => openStatusUpdateDialog(appointment, "completed")}
                                    className="text-green-600"
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                )}
                                {appointment.status !== "cancelled" && (
                                  <DropdownMenuItem 
                                    onClick={() => openStatusUpdateDialog(appointment, "cancelled")}
                                    className="text-red-600"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openStatusUpdateDialog(appointment)}>
                                  Update Status/Notes
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      
      {/* Status Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Appointment Status</DialogTitle>
            <DialogDescription>
              Change the status of the appointment and add notes if needed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Status</label>
              <div className={`px-2 py-1 text-sm rounded-md inline-block ${
                getStatusBadgeClass(selectedAppointment?.status || "")
              }`}>
                {selectedAppointment?.status 
                  ? selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)
                  : "Unknown"}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                placeholder="Add notes about this appointment status change" 
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleStatusUpdate}
              disabled={updateStatus.isPending || !newStatus}
            >
              {updateStatus.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>Update Status</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}

