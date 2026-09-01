import { createAsyncThunk } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";
import { Patient, setUser, clearUser, setLoading } from "./authSlice";

// Response types
interface CheckPatientResponse {
  success: boolean;
  exists: boolean;
  patient?: Patient;
}

interface SendCodeResponse {
  success: boolean;
  message: string;
}

interface VerifyCodeResponse {
  success: boolean;
  patient: Patient;
  token: string;
  refreshToken: string;
}

interface CreatePatientResponse {
  success: boolean;
  message?: string;
  data?: Patient;
}

// Check if patient exists by email
export const checkUserExists = createAsyncThunk<
  CheckPatientResponse,
  { email: string }
>("auth/checkUser", async ({ email }, { rejectWithValue }) => {
  try {
    const response = await axios.post<CheckPatientResponse>(
      "/auth/check-user",
      { email },
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(
      formatAxiosError(error, "Failed to check patient"),
    );
  }
});

// Send verification code to patient's email
export const sendVerificationCode = createAsyncThunk<
  SendCodeResponse,
  { patient_id: number; email: string }
>("auth/sendCode", async ({ patient_id, email }, { rejectWithValue }) => {
  try {
    const response = await axios.post<SendCodeResponse>(
      "/auth/send-code",
      {
        patient_id,
        email,
      },
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(
      formatAxiosError(error, "Failed to send verification code"),
    );
  }
});

// Verify the code and log in
export const verifyLoginCode = createAsyncThunk<
  Patient,
  { patient_id: number; code: number }
>(
  "auth/verifyCode",
  async ({ patient_id, code }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const response = await axios.post<VerifyCodeResponse>(
        "/auth/verify-code",
        {
          patient_id,
          code,
        },
      );

      if (response.data.success && response.data.patient) {
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        dispatch(setUser(response.data.patient));
        return response.data.patient;
      }

      throw new Error("Invalid response from server");
    } catch (error) {
      dispatch(setLoading(false));
      return rejectWithValue(
        formatAxiosError(error, "Failed to verify code"),
      );
    }
  },
);

// Create a new patient account
export const createNewUser = createAsyncThunk<
  Patient,
  {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth?: string;
  }
>("auth/createUser", async (patientData, { dispatch, rejectWithValue }) => {
  try {
    dispatch(setLoading(true));
    const response = await axios.post<CreatePatientResponse>(
      "/auth/create-user",
      patientData,
    );

    if (response.data.success && response.data.data) {
      dispatch(setLoading(false));
      return response.data.data;
    }

    throw new Error(response.data.message || "Invalid response from server");
  } catch (error) {
    dispatch(setLoading(false));
    return rejectWithValue(
      formatAxiosError(error, "Failed to create patient"),
    );
  }
});

// Logout
export const logout = createAsyncThunk<void, void>(
  "auth/logout",
  async (_, { dispatch }) => {
    dispatch(clearUser());
  },
);
