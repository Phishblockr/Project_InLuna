import { configureStore } from "@reduxjs/toolkit";
import userProfileSlice from './userProfile/userProfileSlice';
import themeSlice from './Theme/themeSlice';
import perPageRecSlice from './PerPageRec/perPageRecSlice';
import templateSlice from "./Template/templateSlice";

const store = configureStore({
    reducer: {
        userProfile: userProfileSlice,
        theme: themeSlice,
        perPageRec: perPageRecSlice,
        template: templateSlice
    }
});

export default store;