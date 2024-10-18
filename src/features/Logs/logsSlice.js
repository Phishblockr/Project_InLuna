import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import socket from "../../utils/socket";

const initialState = {
    logs: [],
    totalLogs: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,
    error: null,
    csvDownloadLoading: false, 
    csvDownloadError: null, 
};

const apiUrl = import.meta.env.VITE_API_URL;

export const getLogs = createAsyncThunk(
    "logs/get",
    async ({ page, limit, search, operationType, dateRangeFilter }, { rejectWithValue }) => {
        const token = JSON.parse(localStorage.getItem("user")).token;
        try {
            const res = await fetch(`${apiUrl}/logs/getAllLogs?page=${page}&limit=${limit}&search=${search}&operationType=${operationType}&dateRangeFilter=${dateRangeFilter}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Failed to fetch logs");
            return await res.json();
        } catch (error) {
            return rejectWithValue(error.message || "An unexpected error occurred while fetching logs");
        }
    }
);

export const downloadLogsCsv = createAsyncThunk("logs/downloadCsv", async (_, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;
    try {
        const res = await fetch(`${apiUrl}/logs/exportLogsToCsv`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) throw new Error("Failed to download logs as CSV");

        const blob = await res.blob();

        // Create a link element to trigger the download
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        // Set the filename for the download
        link.download = `logs_${Date.now()}.csv`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);

        return true;
    } catch (error) {
        return rejectWithValue("Failed to download logs as CSV");
    }
})

const logsSlice = createSlice({
    name: "logs",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getLogs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getLogs.fulfilled, (state, action) => {
                state.loading = false;
                state.logs = action.payload.data;
                state.totalLogs = action.payload.totalLogs;
                state.totalPages = action.payload.totalPages;
                state.currentPage = action.payload.currentPage;
            })
            .addCase(getLogs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to load logs";
            })
            // Handle downloading logs as CSV
            .addCase(downloadLogsCsv.pending, (state) => {
                state.csvDownloadLoading = true;
                state.csvDownloadError = null;
            })
            .addCase(downloadLogsCsv.fulfilled, (state) => {
                state.csvDownloadLoading = false;
            })
            .addCase(downloadLogsCsv.rejected, (state, action) => {
                state.csvDownloadLoading = false;
                state.csvDownloadError = action.payload || "Failed to download logs as CSV";
            });
    }
});

export default logsSlice.reducer;
