import { createSlice } from "@reduxjs/toolkit";
import {urls} from "../../urlsData";
import { toast } from "sonner";

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
    },
});

export default urlSlice.reducer;
export const {addUrl, remUrl} = urlSlice.actions;