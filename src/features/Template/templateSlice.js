import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import socket from '../../utils/socket';
import { toast } from 'sonner';

const apiUrl = import.meta.env.VITE_API_URL;

export const fetchOptions = createAsyncThunk("template/fetchOptions", async ({ token }, { rejectWithValue }) => {
    try {
        const res = await fetch(`${apiUrl}/emailTemplate/getGroups`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const errorData = await res.json();
            return rejectWithValue(errorData.message || "Error fetching options");
        }

        const data = await res.json();
        return data;
    } catch (error) {
        return rejectWithValue(error)
    }
});

export const saveTemplate = createAsyncThunk("template/saveTemplate", async ({ token, templateData }, { rejectWithValue }) => {
    try {
        const finalGroup = templateData.selectedOption === "other" ? templateData.otherValue : templateData.selectedOption;

        const res = await fetch(`${apiUrl}/emailTemplate/create`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: templateData.title,
                subject: templateData.subject,
                isSubjectPhishing:templateData.isSubjectPhishing,
                senderAddress:templateData.senderAddress,
                isSenderAddressPhishing:templateData.isSenderAddressPhishing,
                mailedBy:templateData.mailedBy,
                isMailedByPhishing:templateData.isMailedByPhishing,
                signedBy:templateData.signedBy,
                isSignedByPhishing:templateData.isSignedByPhishing,
                securityProtocol:templateData.securityProtocol,
                isSecurityProtocolPhishing:templateData.isSecurityProtocolPhishing,
                htmlContent: templateData.htmlContent,
                isPhishing: templateData.isPhishing,
                group: finalGroup,
            })
        });

        const data = await res.json();

        if (res.ok) {
            toast.success("Template added successfully")
            return data;
        } else {
            toast.error(data.message || "Error saving template");
            return rejectWithValue(data.message || "Error saving template")
        }
    } catch (error) {
        toast.error(`Error saving template: ${error}`);
        return rejectWithValue(error);
    }
});

const templateSlice = createSlice({
    name: "template",
    initialState: {
        groupOptions: [],
        loading: false,
        error: null,
        saveStatus: 'idle',
    },
    reducers: {

    },
    extraReducers: (builder) => {
        builder
            // Handlers for fetchOptions thunk
            .addCase(fetchOptions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOptions.fulfilled, (state, action) => {
                state.loading = false;
                state.groupOptions = action.payload;
            })
            .addCase(fetchOptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Handlers for saveTemplate thunk
            .addCase(saveTemplate.pending, (state) => {
                state.saveStatus = 'pending';
                state.error = null;
            })
            .addCase(saveTemplate.fulfilled, (state) => {
                state.saveStatus = 'succeeded';
            })
            .addCase(saveTemplate.rejected, (state, action) => {
                state.saveStatus = 'failed';
                state.error = action.payload;
            })
    }
});

export default templateSlice.reducer;
