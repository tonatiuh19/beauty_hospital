import { Middleware } from "@reduxjs/toolkit";
import { showLoading, hideLoading } from "../slices/loadingSlice";

/**
 * Middleware that automatically shows/hides the loading mask
 * when async thunks are pending/fulfilled/rejected
 */
export const loadingMiddleware: Middleware = (store) => (next) => (action) => {
  const { type } = action;

  // Check if it's an async thunk action
  if (type && typeof type === "string") {
    // Show loading on pending actions
    if (type.endsWith("/pending")) {
      const actionName = type.replace("/pending", "");
      const loadingMessage = getLoadingMessage(actionName);
      store.dispatch(showLoading(loadingMessage));
    }

    // Hide loading on fulfilled or rejected actions
    if (type.endsWith("/fulfilled") || type.endsWith("/rejected")) {
      store.dispatch(hideLoading());
    }
  }

  return next(action);
};

/**
 * Get appropriate loading message based on the action name
 */
function getLoadingMessage(actionName: string): string | undefined {
  const messageMap: Record<string, string> = {
    "services/fetchServices": "Cargando servicios...",
    "appointmentApi/submit": "Creando tu cita...",
    "auth/checkUser": "Verificando información...",
    "auth/sendCode": "Enviando código de verificación...",
    "auth/verifyCode": "Verificando código...",
    "auth/createPatient": "Creando tu cuenta...",
    "blockedDates/fetchBlockedDates": "Cargando fechas bloqueadas...",
    "blockedDates/checkDateBlocked": "Verificando disponibilidad...",
    "businessHours/fetchBusinessHours": "Cargando horarios...",
    "businessHours/fetchBusinessHoursByDay": "Cargando horarios del día...",
    "bookedSlots/fetchBookedSlots": "Verificando disponibilidad...",
  };

  return messageMap[actionName];
}
