import { createSlice } from "@reduxjs/toolkit";

const OverviewSlice = createSlice({
  name: "overview",
  initialState: {
    linkData: [
      {id: 1, title: "Phishing links visited", count: 118, lastMonth:"+20", logo:"bi bi-shield-x"},
      {id: 2, title: "Links whitelisted", count: 56, lastMonth:"+50", logo:"bi bi-shield-check"},
      {id: 3, title: "Blacklisted links clicked", count: 294, lastMonth:"+10", logo:"bi bi-shield-exclamation"},
      {id: 4, title: "Phishing links blocked", count: 23, lastMonth:"+90", logo:"bi bi-shield-shaded"},
    ]
  }
})

export default OverviewSlice.reducer;