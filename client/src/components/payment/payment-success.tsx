import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface PaymentSuccessProps {
  amount: number;
  onClose: () => void;
}

export default function PaymentSuccess({ amount, onClose }: PaymentSuccessProps) {
  // Format amount as currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
      <p className="text-neutral-600 mb-6">
        You have successfully processed a payment of {formattedAmount}.
        The appointment status has been updated to confirmed.
      </p>
      <Button onClick={onClose}>Close</Button>
    </div>
  );
}