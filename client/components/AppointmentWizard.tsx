import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Service, ServiceCategory } from "@shared/database";
import { GetServicesResponse } from "@shared/api";

// Category display icons
const categoryIcons: Record<ServiceCategory, string> = {
  [ServiceCategory.LASER_HAIR_REMOVAL]: "✨",
  [ServiceCategory.FACIAL_TREATMENT]: "🧖",
  [ServiceCategory.BODY_TREATMENT]: "💆",
  [ServiceCategory.CONSULTATION]: "👨‍⚕️",
  [ServiceCategory.OTHER]: "�",
};

const BODY_AREAS = [
  { id: "face", label: "Cara", emoji: "👤" },
  { id: "underarms", label: "Axilas", emoji: "💪" },
  { id: "bikini", label: "Bikini", emoji: "👙" },
  { id: "legs", label: "Piernas", emoji: "🦵" },
  { id: "arms", label: "Brazos", emoji: "💪" },
  { id: "back", label: "Espalda", emoji: "🔙" },
  { id: "full", label: "Cuerpo Completo", emoji: "👯" },
];

// Mock blocked dates (dates that are unavailable)
const BLOCKED_DATES = new Set([
  "2024-01-02",
  "2024-01-03",
  "2024-01-08",
  "2024-01-15",
  "2024-01-22",
  "2024-01-29",
]);

interface WizardData {
  service: number | null; // Changed from string to number to match service ID
  selectedAreas: string[];
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export function AppointmentWizard() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [data, setData] = useState<WizardData>({
    service: null,
    selectedAreas: [],
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        const result: GetServicesResponse = await response.json();
        if (result.success && result.data) {
          setServices(result.data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceSelect = (serviceId: number) => {
    setData({ ...data, service: serviceId });
    setErrors({ ...errors, service: "" });
  };

  const handleAreaToggle = (areaId: string) => {
    const newAreas = data.selectedAreas.includes(areaId)
      ? data.selectedAreas.filter((a) => a !== areaId)
      : [...data.selectedAreas, areaId];
    setData({ ...data, selectedAreas: newAreas });
    setErrors({ ...errors, selectedAreas: "" });
  };

  const handleInputChange = (field: keyof WizardData, value: string) => {
    setData({ ...data, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!data.service) newErrors.service = "Selecciona un servicio";
      if (data.selectedAreas.length === 0)
        newErrors.selectedAreas = "Selecciona al menos un área";
    } else if (stepNum === 2) {
      if (!data.date) newErrors.date = "Selecciona una fecha";
      if (!data.time) newErrors.time = "Selecciona una hora";
    } else if (stepNum === 3) {
      if (!data.name.trim()) newErrors.name = "El nombre es requerido";
      if (!data.email.trim()) newErrors.email = "El email es requerido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        newErrors.email = "Email inválido";
      if (!data.phone.trim()) newErrors.phone = "El teléfono es requerido";
      if (!/^[0-9+\-\s()]{10,}$/.test(data.phone))
        newErrors.phone = "Teléfono inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (validateStep(step)) {
      console.log("Appointment data:", data);
      // Here you would send the data to your backend
      alert(`¡Cita reservada! Te contactaremos en ${data.phone}`);
    }
  };

  const getServiceName = (id: number | null) => {
    if (!id) return "";
    return services.find((s) => s.id === id)?.name || "";
  };

  const getServicePrice = (id: number | null) => {
    if (!id) return 0;
    return services.find((s) => s.id === id)?.price || 0;
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

      <div className="max-w-2xl mx-auto relative z-10">
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
                            ? "Datos"
                            : "Confirmar"}
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
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl opacity-75" />

          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40">
            {/* Solid color border effect */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

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
                      const icon =
                        categoryIcons[service.category] ||
                        categoryIcons[ServiceCategory.OTHER];

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
                            data.service === service.id
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/30"
                              : "border-white/40 hover:border-primary/50 bg-white/40 hover:bg-white/60"
                          }`}
                        >
                          {/* Background effect on hover */}
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="relative flex justify-between items-start">
                            <div className="flex gap-4 flex-1">
                              <div className="text-3xl">{icon}</div>
                              <div className="flex-1">
                                <h3 className="font-bold text-foreground mb-1 text-lg">
                                  {service.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {service.description ||
                                    "Servicio profesional de calidad"}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                  ⏱ {service.duration_minutes} minutos
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-lg text-primary">
                                ${service.price.toFixed(2)}
                              </p>
                              <motion.div
                                animate={
                                  data.service === service.id
                                    ? {
                                        scale: [1, 1.2, 1],
                                      }
                                    : {}
                                }
                                transition={{
                                  duration: 0.4,
                                }}
                                className={`w-6 h-6 rounded-full border-2 mt-3 flex items-center justify-center transition-all ${
                                  data.service === service.id
                                    ? "border-primary bg-primary"
                                    : "border-gray-300"
                                }`}
                              >
                                {data.service === service.id && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </motion.div>
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
                            data.selectedAreas.includes(area.id)
                              ? "border-secondary bg-secondary/20 shadow-lg shadow-secondary/30"
                              : "border-white/40 hover:border-secondary/50 bg-white/40 hover:bg-white/60"
                          }`}
                        >
                          <motion.div
                            animate={
                              data.selectedAreas.includes(area.id)
                                ? { scale: [1, 1.2, 1] }
                                : {}
                            }
                            transition={{ duration: 0.3 }}
                            className="text-3xl mb-2"
                          >
                            {area.emoji}
                          </motion.div>
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
                      ��� Fecha disponible
                    </label>
                    {errors.date && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl flex gap-3 items-start backdrop-blur-sm"
                      >
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 w-5 h-5" />
                        <span className="text-sm text-red-700 font-medium">
                          {errors.date}
                        </span>
                      </motion.div>
                    )}
                    <motion.input
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      type="date"
                      value={data.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className="w-full px-5 py-4 border-2 border-white/40 bg-white/40 backdrop-blur-sm rounded-2xl focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/20 transition-all text-foreground font-medium"
                    />
                  </div>

                  <div className="mb-8">
                    <label className="block font-bold text-foreground mb-4 text-lg">
                      🕐 Hora Preferida
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
                    <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        "09:00",
                        "10:00",
                        "11:00",
                        "14:00",
                        "15:00",
                        "16:00",
                        "17:00",
                        "18:00",
                      ].map((time, idx) => (
                        <motion.button
                          key={time}
                          onClick={() => handleInputChange("time", time)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + idx * 0.04 }}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className={`p-4 rounded-2xl border-2 font-bold transition-all backdrop-blur-sm ${
                            data.time === time
                              ? "border-accent bg-accent/20 text-accent shadow-lg shadow-accent/30"
                              : "border-white/40 text-gray-700 hover:border-accent/50 bg-white/40 hover:bg-white/60"
                          }`}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>

                  {data.service && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl bg-secondary/10 border border-white/40 backdrop-blur-sm"
                    >
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-bold text-primary">
                          {getServiceName(data.service)}
                        </span>{" "}
                        - ${getServicePrice(data.service)}
                      </p>
                      {data.selectedAreas.length > 0 && (
                        <p className="text-sm text-gray-600 font-medium">
                          Áreas: {data.selectedAreas.length} seleccionada(s)
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: User Information */}
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
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold mb-2 text-accent"
                  >
                    Tu Información Personal
                  </motion.h2>
                  <p className="text-gray-600 mb-8">
                    Completa tus datos para confirmar la cita
                  </p>

                  <motion.div className="space-y-6">
                    {[
                      {
                        label: "Nombre Completo",
                        placeholder: "Juan García",
                        type: "text",
                        field: "name",
                      },
                      {
                        label: "Email",
                        placeholder: "juan@example.com",
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
                          value={data[input.field as keyof WizardData]}
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
                        value={data.notes}
                        onChange={(e) =>
                          handleInputChange("notes", e.target.value)
                        }
                        rows={4}
                        className="w-full px-5 py-4 border-2 border-white/40 bg-white/40 backdrop-blur-sm rounded-2xl focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 transition-all text-foreground font-medium resize-none"
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
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
                      Reserva Casi Lista
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Revisa los detalles y confirma tu cita
                    </p>
                  </div>

                  <motion.div className="space-y-4 mb-8">
                    {[
                      {
                        label: "Servicio",
                        value: getServiceName(data.service),
                        price: `$${getServicePrice(data.service).toFixed(2)}`,
                        icon: "🎯",
                      },
                      {
                        label: "Fecha y Hora",
                        value: `${data.date} a las ${data.time}`,
                        icon: "📅",
                      },
                      {
                        label: "Información de Contacto",
                        value: `${data.name} • ${data.phone}`,
                        icon: "👤",
                      },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.1 }}
                        className="p-5 rounded-2xl bg-white/50 border-2 border-white/40 backdrop-blur-sm hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-bold mb-2">
                              {item.icon} {item.label}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              {item.value}
                            </p>
                            {item.price && (
                              <p className="text-lg font-bold text-primary mt-1">
                                {item.price}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {data.selectedAreas.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-5 rounded-2xl bg-white/50 border-2 border-white/40 backdrop-blur-sm"
                      >
                        <p className="text-sm text-gray-600 font-bold mb-3">
                          🎨 Áreas de Tratamiento
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {BODY_AREAS.filter((a) =>
                            data.selectedAreas.includes(a.id),
                          ).map((area) => (
                            <motion.span
                              key={area.id}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-4 py-2 bg-secondary/30 text-secondary rounded-full text-sm font-bold border border-secondary/50 backdrop-blur-sm"
                            >
                              {area.emoji} {area.label}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-5 rounded-2xl bg-blue-100/40 border-2 border-blue-300/40 backdrop-blur-sm mb-8"
                  >
                    <p className="text-sm text-blue-900 font-bold leading-relaxed">
                      ✓ Recibirás una confirmación por email y WhatsApp una vez
                      que confirmes tu cita. Nuestro equipo se contactará
                      contigo para confirmar los detalles.
                    </p>
                  </motion.div>
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/50 transition-all backdrop-blur-sm"
                >
                  Siguiente
                  <ChevronRight size={20} />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-emerald-500/50 transition-all backdrop-blur-sm"
                >
                  <CheckCircle size={20} />
                  Confirmar Cita
                </motion.button>
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
    </div>
  );
}
