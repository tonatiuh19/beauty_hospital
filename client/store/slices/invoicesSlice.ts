import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";

export const fetchAdminInvoices = createAsyncThunk(
  "invoices/fetchAll",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.get("/admin/invoices", { params });
      return {
        items: response.data.data.items,
        totalPages: response.data.data.pagination.totalPages,
      };
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar las solicitudes de factura"),
      );
    }
  },
);

export const fetchInvoiceStats = createAsyncThunk(
  "invoices/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/invoices/stats");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar las estadísticas"),
      );
    }
  },
);

export const updateInvoiceRequest = createAsyncThunk(
  "invoices/update",
  async (
    { id, data }: { id: number; data: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      await axios.patch(`/admin/invoices/${id}`, data);
      return { id, data };
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo actualizar la solicitud de factura"),
      );
    }
  },
);

interface InvoicesState {
  invoices: any[];
  stats: any | null;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: InvoicesState = {
  invoices: [],
  stats: null,
  totalPages: 1,
  loading: false,
  error: null,
};

const invoicesSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.items;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchInvoiceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export default invoicesSlice.reducer;
