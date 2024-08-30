import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  users: [], // Initialize users as an empty array
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
};

// Fetch employees from backend
export const fetchEmployees = createAsyncThunk('insights/fetchEmployees', async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`http://localhost:5000/api/user/${id}`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    const data = await res.json();
    console.log(data);
    
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Add a new employee
export const addUser = createAsyncThunk('insights/addUser', async (employee, { rejectWithValue }) => {
  try {
    const res = await fetch(`http://localhost:5000/api/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    if (!res.ok) throw new Error('Failed to add employee');
    const data = await res.json();
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Remove an employee
export const removeEmployee = createAsyncThunk('insights/removeEmployee', async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`http://localhost:5000/api/user/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json',
      }
    });
    if (!res.ok) throw new Error('Failed to delete employee');
    return id; // Return the deleted employee's ID
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Slice
const insightsSlice = createSlice({
  name: "insights",
  initialState,
  reducers: {
    remEmployee(state, action) {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    updateEmployeeStatus(state, action) {
      const user = state.users.find(user => user.id === action.payload);
      if (user) {
        user.status = user.status === "Inactive" ? "Active" : "Inactive";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload; // Ensure users is always an array
        state.totalPages = action.payload.totalPages || 1; // Default totalPages to 1 if not provided
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload); // Add the new employee to the users list
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user.id !== action.payload); // Remove the employee from the users list
      })
      .addCase(removeEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { remEmployee, updateEmployeeStatus } = insightsSlice.actions;
export default insightsSlice.reducer;
