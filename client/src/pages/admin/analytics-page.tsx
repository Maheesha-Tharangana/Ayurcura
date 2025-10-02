import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import AdminNavbar from '@/components/admin/admin-navbar';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Circle, ArrowUp, ArrowDown, Users, Calendar, DollarSign, User, Activity } from 'lucide-react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Types for analytics data
interface AnalyticsData {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  appointmentStats: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  recentAppointments: any[];
  paymentStats?: {
    totalRevenue: number;
    pendingPayments: number;
    averagePayment: number;
  };
}

// Sample data for monthly chart (in a real app, this would come from the backend)
const monthlyData = [
  { name: 'Jan', appointments: 10, revenue: 500 },
  { name: 'Feb', appointments: 15, revenue: 750 },
  { name: 'Mar', appointments: 12, revenue: 600 },
  { name: 'Apr', appointments: 20, revenue: 1000 },
  { name: 'May', appointments: 18, revenue: 900 },
  { name: 'Jun', appointments: 22, revenue: 1100 },
  { name: 'Jul', appointments: 25, revenue: 1250 },
  { name: 'Aug', appointments: 30, revenue: 1500 },
  { name: 'Sep', appointments: 28, revenue: 1400 },
  { name: 'Oct', appointments: 35, revenue: 1750 },
  { name: 'Nov', appointments: 40, revenue: 2000 },
  { name: 'Dec', appointments: 45, revenue: 2250 }
];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/admin/stats');
        const data = await response.json();
        setAnalyticsData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Could not load analytics data. Please try again.');
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data.',
          variant: 'destructive'
        });
      }
    };

    fetchAnalytics();
  }, [toast]);

  // Prepare appointment status data for pie chart
  const getAppointmentStatusData = () => {
    if (!analyticsData) return [];
    
    return [
      { name: 'Pending', value: analyticsData.appointmentStats.pending },
      { name: 'Confirmed', value: analyticsData.appointmentStats.confirmed },
      { name: 'Completed', value: analyticsData.appointmentStats.completed },
      { name: 'Cancelled', value: analyticsData.appointmentStats.cancelled },
    ].filter(item => item.value > 0); // Only show non-zero values
  };

  // Calculate percentage for a stat
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-neutral-50 min-h-screen">
      <AdminNavbar />
      
      <div className="container mx-auto py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>
              View comprehensive statistics and analytics for your medical practice
            </CardDescription>
          </CardHeader>
        </Card>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Top stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Patients Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">
                    {analyticsData?.totalPatients || 0}
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 text-xs rounded-full px-2 py-1 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    12%
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                Total registered patients
              </div>
            </CardContent>
          </Card>
          
          {/* Doctors Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Ayurvedic Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">
                    {analyticsData?.totalDoctors || 0}
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 text-xs rounded-full px-2 py-1 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    5%
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                Active practitioners
              </div>
            </CardContent>
          </Card>
          
          {/* Appointments Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">
                    {analyticsData?.totalAppointments || 0}
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 text-xs rounded-full px-2 py-1 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    18%
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                {analyticsData?.appointmentStats?.pending || 0} pending
              </div>
            </CardContent>
          </Card>
          
          {/* Revenue Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(analyticsData?.paymentStats?.totalRevenue || 5000)}
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 text-xs rounded-full px-2 py-1 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    24%
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                This month
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Section */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Appointment Distribution</CardTitle>
                  <CardDescription>
                    Status breakdown of all appointments
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-full w-full rounded-md" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getAppointmentStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getAppointmentStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Trends</CardTitle>
                  <CardDescription>
                    Appointments and revenue by month
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-full w-full rounded-md" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="appointments" fill="#8884d8" name="Appointments" />
                        <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Appointment Success Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Appointment Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        {analyticsData ? 
                          `${calculatePercentage(
                            analyticsData.appointmentStats.completed,
                            analyticsData.totalAppointments
                          )}%` : '0%'}
                      </div>
                      <Progress 
                        value={analyticsData ? 
                          calculatePercentage(
                            analyticsData.appointmentStats.completed,
                            analyticsData.totalAppointments
                          ) : 0} 
                        className="h-2 mb-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Percentage of appointments completed successfully
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Cancellation Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cancellation Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        {analyticsData ? 
                          `${calculatePercentage(
                            analyticsData.appointmentStats.cancelled,
                            analyticsData.totalAppointments
                          )}%` : '0%'}
                      </div>
                      <Progress 
                        value={analyticsData ? 
                          calculatePercentage(
                            analyticsData.appointmentStats.cancelled,
                            analyticsData.totalAppointments
                          ) : 0} 
                        className="h-2 mb-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Percentage of appointments cancelled
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Average Revenue per Patient */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Avg. Revenue Per Patient</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        {formatCurrency(analyticsData?.paymentStats?.averagePayment || 125)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Average revenue generated per patient
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Analytics</CardTitle>
                <CardDescription>
                  Detailed insights on appointment patterns and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="appointments" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                        name="Monthly Appointments"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Financial performance and revenue trends
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#82ca9d" 
                        activeDot={{ r: 8 }}
                        name="Monthly Revenue ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Patients Tab */}
          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle>Patient Demographics</CardTitle>
                <CardDescription>
                  Patient age distribution and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Detailed patient demographics coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}