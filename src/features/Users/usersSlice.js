import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
    users: [],
    loading: false,
    error: null,
};

const apiUrl = import.meta.env.VITE_API_URL

export const getUsers = createAsyncThunk('user/get', async (id, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;
    try {
        const res = await fetch(`${apiUrl}/user/fetch-all`, {
            method: "GET",
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        return data;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const addUser = createAsyncThunk('user/add', async (user, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;

    try {
        const res = await fetch(`${apiUrl}/user/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
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
    const token = JSON.parse(localStorage.getItem("user")).token;

    try {
        const res = await fetch(`${apiUrl}/user/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
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
                state.users = state.users.filter(user => user._id !== action.meta.arg);
            })
            .addCase(delUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { remUser, updateStatus } = usersSlice.actions;
export default usersSlice.reducer;
