import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";

export const fetchCoupons = createAsyncThunk(
  "settings/fetchCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/settings/coupons");
      if (response.data.success) return response.data.data.items || [];
      return rejectWithValue("No se pudieron cargar los cupones");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar los cupones"),
      );
    }
  },
);

export const saveCoupon = createAsyncThunk(
  "settings/saveCoupon",
  async (
    {
      id,
      payload,
    }: { id?: number; payload: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      const body = { ...payload };
      if (id) {
        await axios.put(`/admin/settings/coupons/${id}`, body);
      } else {
        await axios.post("/admin/settings/coupons", body);
      }
      return true;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al guardar cupón"),
      );
    }
  },
);

export const deleteCoupon = createAsyncThunk(
  "settings/deleteCoupon",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/admin/settings/coupons/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al eliminar cupón"),
      );
    }
  },
);

export const fetchSettings = createAsyncThunk(
  "settings/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/settings");
      if (response.data.success) return response.data.data || {};
      return rejectWithValue("No se pudieron cargar las configuraciones");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar las configuraciones"),
      );
    }
  },
);

export const updateSetting = createAsyncThunk(
  "settings/updateSetting",
  async (
    { key, value }: { key: string; value: unknown },
    { rejectWithValue },
  ) => {
    try {
      await axios.put(`/admin/settings/${key}`, { setting_value: value });
      return { key, value };
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al actualizar"),
      );
    }
  },
);

export const fetchContentPages = createAsyncThunk(
  "settings/fetchPages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/settings/content-pages");
      if (response.data.success) return response.data.data || [];
      return rejectWithValue("No se pudieron cargar las páginas");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar las páginas"),
      );
    }
  },
);

export const saveContentPage = createAsyncThunk(
  "settings/savePage",
  async (
    { id, payload }: { id?: number; payload: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      if (id) {
        await axios.put(`/admin/settings/content-pages/${id}`, payload);
      } else {
        await axios.post("/admin/settings/content-pages", payload);
      }
      return true;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al guardar página"),
      );
    }
  },
);

export const fetchAdminBusinessHours = createAsyncThunk(
  "settings/fetchHours",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/settings/business-hours");
      if (response.data.success) return response.data.data || [];
      return rejectWithValue("No se pudieron cargar los horarios");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar los horarios"),
      );
    }
  },
);

export const saveAdminBusinessHours = createAsyncThunk(
  "settings/saveHours",
  async (hours: Record<string, unknown>[], { rejectWithValue }) => {
    try {
      await axios.post("/admin/settings/business-hours", { hours });
      return hours;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al guardar horarios"),
      );
    }
  },
);

export const deleteContentPage = createAsyncThunk(
  "settings/deletePage",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/admin/settings/content-pages/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al eliminar página"),
      );
    }
  },
);

interface SettingsState {
  coupons: any[];
  settings: Record<string, any>;
  contentPages: any[];
  businessHours: any[];
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  coupons: [],
  settings: {},
  contentPages: [],
  businessHours: [],
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state) => {
        state.coupons = [];
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state) => {
        state.settings = {};
      })
      .addCase(fetchContentPages.fulfilled, (state, action) => {
        state.contentPages = action.payload;
      })
      .addCase(fetchContentPages.rejected, (state) => {
        state.contentPages = [];
      })
      .addCase(fetchAdminBusinessHours.fulfilled, (state, action) => {
        state.businessHours = action.payload;
      })
      .addCase(fetchAdminBusinessHours.rejected, (state) => {
        state.businessHours = [];
      })
      .addCase(saveAdminBusinessHours.fulfilled, (state, action) => {
        state.businessHours = action.payload;
      });
  },
});

export default settingsSlice.reducer;
