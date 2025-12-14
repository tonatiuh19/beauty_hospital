import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

// Define interfaces
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  service_name: string;
  scheduled_at: string;
  status: string;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  patient: Patient;
  doctor_id: number;
  doctor_name: string;
  appointment_id?: number;
  appointment?: Appointment;
  visit_date: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescriptions?: string;
  files?: string[];
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordFormData {
  patient_id: number | null;
  appointment_id?: number | null;
  visit_date: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescriptions?: string;
}

interface MedicalRecordsState {
  records: MedicalRecord[];
  patients: Patient[];
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  selectedRecord: MedicalRecord | null;
}

const initialState: MedicalRecordsState = {
  records: [],
  patients: [],
  appointments: [],
  loading: false,
  error: null,
  selectedRecord: null,
};

// Async thunks
export const fetchMedicalRecords = createAsyncThunk(
  "medicalRecords/fetchMedicalRecords",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/medical-records");
      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch medical records",
      );
    }
  },
);

export const fetchPatients = createAsyncThunk(
  "medicalRecords/fetchPatients",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/patients");
      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch patients",
      );
    }
  },
);

export const fetchAppointments = createAsyncThunk(
  "medicalRecords/fetchAppointments",
  async (patientId: number | undefined = undefined, { rejectWithValue }) => {
    try {
      const url = patientId
        ? `/admin/appointments?patient_id=${patientId}`
        : "/admin/appointments";
      const response = await axios.get(url);
      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch appointments",
      );
    }
  },
);

export const createMedicalRecord = createAsyncThunk(
  "medicalRecords/createMedicalRecord",
  async (recordData: MedicalRecordFormData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/admin/medical-records", recordData);
      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create medical record",
      );
    }
  },
);

export const updateMedicalRecord = createAsyncThunk(
  "medicalRecords/updateMedicalRecord",
  async (
    { id, data }: { id: number; data: MedicalRecordFormData },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.put(`/admin/medical-records/${id}`, data);
      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update medical record",
      );
    }
  },
);

export const deleteMedicalRecord = createAsyncThunk(
  "medicalRecords/deleteMedicalRecord",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/medical-records/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete medical record",
      );
    }
  },
);

// Create slice
const medicalRecordsSlice = createSlice({
  name: "medicalRecords",
  initialState,
  reducers: {
    selectRecord: (state, action: PayloadAction<MedicalRecord | null>) => {
      state.selectedRecord = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch medical records
      .addCase(fetchMedicalRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedicalRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchMedicalRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch patients
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = action.payload;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create medical record
      .addCase(createMedicalRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMedicalRecord.fulfilled, (state, action) => {
        state.loading = false;
        // You may need to refetch to get the complete record with patient details
      })
      .addCase(createMedicalRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update medical record
      .addCase(updateMedicalRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMedicalRecord.fulfilled, (state, action) => {
        state.loading = false;
        // You may need to refetch to get the complete updated record
      })
      .addCase(updateMedicalRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete medical record
      .addCase(deleteMedicalRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMedicalRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.records = state.records.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteMedicalRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectRecord, clearError } = medicalRecordsSlice.actions;
export default medicalRecordsSlice.reducer;
