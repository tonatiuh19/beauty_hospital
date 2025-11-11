import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { BlockedDate } from "@shared/database";

interface SimpleCalendarProps {
  selected: string; // YYYY-MM-DD format
  onSelect: (date: string) => void;
  blockedDates: BlockedDate[];
  error?: string;
}

export function SimpleCalendar({
  selected,
  onSelect,
  blockedDates,
  error,
}: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateDisabled = (day: number | null): boolean => {
    if (day === null) return true;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    // Disable past dates
    if (date < today) return true;

    // Check if date is FULLY blocked (all-day blocks only)
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isDateFullyBlocked(dateString, blockedDates);
  };

  // Check if a date has an all-day block (not just partial time blocks)
  const isDateFullyBlocked = (
    dateStr: string,
    blockedDates: BlockedDate[],
  ): boolean => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const checkDate = new Date(year, month - 1, day);
    checkDate.setHours(0, 0, 0, 0);

    return blockedDates.some((blocked) => {
      // Handle both Date objects and string dates from API
      const startDateStr =
        blocked.start_date instanceof Date
          ? blocked.start_date.toISOString().split("T")[0]
          : String(blocked.start_date).split("T")[0];
      const endDateStr =
        blocked.end_date instanceof Date
          ? blocked.end_date.toISOString().split("T")[0]
          : String(blocked.end_date).split("T")[0];

      const [sYear, sMonth, sDay] = startDateStr.split("-").map(Number);
      const [eYear, eMonth, eDay] = endDateStr.split("-").map(Number);

      const startDate = new Date(sYear, sMonth - 1, sDay);
      const endDate = new Date(eYear, eMonth - 1, eDay);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      // Only block the date if it's an all-day block
      return blocked.all_day && checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Check if a date has partial time blocks (not all-day)
  const hasPartialBlocks = (day: number | null): boolean => {
    if (day === null) return false;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const [checkYear, checkMonth, checkDay] = dateString.split("-").map(Number);
    const checkDate = new Date(checkYear, checkMonth - 1, checkDay);
    checkDate.setHours(0, 0, 0, 0);

    return blockedDates.some((blocked) => {
      const startDateStr =
        blocked.start_date instanceof Date
          ? blocked.start_date.toISOString().split("T")[0]
          : String(blocked.start_date).split("T")[0];
      const endDateStr =
        blocked.end_date instanceof Date
          ? blocked.end_date.toISOString().split("T")[0]
          : String(blocked.end_date).split("T")[0];

      const [sYear, sMonth, sDay] = startDateStr.split("-").map(Number);
      const [eYear, eMonth, eDay] = endDateStr.split("-").map(Number);

      const startDate = new Date(sYear, sMonth - 1, sDay);
      const endDate = new Date(eYear, eMonth - 1, eDay);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      // Return true if date is in range but NOT an all-day block
      return !blocked.all_day && checkDate >= startDate && checkDate <= endDate;
    });
  };

  const isDateSelected = (day: number | null): boolean => {
    if (day === null || !selected) return false;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return dateString === selected;
  };

  const isToday = (day: number | null): boolean => {
    if (day === null) return false;

    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const handleDateClick = (day: number | null) => {
    if (day === null || isDateDisabled(day)) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    console.log("Date clicked:", dateString);
    onSelect(dateString);
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl flex gap-3 items-start backdrop-blur-sm"
        >
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 w-5 h-5" />
          <span className="text-sm text-red-700 font-medium">{error}</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="border-2 border-white/40 bg-white/40 backdrop-blur-sm rounded-2xl p-4"
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h3 className="font-bold text-lg">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const disabled = isDateDisabled(day);
            const selectedDay = isDateSelected(day);
            const todayDay = isToday(day);
            const partialBlock = hasPartialBlocks(day);

            return (
              <motion.button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={disabled || day === null}
                whileHover={!disabled && day !== null ? { scale: 1.1 } : {}}
                whileTap={!disabled && day !== null ? { scale: 0.95 } : {}}
                className={`
                  aspect-square p-2 rounded-lg text-sm font-medium transition-all relative
                  ${day === null ? "invisible" : ""}
                  ${
                    disabled
                      ? "bg-red-50 text-red-300 cursor-not-allowed opacity-50 line-through"
                      : selectedDay
                        ? "bg-primary text-white shadow-lg"
                        : todayDay
                          ? "bg-accent text-accent-foreground"
                          : partialBlock
                            ? "hover:bg-amber-100 bg-amber-50/50 border border-amber-300"
                            : "hover:bg-white/60 bg-white/30"
                  }
                `}
              >
                {day}
                {partialBlock && !selectedDay && !disabled && (
                  <span
                    className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full"
                    title="Horarios limitados"
                  ></span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-white/40 space-y-2">
          <p className="text-xs font-semibold text-gray-700 mb-2">Leyenda:</p>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary"></div>
            <span className="text-xs text-gray-600">Fecha seleccionada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent"></div>
            <span className="text-xs text-gray-600">Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div>
            <span className="text-xs text-gray-600">
              Fecha no disponible (Todo el día)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-50 border border-amber-300 relative">
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
            </div>
            <span className="text-xs text-gray-600">Horarios limitados</span>
          </div>
        </div>

        {/* Show blocked dates info if any */}
        {blockedDates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/40">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Fechas/Horarios bloqueados próximos:
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {blockedDates.slice(0, 8).map((blocked, idx) => {
                const start = new Date(blocked.start_date).toLocaleDateString(
                  "es-MX",
                  {
                    day: "numeric",
                    month: "short",
                  },
                );
                const end = new Date(blocked.end_date).toLocaleDateString(
                  "es-MX",
                  {
                    day: "numeric",
                    month: "short",
                  },
                );

                // Format time if available
                const formatTime = (time?: string) => {
                  if (!time) return "";
                  return time.substring(0, 5); // HH:MM
                };

                return (
                  <div key={idx} className="text-xs">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-700">
                          {start === end ? start : `${start} - ${end}`}
                          {blocked.all_day ? (
                            <span className="ml-2 text-red-600 font-semibold">
                              (Todo el día)
                            </span>
                          ) : (
                            blocked.start_time &&
                            blocked.end_time && (
                              <span className="ml-2 text-orange-600 font-semibold">
                                {formatTime(blocked.start_time)} -{" "}
                                {formatTime(blocked.end_time)}
                              </span>
                            )
                          )}
                        </div>
                        {blocked.reason && (
                          <div className="text-gray-500 mt-0.5">
                            {blocked.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {blockedDates.length > 8 && (
                <p className="text-xs text-gray-500 italic pl-4">
                  +{blockedDates.length - 8} más...
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
