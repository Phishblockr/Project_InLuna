import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import socket from "../../utils/socket";

const initialState = {
    reqs: [],
    totalReqs: 0,
    totalPages: 1,
    currentPage: 1,
    perPageRec: 5,
    loading: false,
    error: null,
};

const apiUrl = import.meta.env.VITE_API_URL;

// Async thunk to fetch requests
export const fetchReqs = createAsyncThunk(
    "whitelistReq/get",
    async ({ page, limit, search, status }, { rejectWithValue }) => {
        const token = JSON.parse(localStorage.getItem("user")).token;
        try {
            const res = await fetch(
                `${apiUrl}/whitelistReq/fetchReqs?page=${page}&limit=${limit}&search=${search}&status=${status}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch URLs");
            const data = await res.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message || "An error occurred");
        }
    }
);

// Async thunk to delete a request
export const delReq = createAsyncThunk(
    "whitelistReq/del",
    async (reqId, { rejectWithValue }) => {
        const token = JSON.parse(localStorage.getItem("user")).token;

        try {
            const res = await fetch(`${apiUrl}/whitelistReq/delReq/${reqId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            if (!res.ok) {
                return rejectWithValue(data.error || `Failed to delete ${reqId}`);
            }
            return reqId;
        } catch (error) {
            return rejectWithValue(error.message || "An error occurred");
        }
    }
);

// Async thunk to approve a request
export const approveReq = createAsyncThunk(
    "whitelistReq/approveReq",
    async ({ reqId }, { rejectWithValue }) => {
        const token = JSON.parse(localStorage.getItem("user")).token;
        try {
            const response = await fetch(
                `${apiUrl}/whitelistReq/approveReq/${reqId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            const data = await response.json();
            if (!response.ok) {
                return rejectWithValue(data.error || "Failed to update status");
            }
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Redux slice
const requestsSlice = createSlice({
    name: "requests",
    initialState,
    reducers: {
        updateStatus(state, action) {
            const request = state.reqs.find((request) => request._id === action.payload);
            if (request) {
                request.status = request.status === "Pending" ? "Completed" : "Pending";
            }
        },
        remReq(state, action) {
            state.reqs = state.reqs.filter((request) => request._id !== action.payload);
        },
        updateReqSuccess(state, action) {
            const index = state.reqs.findIndex((req) => req._id === action.payload._id);
            if (index !== -1) {
                state.reqs[index] = action.payload;
            }
        },
        deleteReqSuccess(state, action) {
            state.reqs = state.reqs.filter((req) => req._id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReqs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReqs.fulfilled, (state, action) => {
                state.loading = false;
                state.reqs = action.payload.data;
                state.totalReqs = action.payload.totalRecords;
                state.totalPages = action.payload.totalPages;
                state.currentPage = action.payload.currentPage;
            })
            .addCase(fetchReqs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(delReq.fulfilled, (state, action) => {
                state.reqs = state.reqs.filter((req) => req._id !== action.payload);
            })
            .addCase(approveReq.fulfilled, (state, action) => {
                const request = state.reqs.find((req) => req._id === action.payload._id);
                if (request) {
                    request.status = "approved";
                }
            });
    },
});

export const startListeningToSocket = () => (dispatch, getState) => {
    socket.on("newReqAdded", (req) => {
        const perPageRec = getState().requests.perPageRec;
        const currentPage = getState().requests.currentPage;
        dispatch(fetchReqs({ page: currentPage, limit: perPageRec, search: "", status: "all" }));
    });

    socket.on("reqUpdated", (req) => {
        dispatch(requestsSlice.actions.updateReqSuccess(req));
    });

    socket.on("reqDeleted", (reqId) => {
        dispatch(requestsSlice.actions.deleteReqSuccess(reqId));
    });
};

export default requestsSlice.reducer;
export const { updateStatus, remReq, updateReqSuccess, deleteReqSuccess } = requestsSlice.actions;
