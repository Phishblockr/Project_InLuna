import { createSlice } from "@reduxjs/toolkit";

const perPageRecSlice = createSlice({
  name: "perPageRec",
  initialState: 10,
  reducers: {
    setPerPageRec: (state, action) => {
        return action.payload
    }
  }
});

export default perPageRecSlice.reducer;
export const {setPerPageRec} = perPageRecSlice.actions;
