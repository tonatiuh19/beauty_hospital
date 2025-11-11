import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { Patient, setUser, clearUser, setLoading } from "./authSlice";

// API base URL
const API_URL = "/api/auth";

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
  exists: boolean;
  patient: Patient;
}

// Check if patient exists by email
export const checkUserExists = createAsyncThunk<
  CheckPatientResponse,
  { email: string }
>("auth/checkUser", async ({ email }, { rejectWithValue }) => {
  try {
    const response = await axios.post<CheckPatientResponse>(
      `${API_URL}/check-user`,
      { email },
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to check patient",
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
      `${API_URL}/send-code`,
      {
        patient_id,
        email,
      },
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to send verification code",
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
        `${API_URL}/verify-code`,
        {
          patient_id,
          code,
        },
      );

      if (response.data.success && response.data.patient) {
        // Store tokens in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        dispatch(setUser(response.data.patient));
        return response.data.patient;
      }

      throw new Error("Invalid response from server");
    } catch (error: any) {
      dispatch(setLoading(false));
      return rejectWithValue(
        error.response?.data?.message || "Failed to verify code",
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
      `${API_URL}/create-user`,
      patientData,
    );

    if (response.data.success && response.data.patient) {
      // Don't set patient yet, wait for verification code
      dispatch(setLoading(false));
      return response.data.patient;
    }

    throw new Error("Invalid response from server");
  } catch (error: any) {
    dispatch(setLoading(false));
    return rejectWithValue(
      error.response?.data?.message || "Failed to create patient",
    );
  }
});

// Logout
export const logout = createAsyncThunk<void, void>(
  "auth/logout",
  async (_, { dispatch }) => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    dispatch(clearUser());
  },
);
