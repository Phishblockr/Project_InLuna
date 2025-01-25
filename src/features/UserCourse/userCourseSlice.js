import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import socket from '../../utils/socket';
import { toast } from 'sonner';

const apiUrl = import.meta.env.VITE_API_URL;

export const fetchAssignedCourses = createAsyncThunk(
    'userCourses/fetchAssignedCourses',
    async ({ token, id }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${apiUrl}/userCourse/getAssigned/${id}`, {
                method: 'GET',
                credentials: 'include', // Include cookies for auth
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return rejectWithValue(data.message || 'Error fetching assigned courses');
            }

            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch assigned courses');
        }
    }
);

// Async thunk to remove a course assignment
export const removeCourse = createAsyncThunk(
    'userCourses/removeCourse',
    async ({ token, userId, courseId }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${apiUrl}/userCourse/deleteAssignment`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId, courseId }),
            });

            const data = await response.json();

            if (!response.ok) {
                return rejectWithValue(data.message || 'Error removing course assignment');
            }

            return { userId, courseId }; // Return the IDs to update the state
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to remove course assignment');
        }
    }
);

// Async thunk to assign a course
export const assignCourse = createAsyncThunk(
    'userCourses/assignCourse',
    async ({ token, userId, courseId }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${apiUrl}/userCourse/assign`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId, courseId }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(`Error assigning course: ${data.error}`);
                return rejectWithValue(data.error || 'Error assigning course');
            }

            toast.success('Course assigned successfully');
            return data.assignment;
        } catch (error) {
            toast.error(`Failed to assign course. Error: ${error.message}`);
            return rejectWithValue(error.message || 'Failed to assign course');
        }
    }
);

// Async thunk to fetch course options
export const fetchCourseOptions = createAsyncThunk(
    'userCourses/fetchCourseOptions',
    async ({ token }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${apiUrl}/course/options`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('Error fetching course options:', data.message);
                return rejectWithValue(data.message || 'Error fetching course options');
            }

            return data.options; // Return options formatted for react-select
        } catch (error) {
            console.error('Error fetching course options:', error.message);
            return rejectWithValue(error.message || 'Failed to fetch course options');
        }
    }
);

// Initial state
const initialState = {
    courses: [],
    loading: false,
    error: null,
};

// Slice
const userCourseSlice = createSlice({
    name: "userCourses",
    initialState,
    reducers: {
        addCourseSuccess(state, action) {
            const newCourse = action.payload;
            const existingCourse = state.courses.find(
                (course) => course.courseId === newCourse.courseId
            );
            if (!existingCourse) {
                state.courses.push(newCourse);
            }
        },

        removeCourseSuccess(state, action) {
            const { courseId } = action.payload;
            state.courses = state.courses.filter((course) => course.courseId !== courseId);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssignedCourses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAssignedCourses.fulfilled, (state, action) => {
                state.loading = false;
                state.courses = action.payload;
            })
            .addCase(fetchAssignedCourses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Remove course
        builder
            .addCase(removeCourse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeCourse.fulfilled, (state, action) => {
                state.loading = false;
                state.courses = state.courses.filter(
                    (course) => course.courseId !== action.payload.courseId
                );
                toast.success('Course removed successfully');
            })
            .addCase(removeCourse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(`Error removing course: ${action.payload}`);
            });

        // Assign course
        builder
            .addCase(assignCourse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(assignCourse.fulfilled, (state, action) => {
                state.loading = false;
                state.courses.push(action.payload); // Add the assigned course
            })
            .addCase(assignCourse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch course options
        builder
            .addCase(fetchCourseOptions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCourseOptions.fulfilled, (state, action) => {
                state.loading = false;
                state.courseOptions = action.payload; // Set course options
            })
            .addCase(fetchCourseOptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
})

// Start listening to Socket.IO events
export const startListeningToSocket = () => (dispatch) => {
    socket.on('courseAssigned', (data) => {
        console.log('Socket Event: Course Assigned', data);
        dispatch(assignCourse.fulfilled(data));
    });

    socket.on('courseRemoved', (data) => {
        console.log('Socket Event: Course Removed', data);
        dispatch(removeCourse.fulfilled(data));
    });
};


export const { addCourseSuccess, removeCourseSuccess } = userCourseSlice.actions;
export default userCourseSlice.reducer;