import { createSlice } from "@reduxjs/toolkit";

const OverviewSlice = createSlice({
  name: "overview",
  initialState: {
    linkData: [
      {id: 1, title: "Phishing links visited", count: 118, bg: "bg-[#FF6392] opacity-40"},
      {id: 2, title: "Links whitelisted", count: 56, bg: "bg-[#D3B938]"},
      {id: 3, title: "Blacklisted links clicked", count: 294, bg: "bg-[#5AA9E6] opacity-60"},
      {id: 4, title: "Phishing links blocked", count: 23, bg: "bg-[#C62828] opacity-80"},
    ]
  }
})

export default OverviewSlice.reducer;