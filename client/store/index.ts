import { configureStore } from "@reduxjs/toolkit";
import servicesReducer from "./slices/servicesSlice";
import appointmentReducer from "./slices/appointmentSlice";
import appointmentApiReducer from "./slices/appointmentApiSlice";
import authReducer from "./slices/authSlice";
import blockedDatesReducer from "./slices/blockedDatesSlice";
import businessHoursReducer from "./slices/businessHoursSlice";
import bookedSlotsReducer from "./slices/bookedSlotsSlice";
import loadingReducer from "./slices/loadingSlice";
import usersReducer from "./slices/usersSlice";
import medicalRecordsReducer from "./slices/medicalRecordsSlice";
import { loadingMiddleware } from "./middleware/loadingMiddleware";

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
    loading: loadingReducer,
    users: usersReducer,
    medicalRecords: medicalRecordsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types if needed
        ignoredActions: [],
      },
    }).concat(loadingMiddleware),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
