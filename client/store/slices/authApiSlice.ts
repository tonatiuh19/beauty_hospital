import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { User, setUser, clearUser, setLoading } from "./authSlice";

// API base URL
const API_URL = "/api/auth";

// Response types
interface CheckUserResponse {
  success: boolean;
  exists: boolean;
  user?: User;
}

interface SendCodeResponse {
  success: boolean;
  message: string;
}

interface VerifyCodeResponse {
  success: boolean;
  user: User;
  token: string;
}

interface CreateUserResponse {
  success: boolean;
  exists: boolean;
  user: User;
}

// Check if user exists by email
export const checkUserExists = createAsyncThunk<
  CheckUserResponse,
  { email: string }
>("auth/checkUser", async ({ email }, { rejectWithValue }) => {
  try {
    const response = await axios.post<CheckUserResponse>(
      `${API_URL}/check-user`,
      { email },
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to check user",
    );
  }
});

// Send verification code to user's email
export const sendVerificationCode = createAsyncThunk<
  SendCodeResponse,
  { user_id: number; email: string }
>("auth/sendCode", async ({ user_id, email }, { rejectWithValue }) => {
  try {
    const response = await axios.post<SendCodeResponse>(
      `${API_URL}/send-code`,
      {
        user_id,
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
  User,
  { user_id: number; code: number }
>(
  "auth/verifyCode",
  async ({ user_id, code }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const response = await axios.post<VerifyCodeResponse>(
        `${API_URL}/verify-code`,
        {
          user_id,
          code,
        },
      );

      if (response.data.success && response.data.user) {
        // Store token in localStorage
        localStorage.setItem("token", response.data.token);
        dispatch(setUser(response.data.user));
        return response.data.user;
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

// Create a new user account
export const createNewUser = createAsyncThunk<
  User,
  {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth: string;
  }
>("auth/createUser", async (userData, { dispatch, rejectWithValue }) => {
  try {
    dispatch(setLoading(true));
    const response = await axios.post<CreateUserResponse>(
      `${API_URL}/create-user`,
      userData,
    );

    if (response.data.success && response.data.user) {
      // Don't set user yet, wait for verification code
      dispatch(setLoading(false));
      return response.data.user;
    }

    throw new Error("Invalid response from server");
  } catch (error: any) {
    dispatch(setLoading(false));
    return rejectWithValue(
      error.response?.data?.message || "Failed to create user",
    );
  }
});

// Logout
export const logout = createAsyncThunk<void, void>(
  "auth/logout",
  async (_, { dispatch }) => {
    localStorage.removeItem("token");
    dispatch(clearUser());
  },
);
