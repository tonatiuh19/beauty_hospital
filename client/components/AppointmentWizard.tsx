import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  AlertCircle,
  User,
  Users,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchServices,
  selectService as selectServiceAction,
} from "@/store/slices/servicesSlice";
import {
  setService,
  toggleArea,
  setDate,
  setTime,
  setPersonalInfo,
  setBookedForSelf,
  nextStep,
  previousStep,
  resetAppointment,
} from "@/store/slices/appointmentSlice";
import {
  fetchBlockedDates,
  isDateBlocked,
  isTimeBlocked,
  getBlockedTimesForDate,
} from "@/store/slices/blockedDatesSlice";
import {
  fetchBusinessHours,
  getBusinessHoursForDay,
} from "@/store/slices/businessHoursSlice";
import {
  fetchBookedSlots,
  isTimeSlotBooked,
} from "@/store/slices/bookedSlotsSlice";
import { AuthModal } from "./AuthModal";
import { SimpleCalendar } from "./SimpleCalendar";
import { StripeCheckoutForm } from "./StripeCheckoutForm";
import { AppointmentConfirmationModal } from "./AppointmentConfirmationModal";
import axios from "@/lib/axios";
import type { ApiResponse, StripePaymentResponse } from "@shared/api";

// Initialize Stripe - get publishable key from environment
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_your_stripe_publishable_key",
);

const BODY_AREAS = [
  { id: "face", label: "Cara" },
  { id: "underarms", label: "Axilas" },
  { id: "bikini", label: "Bikini" },
  { id: "legs", label: "Piernas" },
  { id: "arms", label: "Brazos" },
  { id: "back", label: "Espalda" },
  { id: "full", label: "Cuerpo Completo" },
];

interface WizardData {
  service: number | null;
  selectedAreas: string[];
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface ValidationErrors {
  service?: string;
  selectedAreas?: string;
  date?: string;
  time?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export function AppointmentWizard() {
  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const {
    services,
    loading: loadingServices,
    error: servicesError,
  } = useAppSelector((state) => state.services);
  const appointment = useAppSelector((state) => state.appointment);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { blockedDates, loading: loadingBlockedDates } = useAppSelector(
    (state) => state.blockedDates,
  );
  const { businessHours } = useAppSelector((state) => state.businessHours);
  const bookedSlotsState = useAppSelector((state) => state.bookedSlots);
  const step = appointment.currentStep;

  // Local state for validation errors and auth modal
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Auto-accept terms and privacy when reaching payment step
  useEffect(() => {
    if (step === 4 && isAuthenticated) {
      setAcceptedTerms(true);
      setAcceptedPrivacy(true);
    }
  }, [step, isAuthenticated]);

  // Fetch services on component mount
  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Fetch business hours on component mount
  useEffect(() => {
    dispatch(fetchBusinessHours());
  }, [dispatch]);

  // Fetch blocked dates for the next 3 months
  useEffect(() => {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    dispatch(fetchBlockedDates({ start_date: startDate, end_date: endDate }));
  }, [dispatch]);

  // Fetch booked appointments when date or service changes
  useEffect(() => {
    if (appointment.date && appointment.service) {
      dispatch(
        fetchBookedSlots({
          date: appointment.date,
          service_id: appointment.service,
        }),
      );
    }
  }, [appointment.date, appointment.service, dispatch]);

  // Auto-skip Step 3 if logged in and haven't made booking choice yet
  useEffect(() => {
    // This useEffect is no longer needed since we removed the old Step 3
    // Step 3 is now the Sesión/Booking Type step
  }, [step, isAuthenticated, appointment.bookedForSelf, user, dispatch]);

  const handleServiceSelect = (serviceId: number) => {
    dispatch(selectServiceAction(serviceId));
    dispatch(setService(serviceId));
    setErrors({ ...errors, service: undefined });
  };

  const handleAreaToggle = (areaId: string) => {
    dispatch(toggleArea(areaId));
    setErrors({ ...errors, selectedAreas: undefined });
  };

  const handleInputChange = (field: keyof WizardData, value: string) => {
    if (field === "date") {
      dispatch(setDate(value));
    } else if (field === "time") {
      dispatch(setTime(value));
    } else if (
      field === "name" ||
      field === "email" ||
      field === "phone" ||
      field === "notes"
    ) {
      dispatch(setPersonalInfo({ [field]: value }));
    }
    setErrors({ ...errors, [field]: undefined });
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (stepNum === 1) {
      if (!appointment.service) newErrors.service = "Selecciona un servicio";
      if (appointment.selectedAreas.length === 0)
        newErrors.selectedAreas = "Selecciona al menos un área";
    } else if (stepNum === 2) {
      if (!appointment.date) {
        newErrors.date = "Selecciona una fecha";
      } else {
        // Check if the entire day is blocked (not just partial times)
        const blockedTimesForDate = getBlockedTimesForDate(
          appointment.date,
          blockedDates,
        );

        // Only show error if there's an all-day block for this date
        const hasAllDayBlock = blockedTimesForDate.some(
          (block) => block.all_day,
        );

        if (hasAllDayBlock) {
          newErrors.date =
            "Esta fecha no está disponible. Por favor selecciona otra.";
        }
      }
      if (!appointment.time) newErrors.time = "Selecciona una hora";
    } else if (stepNum === 3) {
      // Step 3 requires authentication
      if (!isAuthenticated) {
        newErrors.service = "Debes iniciar sesión para continuar";
        return true; // Block navigation
      }

      // Logged in users must select booking type
      if (appointment.bookedForSelf === null) {
        newErrors.service =
          "Selecciona si la cita es para ti o para otra persona";
      }

      // If booking for someone else, validate their contact info
      if (appointment.bookedForSelf === false) {
        if (!appointment.name.trim()) newErrors.name = "El nombre es requerido";
        if (!appointment.email.trim())
          newErrors.email = "El email es requerido";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appointment.email))
          newErrors.email = "Email inválido";
        if (!appointment.phone.trim())
          newErrors.phone = "El teléfono es requerido";
        if (!/^[0-9+\-\s()]{10,}$/.test(appointment.phone))
          newErrors.phone = "Teléfono inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      dispatch(nextStep());
    }
  };

  const handlePrev = () => {
    dispatch(previousStep());
  };

  // Create payment intent when user reaches step 4 (payment)
  const createPaymentIntent = async () => {
    if (
      !isAuthenticated ||
      !user ||
      !appointment.service ||
      !appointment.date ||
      !appointment.time
    ) {
      setPaymentError(
        "Missing required appointment information or authentication",
      );
      return;
    }

    setIsCreatingPayment(true);
    setPaymentError(null);

    try {
      const scheduled_at = `${appointment.date}T${appointment.time}:00`;

      // Prepare patient_info when booking for another person
      const patient_info =
        !appointment.bookedForSelf && appointment.name && appointment.email
          ? {
              // Split name into first_name and last_name
              first_name: appointment.name.split(" ")[0] || appointment.name,
              last_name: appointment.name.split(" ").slice(1).join(" ") || "",
              email: appointment.email,
              phone: appointment.phone,
            }
          : undefined;

      const response = await axios.post<ApiResponse<StripePaymentResponse>>(
        "/appointments/book-with-payment",
        {
          service_id: appointment.service,
          scheduled_at,
          duration_minutes: getServiceDuration(appointment.service),
          notes: appointment.notes || undefined,
          booked_for_self: appointment.bookedForSelf,
          patient_info, // Include patient info when booking for someone else
          selected_areas: appointment.selectedAreas,
          accepted_terms: acceptedTerms,
          accepted_privacy: acceptedPrivacy,
          payment_amount: getServicePrice(appointment.service),
          currency: "mxn",
        },
      );

      if (response.data.success && response.data.data) {
        setClientSecret(response.data.data.clientSecret);
        setPaymentId(response.data.data.paymentId);
      } else {
        setPaymentError(response.data.error || "Failed to create payment");
      }
    } catch (error: any) {
      console.error("Payment creation error:", error);

      // Handle specific error cases
      if (error.response?.status === 409) {
        // Slot conflict - show user-friendly message and go back to step 2
        setPaymentError(
          error.response?.data?.error ||
            "Este horario ya no está disponible. Por favor selecciona otro horario.",
        );

        // Automatically redirect user back to date/time selection after 3 seconds
        setTimeout(() => {
          dispatch(setTime("")); // Clear the selected time
          dispatch(previousStep()); // Go back to step 2 (date/time selection)
          dispatch(previousStep()); // Go back to step 2 from step 3
          setPaymentError(null);
        }, 3000);
      } else {
        setPaymentError(
          error.response?.data?.error ||
            "Error al crear el pago. Por favor intenta de nuevo.",
        );
      }
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    try {
      // Confirm payment on backend
      const response = await axios.post("/appointments/confirm-payment", {
        payment_intent_id: clientSecret?.split("_secret_")[0],
      });

      if (response.data.success) {
        // Reset form
        dispatch(resetAppointment());
        setClientSecret(null);
        setPaymentId(null);
        setAcceptedTerms(false);
        setAcceptedPrivacy(false);
        // Show confirmation modal
        setShowConfirmationModal(true);
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error);

      if (error.response?.status === 409) {
        // Slot was taken while user was completing payment
        setPaymentError(
          error.response?.data?.error ||
            "Lo sentimos, este horario fue reservado por otro cliente. Tu pago será reembolsado automáticamente.",
        );
      } else {
        setPaymentError("Error al confirmar el pago");
      }
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  // Handle confirmation modal close
  const handleConfirmationClose = () => {
    setShowConfirmationModal(false);
  };

  // Watch for step 4 (payment) and terms acceptance to create payment intent
  useEffect(() => {
    console.log("Payment useEffect triggered:", {
      step,
      acceptedTerms,
      acceptedPrivacy,
      clientSecret: !!clientSecret,
      isCreatingPayment,
      isAuthenticated,
      hasUser: !!user,
    });

    if (
      step === 4 &&
      acceptedTerms &&
      acceptedPrivacy &&
      !clientSecret &&
      !isCreatingPayment &&
      isAuthenticated &&
      user
    ) {
      console.log("Creating payment intent...");
      createPaymentIntent();
    }
  }, [step, acceptedTerms, acceptedPrivacy, isAuthenticated, user]);

  const handleSubmit = () => {
    // This function is no longer used for final submission
    // Payment is handled by the Stripe form
    // Just for backwards compatibility with navigation
    console.log("Submit called - payment should be handled by Stripe form");
  };

  const getServiceName = (id: number | null) => {
    if (!id) return "";
    return services.find((s) => s.id === id)?.name || "";
  };

  const getServicePrice = (id: number | null) => {
    if (!id) return 0;
    return services.find((s) => s.id === id)?.price || 0;
  };

  const getServiceDuration = (id: number | null) => {
    if (!id) return 60; // Default 60 minutes
    return services.find((s) => s.id === id)?.duration_minutes || 60;
  };

  const getAreaLabels = (areaIds: string[]) => {
    return areaIds.map(
      (id) => BODY_AREAS.find((area) => area.id === id)?.label || id,
    );
  };

  // Generate time slots based on service duration and business hours for selected date
  const generateTimeSlots = (durationMinutes: number): string[] => {
    const slots: string[] = [];

    // Get business hours for the selected date's day of week
    if (!appointment.date) return slots;

    const date = new Date(appointment.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = getBusinessHoursForDay(dayOfWeek, businessHours);

    // Default business hours if not loaded yet (9am-6pm with 1pm-2pm break)
    let openHour = 9,
      openMin = 0;
    let closeHour = 18,
      closeMin = 0;
    let breakStartMinutes: number | null = null;
    let breakEndMinutes: number | null = null;

    if (hours) {
      // If business hours found, check if closed
      if (!hours.is_open) return slots;

      // Parse opening and closing times
      [openHour, openMin] = hours.open_time.split(":").map(Number);
      [closeHour, closeMin] = hours.close_time.split(":").map(Number);

      // Parse break times if they exist
      if (hours.break_start && hours.break_end) {
        const [breakStartHour, breakStartMin] = hours.break_start
          .split(":")
          .map(Number);
        const [breakEndHour, breakEndMin] = hours.break_end
          .split(":")
          .map(Number);
        breakStartMinutes = breakStartHour * 60 + breakStartMin;
        breakEndMinutes = breakEndHour * 60 + breakEndMin;
      }
    } else {
      // Use default break time if business hours not loaded
      breakStartMinutes = 13 * 60; // 1:00 PM
      breakEndMinutes = 14 * 60; // 2:00 PM
    }

    const startMinutes = openHour * 60 + openMin;
    const endMinutes = closeHour * 60 + closeMin;

    let currentMinutes = startMinutes;

    while (currentMinutes + durationMinutes <= endMinutes) {
      // Check if slot would overlap with break time
      const slotEndMinutes = currentMinutes + durationMinutes;

      // An appointment overlaps with break if:
      // - It starts before break ends AND
      // - It ends after break starts
      const overlapsBreak =
        breakStartMinutes !== null &&
        breakEndMinutes !== null &&
        currentMinutes < breakEndMinutes &&
        slotEndMinutes > breakStartMinutes;

      if (!overlapsBreak) {
        const slotHours = Math.floor(currentMinutes / 60);
        const slotMinutes = currentMinutes % 60;
        const timeString = `${slotHours.toString().padStart(2, "0")}:${slotMinutes.toString().padStart(2, "0")}`;
        slots.push(timeString);
      }

      // Move to next slot based on duration
      currentMinutes += durationMinutes;
    }

    return slots;
  };

  // Check if a time slot conflicts with blocked times considering service duration
  const isTimeSlotBlocked = (
    date: string,
    startTime: string,
    durationMinutes: number,
  ): { blocked: boolean; reason?: string } => {
    if (!date) return { blocked: false };

    // Convert start time to minutes
    const [startHour, startMin] = startTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + durationMinutes;

    // Check each blocked period for the date
    const blockedTimes = getBlockedTimesForDate(date, blockedDates);

    for (const block of blockedTimes) {
      // If it's an all-day block, the time is blocked
      if (block.all_day) {
        return { blocked: true, reason: block.reason };
      }

      // Parse blocked time range (handle both HH:MM and HH:MM:SS formats)
      if (block.start_time && block.end_time) {
        const startParts = block.start_time.split(":");
        const endParts = block.end_time.split(":");

        const blockStartHour = parseInt(startParts[0], 10);
        const blockStartMin = parseInt(startParts[1], 10);
        const blockEndHour = parseInt(endParts[0], 10);
        const blockEndMin = parseInt(endParts[1], 10);

        const blockStartMinutes = blockStartHour * 60 + blockStartMin;
        const blockEndMinutes = blockEndHour * 60 + blockEndMin;

        // Check if appointment slot overlaps with blocked time
        // Overlap occurs if: (start1 < end2) AND (end1 > start2)
        if (startMinutes < blockEndMinutes && endMinutes > blockStartMinutes) {
          return { blocked: true, reason: block.reason };
        }
      }
    }

    // Check if time slot overlaps with existing booked appointments
    const bookedCheck = isTimeSlotBooked(
      bookedSlotsState,
      startTime,
      durationMinutes,
    );
    if (bookedCheck.booked) {
      return { blocked: true, reason: bookedCheck.reason };
    }

    return { blocked: false };
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  const floatingAnimation = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden py-8 px-4 sm:px-6 lg:px-8">
      {/* Animated Background with Solid Colors */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-indigo-50" />
        {/* Floating orbs with solid colors */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-40 right-10 w-96 h-96 bg-secondary/15 rounded-full blur-3xl"
        />
      </div>

      <div
        className={`mx-auto relative z-10 transition-all duration-500 ${step === 4 ? "max-w-6xl" : "max-w-2xl"}`}
      >
        {/* Header with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <motion.div
            {...floatingAnimation}
            className="mb-4 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Reserva tu Cita Perfecta
              </span>
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Reserva tu Cita
          </h1>
          <p className="text-gray-700 text-lg">
            Completa los pasos para agendar tu tratamiento perfecto
          </p>
        </motion.div>

        {/* Progress Indicator with Clearer Visual Hierarchy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          {/* Steps with connectors */}
          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200/50 rounded-full" />
            <motion.div
              className="absolute top-5 left-0 h-1 bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((step - 1) / 3) * 100}%` }}
              transition={{ duration: 0.6, type: "spring" }}
            />

            {/* Step circles */}
            <div className="flex justify-between relative z-10 mb-6">
              {[1, 2, 3, 4].map((s, idx) => {
                const isCompleted = s < step;
                const isCurrent = s === step;
                const isUpcoming = s > step;

                return (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.12 }}
                    className="flex flex-col items-center flex-1 relative"
                  >
                    {/* Step Badge */}
                    <motion.div
                      animate={
                        isCurrent
                          ? {
                              boxShadow: [
                                "0 0 0 0 rgba(236, 72, 153, 0.7)",
                                "0 0 0 12px rgba(236, 72, 153, 0)",
                              ],
                              scale: [1, 1.15, 1],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all backdrop-blur-sm border-2 ${
                        isCompleted
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/50"
                          : isCurrent
                            ? "bg-primary text-white border-primary shadow-2xl shadow-primary/60"
                            : "bg-white/50 text-gray-400 border-white/40"
                      }`}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", delay: 0.3 }}
                        >
                          <CheckCircle size={24} className="text-white" />
                        </motion.div>
                      ) : (
                        <span
                          className={
                            isCurrent
                              ? "font-bold text-white"
                              : "text-gray-400 font-semibold"
                          }
                        >
                          {s}
                        </span>
                      )}
                    </motion.div>

                    {/* Step Label */}
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.12 + 0.1 }}
                      className={`hidden sm:block text-xs font-bold mt-3 text-center px-2 transition-all ${
                        isCompleted
                          ? "text-emerald-600"
                          : isCurrent
                            ? "text-primary text-sm"
                            : "text-gray-400"
                      }`}
                    >
                      {s === 1
                        ? "Servicio"
                        : s === 2
                          ? "Fecha"
                          : s === 3
                            ? "Sesión"
                            : "Pago"}
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Progress summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm font-semibold text-gray-600"
          >
            <span className="text-primary">Paso {step} de 4</span>
          </motion.div>
        </motion.div>

        {/* Form Card with Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mb-8"
        >
          {/* Neon glow effect */}
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl opacity-75 pointer-events-none" />

          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40">
            {/* Solid color border effect */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <AnimatePresence mode="wait">
              {/* Step 1: Service Selection */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="p-6 sm:p-10"
                >
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold mb-2 text-primary"
                  >
                    Elige tu Servicio Perfecto
                  </motion.h2>
                  <p className="text-gray-600 mb-8">
                    Selecciona el tratamiento que mejor se adapte a ti
                  </p>

                  {errors.service && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl flex gap-3 items-start backdrop-blur-sm"
                    >
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 w-5 h-5" />
                      <span className="text-sm text-red-700 font-medium">
                        {errors.service}
                      </span>
                    </motion.div>
                  )}

                  <motion.div className="grid gap-4 mb-8">
                    {services.map((service, idx) => {
                      return (
                        <motion.button
                          key={service.id}
                          onClick={() => handleServiceSelect(service.id)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`group relative p-5 text-left rounded-2xl border-2 backdrop-blur-sm transition-all overflow-hidden ${
                            appointment.service === service.id
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/30"
                              : "border-white/40 hover:border-primary/50 bg-white/40 hover:bg-white/60"
                          }`}
                        >
                          {/* Background effect on hover */}
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="relative flex justify-between items-center">
                            <div className="flex gap-4 flex-1">
                              <div className="flex-1">
                                <h3 className="font-bold text-foreground mb-1 text-lg">
                                  {service.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {service.description ||
                                    "Servicio profesional de calidad"}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                  {service.duration_minutes} minutos
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-lg text-primary">
                                ${service.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  <div>
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="font-bold text-foreground mb-5 text-lg text-secondary"
                    >
                      Selecciona las áreas de tratamiento
                    </motion.h3>
                    {errors.selectedAreas && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl flex gap-3 items-start backdrop-blur-sm"
                      >
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 w-5 h-5" />
                        <span className="text-sm text-red-700 font-medium">
                          {errors.selectedAreas}
                        </span>
                      </motion.div>
                    )}
                    <motion.div className="grid grid-cols-2 gap-3">
                      {BODY_AREAS.map((area, idx) => (
                        <motion.button
                          key={area.id}
                          onClick={() => handleAreaToggle(area.id)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className={`p-4 rounded-2xl border-2 transition-all backdrop-blur-sm text-center group ${
                            appointment.selectedAreas.includes(area.id)
                              ? "border-secondary bg-secondary/20 shadow-lg shadow-secondary/30"
                              : "border-white/40 hover:border-secondary/50 bg-white/40 hover:bg-white/60"
                          }`}
                        >
                          <p className="text-sm font-bold text-foreground group-hover:text-secondary transition-all">
                            {area.label}
                          </p>
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Date & Time Selection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="p-6 sm:p-10"
                >
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold mb-2 text-secondary"
                  >
                    Selecciona tu Fecha y Hora
                  </motion.h2>
                  <p className="text-gray-600 mb-8">
                    Elige el momento que mejor se adapte a ti
                  </p>

                  <div className="mb-8">
                    <label className="block font-bold text-foreground mb-3 text-lg">
                      Fecha disponible
                    </label>
                    <SimpleCalendar
                      selected={appointment.date}
                      onSelect={(dateString) => {
                        handleInputChange("date", dateString);
                      }}
                      blockedDates={blockedDates}
                      error={errors.date}
                    />
                  </div>

                  <div className="mb-8">
                    <label className="block font-bold text-foreground mb-4 text-lg">
                      Hora Preferida
                    </label>
                    {errors.time && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl flex gap-3 items-start backdrop-blur-sm"
                      >
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 w-5 h-5" />
                        <span className="text-sm text-red-700 font-medium">
                          {errors.time}
                        </span>
                      </motion.div>
                    )}
                    {appointment.service && (
                      <div className="mb-3 text-sm text-muted-foreground">
                        Duración del servicio:{" "}
                        {getServiceDuration(appointment.service)} minutos
                      </div>
                    )}
                    <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {appointment.service &&
                        generateTimeSlots(
                          getServiceDuration(appointment.service),
                        ).map((time, idx) => {
                          // Check if this time slot is blocked considering appointment duration
                          const { blocked, reason } = isTimeSlotBlocked(
                            appointment.date,
                            time,
                            getServiceDuration(appointment.service),
                          );

                          return (
                            <motion.button
                              key={time}
                              onClick={() =>
                                !blocked && handleInputChange("time", time)
                              }
                              disabled={blocked}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + idx * 0.04 }}
                              whileHover={!blocked ? { scale: 1.08 } : {}}
                              whileTap={!blocked ? { scale: 0.92 } : {}}
                              className={`p-4 rounded-2xl border-2 font-bold transition-all backdrop-blur-sm relative ${
                                blocked
                                  ? "border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-60"
                                  : appointment.time === time
                                    ? "border-accent bg-accent/20 text-accent shadow-lg shadow-accent/30"
                                    : "border-white/40 text-gray-700 hover:border-accent/50 bg-white/40 hover:bg-white/60"
                              }`}
                              title={
                                blocked ? reason || "Horario no disponible" : ""
                              }
                            >
                              {time}
                              {blocked && (
                                <span className="absolute top-1 right-1 text-xs">
                                  🚫
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                    </motion.div>

                    {/* Show blocked times info for selected date */}
                    {appointment.date && (
                      <>
                        {(() => {
                          const blockedTimes = getBlockedTimesForDate(
                            appointment.date,
                            blockedDates,
                          );
                          if (blockedTimes.length > 0) {
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                              >
                                <p className="text-xs font-semibold text-amber-900 mb-2">
                                  ⚠️ Horarios bloqueados para esta fecha:
                                </p>
                                <div className="space-y-1">
                                  {blockedTimes.map((block, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs text-amber-800"
                                    >
                                      {block.all_day ? (
                                        <span className="font-medium">
                                          Todo el día
                                        </span>
                                      ) : (
                                        <span className="font-medium">
                                          {block.start_time.substring(0, 5)} -{" "}
                                          {block.end_time.substring(0, 5)}
                                        </span>
                                      )}
                                      {block.reason && (
                                        <span className="text-amber-600">
                                          {" "}
                                          • {block.reason}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                  </div>

                  {appointment.service && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl bg-secondary/10 border border-white/40 backdrop-blur-sm"
                    >
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-bold text-primary">
                          {getServiceName(appointment.service)}
                        </span>{" "}
                        - ${getServicePrice(appointment.service)}
                      </p>
                      {appointment.selectedAreas.length > 0 && (
                        <p className="text-sm text-gray-600 font-medium">
                          Áreas: {appointment.selectedAreas.length}{" "}
                          seleccionada(s)
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Authentication & Booking Type Selection + Contact Info */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="p-6 sm:p-10"
                >
                  {!isAuthenticated ? (
                    <>
                      <div className="text-center mb-10">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            delay: 0.2,
                            stiffness: 100,
                          }}
                          className="mx-auto w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/50"
                        >
                          <AlertCircle className="w-10 h-10 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-3 text-amber-600">
                          Inicia Sesión para Continuar
                        </h2>
                        <p className="text-gray-600 text-lg mb-6">
                          Por favor inicia sesión o crea una cuenta para
                          reservar tu cita
                        </p>
                        <motion.button
                          onClick={() => setShowAuthModal(true)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/50 transition-all"
                        >
                          Iniciar Sesión / Registrarse
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-10">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            delay: 0.2,
                            stiffness: 100,
                          }}
                          className="mx-auto w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/50"
                        >
                          <CheckCircle className="w-10 h-10 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-3 text-blue-600">
                          ¿Para Quién es la Cita?
                        </h2>
                        <p className="text-gray-600 text-lg">
                          Selecciona si la cita es para ti o para otra persona
                        </p>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="p-5 rounded-2xl bg-emerald-100/60 border-2 border-emerald-300/60 backdrop-blur-sm mb-8"
                      >
                        <p className="text-sm text-emerald-900 font-bold leading-relaxed flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>
                            Sesión iniciada como {user?.first_name}{" "}
                            {user?.last_name} ({user?.email})
                          </span>
                        </p>
                      </motion.div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <motion.button
                          onClick={() => {
                            dispatch(setBookedForSelf(true));
                            // Auto-fill with logged-in user's data
                            if (user) {
                              dispatch(
                                setPersonalInfo({
                                  name: `${user.first_name} ${user.last_name}`,
                                  email: user.email,
                                  phone: user.phone || "",
                                }),
                              );
                            }
                          }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`group relative p-8 text-center rounded-2xl border-2 backdrop-blur-sm transition-all overflow-hidden ${
                            appointment.bookedForSelf === true
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/30"
                              : "border-white/40 hover:border-primary/50 bg-white/40 hover:bg-white/60"
                          }`}
                        >
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative">
                            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                              <User className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Para Mí</h3>
                            <p className="text-sm text-gray-600">
                              La cita será para {user?.first_name}{" "}
                              {user?.last_name}
                            </p>
                          </div>
                        </motion.button>

                        <motion.button
                          onClick={() => {
                            dispatch(setBookedForSelf(false));
                            // Clear any auto-filled data so user can enter the other person's info
                            dispatch(
                              setPersonalInfo({
                                name: "",
                                email: "",
                                phone: "",
                              }),
                            );
                          }}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`group relative p-8 text-center rounded-2xl border-2 backdrop-blur-sm transition-all overflow-hidden ${
                            appointment.bookedForSelf === false
                              ? "border-secondary bg-secondary/10 shadow-lg shadow-secondary/30"
                              : "border-white/40 hover:border-secondary/50 bg-white/40 hover:bg-white/60"
                          }`}
                        >
                          <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative">
                            <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                              <Users className="w-8 h-8 text-secondary" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">
                              Para Otra Persona
                            </h3>
                            <p className="text-sm text-gray-600">
                              La cita será para alguien más
                            </p>
                          </div>
                        </motion.button>
                      </div>

                      {appointment.bookedForSelf !== null && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl bg-blue-100/40 border-2 border-blue-300/40 backdrop-blur-sm mb-8"
                          >
                            <p className="text-sm text-blue-900 font-bold leading-relaxed">
                              {appointment.bookedForSelf
                                ? "✓ Perfecto! La información de contacto será la tuya."
                                : "✓ Por favor proporciona la información de contacto de la persona para quien es la cita."}
                            </p>
                          </motion.div>

                          {/* Notes field for "Para Mí" */}
                          {appointment.bookedForSelf === true && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-6"
                            >
                              <label className="block text-sm font-bold text-foreground mb-3">
                                Notas o Comentarios (Opcional)
                              </label>
                              <textarea
                                placeholder="¿Alguna alergia o condición especial?"
                                value={appointment.notes}
                                onChange={(e) =>
                                  handleInputChange("notes", e.target.value)
                                }
                                rows={4}
                                className="w-full px-5 py-4 border-2 border-white/40 bg-white/40 backdrop-blur-sm rounded-2xl focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 transition-all text-foreground font-medium resize-none"
                              />
                            </motion.div>
                          )}
                        </>
                      )}

                      {/* Contact info form for "Para Otra Persona" */}
                      {appointment.bookedForSelf === false && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6 mt-8"
                        >
                          <h3 className="text-xl font-bold text-gray-800 mb-4">
                            Información de Contacto
                          </h3>
                          {[
                            {
                              label: "Nombre Completo",
                              placeholder: "Nombre de la persona",
                              type: "text",
                              field: "name",
                            },
                            {
                              label: "Email",
                              placeholder: "email@example.com",
                              type: "email",
                              field: "email",
                            },
                            {
                              label: "Teléfono",
                              placeholder: "+52 1234567890",
                              type: "tel",
                              field: "phone",
                            },
                          ].map((input, idx) => (
                            <motion.div
                              key={input.field}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + idx * 0.1 }}
                            >
                              <label className="block text-sm font-bold text-foreground mb-3">
                                {input.label}
                              </label>
                              {errors[input.field] && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mb-2 p-3 bg-red-50 border border-red-300 rounded-lg flex gap-2 items-start backdrop-blur-sm"
                                >
                                  <AlertCircle className="text-red-600 flex-shrink-0 w-4 h-4 mt-0.5" />
                                  <span className="text-sm text-red-700 font-medium">
                                    {errors[input.field]}
                                  </span>
                                </motion.div>
                              )}
                              <input
                                type={input.type}
                                placeholder={input.placeholder}
                                value={
                                  appointment[input.field as keyof WizardData]
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    input.field as keyof WizardData,
                                    e.target.value,
                                  )
                                }
                                className="w-full px-5 py-4 border-2 border-white/40 bg-white/40 backdrop-blur-sm rounded-2xl focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 transition-all text-foreground font-medium"
                              />
                            </motion.div>
                          ))}

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <label className="block text-sm font-bold text-foreground mb-3">
                              Notas o Comentarios (Opcional)
                            </label>
                            <textarea
                              placeholder="¿Alguna alergia o condición especial?"
                              value={appointment.notes}
                              onChange={(e) =>
                                handleInputChange("notes", e.target.value)
                              }
                              rows={4}
                              className="w-full px-5 py-4 border-2 border-white/40 bg-white/40 backdrop-blur-sm rounded-2xl focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 transition-all text-foreground font-medium resize-none"
                            />
                          </motion.div>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 4: Checkout & Payment */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="p-6 sm:p-10"
                >
                  <div className="text-center mb-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        delay: 0.2,
                        stiffness: 100,
                      }}
                      className="mx-auto w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/50"
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold mb-3 text-emerald-600">
                      Resumen y Pago
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Revisa los detalles y completa tu reserva
                    </p>
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Payment Form (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Payment Section - Stripe Integration */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                          Método de Pago
                        </h3>

                        {/* Terms and Conditions */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="space-y-4 mb-6"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="terms"
                              checked={acceptedTerms}
                              onChange={(e) =>
                                setAcceptedTerms(e.target.checked)
                              }
                              className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <label
                              htmlFor="terms"
                              className="text-sm text-gray-700 cursor-pointer select-none"
                            >
                              Acepto los{" "}
                              <a
                                href="/terminos"
                                target="_blank"
                                className="text-primary font-bold hover:underline"
                              >
                                Términos y Condiciones
                              </a>{" "}
                              del servicio
                            </label>
                          </div>

                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="privacy"
                              checked={acceptedPrivacy}
                              onChange={(e) =>
                                setAcceptedPrivacy(e.target.checked)
                              }
                              className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <label
                              htmlFor="privacy"
                              className="text-sm text-gray-700 cursor-pointer select-none"
                            >
                              Acepto la{" "}
                              <a
                                href="/privacidad"
                                target="_blank"
                                className="text-primary font-bold hover:underline"
                              >
                                Política de Privacidad
                              </a>{" "}
                              y el tratamiento de mis datos personales
                            </label>
                          </div>
                        </motion.div>

                        {/* Show payment form only after terms are accepted */}
                        {!acceptedTerms || !acceptedPrivacy ? (
                          <div className="p-8 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center">
                            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                            <p className="text-amber-800 font-medium">
                              ✓ Por favor acepta los términos y condiciones y la
                              política de privacidad para continuar con el pago
                            </p>
                          </div>
                        ) : isCreatingPayment ? (
                          <div className="p-8 rounded-2xl bg-blue-50 border-2 border-blue-300 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-blue-800 font-medium">
                              Preparando método de pago seguro...
                            </p>
                          </div>
                        ) : paymentError ? (
                          <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-300">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-red-800 font-bold mb-2">
                                  {paymentError.includes("horario")
                                    ? "⚠️ Horario No Disponible"
                                    : "Error al preparar el pago"}
                                </p>
                                <p className="text-sm text-red-700 leading-relaxed">
                                  {paymentError}
                                </p>
                                {!paymentError.includes("horario") && (
                                  <button
                                    onClick={createPaymentIntent}
                                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                  >
                                    Intentar de nuevo
                                  </button>
                                )}
                                {paymentError.includes("horario") && (
                                  <p className="mt-3 text-xs text-red-600 italic">
                                    Serás redirigido a la selección de horario
                                    en unos segundos...
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : clientSecret ? (
                          <Elements
                            stripe={stripePromise}
                            options={{
                              clientSecret,
                              appearance: {
                                theme: "stripe",
                                variables: {
                                  colorPrimary: "#ec4899",
                                  colorBackground: "#ffffff",
                                  colorText: "#1f2937",
                                  colorDanger: "#ef4444",
                                  fontFamily: "system-ui, sans-serif",
                                  borderRadius: "12px",
                                },
                              },
                            }}
                          >
                            <StripeCheckoutForm
                              amount={getServicePrice(appointment.service)}
                              onSuccess={handlePaymentSuccess}
                              onError={handlePaymentError}
                            />
                          </Elements>
                        ) : null}
                      </motion.div>

                      {/* Info Notice */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-5 rounded-2xl bg-blue-100/40 border-2 border-blue-300/40 backdrop-blur-sm"
                      >
                        <p className="text-sm text-blue-900 font-bold leading-relaxed">
                          ✓ Recibirás una confirmación por email y WhatsApp una
                          vez que se procese tu pago. Nuestro equipo se
                          contactará contigo para confirmar los detalles.
                        </p>
                      </motion.div>
                    </div>

                    {/* Right Column - Summary Panel (1/3 width) */}
                    <div className="lg:col-span-1">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="sticky top-4 space-y-4"
                      >
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                          Resumen de tu Cita
                        </h3>

                        {/* Summary Cards */}
                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-white/50 border border-white/40 backdrop-blur-sm">
                            <p className="text-xs text-gray-600 font-bold mb-1">
                              Servicio
                            </p>
                            <p className="text-sm font-bold text-primary">
                              {getServiceName(appointment.service)}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-white/50 border border-white/40 backdrop-blur-sm">
                            <p className="text-xs text-gray-600 font-bold mb-1">
                              Fecha y Hora
                            </p>
                            <p className="text-sm font-bold text-gray-800">
                              {appointment.date}
                            </p>
                            <p className="text-sm font-bold text-gray-800">
                              {appointment.time}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-white/50 border border-white/40 backdrop-blur-sm">
                            <p className="text-xs text-gray-600 font-bold mb-1">
                              Duración
                            </p>
                            <p className="text-sm font-bold text-gray-800">
                              {getServiceDuration(appointment.service)} min
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-white/50 border border-white/40 backdrop-blur-sm">
                            <p className="text-xs text-gray-600 font-bold mb-1">
                              Contacto
                            </p>
                            <p className="text-sm font-bold text-gray-800">
                              {appointment.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {appointment.email}
                            </p>
                            <p className="text-xs text-gray-600">
                              {appointment.phone}
                            </p>
                          </div>

                          {appointment.selectedAreas.length > 0 && (
                            <div className="p-4 rounded-xl bg-white/50 border border-white/40 backdrop-blur-sm">
                              <p className="text-xs text-gray-600 font-bold mb-2">
                                Áreas
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {BODY_AREAS.filter((a) =>
                                  appointment.selectedAreas.includes(a.id),
                                ).map((area) => (
                                  <span
                                    key={area.id}
                                    className="px-2 py-1 bg-secondary/30 text-secondary rounded-full text-xs font-bold"
                                  >
                                    {area.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {appointment.notes && (
                            <div className="p-4 rounded-xl bg-white/50 border border-white/40 backdrop-blur-sm">
                              <p className="text-xs text-gray-600 font-bold mb-1">
                                Notas
                              </p>
                              <p className="text-xs text-gray-700">
                                {appointment.notes}
                              </p>
                            </div>
                          )}

                          {/* Total */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-emerald-500/20 border-2 border-primary/40 backdrop-blur-sm">
                            <p className="text-xs text-gray-600 font-bold mb-1">
                              Total a Pagar
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              ${getServicePrice(appointment.service).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600">MXN</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="px-6 sm:px-10 py-6 border-t border-white/40 bg-white/40 backdrop-blur-sm flex gap-3 justify-between">
              <motion.button
                onClick={handlePrev}
                disabled={step === 1}
                whileHover={step !== 1 ? { scale: 1.05 } : {}}
                whileTap={step !== 1 ? { scale: 0.95 } : {}}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all backdrop-blur-sm ${
                  step === 1
                    ? "bg-gray-200/50 text-gray-400 cursor-not-allowed"
                    : "bg-white/60 border-2 border-white/40 text-gray-700 hover:border-primary hover:text-primary hover:shadow-lg"
                }`}
              >
                <ChevronLeft size={20} />
                Anterior
              </motion.button>

              {step < 4 ? (
                <motion.button
                  onClick={handleNext}
                  disabled={
                    (step === 3 && !isAuthenticated) ||
                    (step === 3 &&
                      isAuthenticated &&
                      appointment.bookedForSelf === null)
                  }
                  whileHover={
                    !(
                      (step === 3 && !isAuthenticated) ||
                      (step === 3 &&
                        isAuthenticated &&
                        appointment.bookedForSelf === null)
                    )
                      ? { scale: 1.05 }
                      : {}
                  }
                  whileTap={
                    !(
                      (step === 3 && !isAuthenticated) ||
                      (step === 3 &&
                        isAuthenticated &&
                        appointment.bookedForSelf === null)
                    )
                      ? { scale: 0.95 }
                      : {}
                  }
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all backdrop-blur-sm ${
                    (step === 3 && !isAuthenticated) ||
                    (step === 3 &&
                      isAuthenticated &&
                      appointment.bookedForSelf === null)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white hover:shadow-lg hover:shadow-primary/50"
                  }`}
                >
                  Siguiente
                  <ChevronRight size={20} />
                </motion.button>
              ) : (
                <div className="text-sm text-gray-600 font-medium">
                  Complete el pago arriba para confirmar
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer Info with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-gray-700 font-medium">
            ¿Necesitas ayuda? Llama al{" "}
            <span className="font-bold text-primary">+52 1234567890</span> o
            escribe a{" "}
            <span className="font-bold text-secondary">info@hospital.mx</span>
          </p>
        </motion.div>
      </div>

      {/* Auth Modal - show when user tries to submit without being logged in */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Confirmation Modal - show after successful payment */}
      <AppointmentConfirmationModal
        open={showConfirmationModal}
        onClose={handleConfirmationClose}
        appointmentDetails={{
          serviceName: getServiceName(appointment.service),
          date: appointment.date,
          time: appointment.time,
          duration: getServiceDuration(appointment.service),
          areas: getAreaLabels(appointment.selectedAreas),
          contactEmail: user?.email || appointment.email,
          contactPhone: user?.phone || appointment.phone,
          amount: getServicePrice(appointment.service),
        }}
      />
    </div>
  );
}
