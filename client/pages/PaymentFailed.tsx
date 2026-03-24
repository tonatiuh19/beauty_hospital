import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  XCircle,
  RefreshCw,
  Home,
  Phone,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface FailedState {
  error?: string;
}

export default function PaymentFailed() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as FailedState | null;

  const errorMessage =
    state?.error ||
    "Ocurrió un error al procesar tu pago. Por favor intenta de nuevo o contacta a soporte.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8EF] to-[#FEFCF7]">
      <Header />

      <main className="pt-8 pb-20 px-4">
        <div className="max-w-xl mx-auto">
          {/* Hero Failed Card */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3D2E1F] via-[#4A3728] to-[#2C1F14] text-white text-center px-8 py-16 mb-8 shadow-2xl"
          >
            {/* Soft glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            {/* Animated X circle */}
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 12,
                delay: 0.2,
              }}
              className="relative mx-auto mb-6 w-28 h-28 flex items-center justify-center"
            >
              <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/20 shadow-xl">
                <XCircle
                  className="w-16 h-16"
                  style={{ color: "#E8C580" }}
                  strokeWidth={1.5}
                />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight"
            >
              Pago No Completado
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-white/80 text-lg font-light"
            >
              No se pudo procesar tu pago
            </motion.p>
          </motion.div>

          {/* Error Detail */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-[#3D2E1F] mb-1">
                  Detalle del error
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
          </motion.div>

          {/* What to do next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#FFF5E1] rounded-2xl p-6 border border-[#E8C580]/60 mb-8"
          >
            <p className="text-xs font-bold text-[#A0812E] uppercase tracking-wider mb-3">
              ¿Qué puedo hacer?
            </p>
            <ul className="space-y-2 text-sm text-[#3D2E1F]">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C9A159] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>Verifica que los datos de tu tarjeta sean correctos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C9A159] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>Confirma que tu tarjeta tenga fondos suficientes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C9A159] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Intenta con otra tarjeta o método de pago</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C9A159] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </span>
                <span>Contacta a tu banco si el problema persiste</span>
              </li>
            </ul>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/appointment")}
              className="flex-1 py-4 bg-gradient-to-r from-[#C9A159] to-[#A0812E] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#C9A159]/30 hover:shadow-xl hover:shadow-[#C9A159]/40 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Intentar de Nuevo
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/")}
              className="flex-1 py-4 bg-white border-2 border-[#C9A159]/60 text-[#A0812E] font-bold text-base rounded-2xl hover:bg-[#FFF5E1] hover:border-[#C9A159] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Volver al Inicio
            </motion.button>
          </motion.div>

          {/* Support contact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-gray-500"
          >
            <p className="mb-2 font-medium text-[#3D2E1F]">¿Necesitas ayuda?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:+521234567890"
                className="flex items-center gap-2 text-[#A0812E] font-medium hover:underline"
              >
                <Phone className="w-4 h-4" />
                +52 1234567890
              </a>
              <a
                href="mailto:info@hospital.mx"
                className="flex items-center gap-2 text-[#A0812E] font-medium hover:underline"
              >
                <Mail className="w-4 h-4" />
                info@hospital.mx
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
