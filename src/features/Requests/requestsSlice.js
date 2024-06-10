import { createSlice } from "@reduxjs/toolkit";
import { requests } from "../../requestData";

const requestsSlice = createSlice({
  name: "requests",
  initialState: {
    requests,
  },
  reducers: {
    updateStatus(state, action) {
      const request = state.requests.find(
        (request) => request.id === action.payload
      );
      if (request) {
        request.status = request.status === "Pending" ? "Completed" : "Pending";
      }
    },

    remReq(state, action) {
      state.requests = state.requests.filter(
        (request) => request.id !== action.payload
      );
    },
  },
});

export default requestsSlice.reducer;
export const { updateStatus, remReq } = requestsSlice.actions;
