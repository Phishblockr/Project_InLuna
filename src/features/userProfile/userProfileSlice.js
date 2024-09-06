import { createSlice } from "@reduxjs/toolkit";

const userProfileSlice = createSlice({
    name: "userProfile",
    initialState: {
        details: {},
        loading: false,  // Initialize as false to indicate not loading initially
        error: null,
    },
    reducers: {
        fetchUserStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchUserSuccess: (state, action) => {
            state.loading = false;
            state.details = action.payload;
        },
        fetchUserFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        cleanUserDetails: (state) => {
            state.details = null;
            state.error = null;
            state.loading = false;  // Reset loading state as well
        },
    },
});

export const {
    fetchUserStart,
    fetchUserSuccess,
    fetchUserFailure,
    cleanUserDetails,
} = userProfileSlice.actions;

export default userProfileSlice.reducer;
