import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import io from "socket.io-client";

const initialState = {
    users: [],
    loading: false,
    error: null,
};

const apiUrl = import.meta.env.VITE_API_URL
const socket = io(import.meta.env.VITE_BASE_URL)
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});
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

export const delUser = createAsyncThunk('user/del', async (id, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;

    try {
        const res = await fetch(`${apiUrl}/user/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) throw new Error(`Failed to delete ${id}`)
        return id;
    } catch (error) {
        return rejectWithValue(error.message);
    }
})

export const uploadCsv = createAsyncThunk('users/uploadCsv', async (formData, { rejectWithValue }) => {
    try {
        const token = JSON.parse(localStorage.getItem("user")).token;
        const response = await fetch(`${apiUrl}/user/addUsersFromCsv`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload CSV');
        return await response.json()
    } catch (error) {
        return rejectWithValue(error.message)
    }
})

const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        // remUser(state, action) {
        //     state.users = state.users.filter(user => user.id !== action.payload);
        // },

        updateStatus(state, action) {
            const user = state.users.find(user => user.id === action.payload);
            if (user) {
                user.status = user.status === "Inactive" ? "Active" : "Inactive";
            }
        },
        addUserSuccess(state, action) {
            const existingUser = state.users.find(user => user._id === action.payload._id);
            if (!existingUser) {
              state.users.push(action.payload); // Add user only if it doesn't exist
            }
          },
        updateUserSuccess(state, action) {
            const index = state.users.findIndex(user => user._id === action.payload._id);
            if (index !== -1) {
                state.users[index] = action.payload;
            }
        },
        deleteUserSuccess(state, action) {
            state.users = state.users.filter(user => user._id !== action.payload);
        },
        addMultipleUsersSuccess(state, action) {
            state.users.push(...action.payload);
        }
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
                state.users = state.users.filter(user => user._id !== action.payload);
            })
            .addCase(delUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { deleteUserSuccess, updateStatus, addUserSuccess, updateUserSuccess, addMultipleUsersSuccess } = usersSlice.actions;

export const startListeningToSocket = () => (dispatch) => {
    socket.on("usersByCsvAdded", (data) => {
        dispatch(addMultipleUsersSuccess(data));
    });

    socket.on("userCreated", (data) => {
        dispatch(addUserSuccess(data));
    });

    socket.on("userUpdated", (user) => {
        dispatch(updateUserSuccess(user));
    });

    socket.on("userDeleted", (userId) => {
        dispatch(deleteUserSuccess(userId));
    });
}

export default usersSlice.reducer;
