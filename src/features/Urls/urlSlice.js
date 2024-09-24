import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { urls } from "../../urlsData";
import io from "socket.io-client";
import socket from "../../utils/socket";

const initialState = {
    urls: [],
    totalUrls: 0,
    totalPages: 1,
    currentPage: 1,
    perPageRec: 5,
    loading: false,
    error: null,
};

const apiUrl = import.meta.env.VITE_API_URL

export const getUrls = createAsyncThunk("url/get", async ({ page, limit, search, status }, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;
    try {
        const res = await fetch(`${apiUrl}/url/getUrls?page=${page}&limit=${limit}&search=${search}&status=${status}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) throw new Error("Failed to fetch urls");
        const data = await res.json();
        return data;
    } catch (error) {
        return rejectWithValue(error.message || "An error occurred")
    }
});

export const addUrl = createAsyncThunk("url/add", async (url, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;

    try {
        const res = await fetch(`${apiUrl}/url/addUrl`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(url)
        });
        if (!res.ok) throw new Error("Failed to add user");
        const data = await res.json();
        return data;
    } catch (error) {
        return rejectWithValue(error.message || "An error occurred");
    }
});

export const delUrl = createAsyncThunk("url/del", async (urlId, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;
    try {
        const res = await fetch(`${apiUrl}/url/deleteUrl/${urlId}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        const data = await res.json();
        if (!res.ok) {
            return rejectWithValue(data.error || `Failed to delete ${urlId}`);
        }
        return urlId;
    } catch (error) {
        return rejectWithValue(error.message || 'An error occurred');
    }
});

export const updateUrl = createAsyncThunk("url/update", async ({ urlId, urlData }, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;
    try {
        const res = await fetch(`${apiUrl}/url/updateUrl/${urlId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(urlData)
        });
        const data = await res.json();
        if (!res.ok) {
            return rejectWithValue(data.error || "Failed to update status")
        }
        return data;
    } catch (error) {
        return rejectWithValue(error.message)
    }
});

const fetchMoreUrlsFromNextPage = async (page, limit) => {
    const token = JSON.parse(localStorage.getItem("user")).token;
    try {
        const res = await fetch(`${apiUrl}/url/getUrls?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (res.ok) {
            const data = await res.json();
            return data.urls;
        }
        return [];
    } catch (error) {
        console.log(error.message)
    }
}

const urlSlice = createSlice({
    name: "urls",
    initialState,
    reducers: {
        addUrlSuccess(state, action) {
            const url = {
                url: action.payload.url,
                category: action.payload.category,
                status: action.payload.status,
            }
            state.urls.push(url);
        },
        deleteUrlSuccess(state, action) {
            state.urls = state.urls.filter(url => url.id !== action.payload)
        },
        updateUrlSuccess(state, action) {
            const { id, url, category, status } = action.payload;
            const existingUrl = state.urls.find((url) => url.id === id);
            if (existingUrl) {
                existingUrl.url = url;
                existingUrl.category = category;
                existingUrl.status = status;
            }
        }
        // updateStatus(state, action) {
        //     const url = state.urls.find((url) => url.id === action.payload);
        //     if (url) {
        //         url.status = url.status === "Blacklisted" ? "Whitelisted" : "Blacklisted";
        //     }
        // }
    },
    extraReducers: builder => {
        builder

            // fetching urls
            .addCase(getUrls.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUrls.fulfilled, (state, action) => {
                state.loading = false;
                state.urls = action.payload.urls;
                state.totalPages = action.payload.totalPages;
                state.currentPage = action.payload.currentPage;
                state.totalUrls = action.payload.totalUrls;
            })
            .addCase(getUrls.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // adding url
            .addCase(addUrl.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addUrl.fulfilled, (state, action) => {
                state.loading = false;
                state.urls.push(action.payload);
            })
            .addCase(addUrl.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Url
            .addCase(delUrl.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(delUrl.fulfilled, (state, action) => {
                state.loading = false;
                state.urls = state.urls.filter(url => url._id !== action.payload);
                const totalPages = Math.ceil(state.totalUrls / state.perPageRec);

                if (state.urls.length < state.perPageRec && state.currentPage < totalPages) {
                    fetchMoreUrlsFromNextPage(state.currentPage + 1, state.perPageRec).then(newUrls => {
                        state.urls.push(...newUrls);
                    });
                }
                state.totalUrls -= 1;
                state.totalPages = Math.ceil(state.totalUrls / state.perPageRec);
            })
            .addCase(delUrl.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Updating Url
            .addCase(updateUrl.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUrl.fulfilled, (state, action) => {
                const updatedUrl = action.payload;
                const existingUrl = state.urls.find((url) => url._id === updatedUrl._id);
                if (existingUrl) {
                    existingUrl.url = updatedUrl.url;
                    existingUrl.category = updatedUrl.category;
                    existingUrl.status = updatedUrl.status;
                }
                state.loading = false;
            })
            .addCase(updateUrl.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const startListeningToSocket = () => (dispatch, getState) => {
    socket.on("urlAdded", (data) => {
        dispatch(addUrlSuccess(data));
    });

    socket.on("urlUpdated", (url) => {
        dispatch(updateUrlSuccess(url));
    });

    socket.on("urlDeleted", (urlId) => {
        dispatch(deleteUrlSuccess(urlId));
    });
}

export default urlSlice.reducer;
export const { addUrlSuccess, deleteUrlSuccess, updateUrlSuccess } = urlSlice.actions;