import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

interface PatientAppointment {
  id: number;
  service: {
    id: number;
    name: string;
    price: number;
    category: string;
  };
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
  booked_for_self: boolean;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  payment: {
    id: number;
    amount: number;
    status: string;
    method: string;
  } | null;
  contract_id?: number;
  contract_status?: string;
  is_past: boolean;
  is_upcoming: boolean;
  can_cancel: boolean;
  can_edit: boolean;
}

interface PatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface PatientAppointmentsState {
  appointments: PatientAppointment[];
  profile: PatientProfile | null;
  loading: boolean;
  profileLoading: boolean;
  downloadingContractId: number | null;
  error: string | null;
}

const initialState: PatientAppointmentsState = {
  appointments: [],
  profile: null,
  loading: false,
  profileLoading: false,
  downloadingContractId: null,
  error: null,
};

// Fetch patient appointments
export const fetchPatientAppointments = createAsyncThunk(
  "patientAppointments/fetchAppointments",
  async (patientId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/patient/appointments?patient_id=${patientId}`,
      );
      if (response.data.success) {
        return response.data.data.appointments || [];
      }
      return rejectWithValue("No se pudieron cargar las citas");
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "No se pudieron cargar las citas",
      );
    }
  },
);

// Fetch patient profile
export const fetchPatientProfile = createAsyncThunk(
  "patientAppointments/fetchProfile",
  async (patientId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/patient/profile?patient_id=${patientId}`,
      );
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue("No se pudo cargar el perfil");
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "No se pudo cargar el perfil",
      );
    }
  },
);

// Update patient profile
export const updatePatientProfile = createAsyncThunk(
  "patientAppointments/updateProfile",
  async (
    {
      patientId,
      updates,
    }: { patientId: number; updates: Partial<PatientProfile> },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.put(
        `/patient/profile?patient_id=${patientId}`,
        updates,
      );
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue("No se pudo actualizar el perfil");
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "No se pudo actualizar el perfil",
      );
    }
  },
);

// Download contract PDF
export const downloadContract = createAsyncThunk(
  "patientAppointments/downloadContract",
  async (
    {
      contractId,
      appointmentId,
    }: { contractId: number; appointmentId: number },
    { rejectWithValue },
  ) => {
    try {
      const token =
        localStorage.getItem("adminAccessToken") ||
        localStorage.getItem("accessToken");
      const response = await axios.get(
        `/admin/contracts/${contractId}/download`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: "blob",
        },
      );

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contrato-${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { contractId, appointmentId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "No se pudo descargar el contrato",
      );
    }
  },
);

// Cancel appointment
export const cancelAppointment = createAsyncThunk(
  "patientAppointments/cancelAppointment",
  async (
    {
      appointmentId,
      patientId,
      reason,
    }: { appointmentId: number; patientId: number; reason: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post(
        `/patient/appointments/${appointmentId}/cancel`,
        {
          patient_id: patientId,
          cancellation_reason: reason,
        },
      );
      if (response.data.success) {
        return appointmentId;
      }
      return rejectWithValue("No se pudo cancelar la cita");
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "No se pudo cancelar la cita",
      );
    }
  },
);

const patientAppointmentsSlice = createSlice({
  name: "patientAppointments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAppointments: (state) => {
      state.appointments = [];
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch appointments
      .addCase(fetchPatientAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchPatientAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch profile
      .addCase(fetchPatientProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchPatientProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchPatientProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload as string;
      })
      // Update profile
      .addCase(updatePatientProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updatePatientProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(updatePatientProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload as string;
      })
      // Download contract
      .addCase(downloadContract.pending, (state, action) => {
        state.downloadingContractId = action.meta.arg.contractId;
        state.error = null;
      })
      .addCase(downloadContract.fulfilled, (state) => {
        state.downloadingContractId = null;
      })
      .addCase(downloadContract.rejected, (state, action) => {
        state.downloadingContractId = null;
        state.error = action.payload as string;
      })
      // Cancel appointment
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.appointments = state.appointments.map((apt) =>
          apt.id === action.payload
            ? {
                ...apt,
                status: "cancelled",
                can_cancel: false,
                can_edit: false,
              }
            : apt,
        );
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetAppointments } =
  patientAppointmentsSlice.actions;
export default patientAppointmentsSlice.reducer;
