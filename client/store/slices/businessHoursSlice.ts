import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { BusinessHours } from "@shared/database";
import type { ApiResponse } from "@shared/api";
import axios from "@/lib/axios";

interface BusinessHoursState {
  businessHours: BusinessHours[];
  loading: boolean;
  error: string | null;
}

const initialState: BusinessHoursState = {
  businessHours: [],
  loading: false,
  error: null,
};

// Fetch all business hours
export const fetchBusinessHours = createAsyncThunk(
  "businessHours/fetchBusinessHours",
  async () => {
    const response =
      await axios.get<ApiResponse<BusinessHours[]>>("/business-hours");

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Failed to fetch business hours");
  },
);

// Fetch business hours for a specific day
export const fetchBusinessHoursByDay = createAsyncThunk(
  "businessHours/fetchBusinessHoursByDay",
  async (dayOfWeek: number) => {
    const response = await axios.get<ApiResponse<BusinessHours>>(
      `/business-hours/day/${dayOfWeek}`,
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Failed to fetch business hours for this day");
  },
);

const businessHoursSlice = createSlice({
  name: "businessHours",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all business hours
    builder.addCase(fetchBusinessHours.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBusinessHours.fulfilled, (state, action) => {
      state.loading = false;
      state.businessHours = action.payload;
    });
    builder.addCase(fetchBusinessHours.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch business hours";
    });

    // Fetch business hours by day
    builder.addCase(fetchBusinessHoursByDay.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBusinessHoursByDay.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(fetchBusinessHoursByDay.rejected, (state, action) => {
      state.loading = false;
      state.error =
        action.error.message || "Failed to fetch business hours for this day";
    });
  },
});

export const { clearError } = businessHoursSlice.actions;
export default businessHoursSlice.reducer;

// Helper function to get business hours for a specific day of week
export const getBusinessHoursForDay = (
  dayOfWeek: number,
  businessHours: BusinessHours[],
): BusinessHours | null => {
  return businessHours.find((bh) => bh.day_of_week === dayOfWeek) || null;
};

// Helper function to check if a date is open
export const isDateOpen = (
  dateString: string,
  businessHours: BusinessHours[],
): boolean => {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = getBusinessHoursForDay(dayOfWeek, businessHours);
  return hours ? hours.is_open : false;
};
