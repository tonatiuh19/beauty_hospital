import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

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
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
}

const initialState: ContractsState = {
  contracts: [],
  selectedContract: null,
  loading: false,
  error: null,
  updateLoading: false,
};

// Async thunks
export const fetchContracts = createAsyncThunk(
  "contracts/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/contracts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data.contracts;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching contracts",
      );
    }
  },
);

export const fetchContractById = createAsyncThunk(
  "contracts/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get(`/admin/contracts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data.contract;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching contract",
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
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.put(
        `/admin/contracts/${id}/terms`,
        { custom_terms: customTerms },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating contract terms",
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
        state.contracts = action.payload;
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
        state.selectedContract = action.payload;
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
