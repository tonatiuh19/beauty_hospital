import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { AppointmentState } from "./appointmentSlice";

// Define the state interface
interface AppointmentApiState {
  submitting: boolean;
  success: boolean;
  error: string | null;
  confirmationId: string | null;
}

// Initial state
const initialState: AppointmentApiState = {
  submitting: false,
  success: false,
  error: null,
  confirmationId: null,
};

// Async thunk for submitting appointment
export const submitAppointment = createAsyncThunk(
  "appointmentApi/submit",
  async (appointmentData: AppointmentState, { rejectWithValue }) => {
    try {
      // This would be the actual API endpoint for creating appointments
      const response = await axios.post("/appointments", appointmentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit appointment",
      );
    }
  },
);

// Create the slice
const appointmentApiSlice = createSlice({
  name: "appointmentApi",
  initialState,
  reducers: {
    // Reset submission state
    resetSubmission: (state) => {
      state.submitting = false;
      state.success = false;
      state.error = null;
      state.confirmationId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle submitAppointment pending
      .addCase(submitAppointment.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.success = false;
      })
      // Handle submitAppointment fulfilled
      .addCase(submitAppointment.fulfilled, (state, action) => {
        state.submitting = false;
        state.success = true;
        state.confirmationId = action.payload.confirmationId || null;
      })
      // Handle submitAppointment rejected
      .addCase(submitAppointment.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

// Export actions
export const { resetSubmission } = appointmentApiSlice.actions;

// Export reducer
export default appointmentApiSlice.reducer;
