import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";

const apiUrl = import.meta.env.VITE_API_URL;

export const fetchTransactionHistory = createAsyncThunk(
  "transactionHistory/fetchTransactionHistory",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${apiUrl}/transactions/getAllOrgTransactions`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to fetch transaction history");
        return rejectWithValue(
          err.message || "Failed to fetch transaction history"
        );
      }

      return data;
    } catch (err) {
      return rejectWithValue(
        err.message || "Failed to fetch transaction history"
      );
    }
  }
);

const transactionHistorySlice = createSlice({
  name: "transactionHistory",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducer: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default transactionHistorySlice.reducer;
