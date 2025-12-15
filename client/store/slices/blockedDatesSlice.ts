import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { BlockedDate } from "@shared/database";
import type { ApiResponse, PaginatedResponse } from "@shared/api";
import axios from "@/lib/axios";
import { withRetry, getUserFriendlyErrorMessage } from "@/lib/axios-retry";

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
  async (
    params: { start_date?: string; end_date?: string } | undefined,
    { rejectWithValue },
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date)
        queryParams.append("start_date", params.start_date);
      if (params?.end_date) queryParams.append("end_date", params.end_date);

      const response = await withRetry(
        () =>
          axios.get<ApiResponse<PaginatedResponse<BlockedDate>>>(
            `/blocked-dates?${queryParams.toString()}`,
          ),
        { maxRetries: 3, initialDelay: 1000 },
      );

      if (response.data.success && response.data.data) {
        return response.data.data.items;
      }
      throw new Error("Failed to fetch blocked dates");
    } catch (error) {
      return rejectWithValue(getUserFriendlyErrorMessage(error));
    }
  },
);

// Check if a date is blocked
export const checkDateBlocked = createAsyncThunk(
  "blockedDates/checkDateBlocked",
  async (date: string, { rejectWithValue }) => {
    try {
      const response = await withRetry(
        () =>
          axios.get<ApiResponse<{ blocked: boolean }>>(
            `/blocked-dates/check?date=${date}`,
          ),
        { maxRetries: 3, initialDelay: 1000 },
      );

      if (response.data.success && response.data.data) {
        return { date, blocked: response.data.data.blocked };
      }
      throw new Error("Failed to check blocked date");
    } catch (error) {
      return rejectWithValue(getUserFriendlyErrorMessage(error));
    }
  },
);

// Admin: Fetch all blocked dates
export const fetchAdminBlockedDates = createAsyncThunk(
  "blockedDates/fetchAdminBlockedDates",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get<
        ApiResponse<PaginatedResponse<BlockedDate>>
      >("/admin/blocked-dates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        return response.data.data.items;
      }
      throw new Error("Failed to fetch blocked dates");
    } catch (error) {
      return rejectWithValue(getUserFriendlyErrorMessage(error));
    }
  },
);

// Admin: Create blocked date
export const createBlockedDate = createAsyncThunk(
  "blockedDates/createBlockedDate",
  async (
    data: {
      start_date: string;
      end_date: string;
      start_time?: string | null;
      end_time?: string | null;
      all_day: boolean;
      reason?: string;
      notes?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
      const created_by = adminUser?.id || null;

      const response = await axios.post<ApiResponse<BlockedDate>>(
        "/admin/blocked-dates",
        { ...data, created_by },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to create blocked date");
    } catch (error) {
      return rejectWithValue(getUserFriendlyErrorMessage(error));
    }
  },
);

// Admin: Update blocked date
export const updateBlockedDate = createAsyncThunk(
  "blockedDates/updateBlockedDate",
  async (
    {
      id,
      data,
    }: {
      id: number;
      data: {
        start_date: string;
        end_date: string;
        start_time?: string | null;
        end_time?: string | null;
        all_day: boolean;
        reason?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.put<ApiResponse<BlockedDate>>(
        `/admin/blocked-dates/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to update blocked date");
    } catch (error) {
      return rejectWithValue(getUserFriendlyErrorMessage(error));
    }
  },
);

// Admin: Delete blocked date
export const deleteBlockedDate = createAsyncThunk(
  "blockedDates/deleteBlockedDate",
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.delete(`/admin/blocked-dates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (error) {
      return rejectWithValue(getUserFriendlyErrorMessage(error));
    }
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
      state.error =
        (action.payload as string) || "Failed to fetch blocked dates";
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
      state.error =
        (action.payload as string) || "Failed to check blocked date";
    });

    // Admin: Fetch blocked dates
    builder.addCase(fetchAdminBlockedDates.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAdminBlockedDates.fulfilled, (state, action) => {
      state.loading = false;
      state.blockedDates = action.payload;
    });
    builder.addCase(fetchAdminBlockedDates.rejected, (state, action) => {
      state.loading = false;
      state.error =
        (action.payload as string) || "Failed to fetch blocked dates";
    });

    // Admin: Create blocked date
    builder.addCase(createBlockedDate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBlockedDate.fulfilled, (state, action) => {
      state.loading = false;
      state.blockedDates.push(action.payload);
    });
    builder.addCase(createBlockedDate.rejected, (state, action) => {
      state.loading = false;
      state.error =
        (action.payload as string) || "Failed to create blocked date";
    });

    // Admin: Update blocked date
    builder.addCase(updateBlockedDate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateBlockedDate.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.blockedDates.findIndex(
        (d) => d.id === action.payload.id,
      );
      if (index !== -1) {
        state.blockedDates[index] = action.payload;
      }
    });
    builder.addCase(updateBlockedDate.rejected, (state, action) => {
      state.loading = false;
      state.error =
        (action.payload as string) || "Failed to update blocked date";
    });

    // Admin: Delete blocked date
    builder.addCase(deleteBlockedDate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteBlockedDate.fulfilled, (state, action) => {
      state.loading = false;
      state.blockedDates = state.blockedDates.filter(
        (d) => d.id !== action.payload,
      );
    });
    builder.addCase(deleteBlockedDate.rejected, (state, action) => {
      state.loading = false;
      state.error =
        (action.payload as string) || "Failed to delete blocked date";
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
