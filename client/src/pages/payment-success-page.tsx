import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';

export default function PaymentSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        // Extract the payment_intent and payment_intent_client_secret from URL
        const params = new URLSearchParams(window.location.search);
        const paymentIntent = params.get('payment_intent');
        const redirectStatus = params.get('redirect_status');

        if (!paymentIntent || redirectStatus !== 'succeeded') {
          throw new Error('Payment verification failed');
        }

        // Find the appointment ID from local storage or other means
        // For a real app, you'd probably store the appointment ID before redirecting to payment
        // or get it from the server based on the payment intent
        const storedAppointmentId = localStorage.getItem('current_appointment_id');
        
        if (!storedAppointmentId) {
          // If we don't have the ID, we still consider it a success since Stripe confirmed payment
          setSuccess(true);
          setLoading(false);
          return;
        }

        setAppointmentId(storedAppointmentId);

        // Update the appointment payment status
        const response = await apiClient.patch(`/api/appointments/${storedAppointmentId}/payment`, {
          paymentStatus: 'paid',
        });

        if (!response.ok) {
          // The payment was successful but updating our system failed
          toast({
            title: 'Payment recorded by Stripe',
            description: 'However, we could not update your appointment. Please contact support.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Payment Successful!',
            description: 'Your appointment has been confirmed.',
          });
        }

        setSuccess(true);
        localStorage.removeItem('current_appointment_id');
      } catch (error) {
        console.error('Error processing payment success:', error);
        toast({
          title: 'Payment Verification Error',
          description: 'We could not verify your payment. Please contact support.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    processPaymentSuccess();
  }, [toast, setLocation]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container flex items-center justify-center min-h-[70vh]">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Processing Payment</CardTitle>
              <CardDescription>Please wait while we verify your payment...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container flex items-center justify-center min-h-[70vh]">
        <Card className="w-[350px]">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center">Payment Successful!</CardTitle>
            <CardDescription className="text-center">
              Thank you for your payment. Your appointment has been confirmed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              A confirmation has been sent to your email. You can view your appointment details in your profile.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => setLocation('/profile')}>
              Go to Profile
            </Button>
            <Button onClick={() => setLocation('/')} variant="outline">
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}