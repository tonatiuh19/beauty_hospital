import { useState, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react";

interface StripeCheckoutFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
}

export function StripeCheckoutForm({
  amount,
  onSuccess,
  onError,
  disabled = false,
  onProcessingChange,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || paymentCompleted) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setMessage(null);
    onProcessingChange?.(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/appointment/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message || "Ocurrió un error inesperado.");
        setPaymentStatus("error");
        setIsProcessing(false);
        onProcessingChange?.(false);
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Lock the form permanently — navigation will happen via onSuccess
        setPaymentCompleted(true);
        setMessage("Confirmando tu reserva...");
        setPaymentStatus("success");
        // Keep isProcessing = true so button stays locked during backend confirmation
        onSuccess();
      } else {
        // Requires further action (e.g. 3DS redirect handled by Stripe)
        setMessage("El pago está siendo procesado...");
        setPaymentStatus("processing");
        setIsProcessing(false);
        onProcessingChange?.(false);
      }
    } catch (err) {
      setMessage("Ocurrió un error inesperado. Por favor intenta de nuevo.");
      setPaymentStatus("error");
      setIsProcessing(false);
      onProcessingChange?.(false);
      onError("Unexpected error");
    }
  };

  const isButtonDisabled =
    !stripe || !elements || isProcessing || disabled || paymentCompleted;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="p-6 rounded-2xl bg-white border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-[#C9A159]" />
          <h3 className="font-bold text-gray-800">Información de Pago</h3>
        </div>
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: {
              applePay: "auto",
              googlePay: "auto",
            },
            terms: {
              card: "never",
            },
          }}
        />
      </div>

      {/* Status Messages */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-start gap-3 ${
            paymentStatus === "success"
              ? "bg-[#FFF5E1] border-2 border-[#C9A159]/50"
              : paymentStatus === "error"
                ? "bg-red-50 border-2 border-red-300"
                : "bg-blue-50 border-2 border-blue-300"
          }`}
        >
          {paymentStatus === "success" && (
            <Loader2 className="w-5 h-5 text-[#C9A159] flex-shrink-0 mt-0.5 animate-spin" />
          )}
          {paymentStatus === "error" && (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          {paymentStatus === "processing" && (
            <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
          )}
          <p
            className={`text-sm font-medium ${
              paymentStatus === "success"
                ? "text-[#A0812E]"
                : paymentStatus === "error"
                  ? "text-red-800"
                  : "text-blue-800"
            }`}
          >
            {message}
          </p>
        </motion.div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isButtonDisabled}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
          isButtonDisabled
            ? "bg-gray-300 cursor-not-allowed opacity-70"
            : "bg-gradient-to-r from-[#C9A159] to-[#A0812E] hover:shadow-2xl hover:shadow-[#C9A159]/40 hover:scale-[1.01]"
        }`}
      >
        {paymentCompleted ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Confirmando tu reserva...
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Procesando pago...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pagar ${amount.toFixed(2)} MXN
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Pago seguro procesado por Stripe. Tu información está protegida.
        </p>
      </div>
    </form>
  );
}
