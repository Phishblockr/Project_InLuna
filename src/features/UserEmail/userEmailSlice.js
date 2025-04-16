import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import socket from "../../utils/socket";
import { toast } from "sonner";

const apiUrl = import.meta.env.VITE_API_URL;

export const fetchAssignedEmails = createAsyncThunk(
    'userEmail/fetchAssignedEmails',
    async ({token, id},{rejectWithValue}) => {
        try{
            const response = await fetch(`${apiUrl}/userEmail/getAssigned/${id}`,{
                method: "GET",
                credentials: 'include',
                headers : {
                    'Content-Type': 'application/json',
                    'Authorization':  `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if(!response.ok){
                throw new Error(data.message || 'Failed to fetch assigned emails.');
            }

            return data;

        }catch(error){
            return rejectWithValue(error.message || 'Failed to fetch assigned emails.');
        }
    }
);

export const removeAssignedEmail = createAsyncThunk(
    'userEmail/removeAssignedEmail',
    async({token, userId, emailTemplateId }, {rejectWithValue}) => {
        try {
            const response = await fetch(`${apiUrl}/userEmail/deleteAssignment`,{
                method: "DELETE",
                credentials: 'include',
                headers : {
                    'Content-Type': 'application/json',
                    'Authorization':  `Bearer ${token}`,
                },
                body: JSON.stringify({userId, emailTemplateId}),
            });
             const data = await response.json();

            if(!response.ok){
                throw new Error(data.message || 'Failed to remove assigned email.');
            }

            return {userId,emailTemplateId};
            
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to remove assigned email.');
        }
    }
)

export const assignEmail = createAsyncThunk(
    'userEmail/assignEmail',
    async({token, userId, emailTemplateId }, {rejectWithValue}) => {
        try {
            const response = await fetch(`${apiUrl}/userEmail/assign`,{
                method: "POST",
                credentials: 'include',
                headers : {
                    'Content-Type': 'application/json',
                    'Authorization':  `Bearer ${token}`,
                },
                body: JSON.stringify({userId, emailTemplateId}),
            });
            const data = await response.json();

            if(!response.ok){
                toast.error(`Failed to assign email. Error: ${data.message}`);
                throw new Error(data.message || 'Failed to assign email.');
            }

            toast.success(`Email assigned successfully.`);
            return data.assignment;
            
        } catch (error) {
            toast.error(`Failed to assign email. Error: ${error.message}`);
            return rejectWithValue(error.message || 'Failed to assign email.');
        }
    }
)

export const fetchEmailOptions = createAsyncThunk(
    'userEmail/fetchEmailOptions',
    async ({token},{rejectWithValue}) => {
        try {
            const response = await fetch(`${apiUrl}/emailTemplate/options`,{
                method: "GET",
                credentials: 'include',
                headers : {
                    'Content-Type': 'application/json',
                    'Authorization':  `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if(!response.ok){
                toast.error(`Failed to fetch email options. Error: ${data.message}`);
                throw new Error(data.message || 'Failed to fetch email options.');
            }

            return data.options;
            
        } catch (error) {
            toast.error(`Failed to fetch email options. Error: ${error.message}`);
            return rejectWithValue(error.message || 'Failed to fetch email options.');
        }
    }
)

//Initial State
const initialState = {
    Emails: [],
    loading: false,
    error: null,
    emailOptions: [],
};

//Slice
const userEmailSlice = createSlice({
    name: 'userEmail',
    initialState,
    reducers: {
        addEmailSuccess(state, action) {
            const newEmail = action.payload;
            const existingEmail = state.Emails.find((email) => email.id === newEmail.id);
            if (!existingEmail) {
                state.Emails.push(newEmail);
            }
        },
        removeEmailSuccess(state, action) {
            const {emailTemplateId} = action.payload;
            state.Emails = state.Emails.filter((email) => email.emailTemplateId !== emailTemplateId);
        },
    },
    extraReducers: (builder) => {
        //fetch assigned emails
        builder
            .addCase(fetchAssignedEmails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAssignedEmails.fulfilled, (state, action) => {
                state.loading = false;
                state.Emails = action.payload;
            })
            .addCase(fetchAssignedEmails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        //remove assigned email
        builder
            .addCase(removeAssignedEmail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeAssignedEmail.fulfilled, (state, action) => {
                state.loading = false;
                state.Emails = state.Emails.filter((email) => email.emailTemplateId !== action.payload.emailTemplateId);
                toast.success(`Email removed successfully.`);
            })
            .addCase(removeAssignedEmail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(`Failed to remove email. Error: ${action.payload}`);
            });

        //assign email
        builder
            .addCase(assignEmail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(assignEmail.fulfilled, (state, action) => {
                state.loading = false;
                state.Emails.push(action.payload);
            })
            .addCase(assignEmail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
        
        //fetch email options
        builder
            .addCase(fetchEmailOptions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmailOptions.fulfilled, (state, action) => {
                state.loading = false;
                state.emailOptions = action.payload;

            })
            .addCase(fetchEmailOptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

    }
})

//Start listening to Socket.IO events
export const startListeningToSocket = () => (dispatch) => {
    socket.on('emailAssigned', (data) => {
        console.log("Socket Event : Email Assigned", data);
        dispatch(assignEmail.fulfilled(data));
    });
    socket.on('emailRemoved', (data) => {
        console.log("Socket Event : Email Removed", data);
        dispatch(removeAssignedEmail.fulfilled(data));
    });
};

export const { addEmailSuccess, removeEmailSuccess } = userEmailSlice.actions;
export default userEmailSlice.reducer;