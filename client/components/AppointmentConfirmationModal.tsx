import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AppointmentConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  appointmentDetails: {
    serviceName: string;
    date: string;
    time: string;
    duration: number;
    areas: string[];
    contactEmail: string;
    contactPhone: string;
    amount: number;
  };
}

export function AppointmentConfirmationModal({
  open,
  onClose,
  appointmentDetails,
}: AppointmentConfirmationModalProps) {
  const formatDate = (dateString: string) => {
    // Handle YYYY-MM-DD format
    if (!dateString) return "Fecha no disponible";

    // Parse YYYY-MM-DD format properly to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 bg-transparent max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all hover:scale-110"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Header with Success Animation */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 px-4 sm:px-8 py-8 sm:py-12 text-center">
            {/* Animated Background Sparkles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 100 + "%",
                    y: Math.random() * 100 + "%",
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="relative inline-block mb-4 sm:mb-6"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" />
              </div>
              {/* Pulse Ring */}
              <motion.div
                className="absolute inset-0 bg-white rounded-full"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-3"
            >
              ¡Cita Confirmada!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-emerald-50 text-base sm:text-lg"
            >
              Tu pago ha sido procesado exitosamente
            </motion.p>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-6">
            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="pt-2"
            >
              <button
                onClick={onClose}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
