import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import PaymentSuccess from "./payment-success";

// Initialize Stripe with the public key if available
// We're using a dummy key for development purposes
const DUMMY_STRIPE_KEY = 'pk_test_dummy_key_for_development';
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || DUMMY_STRIPE_KEY;
const stripePromise = loadStripe(stripeKey);

const PaymentForm = ({
  appointmentId,
  onSuccess,
}: {
  appointmentId: number;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const res = await apiRequest(
        "POST",
        `/api/appointments/${appointmentId}/confirm-payment`,
        { paymentIntentId }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment confirmed",
        description: "Your appointment has been confirmed",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error confirming payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm the payment on the server
        confirmPaymentMutation.mutate(paymentIntent.id);
      }
    } catch (err: any) {
      toast({
        title: "Payment error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
};

interface CheckoutFormProps {
  appointmentId: number;
  amount: number;
  onSuccess: () => void;
}

export default function CheckoutForm({
  appointmentId,
  amount,
  onSuccess,
}: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Payment success state
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/appointments/${appointmentId}/payment`,
        { amount }
      );
      return res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create the payment intent when the component mounts
  useEffect(() => {
    createPaymentIntentMutation.mutate();
  }, []);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    // Delay the onSuccess callback to allow the user to see the success message
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
      </CardHeader>
      <CardContent>
        {paymentSuccess ? (
          <PaymentSuccess amount={amount} onClose={onSuccess} />
        ) : createPaymentIntentMutation.isPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : !clientSecret ? (
          <div className="py-4">
            <p className="text-neutral-600 mb-4">
              There was an issue setting up the payment. Please try again.
            </p>
            <Button onClick={() => createPaymentIntentMutation.mutate()}>
              Retry
            </Button>
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <PaymentForm appointmentId={appointmentId} onSuccess={handlePaymentSuccess} />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}