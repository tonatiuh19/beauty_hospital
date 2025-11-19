import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { Service } from "@shared/database";
import { GetServicesResponse } from "@shared/api";
import { withRetry, getUserFriendlyErrorMessage } from "@/lib/axios-retry";

// Define the state interface
interface ServicesState {
  services: Service[];
  loading: boolean;
  error: string | null;
  selectedService: Service | null;
}

// Initial state
const initialState: ServicesState = {
  services: [],
  loading: false,
  error: null,
  selectedService: null,
};

// Async thunk for fetching services
export const fetchServices = createAsyncThunk(
  "services/fetchServices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await withRetry(
        () => axios.get<GetServicesResponse>("/services"),
        { maxRetries: 3, initialDelay: 1000 },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to fetch services");
    } catch (error: any) {
      return rejectWithValue(getUserFriendlyErrorMessage(error));
    }
  },
);

// Create the slice
const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    // Action to select a service
    selectService: (state, action: PayloadAction<number>) => {
      const service = state.services.find((s) => s.id === action.payload);
      state.selectedService = service || null;
    },
    // Action to clear selected service
    clearSelectedService: (state) => {
      state.selectedService = null;
    },
    // Action to clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchServices pending
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle fetchServices fulfilled
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
        state.error = null;
      })
      // Handle fetchServices rejected
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { selectService, clearSelectedService, clearError } =
  servicesSlice.actions;

// Export reducer
export default servicesSlice.reducer;
