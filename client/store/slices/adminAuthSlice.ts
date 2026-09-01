import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  employee_id?: string;
  specialization?: string;
}

interface AdminAuthState {
  step: "email" | "code";
  email: string;
  userId: number | null;
  userRole: string;
  userName: string;
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

function loadStoredAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem("adminUser");
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

const storedUser = loadStoredAdmin();

const initialState: AdminAuthState = {
  step: "email",
  email: "",
  userId: null,
  userRole: "",
  userName: "",
  user: storedUser,
  loading: false,
  error: null,
  success: null,
};

export const checkAdminUser = createAsyncThunk(
  "adminAuth/checkUser",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await axios.post("/admin/auth/check-user", { email });
      if (response.data.success && response.data.exists) {
        return { email, user: response.data.user };
      }
      return rejectWithValue(
        "No se encontró una cuenta de administrador con este correo electrónico",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al procesar la solicitud"),
      );
    }
  },
);

export const sendAdminCode = createAsyncThunk(
  "adminAuth/sendCode",
  async (
    { userId, email }: { userId: number; email: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post("/admin/auth/send-code", {
        user_id: userId,
        email,
      });
      if (response.data.success) {
        return email;
      }
      return rejectWithValue(
        response.data.message || "Error al enviar el código",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al enviar el código"),
      );
    }
  },
);

export const startAdminLogin = createAsyncThunk(
  "adminAuth/startLogin",
  async (email: string, { dispatch, rejectWithValue }) => {
    const check = await dispatch(checkAdminUser(email));
    if (checkAdminUser.rejected.match(check)) {
      return rejectWithValue(check.payload);
    }
    const user = check.payload.user;
    const send = await dispatch(
      sendAdminCode({ userId: user.id, email }),
    );
    if (sendAdminCode.rejected.match(send)) {
      return rejectWithValue(send.payload);
    }
    return { email, user };
  },
);

export const verifyAdminCode = createAsyncThunk(
  "adminAuth/verifyCode",
  async (
    { userId, code }: { userId: number; code: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post("/admin/auth/verify-code", {
        user_id: userId,
        code,
      });
      if (response.data.success) {
        localStorage.setItem("adminAccessToken", response.data.accessToken);
        localStorage.setItem("adminRefreshToken", response.data.refreshToken);
        localStorage.setItem("adminUser", JSON.stringify(response.data.user));
        return response.data.user as AdminUser;
      }
      return rejectWithValue(response.data.message || "Código inválido");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Código inválido. Por favor, verifica e intenta de nuevo."),
      );
    }
  },
);

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    resetAdminLogin: (state) => {
      state.step = "email";
      state.error = null;
      state.success = null;
    },
    clearAdminAuthError: (state) => {
      state.error = null;
      state.success = null;
    },
    logoutAdmin: (state) => {
      localStorage.removeItem("adminAccessToken");
      localStorage.removeItem("adminRefreshToken");
      localStorage.removeItem("adminUser");
      state.user = null;
      state.step = "email";
      state.userId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startAdminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(startAdminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.step = "code";
        state.email = action.payload.email;
        state.userId = action.payload.user.id;
        state.userRole = action.payload.user.role;
        state.userName = `${action.payload.user.first_name} ${action.payload.user.last_name}`;
        state.success = `Código de verificación enviado a ${action.payload.email}`;
      })
      .addCase(startAdminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyAdminCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAdminCode.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(verifyAdminCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAdminLogin, clearAdminAuthError, logoutAdmin } =
  adminAuthSlice.actions;
export default adminAuthSlice.reducer;
