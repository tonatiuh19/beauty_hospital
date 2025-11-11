import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { BlockedDate } from "@shared/database";
import type { ApiResponse, PaginatedResponse } from "@shared/api";
import axios from "@/lib/axios";

interface BlockedDatesState {
  blockedDates: BlockedDate[];
  loading: boolean;
  error: string | null;
}

const initialState: BlockedDatesState = {
  blockedDates: [],
  loading: false,
  error: null,
};

// Fetch blocked dates (public)
export const fetchBlockedDates = createAsyncThunk(
  "blockedDates/fetchBlockedDates",
  async (params?: { start_date?: string; end_date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);

    const response = await axios.get<
      ApiResponse<PaginatedResponse<BlockedDate>>
    >(`/blocked-dates?${queryParams.toString()}`);

    if (response.data.success && response.data.data) {
      return response.data.data.items;
    }
    throw new Error("Failed to fetch blocked dates");
  },
);

// Check if a date is blocked
export const checkDateBlocked = createAsyncThunk(
  "blockedDates/checkDateBlocked",
  async (date: string) => {
    const response = await axios.get<ApiResponse<{ blocked: boolean }>>(
      `/blocked-dates/check?date=${date}`,
    );

    if (response.data.success && response.data.data) {
      return { date, blocked: response.data.data.blocked };
    }
    throw new Error("Failed to check blocked date");
  },
);

const blockedDatesSlice = createSlice({
  name: "blockedDates",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch blocked dates
    builder.addCase(fetchBlockedDates.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBlockedDates.fulfilled, (state, action) => {
      state.loading = false;
      state.blockedDates = action.payload;
    });
    builder.addCase(fetchBlockedDates.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch blocked dates";
    });

    // Check date blocked
    builder.addCase(checkDateBlocked.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(checkDateBlocked.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(checkDateBlocked.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to check blocked date";
    });
  },
});

export const { clearError } = blockedDatesSlice.actions;
export default blockedDatesSlice.reducer;

// Helper function to check if a date is in blocked dates array
export const isDateBlocked = (
  date: string,
  blockedDates: BlockedDate[],
): boolean => {
  const [year, month, day] = date.split("-").map(Number);
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

    return checkDate >= startDate && checkDate <= endDate;
  });
};

// Helper function to check if a specific time on a date is blocked
export const isTimeBlocked = (
  date: string,
  time: string,
  blockedDates: BlockedDate[],
): { blocked: boolean; reason?: string; blockInfo?: BlockedDate } => {
  const [year, month, day] = date.split("-").map(Number);
  const checkDate = new Date(year, month - 1, day);
  checkDate.setHours(0, 0, 0, 0);

  for (const blocked of blockedDates) {
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

    // Check if date is in range
    if (checkDate >= startDate && checkDate <= endDate) {
      // If all_day block, time is blocked
      if (blocked.all_day) {
        return { blocked: true, reason: blocked.reason, blockInfo: blocked };
      }

      // Check if time falls within blocked time range
      if (blocked.start_time && blocked.end_time) {
        if (time >= blocked.start_time && time < blocked.end_time) {
          return { blocked: true, reason: blocked.reason, blockInfo: blocked };
        }
      }
    }
  }

  return { blocked: false };
};

// Helper function to get all blocked times for a specific date
export const getBlockedTimesForDate = (
  date: string,
  blockedDates: BlockedDate[],
): Array<{
  start_time: string;
  end_time: string;
  reason?: string;
  all_day: boolean;
}> => {
  // Parse the date string as YYYY-MM-DD
  const [year, month, day] = date.split("-").map(Number);
  const checkDate = new Date(year, month - 1, day);
  checkDate.setHours(0, 0, 0, 0);

  const blockedTimes: Array<{
    start_time: string;
    end_time: string;
    reason?: string;
    all_day: boolean;
  }> = [];

  blockedDates.forEach((blocked) => {
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

    if (checkDate >= startDate && checkDate <= endDate) {
      blockedTimes.push({
        start_time: blocked.start_time || "00:00:00",
        end_time: blocked.end_time || "23:59:59",
        reason: blocked.reason,
        all_day: blocked.all_day,
      });
    }
  });

  return blockedTimes;
};
