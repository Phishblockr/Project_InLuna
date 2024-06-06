import { createSlice } from "@reduxjs/toolkit";

const themeSlice = createSlice({
    name: "theme",
    initialState:"light",
    reducers: {
        setTheme: (state, action) => {
            return action.payload
        }
    }
});

export default themeSlice.reducer;
export const {setTheme} = themeSlice.actions;