import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

const initialState: LoadingState = {
  isLoading: false,
  message: undefined,
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    showLoading: (state, action: PayloadAction<string | undefined>) => {
      state.isLoading = true;
      state.message = action.payload;
    },
    hideLoading: (state) => {
      state.isLoading = false;
      state.message = undefined;
    },
  },
});

export const { showLoading, hideLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
