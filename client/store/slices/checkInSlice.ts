import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";

export interface CheckInAppointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  service_name: string;
  service_price: number;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  check_in_at: string | null;
}

export const validateCheckInToken = createAsyncThunk(
  "checkIn/validate",
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/check-in/validate/${token}`);
      if (response.data.success) {
        return {
          appointment: response.data.data.appointment as CheckInAppointment,
          contractTerms:
            response.data.data.contract_terms ||
            "Términos y condiciones del servicio.",
        };
      }
      return rejectWithValue(
        response.data.message || "No se pudo validar el token",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(
          error,
          "Token expirado o inválido. Por favor, solicite un nuevo código QR.",
        ),
      );
    }
  },
);

export const completeCheckIn = createAsyncThunk(
  "checkIn/complete",
  async (
    payload: {
      token: string;
      signature_data: string;
      terms_accepted: boolean;
      pdf_base64: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post("/check-in/complete", payload);
      if (response.data.success) return true;
      return rejectWithValue(
        response.data.message || "Error al procesar el check-in",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al procesar el check-in"),
      );
    }
  },
);

interface CheckInState {
  appointment: CheckInAppointment | null;
  contractTerms: string;
  loading: boolean;
  submitting: boolean;
  success: boolean;
  error: string | null;
}

const initialState: CheckInState = {
  appointment: null,
  contractTerms: "",
  loading: false,
  submitting: false,
  success: false,
  error: null,
};

const checkInSlice = createSlice({
  name: "checkIn",
  initialState,
  reducers: {
    resetCheckIn: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateCheckInToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateCheckInToken.fulfilled, (state, action) => {
        state.loading = false;
        state.appointment = action.payload.appointment;
        state.contractTerms = action.payload.contractTerms;
      })
      .addCase(validateCheckInToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(completeCheckIn.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(completeCheckIn.fulfilled, (state) => {
        state.submitting = false;
        state.success = true;
      })
      .addCase(completeCheckIn.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetCheckIn } = checkInSlice.actions;
export default checkInSlice.reducer;
