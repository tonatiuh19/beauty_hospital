import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type {
  BookedTimeSlot,
  GetBookedTimeSlotsResponse,
  ApiResponse,
} from "@shared/api";
import axios from "@/lib/axios";
import { withRetry, getUserFriendlyErrorMessage } from "@/lib/axios-retry";

interface BookedSlotsState {
  bookedSlots: BookedTimeSlot[];
  currentDate: string | null;
  currentServiceId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: BookedSlotsState = {
  bookedSlots: [],
  currentDate: null,
  currentServiceId: null,
  loading: false,
  error: null,
};

// Fetch booked time slots for a specific date (and optionally service)
export const fetchBookedSlots = createAsyncThunk(
  "bookedSlots/fetchBookedSlots",
  async (
    params: { date: string; service_id?: number },
    { rejectWithValue },
  ) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("date", params.date);
      if (params.service_id) {
        queryParams.append("service_id", params.service_id.toString());
      }

      const response = await withRetry(
        () =>
          axios.get<ApiResponse<GetBookedTimeSlotsResponse>>(
            `/appointments/booked-slots?${queryParams.toString()}`,
          ),
        { maxRetries: 3, initialDelay: 1000 },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to fetch booked time slots");
    } catch (error) {
      return rejectWithValue(getUserFriendlyErrorMessage(error));
    }
  },
);

const bookedSlotsSlice = createSlice({
  name: "bookedSlots",
  initialState,
  reducers: {
    clearBookedSlots: (state) => {
      state.bookedSlots = [];
      state.currentDate = null;
      state.currentServiceId = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookedSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookedSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.bookedSlots = action.payload.booked_slots;
        state.currentDate = action.payload.date;
        state.currentServiceId = action.payload.service_id;
      })
      .addCase(fetchBookedSlots.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch booked slots";
      });
  },
});

export const { clearBookedSlots } = bookedSlotsSlice.actions;

// Selector to check if a time slot is booked
export const isTimeSlotBooked = (
  state: BookedSlotsState,
  startTime: string,
  durationMinutes: number,
): { booked: boolean; reason?: string } => {
  // Convert start time to minutes
  const [startHour, startMin] = startTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = startMinutes + durationMinutes;

  // Check each booked slot
  for (const bookedSlot of state.bookedSlots) {
    const [bookedHour, bookedMin] = bookedSlot.start_time
      .split(":")
      .map(Number);
    const bookedStartMinutes = bookedHour * 60 + bookedMin;
    const bookedEndMinutes = bookedStartMinutes + bookedSlot.duration_minutes;

    // Check if the time slots overlap
    // Overlap occurs if: (start1 < end2) AND (end1 > start2)
    if (startMinutes < bookedEndMinutes && endMinutes > bookedStartMinutes) {
      return {
        booked: true,
        reason: "Este horario ya está reservado",
      };
    }
  }

  return { booked: false };
};

export default bookedSlotsSlice.reducer;
