import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
    users: [],
    loading: false,
    error: null,
};

export const getUsers = createAsyncThunk('user/get', async (id, { rejectWithValue }) => {
    try {
        const res = await fetch(`http://localhost:5000/api/user/${id}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        return data;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const addUser = createAsyncThunk('user/add', async (user, { rejectWithValue }) => {
    try {
        const res = await fetch(`http://localhost:5000/api/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });
        if (!res.ok) throw new Error('Failed to add user');
        const data = await res.json();
        return data;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const delUser = createAsyncThunk('user/del', async(id) => {
    try {
        const res = await fetch(`http://localhost:5000/api/user/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-type' : 'application/json'
            }
        });
        const data = await res.json();
        return data;
    } catch (error) {
        return rejectWithValue(error.message);
    }
})

const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        remUser(state, action) {
            state.users = state.users.filter(user => user.id !== action.payload);
        },
        updateStatus(state, action) {
            const user = state.users.find(user => user.id === action.payload);
            if (user) {
                user.status = user.status === "Inactive" ? "Active" : "Inactive";
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(getUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addUser.fulfilled, (state, action) => {
                state.loading = false;
                state.users.push(action.payload);
            })
            .addCase(addUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(delUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(delUser.fulfilled, (state, action) => {
                state.loading = false;
                state.users.push(action.payload);
            })
            .addCase(delUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { remUser, updateStatus } = usersSlice.actions;
export default usersSlice.reducer;
