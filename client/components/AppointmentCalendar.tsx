import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import type { BlockedDate } from "@shared/database";
import { isDateBlocked } from "@/store/slices/blockedDatesSlice";
import { logger } from "@/lib/logger";

interface AppointmentCalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  blockedDates: BlockedDate[];
  error?: string;
}

export function AppointmentCalendar({
  selected,
  onSelect,
  blockedDates,
  error,
}: AppointmentCalendarProps) {
  // Function to check if a date should be disabled
  const isDisabled = (date: Date): boolean => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) return true;

    // Check if date is blocked
    const dateString = date.toISOString().split("T")[0];
    return isDateBlocked(dateString, blockedDates);
  };

  const handleSelect = (date: Date | undefined) => {
    logger.log("Calendar date selected:", date);
    onSelect(date);
  };

  // Get blocked dates for display info
  const getBlockedDateReason = (date: Date): string | undefined => {
    const dateString = date.toISOString().split("T")[0];
    const blocked = blockedDates.find((bd) => {
      const checkDate = new Date(date);
      const startDate = new Date(bd.start_date);
      const endDate = new Date(bd.end_date);
      checkDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      return checkDate >= startDate && checkDate <= endDate;
    });
    return blocked?.reason;
  };

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
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={isDisabled}
          className="rounded-xl w-full"
          fromDate={new Date()}
          modifiers={{
            blocked: (date) => {
              const dateString = date.toISOString().split("T")[0];
              return isDateBlocked(dateString, blockedDates);
            },
          }}
          modifiersClassNames={{
            blocked:
              "bg-red-100 text-red-400 line-through opacity-50 hover:bg-red-100",
          }}
        />

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
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
            <span className="text-xs text-gray-600">Fecha no disponible</span>
          </div>
        </div>

        {/* Show blocked dates info if any */}
        {/* {blockedDates.length > 0 && (
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
        )} */}
      </motion.div>
    </div>
  );
}
