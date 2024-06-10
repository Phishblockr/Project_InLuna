import { createSlice } from "@reduxjs/toolkit";
import {urls} from "../../urlsData";

const urlSlice = createSlice({
    name:"urls",
    initialState:{
        urls,
    },
    reducers:{
        addUrl(state, action){
            const url = {
                url: action.payload.url,
                category: action.payload.category,
                status: action.payload.status,
            }
            state.urls.push(url);
        },
        remUrl(state,action){
            state.urls = state.urls.filter(url => url.id !== action.payload)
        },
        editUrl(state, action){
            const {id, url, category, status} = action.payload;
            const existingUrl = state.urls.find((url) => url.id === id);
            if (existingUrl) {
                existingUrl.url = url;
                existingUrl.category = category;
                existingUrl.status = status;
            }
        }
        // updateStatus(state, action) {
        //     const url = state.urls.find((url) => url.id === action.payload);
        //     if (url) {
        //         url.status = url.status === "Blacklisted" ? "Whitelisted" : "Blacklisted";
        //     }
        // }
    },
});

export default urlSlice.reducer;
export const {addUrl, remUrl, editUrl} = urlSlice.actions;