import { createSlice } from "@reduxjs/toolkit";
import { users } from "../../usersData";

const usersSlice = createSlice({
    name: "users",
    initialState:{
        users,
    },
    reducers:{
        addUser(state, action){
            const user = {
                img: action.payload.img,
                name: action.payload.name,
                email: action.payload.email,
                department: action.payload.department,
                role: action.payload.role,
                status: action.payload.status,
            }
            state.users.push(user);
        },
        remUser(state, action){
            state.users = state.users.filter(user => user.id !== action.payload)
        },
    },
});

export default usersSlice.reducer;
export const {addUser, remUser} = usersSlice.actions;