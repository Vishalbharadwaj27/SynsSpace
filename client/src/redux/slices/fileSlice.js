import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const getFiles = createAsyncThunk(
  'files/getFiles',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/files/${roomId}`);
      return response.data.data.files;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch files');
    }
  }
);

export const uploadFile = createAsyncThunk(
  'files/uploadFile',
  async ({ roomId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/files/${roomId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data.file;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload file');
    }
  }
);

export const updateFilePermission = createAsyncThunk(
  'files/updateFilePermission',
  async ({ fileId, sharing_permission }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/files/${fileId}/permission`, { sharing_permission });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update file permission');
    }
  }
);

export const deleteFile = createAsyncThunk(
  'files/deleteFile',
  async (fileId, { rejectWithValue }) => {
    try {
      await api.delete(`/files/${fileId}`);
      return fileId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete file');
    }
  }
);

const fileSlice = createSlice({
  name: 'files',
  initialState: {
    files: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(getFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.files.unshift(action.payload);
      })
      .addCase(updateFilePermission.fulfilled, (state, action) => {
        const file = state.files.find((f) => f.id === action.payload.fileId);
        if (file) {
          file.sharing_permission = action.payload.sharing_permission;
        }
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter((f) => f.id !== action.payload);
      });
  },
});

export const { clearError } = fileSlice.actions;
export default fileSlice.reducer;
