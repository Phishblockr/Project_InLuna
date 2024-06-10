import { createSlice } from "@reduxjs/toolkit";
import { users } from "../../data";

const insightsSlice = createSlice({
  name: "insights",
  initialState: {
    users,
  },
  reducers: {
    addUser(state, action) {
      console.log(action.payload);
      const user = {
        id: action.payload.id,
        name: action.payload.name,
        email: action.payload.email,
        department: action.payload.department,
        img: action.payload.img
      }
      state.users.push(user);
    },
    remUser(state, action) {
      state.users = state.users.filter(el => el.id !== action.payload)
    }
  }
})

export default insightsSlice.reducer;
export const { addUser, remUser } = insightsSlice.actions;