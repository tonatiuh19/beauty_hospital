import { createSlice } from "@reduxjs/toolkit";

interface ConfigState {
  isLocalhost: boolean;
  enableConsoleLogs: boolean;
}

const isLocalEnvironment = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.endsWith(".local")
  );
};

const initialState: ConfigState = {
  isLocalhost: isLocalEnvironment(),
  enableConsoleLogs: isLocalEnvironment(),
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    toggleConsoleLogs: (state) => {
      state.enableConsoleLogs = !state.enableConsoleLogs;
    },
    setConsoleLogs: (state, action) => {
      state.enableConsoleLogs = action.payload;
    },
  },
});

export const { toggleConsoleLogs, setConsoleLogs } = configSlice.actions;
export default configSlice.reducer;
