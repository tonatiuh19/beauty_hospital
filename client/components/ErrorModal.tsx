import { motion } from "framer-motion";
import { AlertCircle, X, RefreshCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  title?: string;
  message: string;
  showRetry?: boolean;
}

export function ErrorModal({
  open,
  onClose,
  onRetry,
  title = "Ocurrió un Error",
  message,
  showRetry = true,
}: ErrorModalProps) {
  const handleRetry = () => {
    onClose();
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Error Icon Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 px-8 py-10 text-center">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            {/* Error Icon with Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg"
            >
              <AlertCircle className="w-10 h-10 text-red-500" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
            >
              {title}
            </motion.h2>
          </div>

          {/* Error Message Content */}
          <div className="px-6 sm:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <p className="text-gray-700 text-center leading-relaxed">
                {message}
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              {showRetry && onRetry && (
                <button
                  onClick={handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  Intentar de Nuevo
                </button>
              )}
              <button
                onClick={onClose}
                className={`${showRetry && onRetry ? "flex-1" : "w-full"} px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all hover:scale-105 active:scale-95`}
              >
                Cerrar
              </button>
            </motion.div>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <p className="text-xs text-gray-500 text-center">
                Si el problema persiste, por favor contacta a nuestro equipo de
                soporte
              </p>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
