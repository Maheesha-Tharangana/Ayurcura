import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { User, Doctor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Search, ArrowLeft, CreditCard, Check, Clock, X, RefreshCw } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Payment interface
interface Payment {
  _id?: string;
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  appointmentId: number;
  userId: number;
  doctorId: number;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export default function ManagePayments() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ['/api/admin/payments'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/payments");
        return await response.json();
      } catch (error) {
        console.error("Error fetching payments:", error);
        // Return an empty array if there was an error or endpoint doesn't exist yet
        return [];
      }
    }
  });
  
  // Fetch doctors for reference
  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
  });
  
  // Fetch users for reference
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });
  
  // Helper functions to get doctor and user names
  const getDoctorName = (doctorId: number) => {
    const doctor = doctors?.find(doc => doc.id === doctorId);
    return doctor ? doctor.name : `Doctor #${doctorId}`;
  };
  
  const getUserName = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    return user ? user.fullName || user.username : `User #${userId}`;
  };
  
  // Format currency
  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  // Mutation for updating payment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/payments/${id}/status`,
        { status }
      );
      
      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment status updated",
        description: "The payment status has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      setIsStatusDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message || "An error occurred while updating the payment status.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for processing refunds
  const refundPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/payments/${id}/refund`,
        {}
      );
      
      if (!response.ok) {
        throw new Error("Failed to process refund");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment refunded",
        description: "The payment has been successfully refunded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      setIsRefundDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to process refund",
        description: error.message || "An error occurred while processing the refund.",
        variant: "destructive",
      });
    },
  });
  
  // Handler for opening status change dialog
  const openStatusChangeDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setNewStatus(payment.status);
    setIsStatusDialogOpen(true);
  };
  
  // Handler for opening refund dialog
  const openRefundDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsRefundDialogOpen(true);
  };
  
  // Handler for confirming status change
  const confirmStatusChange = () => {
    if (selectedPayment && newStatus) {
      updateStatusMutation.mutate({ 
        id: selectedPayment.id, 
        status: newStatus 
      });
    }
  };
  
  // Handler for confirming refund
  const confirmRefund = () => {
    if (selectedPayment) {
      refundPaymentMutation.mutate(selectedPayment.id);
    }
  };

  // View payment details
  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
  };
  
  // Filter payments based on search and status
  const filteredPayments = payments?.filter(payment => {
    const doctorName = doctors ? getDoctorName(payment.doctorId) : `Doctor #${payment.doctorId}`;
    const userName = users ? getUserName(payment.userId) : `User #${payment.userId}`;
    
    const matchesSearch = 
      doctorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  // Get status icon
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <Check className="h-4 w-4" />;
      case "refunded":
        return <ArrowLeft className="h-4 w-4" />;
      case "failed":
        return <X className="h-4 w-4" />;
      default:
        return null;
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
            <h1 className="text-3xl font-bold text-neutral-900">Manage Payments</h1>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>
                View and manage all payments in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      placeholder="Search by patient, doctor, or transaction ID"
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
                        <SelectValue placeholder="All Payment Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {isLoadingPayments ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : !filteredPayments || filteredPayments.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="h-16 w-16 rounded-full bg-neutral-100 mx-auto flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8 text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-medium text-neutral-900 mb-2">No Payments Found</h3>
                  <p className="text-neutral-600 max-w-md mx-auto">
                    {searchTerm || statusFilter 
                      ? "No payments match your search criteria. Try using different keywords or filters."
                      : "There are no payments in the system yet."}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredPayments.map((payment) => (
                        <tr key={payment._id || payment.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {payment.transactionId || `#PAY-${payment.id.toString().padStart(4, '0')}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {getUserName(payment.userId)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {getDoctorName(payment.doctorId)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {formatCurrency(payment.amount, payment.currency)}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {payment.paymentMethod}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">
                              {formatDate(payment.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${getStatusBadgeClass(payment.status)}`}>
                              <StatusIcon status={payment.status} />
                              <span className="ml-1">
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewPaymentDetails(payment)}
                            >
                              View Details
                            </Button>
                            {payment.status !== 'refunded' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openStatusChangeDialog(payment)}
                                >
                                  Change Status
                                </Button>
                                {payment.status === 'completed' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={() => openRefundDialog(payment)}
                                  >
                                    Refund
                                  </Button>
                                )}
                              </>
                            )}
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
      
      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected payment
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Transaction ID</p>
                  <p className="text-neutral-900">{selectedPayment.transactionId || `#PAY-${selectedPayment.id.toString().padStart(4, '0')}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Status</p>
                  <div className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${getStatusBadgeClass(selectedPayment.status)}`}>
                    <StatusIcon status={selectedPayment.status} />
                    <span className="ml-1">
                      {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Amount</p>
                  <p className="text-neutral-900">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Payment Method</p>
                  <p className="text-neutral-900">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Patient</p>
                  <p className="text-neutral-900">{getUserName(selectedPayment.userId)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Doctor</p>
                  <p className="text-neutral-900">{getDoctorName(selectedPayment.doctorId)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Appointment ID</p>
                  <p className="text-neutral-900">#{selectedPayment.appointmentId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Date & Time</p>
                  <p className="text-neutral-900">{formatDateTime(selectedPayment.createdAt)}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button className="w-full" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Payment Status</DialogTitle>
            <DialogDescription>
              Update the status of this payment. This will also update the associated appointment.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Status:</p>
                <div className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${getStatusBadgeClass(selectedPayment.status)}`}>
                  <StatusIcon status={selectedPayment.status} />
                  <span className="ml-1">
                    {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">New Status:</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsStatusDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmStatusChange}
                  disabled={updateStatusMutation.isPending || newStatus === selectedPayment.status}
                  className="flex items-center"
                >
                  {updateStatusMutation.isPending && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Status
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Refund Confirmation Dialog */}
      <AlertDialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedPayment && (
            <div className="my-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Transaction ID</p>
                  <p className="text-neutral-900">{selectedPayment.transactionId || `#PAY-${selectedPayment.id.toString().padStart(4, '0')}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Amount</p>
                  <p className="text-neutral-900">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Patient</p>
                  <p className="text-neutral-900">{getUserName(selectedPayment.userId)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Date</p>
                  <p className="text-neutral-900">{formatDate(selectedPayment.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRefund}
              disabled={refundPaymentMutation.isPending}
              className="flex items-center bg-blue-600 text-white hover:bg-blue-700"
            >
              {refundPaymentMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
}