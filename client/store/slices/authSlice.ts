import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// User type
export interface User {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  last_login: string | null;
}

// Auth state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

// Create the auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      // Remove user from localStorage
      localStorage.removeItem("user");
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    restoreUser: (state) => {
      // Restore user from localStorage on app init
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          state.user = JSON.parse(storedUser);
          state.isAuthenticated = true;
        } catch (error) {
          console.error("Error restoring user from localStorage:", error);
          localStorage.removeItem("user");
        }
      }
    },
  },
});

// Export actions
export const { setUser, clearUser, setLoading, restoreUser } =
  authSlice.actions;

// Export reducer
export default authSlice.reducer;
