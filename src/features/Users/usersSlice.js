import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import io from "socket.io-client";

const initialState = {
    users: [],
    totalUsers: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,
    error: null,
  };

const apiUrl = import.meta.env.VITE_API_URL
const socket = io(import.meta.env.VITE_BASE_URL)
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});
export const getUsers = createAsyncThunk('user/get', async ({page, limit, search, status}, { rejectWithValue }) => {
    const token = JSON.parse(localStorage.getItem("user")).token;
    try {
        const res = await fetch(`${apiUrl}/user/fetch-all?page=${page}&limit=${limit}&search=${search}&status=${status}`, {
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
            const newUsers = action.payload.users || [];

            // Ensure newUsers is an array
            if (!Array.isArray(newUsers)) {
                console.error("Expected an array of new users, received: ", newUsers);
                return;
            }
        
            // Get the existing user IDs to avoid duplicates
            const existingUserIds = state.users.map(user => user._id);
        
            // Filter out any duplicate users
            const filteredNewUsers = newUsers.filter(user => !existingUserIds.includes(user._id));
        
            // Combine the existing users with the new users
            state.users = [...state.users, ...filteredNewUsers];
        
            // Update totalUsers with the new length of users
            state.totalUsers = action.payload.totalUsers || state.users.length;
        
            // Calculate totalPages using the perPageRec value from action.payload
            state.totalPages = Math.ceil(state.totalUsers / action.payload.perPageRec);

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
                state.users = action.payload.users;
                state.totalPages = action.payload.totalPages; 
                state.currentPage = action.payload.currentPage;
                state.totalUsers = action.payload.totalUsers;
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
                const totalPages = Math.ceil(state.totalUsers / state.perPageRec);

                if (state.users.length < state.perPageRec && state.currentPage < totalPages){
                    fetchMoreUsersFromNextPage(state.currentPage + 1, state.perPageRec).then(newUsers => {
                        state.users.push(...newUsers);
                    });
                }
                state.totalUsers -= 1;
                state.totalPages = Math.ceil(state.totalUsers / state.perPageRec);
            })
            .addCase(delUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(uploadCsv.fulfilled, (state, action) => {
                state.loading = false;
                const newUsers = action.payload.users || [];
                const existingUserIds = state.users.map(user => user._id);
            
                const filteredNewUsers = newUsers.filter(user => !existingUserIds.includes(user._id));
            
                // Update users and recalculate pagination
                state.users = [...state.users, ...filteredNewUsers];
                state.totalUsers = action.payload.totalUsers;
                state.totalPages = Math.ceil(state.totalUsers / action.payload.perPageRec);
            })
            .addCase(uploadCsv.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});


export const startListeningToSocket = () => (dispatch, getState) => {
    socket.on("usersByCsvAdded", (data) => {
        const perPageRec = getState().perPageRec;
        dispatch(getUsers({ page: getState().currentPage, limit: perPageRec }));
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

const fetchMoreUsersFromNextPage = async (page, limit) => {
    const token = JSON.parse(localStorage.getItem("user")).token;
    const res = await fetch(`${apiUrl}/user/fetch-all?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.users;
    }
    return [];
  };

export const { deleteUserSuccess, updateStatus, addUserSuccess, updateUserSuccess, addMultipleUsersSuccess } = usersSlice.actions;
export default usersSlice.reducer;
