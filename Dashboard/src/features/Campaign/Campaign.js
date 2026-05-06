// src/redux/slices/campaignSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import socket from "../../utils/socket";

const initialState = {
    campaigns: [],
    totalcampaigns: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,
    error: null,
};

const apiUrl = import.meta.env.VITE_API_URL

export const getCampaigns = createAsyncThunk('campaign/get', async ({ page, limit, search, status, token }, { rejectWithValue }) => {
    try {
        const res = await fetch(`${apiUrl}/campaign/fetchAll?page=${page}&limit=${limit}&search=${search}&status=${status}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Failed to fetch campaign');
        const data = await res.json();
        return data;
    } catch (error) {
        return rejectWithValue(error.message || 'An error occurred');
    }
});

export const addCampaign = createAsyncThunk("campaign/add", async ({ data, token }, { rejectWithValue }) => {
    try {
        console.log(token);
        const res = await fetch(`${apiUrl}/campaign/add`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to fetch campaign");
        const responseData = await res.json();
        return responseData;
    } catch (error) {
        return rejectWithValue(error.message || "An error occurred");
    }
});

export const delCampaign = createAsyncThunk("campaign/del", async ({ id, token }, { rejectWithValue }) => {
    try {
        const res = await fetch(`${apiUrl}/campaign/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        if (!res.ok) {
            return rejectWithValue(data.error || `Failed to delete ${id}`);
        }
        return id;
    } catch (error) {
        return rejectWithValue(error.message || 'An error occurred');
    }
});

export const updateCampaign = createAsyncThunk("campaign/update", async ({ id, updatedData, token }, { rejectWithValue }) => {
    try {
        const res = await fetch(`${apiUrl}/campaign/update/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        });
        const data = await res.json();
        if (!res.ok) {
            return rejectWithValue(data.error || "Failed to update campaign");
        }
        return data;
    } catch (error) {
        return rejectWithValue(error.message)
    }
});

const fetchMoreDataFromNextPage = async (page, limit, token) => {
    try {
        const res = await fetch(`${apiUrl}/campaign/fetchAll?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (res.ok) {
            const data = await res.json();
            return data.campaigns;
        }
        return [];
    } catch (error) {
        console.error(error.message)
    }
}

const campaignSlice = createSlice({
    name: "campaign",
    initialState,
    reducers: {
        // Action to add a campaign
        addCampaignSuccess(state, action) {
            const existingData = state.campaigns.find(campaign => campaign._id === action.payload._id);
            if (!existingData) {
                state.campaigns.push(action.payload);
            }
        },
        // Action to update a campaign
        updateCampaignSuccess(state, action) {
            const { id, ...updatedData } = action.payload;
            const index = state.campaigns.findIndex(campaign => campaign._id === id);
            if (index !== -1) {
                state.campaigns[index] = { ...state.campaigns[index], ...updatedData };
            }
        },        
        // // Action to delete a campaign
        deleteCampaignSuccess(state, action) {
            state.campaigns = state.campaigns.filter(campaign => campaign._id !== action.payload);
        },
    },
    extraReducers: builder => {
        builder
            // fetch campaigns
            .addCase(getCampaigns.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCampaigns.fulfilled, (state, action) => {
                state.loading = false;
                state.campaigns = action.payload.campaigns;
                state.currentPage = action.payload.currentPage;
                state.totalPages = action.payload.totalPages;
                state.totalcampaigns = action.payload.totalcampaigns;
            })
            .addCase(getCampaigns.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // adding campaigns
            .addCase(addCampaign.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addCampaign.fulfilled, (state, action) => {
                state.loading = false;
                state.campaigns.push(action.payload);
            })
            .addCase(addCampaign.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // delete
            .addCase(delCampaign.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(delCampaign.fulfilled, (state, action) => {
                const {token} = action.meta.arg;
                state.loading = false;
                state.campaigns = state.campaigns.filter(campaign => campaign._id !== action.payload);
                const totalPages = Math.ceil(state.totalcampaigns / state.perPageRec);

                if (state.campaigns.length < state.perPageRec && state.currentPage < totalPages){
                    fetchMoreDataFromNextPage(state.currentPage + 1, state.perPageRec, token).then(newCampaigns => {
                        state.campaigns.push(...newCampaigns);
                    });
                }
                state.totalcampaigns -= 1;
                state.totalPages = Math.ceil(state.totalcampaigns / state.perPageRec);
            })
            .addCase(delCampaign.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Updating Campaign
            .addCase(updateCampaign.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCampaign.fulfilled, (state, action) => {
    const { id, ...updatedData } = action.payload;
    const index = state.campaigns.findIndex(campaign => campaign._id === id);
    if (index !== -1) {
        state.campaigns[index] = { ...state.campaigns[index], ...updatedData };
    }
            })
            .addCase(updateCampaign.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
    },
});

export const startListeningToSocket = (token) => (dispatch, getState) => {
    socket.on("campaignAdded", (data) => {
        dispatch(addCampaignSuccess(data));
    });

    socket.on("campaignUpdated", (campaign) => {
        dispatch(updateCampaignSuccess(campaign));
    });

    socket.on("campaignDeleted", (id) => {
        dispatch(deleteCampaignSuccess(id));
    });
}

// Export actions
export const {
    addCampaignSuccess, updateCampaignSuccess, deleteCampaignSuccess,} = campaignSlice.actions;
// Export reducer
export default campaignSlice.reducer;
