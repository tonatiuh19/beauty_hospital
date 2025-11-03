import { configureStore } from "@reduxjs/toolkit";
import servicesReducer from "./slices/servicesSlice";
import appointmentReducer from "./slices/appointmentSlice";
import appointmentApiReducer from "./slices/appointmentApiSlice";

// Configure the store
export const store = configureStore({
  reducer: {
    services: servicesReducer,
    appointment: appointmentReducer,
    appointmentApi: appointmentApiReducer,
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
