import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";

export const fetchAdminPayments = createAsyncThunk(
  "payments/fetchAll",
  async (
    params: {
      search?: string;
      status?: string;
      payment_method?: string;
      page?: number;
      limit?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.get("/admin/payments", { params });
      if (response.data.success) {
        return {
          payments: response.data.data || [],
          totalPages: response.data.pagination?.totalPages || 1,
        };
      }
      return rejectWithValue("No se pudieron cargar los pagos");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar los pagos"),
      );
    }
  },
);

export const fetchPaymentStats = createAsyncThunk(
  "payments/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/payments/stats");
      if (response.data.success) return response.data.data;
      return rejectWithValue("No se pudieron cargar las estadísticas");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar las estadísticas"),
      );
    }
  },
);

export const processPaymentRefund = createAsyncThunk(
  "payments/refund",
  async (
    {
      paymentId,
      amount,
      reason,
    }: { paymentId: number; amount: number; reason: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post(`/admin/payments/${paymentId}/refund`, {
        amount,
        reason,
      });
      if (response.data.success) return response.data;
      return rejectWithValue(
        response.data.message || "Error al procesar reembolso",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al procesar reembolso"),
      );
    }
  },
);

export const fetchAppointmentsByPatient = createAsyncThunk(
  "payments/appointmentsByPatient",
  async (patientId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/appointments", {
        params: { patient_id: patientId, limit: 30 },
      });
      const rows = response.data.data || [];
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar las citas"),
      );
    }
  },
);

export const createAdminPayment = createAsyncThunk(
  "payments/create",
  async (
    payload: {
      patient_id?: number;
      appointment_id?: number | null;
      amount: number;
      payment_method: string;
      notes?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post("/admin/payments", payload);
      if (response.data.success) return response.data.data;
      return rejectWithValue(
        response.data.message || "Error al registrar pago",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al registrar pago"),
      );
    }
  },
);

export const approvePaymentRefund = createAsyncThunk(
  "payments/approveRefund",
  async (paymentId: number, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/admin/payments/${paymentId}/approve-refund`,
        {},
      );
      if (response.data.success) return response.data;
      return rejectWithValue(
        response.data.message || "Error al aprobar reembolso",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al aprobar reembolso"),
      );
    }
  },
);

interface PaymentsState {
  payments: any[];
  stats: any | null;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: PaymentsState = {
  payments: [],
  stats: null,
  totalPages: 1,
  loading: false,
  error: null,
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminPayments.rejected, (state, action) => {
        state.loading = false;
        state.payments = [];
        state.error = action.payload as string;
      })
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(createAdminPayment.fulfilled, (state, action) => {
        if (action.payload) {
          state.payments = [action.payload, ...state.payments];
        }
      });
  },
});

export default paymentsSlice.reducer;
