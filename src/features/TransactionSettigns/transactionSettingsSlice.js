import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import socket from "../../utils/socket";
import { toast } from "sonner";

const apiUrl = import.meta.env.VITE_API_URL;

export const fetchTransactionDetails = createAsyncThunk(
  "transactionSettings/fetchTransactionDetails",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${apiUrl}/org/getTransactionSettings`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to fetch details.");
        return rejectWithValue(err.message || "Failed to fetch details");
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch details");
    }
  }
);

const transactionSettingsSlice = createSlice({
  name: "transactionSettings",
  initialState: {
    data: {},
    loading: false,
    error: null,
  },
  reducer: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default transactionSettingsSlice.reducer;
