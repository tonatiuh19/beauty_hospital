import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";
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

export const fetchAdminServices = createAsyncThunk(
  "services/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/services");
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar los servicios"),
      );
    }
  },
);

export const saveAdminService = createAsyncThunk(
  "services/saveAdmin",
  async (
    { id, values }: { id?: number; values: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      if (id) {
        await axios.put(`/admin/services/${id}`, values);
      } else {
        await axios.post("/admin/services", values);
      }
      return true;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo guardar el servicio"),
      );
    }
  },
);

export const uploadAdminFile = createAsyncThunk(
  "services/uploadAdminFile",
  async (
    { file, folder }: { file: File; folder: string },
    { rejectWithValue },
  ) => {
    try {
      const data_base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const { data } = await axios.post("/admin/uploads", {
        filename: file.name,
        content_type: file.type,
        data_base64,
        folder,
      });
      if (!data?.success || !data?.data?.url) {
        throw new Error(data?.message || "Upload failed");
      }
      return data.data as { url: string; pathname: string };
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo subir el archivo"),
      );
    }
  },
);

export const deleteAdminService = createAsyncThunk(
  "services/deleteAdmin",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/admin/services/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo eliminar el servicio"),
      );
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
      })
      .addCase(fetchAdminServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchAdminServices.rejected, (state, action) => {
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
