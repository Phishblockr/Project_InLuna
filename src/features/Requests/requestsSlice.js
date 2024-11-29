import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import socket from "../../utils/socket";

const initialState = {
    requests: [],
    totalReqs: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,
    error: null,
};

const apiUrl = import.meta.env.VITE_API_URL;
//fetch requests
export const fetchReqs = createAsyncThunk(
    "Request/get",
    async ({ page, limit, search, status, token }, { rejectWithValue }) => {
        // const token = JSON.parse(localStorage.getItem("user")).token;
        try {
            const res = await fetch(
                `${apiUrl}/Request/fetchReqs?page=${page}&limit=${limit}&search=${search}&status=${status}`,
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
            return rejectWithValue(error.message || "An unexpected error occurred while fetching whitelist requests");
        }
    }
);

//delete a request
export const delReq = createAsyncThunk(
    "Request/del",
    async ({ reqId, token }, { rejectWithValue }) => {
        // const token = JSON.parse(localStorage.getItem("user")).token;
        try {
            const res = await fetch(`${apiUrl}/Request/delReq/${reqId}`, {
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
            return rejectWithValue(error.message || "An unexpected error occurred while deleting whitelist requests");
        }
    }
);

// Async thunk to approve a request
export const approveReq = createAsyncThunk(
    "whitelistReq/approveReq",
    async ({ reqId, token }, { rejectWithValue }) => {
        // const token = JSON.parse(localStorage.getItem("user")).token;
        try {
            const response = await fetch(
                `${apiUrl}/Request/approveReq/${reqId}`,
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
            return rejectWithValue(error.message || "An unexpected error occurred while approving requests");
        }
    }
);

const fetchMoreRequestsFromNextPage = async (page, limit, token) => {
    // const token = JSON.parse(localStorage.getItem("user")).token;
    const res = await fetch(`${apiUrl}/Request/fetchReqs?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (res.ok) {
        const data = await res.json();
        return data.requests;
    }
    return [];
};

// Redux slice
const requestsSlice = createSlice({
    name: "requests",
    initialState,
    reducers: {
        updateStatus(state, action) {
            const request = state.requests.find((request) => request._id === action.payload);
            if (request) {
                request.status = request.status === "Pending" ? "Completed" : "Pending";
            }
        },
        remReq(state, action) {
            state.requests = state.requests.filter((request) => request._id !== action.payload);
        },
        updateReqSuccess(state, action) {
            const index = state.requests.findIndex((req) => req._id === action.payload._id);
            if (index !== -1) {
                state.requests[index] = action.payload;
            }
        },
        deleteReqSuccess(state, action) {
            state.requests = state.requests.filter((req) => req._id !== action.payload);
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
                state.requests = action.payload.data;
                state.totalReqs = action.payload.totalRecords;
                state.totalPages = action.payload.totalPages;
                state.currentPage = action.payload.currentPage;
            })
            .addCase(fetchReqs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(delReq.fulfilled, (state, action) => {
                const {token} = action.meta.arg;
                state.requests = state.requests.filter((req) => req._id !== action.payload);
                state.totalReqs -= 1;
                state.totalPages = Math.ceil(state.totalReqs / state.perPageRec);

                if (state.requests.length < state.perPageRec && state.currentPage < state.totalPages) {
                    fetchMoreRequestsFromNextPage(state.currentPage + 1, state.perPageRec, token).then(newRequests => {
                        state.requests.push(...newRequests);
                    });
                }
            })
            .addCase(approveReq.fulfilled, (state, action) => {
                const request = state.requests.find((req) => req._id === action.payload._id);
                if (request) {
                    request.status = "approved";
                }
            });
    },
});

export const startListeningToSocket = (token) => (dispatch, getState) => {
    socket.on("newReqAdded", (req) => {
        const perPageRec = getState().perPageRec;
        const currentPage = getState().requests.currentPage;
        dispatch(fetchReqs({ page: currentPage, limit: perPageRec, search: "", status: "all", token }));
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
