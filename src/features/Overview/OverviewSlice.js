import { createSlice } from "@reduxjs/toolkit";

const OverviewSlice = createSlice({
  name: "overview",
  initialState: {
    linkData: [
      {id: 1, title: "Phishing links visited", count: 0, lastMonth:"0", logo:"bi bi-shield-x"},
      {id: 2, title: "Links whitelisted", count: 0, lastMonth:"0", logo:"bi bi-shield-check"},
      {id: 3, title: "Blacklisted links clicked", count: 0, lastMonth:"0", logo:"bi bi-shield-exclamation"},
      {id: 4, title: "Phishing links blocked", count: 0, lastMonth:"0", logo:"bi bi-shield-shaded"},
    ],
  },
  reducers: {
    setOverviewData: (state, action) => {
      state.linkData = action.payload;
    },
  },
});
export const {setOverviewData} = OverviewSlice.actions;
export default OverviewSlice.reducer;