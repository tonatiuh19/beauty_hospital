import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";

export const fetchCalendarAppointments = createAsyncThunk(
  "calendar/fetchAppointments",
  async (
    { start_date, end_date }: { start_date: string; end_date: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.get("/admin/dashboard/calendar", {
        params: { start_date, end_date },
      });
      if (response.data.success) return response.data.data;
      return rejectWithValue("No se pudieron cargar las citas");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar las citas"),
      );
    }
  },
);

export const searchAdminPatients = createAsyncThunk(
  "calendar/searchPatients",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/patients", {
        params: { search: query, limit: 10 },
      });
      if (response.data.success) {
        return (response.data.data || []).map((p: any) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
          phone: p.phone,
        }));
      }
      return rejectWithValue("No se pudieron buscar pacientes");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron buscar pacientes"),
      );
    }
  },
);

export const fetchAppointmentPaymentInfo = createAsyncThunk(
  "calendar/paymentInfo",
  async (appointmentId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/admin/appointments/${appointmentId}/payment-info`,
      );
      if (response.data.success) return response.data;
      return rejectWithValue("No se pudo cargar la información de pago");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo cargar la información de pago"),
      );
    }
  },
);

export const rescheduleAdminAppointment = createAsyncThunk(
  "calendar/reschedule",
  async (
    {
      id,
      appointment_date,
      appointment_time,
      notes,
    }: {
      id: number;
      appointment_date: string;
      appointment_time: string;
      notes?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post(`/admin/appointments/${id}/reschedule`, {
        appointment_date,
        appointment_time,
        notes,
      });
      if (response.data.success) return response.data;
      return rejectWithValue(
        response.data.message || "No se pudo reprogramar la cita.",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo reprogramar la cita."),
      );
    }
  },
);

export const cancelAdminAppointment = createAsyncThunk(
  "calendar/cancel",
  async (
    {
      id,
      cancellation_reason,
      refund,
    }: { id: number; cancellation_reason?: string; refund?: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post(`/admin/appointments/${id}/cancel`, {
        cancellation_reason,
        refund,
      });
      if (response.data.success) return response.data;
      return rejectWithValue(
        response.data.message || "No se pudo cancelar la cita.",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo cancelar la cita."),
      );
    }
  },
);

export const generateCheckInQr = createAsyncThunk(
  "calendar/generateQr",
  async (appointmentId: number, { rejectWithValue }) => {
    try {
      const response = await axios.post("/check-in/generate-token", {
        appointment_id: appointmentId,
      });
      if (response.data.success) return response.data.data;
      return rejectWithValue(
        response.data.message || "Error al generar código QR",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo generar el código QR"),
      );
    }
  },
);

export const createManualAppointment = createAsyncThunk(
  "calendar/createManual",
  async (payload: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
      const response = await axios.post("/admin/appointments/manual", {
        ...payload,
        created_by: adminUser?.id || null,
      });
      if (response.data.success) return response.data;
      return rejectWithValue(
        response.data.message || "Error al crear cita",
      );
    } catch (error) {
      return rejectWithValue(formatAxiosError(error, "Error al crear cita"));
    }
  },
);

export const updateAdminAppointmentStatus = createAsyncThunk(
  "calendar/updateStatus",
  async (
    { id, status }: { id: number; status: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.patch(
        `/admin/appointments/${id}/status`,
        { status },
      );
      if (response.data.success) return { id, status };
      return rejectWithValue(
        response.data.message || "Error al actualizar el estado",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al actualizar el estado"),
      );
    }
  },
);

export const checkInAdminAppointment = createAsyncThunk(
  "calendar/checkIn",
  async (appointmentId: number, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/admin/appointments/${appointmentId}/check-in`,
        {},
      );
      if (response.data.success) return appointmentId;
      return rejectWithValue(
        response.data.message || "Error during check-in",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error during check-in"),
      );
    }
  },
);

interface CalendarState {
  appointments: any[];
  patients: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  appointments: [],
  patients: [],
  loading: false,
  error: null,
};

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    clearCalendarPatients: (state) => {
      state.patients = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendarAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCalendarAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchCalendarAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchAdminPatients.fulfilled, (state, action) => {
        state.patients = action.payload;
      })
      .addCase(updateAdminAppointmentStatus.fulfilled, (state, action) => {
        const apt = state.appointments.find((a) => a.id === action.payload.id);
        if (apt) apt.status = action.payload.status;
      });
  },
});

export const { clearCalendarPatients } = calendarSlice.actions;
export default calendarSlice.reducer;
