// src/redux/slices/campaignSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  campaigns: [
    {
      name: "Phishing Email Campaign",
      date: "10/02/2024",
      groups: "All",
      courses: "Phishing Alerts and Emails V2",
      status: "completed",
    },
    {
      name: "Phishing Email Campaign",
      date: "10/02/2024",
      groups: "Accounts",
      courses: "Phishing Alerts and Emails V2",
      status: "in progress",
    },
    {
      name: "Phishing Email Campaign",
      date: "10/02/2024",
      groups: "Engineering",
      courses: "Phishing Alerts and Emails V2",
      status: "scheduled",
    },
  ],
  loading: false,
  error: null,
};

const campaignSlice = createSlice({
  name: "campaign",
  initialState,
  reducers: {
    // Action to add a campaign
    addCampaign(state, action) {
      const newCampaign = {
        ...action.payload,
        status: "scheduled", // Default status for new campaigns
      };
      state.campaigns.push(newCampaign);
    },
    // Action to update a campaign
    updateCampaign(state, action) {
      const { index, updatedData } = action.payload;
      if (state.campaigns[index]) {
        state.campaigns[index] = { ...state.campaigns[index], ...updatedData };
      }
    },
    // Action to delete a campaign
    deleteCampaign(state, action) {
      const index = action.payload;
      state.campaigns = state.campaigns.filter((_, i) => i !== index);
    },
    // Action to set loading state
    setLoading(state, action) {
      state.loading = action.payload;
    },
    // Action to set an error
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

// Export actions
export const {
  addCampaign,
  updateCampaign,
  deleteCampaign,
  setLoading,
  setError,
} = campaignSlice.actions;

// Export reducer
export default campaignSlice.reducer;
