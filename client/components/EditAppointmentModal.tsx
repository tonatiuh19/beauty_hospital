import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { SimpleCalendar } from "./SimpleCalendar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBlockedDates } from "@/store/slices/blockedDatesSlice";
import { fetchBusinessHours } from "@/store/slices/businessHoursSlice";
import { fetchBookedSlots } from "@/store/slices/bookedSlotsSlice";

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newDate: string, newTime: string) => void;
  appointment: {
    id: number;
    service_name: string;
    scheduled_at: string;
    duration_minutes: number;
  };
  isLoading?: boolean;
}

export function EditAppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointment,
  isLoading = false,
}: EditAppointmentModalProps) {
  const dispatch = useAppDispatch();
  const { blockedDates } = useAppSelector((state) => state.blockedDates);
  const { businessHours } = useAppSelector((state) => state.businessHours);
  const bookedSlotsState = useAppSelector((state) => state.bookedSlots);
  const bookedSlots = bookedSlotsState.bookedSlots || [];

  // Parse current appointment date/time
  const currentScheduledDate = new Date(appointment.scheduled_at);
  const currentDate = currentScheduledDate.toISOString().split("T")[0];
  const currentTime = currentScheduledDate.toTimeString().slice(0, 5);

  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [selectedTime, setSelectedTime] = useState(currentTime);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      dispatch(fetchBlockedDates({ start_date: startDate, end_date: endDate }));
      dispatch(fetchBusinessHours());
    }
  }, [isOpen, dispatch]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchBookedSlots({ date: selectedDate }));
    }
  }, [selectedDate, dispatch]);

  // Generate available time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, businessHours, bookedSlots, blockedDates]);

  const generateTimeSlots = () => {
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();

    // Get business hours for selected day
    const businessHour = businessHours.find(
      (bh: any) => bh.day_of_week === dayOfWeek,
    );

    if (!businessHour || !businessHour.is_open) {
      setAvailableSlots([]);
      return;
    }

    const slots: string[] = [];
    const openTime = businessHour.open_time;
    const closeTime = businessHour.close_time;
    const breakStart = businessHour.break_start;
    const breakEnd = businessHour.break_end;

    // Parse times
    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);

    // Generate 15-minute slots
    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute <= closeMinute)
    ) {
      const timeString = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

      // Check if time is during break
      const isDuringBreak =
        breakStart &&
        breakEnd &&
        timeString >= breakStart &&
        timeString < breakEnd;

      // Check if time is blocked
      const isTimeBlocked = isSlotBlocked(selectedDate, timeString);

      // Check if time is booked
      const isTimeBooked = isSlotBooked(selectedDate, timeString);

      // Don't add if during break, blocked, or booked (unless it's the current appointment time)
      const isCurrentSlot =
        selectedDate === currentDate && timeString === currentTime;
      if (
        !isDuringBreak &&
        !isTimeBlocked &&
        (!isTimeBooked || isCurrentSlot)
      ) {
        slots.push(timeString);
      }

      // Increment by 15 minutes
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }

    setAvailableSlots(slots);
  };

  const isSlotBlocked = (date: string, time: string): boolean => {
    return blockedDates.some((blocked: any) => {
      const startDateStr =
        blocked.start_date instanceof Date
          ? blocked.start_date.toISOString().split("T")[0]
          : String(blocked.start_date).split("T")[0];
      const endDateStr =
        blocked.end_date instanceof Date
          ? blocked.end_date.toISOString().split("T")[0]
          : String(blocked.end_date).split("T")[0];

      const checkDate = new Date(date);
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (checkDate < startDate || checkDate > endDate) {
        return false;
      }

      // If all-day block, it's blocked
      if (blocked.all_day) {
        return true;
      }

      // Check if time falls within blocked time range
      if (blocked.start_time && blocked.end_time) {
        return time >= blocked.start_time && time < blocked.end_time;
      }

      return false;
    });
  };

  const isSlotBooked = (date: string, time: string): boolean => {
    return bookedSlots.some((slot: any) => {
      // BookedTimeSlot has start_time, not scheduled_at
      return slot.start_time === time;
    });
  };

  const handleSave = () => {
    if (!selectedDate || !selectedTime) {
      setError("Por favor selecciona fecha y hora");
      return;
    }

    // Validate that it's different from current
    if (selectedDate === currentDate && selectedTime === currentTime) {
      setError("Debes seleccionar una fecha/hora diferente");
      return;
    }

    // Validate that the slot is available
    if (!availableSlots.includes(selectedTime)) {
      setError("El horario seleccionado no está disponible");
      return;
    }

    onSave(selectedDate, selectedTime);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
    setError("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light p-6 text-white relative">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Reagendar Cita</h2>
                    <p className="text-indigo-100 text-sm mt-1">
                      {appointment.service_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Current Appointment Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Cita Actual
                  </h3>
                  <div className="text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Fecha:</span>{" "}
                      {currentScheduledDate.toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p>
                      <span className="font-medium">Hora:</span> {currentTime}
                    </p>
                    <p>
                      <span className="font-medium">Duración:</span>{" "}
                      {appointment.duration_minutes} minutos
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Date and Time Selection */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Selecciona Nueva Fecha
                    </h3>
                    <SimpleCalendar
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      blockedDates={blockedDates}
                    />
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Selecciona Nueva Hora
                    </h3>

                    {!selectedDate ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-blue-800">
                          Primero selecciona una fecha
                        </p>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-yellow-800">
                          No hay horarios disponibles para esta fecha
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto pr-2">
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((time) => {
                            const isSelected = time === selectedTime;
                            const isCurrent =
                              selectedDate === currentDate &&
                              time === currentTime;

                            return (
                              <button
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                disabled={isLoading || isCurrent}
                                className={`
                                  p-3 rounded-lg text-sm font-medium transition-all relative
                                  ${
                                    isSelected
                                      ? "bg-indigo-600 text-white shadow-lg scale-105"
                                      : isCurrent
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }
                                  disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                              >
                                {time}
                                {isCurrent && (
                                  <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full">
                                    Actual
                                  </span>
                                )}
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 absolute top-1 right-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Summary */}
                {selectedDate && selectedTime && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Nueva Cita Seleccionada
                    </h4>
                    <p className="text-sm text-green-800">
                      {new Date(selectedDate).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      a las {selectedTime}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t p-6 bg-gray-50 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading || !selectedDate || !selectedTime}
                  className="flex-1 bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light hover:from-luxury-gold-dark/90 hover:to-luxury-gold-light/90"
                >
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
