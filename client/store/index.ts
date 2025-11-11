import { configureStore } from "@reduxjs/toolkit";
import servicesReducer from "./slices/servicesSlice";
import appointmentReducer from "./slices/appointmentSlice";
import appointmentApiReducer from "./slices/appointmentApiSlice";
import authReducer from "./slices/authSlice";
import blockedDatesReducer from "./slices/blockedDatesSlice";
import businessHoursReducer from "./slices/businessHoursSlice";
import bookedSlotsReducer from "./slices/bookedSlotsSlice";

// Configure the store
export const store = configureStore({
  reducer: {
    services: servicesReducer,
    appointment: appointmentReducer,
    appointmentApi: appointmentApiReducer,
    auth: authReducer,
    blockedDates: blockedDatesReducer,
    businessHours: businessHoursReducer,
    bookedSlots: bookedSlotsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types if needed
        ignoredActions: [],
      },
    }),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
