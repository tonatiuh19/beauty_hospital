import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as Yup from "yup";
import axios, { formatAxiosError } from "@/lib/axios";

export const newPatientSchema = Yup.object({
  first_name: Yup.string().trim().required("Nombre requerido"),
  last_name: Yup.string().trim().required("Apellido requerido"),
  email: Yup.string().email("Email inválido").required("Email requerido"),
  phone: Yup.string().trim().required("Teléfono requerido"),
});

export type NewPatientValues = Yup.InferType<typeof newPatientSchema>;

export const fetchAdminPatients = createAsyncThunk(
  "patients/fetchAll",
  async (
    params: { search?: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.get("/admin/patients", { params });
      if (response.data.success) {
        return {
          patients: response.data.data || [],
          totalPages: response.data.pagination?.totalPages || 1,
        };
      }
      return rejectWithValue("No se pudieron cargar los pacientes");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar los pacientes"),
      );
    }
  },
);

export const fetchAdminPatientById = createAsyncThunk(
  "patients/fetchById",
  async (patientId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/admin/patients/${patientId}`);
      if (response.data.success) {
        const appointments = (response.data.data.appointments || []).map(
          (a: Record<string, unknown>) => ({
            ...a,
            scheduled_date:
              a.appointment_date_formatted || a.scheduled_date || a.scheduled_at,
            scheduled_time:
              a.appointment_time_formatted || a.scheduled_time,
          }),
        );
        const contracts = (response.data.data.contracts || []).map(
          (c: Record<string, unknown>) => ({
            ...c,
            total_sessions: c.sessions_included ?? c.total_sessions,
            completed_sessions: c.sessions_completed ?? c.completed_sessions,
          }),
        );
        return {
          patient: {
            ...response.data.data.patient,
            appointments,
            payments: response.data.data.payments || [],
            medical_records: response.data.data.medicalRecords || [],
            contracts,
          },
          raw: response.data.data.patient,
        };
      }
      return rejectWithValue("No se pudo cargar el paciente");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudo cargar el paciente"),
      );
    }
  },
);

export const createAdminPatient = createAsyncThunk(
  "patients/create",
  async (data: NewPatientValues, { rejectWithValue }) => {
    try {
      const response = await axios.post("/admin/patients", data);
      if (response.data.success) return response.data.data;
      return rejectWithValue(
        response.data.message || "Error al crear paciente",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al crear paciente"),
      );
    }
  },
);

export const updateAdminPatient = createAsyncThunk(
  "patients/update",
  async (
    { id, data }: { id: number; data: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.patch(`/admin/patients/${id}`, data);
      if (response.data.success) return response.data;
      return rejectWithValue(
        response.data.message || "Error al actualizar paciente",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al actualizar paciente"),
      );
    }
  },
);

export const togglePatientActive = createAsyncThunk(
  "patients/toggleActive",
  async (patientId: number, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `/admin/patients/${patientId}/toggle-active`,
        {},
      );
      if (response.data.success) return patientId;
      return rejectWithValue(
        response.data.message || "Error al cambiar estado",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al cambiar estado"),
      );
    }
  },
);

export const addPatientMedicalRecord = createAsyncThunk(
  "patients/addMedicalRecord",
  async (
    {
      patientId,
      record,
    }: { patientId: number; record: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
      const response = await axios.post(
        `/admin/patients/${patientId}/medical-records`,
        { ...record, doctor_id: adminUser?.id || null },
      );
      if (response.data.success) return response.data;
      return rejectWithValue(
        response.data.message || "Error al agregar registro médico",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al agregar registro médico"),
      );
    }
  },
);

interface PatientsState {
  patients: any[];
  selectedPatient: any | null;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: PatientsState = {
  patients: [],
  selectedPatient: null,
  totalPages: 1,
  loading: false,
  error: null,
};

const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = action.payload.patients;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminPatients.rejected, (state, action) => {
        state.loading = false;
        state.patients = [];
        state.error = action.payload as string;
      })
      .addCase(createAdminPatient.fulfilled, (state, action) => {
        if (action.payload) {
          state.patients = [action.payload, ...state.patients];
        }
      })
      .addCase(fetchAdminPatientById.fulfilled, (state, action) => {
        state.selectedPatient = action.payload.patient;
      });
  },
});

export const { clearSelectedPatient } = patientsSlice.actions;
export default patientsSlice.reducer;
