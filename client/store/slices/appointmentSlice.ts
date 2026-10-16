import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the appointment state interface
export interface AppointmentState {
  service: number | null;
  selectedAreas: string[];
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  bookedForSelf: boolean | null; // null = not selected yet, true = for me, false = for someone else
  currentStep: number;
}

// Initial state
const initialState: AppointmentState = {
  service: null,
  selectedAreas: [],
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  notes: "",
  bookedForSelf: null,
  currentStep: 1,
};

// Create the slice
const appointmentSlice = createSlice({
  name: "appointment",
  initialState,
  reducers: {
    // Update service selection
    setService: (state, action: PayloadAction<number>) => {
      if (state.service !== action.payload) {
        state.selectedAreas = [];
      }
      state.service = action.payload;
    },
    // Toggle area selection (max 1 for Bliss/Legacy, up to 4 for Velocity)
    toggleArea: (
      state,
      action: PayloadAction<{ id: string; max?: number }>,
    ) => {
      const id = action.payload.id;
      const max = action.payload.max ?? 1;
      if (state.selectedAreas.includes(id)) {
        state.selectedAreas = state.selectedAreas.filter((area) => area !== id);
        return;
      }
      if (max <= 1) {
        state.selectedAreas = [id];
        return;
      }
      if (state.selectedAreas.length < max) {
        state.selectedAreas.push(id);
      }
    },
    // Set multiple areas at once
    setSelectedAreas: (state, action: PayloadAction<string[]>) => {
      state.selectedAreas = action.payload;
    },
    // Update date
    setDate: (state, action: PayloadAction<string>) => {
      state.date = action.payload;
    },
    // Update time
    setTime: (state, action: PayloadAction<string>) => {
      state.time = action.payload;
    },
    // Update personal information
    setPersonalInfo: (
      state,
      action: PayloadAction<{
        name?: string;
        email?: string;
        phone?: string;
        notes?: string;
      }>,
    ) => {
      if (action.payload.name !== undefined) state.name = action.payload.name;
      if (action.payload.email !== undefined)
        state.email = action.payload.email;
      if (action.payload.phone !== undefined)
        state.phone = action.payload.phone;
      if (action.payload.notes !== undefined)
        state.notes = action.payload.notes;
    },
    // Set booking type
    setBookedForSelf: (state, action: PayloadAction<boolean>) => {
      state.bookedForSelf = action.payload;
    },
    // Update current step
    setStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    // Go to next step
    nextStep: (state) => {
      if (state.currentStep < 4) {
        state.currentStep += 1;
      }
    },
    // Go to previous step
    previousStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
    },
    // Reset appointment form
    resetAppointment: (state) => {
      return initialState;
    },
  },
});

// Export actions
export const {
  setService,
  toggleArea,
  setSelectedAreas,
  setDate,
  setTime,
  setPersonalInfo,
  setBookedForSelf,
  setStep,
  nextStep,
  previousStep,
  resetAppointment,
} = appointmentSlice.actions;

// Export reducer
export default appointmentSlice.reducer;
