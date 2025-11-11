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
}

export function StripeCheckoutForm({
  amount,
  onSuccess,
  onError,
  disabled = false,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/appointment/confirmation`,
        },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message || "An unexpected error occurred.");
        setPaymentStatus("error");
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage("¡Pago completado con éxito!");
        setPaymentStatus("success");
        onSuccess();
      } else {
        setMessage("El pago está siendo procesado...");
        setPaymentStatus("processing");
      }
    } catch (err) {
      setMessage("Ocurrió un error inesperado. Por favor intenta de nuevo.");
      setPaymentStatus("error");
      onError("Unexpected error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="p-6 rounded-2xl bg-white border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
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
              ? "bg-emerald-50 border-2 border-emerald-300"
              : paymentStatus === "error"
                ? "bg-red-50 border-2 border-red-300"
                : "bg-blue-50 border-2 border-blue-300"
          }`}
        >
          {paymentStatus === "success" && (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
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
                ? "text-emerald-800"
                : paymentStatus === "error"
                  ? "text-red-800"
                  : "text-blue-800"
            }`}
          >
            {message}
          </p>
        </motion.div>
      )}

      {/* Submit Button - Hidden when form is submitted via parent component */}
      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing || disabled}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all flex items-center justify-center gap-2 ${
          !stripe || !elements || isProcessing || disabled
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/50"
        }`}
      >
        {isProcessing ? (
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
