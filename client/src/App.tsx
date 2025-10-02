import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { WebSocketProvider } from "@/components/providers/websocket-provider";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load page components
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const DoctorsPage = lazy(() => import("@/pages/doctors-page"));
const DoctorDetailPage = lazy(() => import("@/pages/doctor-detail-page"));
const TreatmentsPage = lazy(() => import("@/pages/treatments-page"));
const TreatmentDetailPage = lazy(() => import("@/pages/treatment-detail-page"));
const ArticlesPage = lazy(() => import("@/pages/articles-page"));
const ArticleDetailPage = lazy(() => import("@/pages/article-detail-page"));

const BookAppointmentPage = lazy(() => import("@/pages/book-appointment-page"));
const AppointmentsPage = lazy(() => import("@/pages/appointments-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const PaymentPage = lazy(() => import("@/pages/payment-page"));
const PaymentSuccessPage = lazy(() => import("@/pages/payment-success-page"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminDoctorsPage = lazy(() => import("@/pages/admin/doctors-page"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/analytics-page"));
const ManageDoctors = lazy(() => import("@/pages/admin/manage-doctors"));
const ManageAppointments = lazy(() => import("@/pages/admin/manage-appointments"));
const ManagePayments = lazy(() => import("@/pages/admin/manage-payments"));
const ManageTreatments = lazy(() => import("@/pages/admin/manage-treatments"));
const ManageArticles = lazy(() => import("@/pages/admin/manage-articles"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/doctors" component={DoctorsPage} />
        <Route path="/doctors/:id" component={DoctorDetailPage} />
        <Route path="/treatments" component={TreatmentsPage} />
        <Route path="/treatments/:id" component={TreatmentDetailPage} />
        <Route path="/articles" component={ArticlesPage} />
        <Route path="/articles/:source/:id" component={ArticleDetailPage} />
        
        <ProtectedRoute path="/book-appointment/:doctorId" component={BookAppointmentPage} />
        <ProtectedRoute path="/appointments" component={AppointmentsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/payment/:appointmentId" component={PaymentPage} />
        <ProtectedRoute path="/payment-success" component={PaymentSuccessPage} />
        <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly={true} />
        <ProtectedRoute path="/admin/doctors" component={AdminDoctorsPage} adminOnly={true} />
        <ProtectedRoute path="/admin/analytics" component={AdminAnalyticsPage} adminOnly={true} />
        <ProtectedRoute path="/admin/appointments" component={ManageAppointments} adminOnly={true} />
        <ProtectedRoute path="/admin/payments" component={ManagePayments} adminOnly={true} />
        <ProtectedRoute path="/admin/treatments" component={ManageTreatments} adminOnly={true} />
        <ProtectedRoute path="/admin/articles" component={ManageArticles} adminOnly={true} />
        <ProtectedRoute path="/admin/settings" component={AdminSettings} adminOnly={true} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
