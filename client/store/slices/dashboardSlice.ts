import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";

export interface DashboardMetrics {
  period: {
    start_date: string;
    end_date: string;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    no_show: number;
    scheduled: number;
  };
  revenue: {
    total_revenue: number;
    total_refunds: number;
    pending_amount: number;
  };
  patients: {
    new_patients: number;
  };
  contracts: {
    active_contracts: number;
  };
  topServices: Array<{
    name: string;
    category: string;
    bookings: number;
    revenue: number;
  }>;
  upcomingToday: number;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  transactions: number;
}

export interface DashboardActivity {
  entity_id: number;
  patient_id?: number;
  action: string;
  entity_type: string;
  description: string;
  created_at: string;
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  revenueChart: RevenueChartPoint[];
  activity: DashboardActivity[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  metrics: null,
  revenueChart: [],
  activity: [],
  loading: false,
  error: null,
};

export const fetchDashboardMetrics = createAsyncThunk(
  "dashboard/fetchMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/dashboard/metrics");
      if (response.data.success) return response.data.data as DashboardMetrics;
      return rejectWithValue("No se pudieron cargar las métricas");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar las métricas"),
      );
    }
  },
);

export const fetchRecentActivity = createAsyncThunk<
  DashboardActivity[],
  void
>(
  "dashboard/fetchActivity",
  async (_, { rejectWithValue }) => {
    const take = 12;
    try {
      const response = await axios.get(
        `/admin/dashboard/activity?limit=${take}`,
      );
      if (response.data.success)
        return (response.data.data || []) as DashboardActivity[];
      return rejectWithValue("No se pudo cargar la actividad reciente");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo cargar la actividad reciente"),
      );
    }
  },
);

export const fetchRevenueChart = createAsyncThunk(
  "dashboard/fetchRevenueChart",
  async (period: "week" | "month" | "year", { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/admin/dashboard/revenue-chart?period=${period}`,
      );
      if (response.data.success)
        return response.data.data as RevenueChartPoint[];
      return rejectWithValue("No se pudo cargar el gráfico de ingresos");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo cargar el gráfico de ingresos"),
      );
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRevenueChart.fulfilled, (state, action) => {
        state.revenueChart = action.payload;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.activity = action.payload;
      })
      .addCase(fetchRecentActivity.rejected, (state) => {
        state.activity = [];
      });
  },
});

export default dashboardSlice.reducer;
