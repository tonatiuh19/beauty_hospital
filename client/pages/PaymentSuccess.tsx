import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Calendar,
  Clock,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Home,
  Sparkles,
  Shield,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import axios from "@/lib/axios";
import { logger } from "@/lib/logger";

interface SuccessState {
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  areas: string[];
  contactEmail: string;
  contactPhone: string;
  amount: number;
}

// Floating sparkle particle component
function SparkleParticle({ index }: { index: number }) {
  const positions = [
    { left: "10%", top: "20%" },
    { left: "85%", top: "15%" },
    { left: "25%", top: "70%" },
    { left: "70%", top: "65%" },
    { left: "50%", top: "10%" },
    { left: "15%", top: "55%" },
    { left: "80%", top: "45%" },
    { left: "40%", top: "80%" },
    { left: "60%", top: "30%" },
    { left: "5%", top: "85%" },
    { left: "90%", top: "80%" },
    { left: "35%", top: "40%" },
  ];
  const pos = positions[index % positions.length];

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: pos.left, top: pos.top }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1, 0],
        y: [0, -20, -40],
      }}
      transition={{
        duration: 2.5 + (index % 3) * 0.5,
        repeat: Infinity,
        delay: index * 0.3,
        ease: "easeInOut",
      }}
    >
      <Sparkles className="w-4 h-4 text-white/60" />
    </motion.div>
  );
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateFromWizard = location.state as SuccessState | null;

  const [details, setDetails] = useState<SuccessState | null>(stateFromWizard);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle 3DS redirect: URL params contain payment_intent
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentIntentId = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");

    if (paymentIntentId) {
      if (redirectStatus === "failed") {
        navigate("/appointment/failed", {
          replace: true,
          state: {
            error:
              "El pago fue rechazado. Por favor intenta con otro método de pago.",
          },
        });
        return;
      }

      if (redirectStatus === "succeeded" && !stateFromWizard) {
        setIsConfirming(true);
        axios
          .post("/appointments/confirm-payment", {
            payment_intent_id: paymentIntentId,
          })
          .then((res) => {
            if (res.data.success) {
              // Appointment created — show generic success since we don't have all details from 3DS flow
              setDetails({
                serviceName: "Tu servicio",
                date: "",
                time: "",
                duration: 0,
                areas: [],
                contactEmail: "",
                contactPhone: "",
                amount: 0,
              });
            } else {
              setError(
                res.data.error ||
                  "No se pudo confirmar tu pago. Por favor contacta soporte.",
              );
            }
          })
          .catch((err) => {
            logger.error("3DS confirmation error:", err);
            if (err.response?.status === 409) {
              navigate("/appointment/failed", {
                replace: true,
                state: {
                  error:
                    err.response?.data?.error ||
                    "Lo sentimos, este horario ya fue reservado. Tu pago será reembolsado.",
                },
              });
            } else {
              setError(
                "Error al confirmar el pago. Por favor contacta soporte.",
              );
            }
          })
          .finally(() => setIsConfirming(false));
      }
    } else if (!stateFromWizard) {
      // No state and no URL params — redirect to home
      navigate("/", { replace: true });
    }
  }, []);

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF8EF] to-[#FFF3E0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#C9A159] mx-auto mb-4" />
          <p className="text-[#3D2E1F] font-medium">
            Confirmando tu reserva...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF8EF] to-[#FFF3E0] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#3D2E1F] mb-2">
            Algo salió mal
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (!details) return null;

  const hasDetails =
    details.serviceName && details.serviceName !== "Tu servicio";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8EF] to-[#FEFCF7]">
      <Header />

      <main className="pt-8 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Hero Success Card */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C9A159] via-[#BF9649] to-[#A0812E] text-white text-center px-8 py-16 mb-8 shadow-2xl shadow-[#C9A159]/30"
          >
            {/* Background sparkle particles */}
            {[...Array(12)].map((_, i) => (
              <SparkleParticle key={i} index={i} />
            ))}

            {/* Soft glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/5 pointer-events-none" />

            {/* Animated checkmark circle */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 12,
                delay: 0.2,
              }}
              className="relative mx-auto mb-6 w-28 h-28 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              <div className="relative w-28 h-28 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/40 shadow-xl">
                <CheckCircle
                  className="w-16 h-16 text-white drop-shadow-lg"
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
              ¡Cita Confirmada!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-white/90 text-lg sm:text-xl font-light"
            >
              Tu pago fue procesado exitosamente
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              Pago seguro procesado por Stripe
            </motion.div>
          </motion.div>

          {/* Appointment Detail Cards */}
          {hasDetails && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 mb-8"
            >
              <h2 className="text-xl font-bold text-[#3D2E1F] mb-4">
                Resumen de tu Cita
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Service */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl p-5 border border-[#E8C580]/40 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF5E1] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#C9A159]" />
                    </div>
                    <span className="text-xs font-bold text-[#A0812E] uppercase tracking-wider">
                      Servicio
                    </span>
                  </div>
                  <p className="text-[#3D2E1F] font-bold text-base leading-tight">
                    {details.serviceName}
                  </p>
                </motion.div>

                {/* Date & Time */}
                {details.date && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 }}
                    className="bg-white rounded-2xl p-5 border border-[#E8C580]/40 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF5E1] flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#C9A159]" />
                      </div>
                      <span className="text-xs font-bold text-[#A0812E] uppercase tracking-wider">
                        Fecha y Hora
                      </span>
                    </div>
                    <p className="text-[#3D2E1F] font-bold">{details.date}</p>
                    <p className="text-gray-500 text-sm">{details.time}</p>
                  </motion.div>
                )}

                {/* Duration */}
                {details.duration > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl p-5 border border-[#E8C580]/40 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF5E1] flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[#C9A159]" />
                      </div>
                      <span className="text-xs font-bold text-[#A0812E] uppercase tracking-wider">
                        Duración
                      </span>
                    </div>
                    <p className="text-[#3D2E1F] font-bold">
                      {details.duration} minutos
                    </p>
                  </motion.div>
                )}

                {/* Amount */}
                {details.amount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 }}
                    className="bg-gradient-to-br from-[#C9A159]/10 to-[#A0812E]/5 rounded-2xl p-5 border-2 border-[#C9A159]/30 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF5E1] flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-[#C9A159]" />
                      </div>
                      <span className="text-xs font-bold text-[#A0812E] uppercase tracking-wider">
                        Total Pagado
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#A0812E]">
                      ${details.amount.toFixed(2)}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        MXN
                      </span>
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Contact info */}
              {(details.contactEmail || details.contactPhone) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-2xl p-5 border border-[#E8C580]/40 shadow-sm"
                >
                  <p className="text-xs font-bold text-[#A0812E] uppercase tracking-wider mb-3">
                    Contacto
                  </p>
                  <div className="space-y-2">
                    {details.contactEmail && (
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <Mail className="w-4 h-4 text-[#C9A159] flex-shrink-0" />
                        <span>{details.contactEmail}</span>
                      </div>
                    )}
                    {details.contactPhone && (
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <Phone className="w-4 h-4 text-[#C9A159] flex-shrink-0" />
                        <span>{details.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Areas */}
              {details.areas.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="bg-white rounded-2xl p-5 border border-[#E8C580]/40 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-4 h-4 text-[#C9A159]" />
                    <p className="text-xs font-bold text-[#A0812E] uppercase tracking-wider">
                      Áreas de Tratamiento
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {details.areas.map((area) => (
                      <span
                        key={area}
                        className="px-3 py-1 bg-[#FFF5E1] text-[#A0812E] border border-[#E8C580]/60 rounded-full text-xs font-bold"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Email notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasDetails ? 0.85 : 0.5 }}
            className="mb-8 p-4 rounded-2xl bg-[#FFF5E1] border border-[#E8C580]/60 flex items-start gap-3"
          >
            <Mail className="w-5 h-5 text-[#C9A159] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#3D2E1F] leading-relaxed">
              <strong>Recibirás una confirmación por email</strong> con los
              detalles de tu cita. Nuestro equipo se pondrá en contacto contigo
              para confirmar los detalles finales.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasDetails ? 0.95 : 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/my-appointments")}
              className="flex-1 py-4 bg-gradient-to-r from-[#C9A159] to-[#A0812E] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#C9A159]/30 hover:shadow-xl hover:shadow-[#C9A159]/40 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Ver Mis Citas
              <ChevronRight className="w-4 h-4" />
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
