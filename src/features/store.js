import { configureStore } from "@reduxjs/toolkit";
import userProfileSlice from './userProfile/userProfileSlice';
import themeSlice from './Theme/themeSlice';

const store = configureStore({
    reducer: {
        userProfile: userProfileSlice,
        theme: themeSlice,
    }
});

export default store;