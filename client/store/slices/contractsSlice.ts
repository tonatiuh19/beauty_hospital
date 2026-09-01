import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { formatAxiosError } from "@/lib/axios";

interface Contract {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  service_id: number;
  service_name: string;
  contract_number: string;
  total_amount: number;
  sessions_included?: number;
  sessions_completed?: number;
  total_sessions?: number;
  completed_sessions?: number;
  remaining_sessions?: number;
  amount_paid?: number;
  amount_pending?: number;
  start_date?: string;
  end_date?: string | null;
  status: string;
  terms_and_conditions: string;
  custom_terms: string | null;
  signature_url?: string | null;
  contract_file_url?: string | null;
  signed_at: string | null;
  created_at: string;
}

interface ContractsState {
  contracts: Contract[];
  selectedContract: Contract | null;
  sessions: any[];
  stats: any | null;
  totalPages: number;
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
}

const initialState: ContractsState = {
  contracts: [],
  selectedContract: null,
  sessions: [],
  stats: null,
  totalPages: 1,
  loading: false,
  error: null,
  updateLoading: false,
};

// Async thunks
export const fetchContracts = createAsyncThunk(
  "contracts/fetchAll",
  async (
    params:
      | {
          search?: string;
          status?: string;
          page?: number;
          limit?: number;
        }
      | undefined,
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.get("/admin/contracts", { params });
      return {
        contracts: response.data.data.contracts,
        totalPages: response.data.data.totalPages || 1,
      };
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error fetching contracts"),
      );
    }
  },
);

export const fetchContractStats = createAsyncThunk(
  "contracts/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/admin/contracts/stats");
      if (response.data.success) return response.data.data;
      return rejectWithValue("Error fetching contract stats");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error fetching contract stats"),
      );
    }
  },
);

export const fetchContractById = createAsyncThunk(
  "contracts/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/admin/contracts/${id}`);
      return {
        contract: response.data.data.contract,
        sessions: response.data.data.sessions || [],
      };
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error fetching contract"),
      );
    }
  },
);

export const downloadContractPdf = createAsyncThunk(
  "contracts/downloadPdf",
  async (contractId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/admin/contracts/${contractId}/download`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contrato-${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return contractId;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error al descargar el contrato"),
      );
    }
  },
);

export const fetchDefaultContractTerms = createAsyncThunk(
  "contracts/fetchDefaultTerms",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "/admin/settings/default-contract-terms",
      );
      if (response.data.success) return response.data.data.terms as string;
      return rejectWithValue("No se pudieron cargar los términos");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron cargar los términos predeterminados"),
      );
    }
  },
);

export const saveDefaultContractTerms = createAsyncThunk(
  "contracts/saveDefaultTerms",
  async (terms: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        "/admin/settings/default-contract-terms",
        { terms },
      );
      if (response.data.success) return terms;
      return rejectWithValue("No se pudieron guardar los términos");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "No se pudieron guardar los términos"),
      );
    }
  },
);

export const fetchContractByAppointment = createAsyncThunk(
  "contracts/fetchByAppointment",
  async (appointmentId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/admin/contracts/appointment/${appointmentId}`,
      );
      if (response.data.success) return response.data.data;
      return rejectWithValue(
        response.data.message || "Error checking contract status",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error checking contract status"),
      );
    }
  },
);

export const createAdminContract = createAsyncThunk(
  "contracts/create",
  async (payload: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await axios.post("/admin/contracts/create", payload);
      if (response.data.success) return response.data.data;
      return rejectWithValue(
        response.data.message || "Error creating contract",
      );
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error creating contract"),
      );
    }
  },
);

export const fetchContractStatus = createAsyncThunk(
  "contracts/fetchStatus",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/admin/contracts/${id}/status`);
      if (response.data.success) return response.data.data;
      return rejectWithValue("Error checking signature status");
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error checking signature status"),
      );
    }
  },
);

export const updateContractTerms = createAsyncThunk(
  "contracts/updateTerms",
  async (
    { id, customTerms }: { id: number; customTerms: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.put(`/admin/contracts/${id}/terms`, {
        custom_terms: customTerms,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        formatAxiosError(error, "Error updating contract terms"),
      );
    }
  },
);

// Slice
const contractsSlice = createSlice({
  name: "contracts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedContract: (state, action: PayloadAction<Contract | null>) => {
      state.selectedContract = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all contracts
      .addCase(fetchContracts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts = action.payload.contracts;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch contract by ID
      .addCase(fetchContractById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedContract = action.payload.contract;
        state.sessions = action.payload.sessions;
      })
      .addCase(fetchContractStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchContractById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update contract terms
      .addCase(updateContractTerms.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateContractTerms.fulfilled, (state, action) => {
        state.updateLoading = false;
        if (
          state.selectedContract &&
          state.selectedContract.id === action.payload.id
        ) {
          state.selectedContract.custom_terms = action.payload.custom_terms;
        }
        // Update in contracts list too
        const index = state.contracts.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.contracts[index].custom_terms = action.payload.custom_terms;
        }
      })
      .addCase(updateContractTerms.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedContract } = contractsSlice.actions;
export default contractsSlice.reducer;
