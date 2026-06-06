import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const getRooms = createAsyncThunk(
  'rooms/getRooms',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/rooms', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms');
    }
  }
);

export const getUserRooms = createAsyncThunk(
  'rooms/getUserRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/rooms/my-rooms');
      return response.data.data.rooms;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user rooms');
    }
  }
);

export const createRoom = createAsyncThunk(
  'rooms/createRoom',
  async (roomData, { rejectWithValue }) => {
    try {
      const response = await api.post('/rooms', roomData);
      return response.data.data.room;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create room');
    }
  }
);

export const joinRoomById = createAsyncThunk(
  'rooms/joinRoomById',
  async ({ roomId, room_code }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/rooms/${roomId}/join`, { room_code });
      return response.data.data.room;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join room');
    }
  }
);

export const joinRoom = createAsyncThunk(
  'rooms/joinRoom',
  async (roomCode, { rejectWithValue }) => {
    try {
      const response = await api.post('/rooms/join', { room_code: roomCode });
      return response.data.data.room;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join room');
    }
  }
);

export const leaveRoom = createAsyncThunk(
  'rooms/leaveRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      return roomId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave room');
    }
  }
);

export const getRoomById = createAsyncThunk(
  'rooms/getRoomById',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/rooms/${roomId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch room');
    }
  }
);

const roomSlice = createSlice({
  name: 'rooms',
  initialState: {
    rooms: [],
    userRooms: [],
    currentRoom: null,
    currentMembers: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRoom: (state, action) => {
      state.currentRoom = action.payload;
    },
    setCurrentMembers: (state, action) => {
      state.currentMembers = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload.rooms;
      })
      .addCase(getRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getUserRooms.fulfilled, (state, action) => {
        state.userRooms = action.payload;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.rooms.unshift(action.payload);
        state.userRooms.unshift(action.payload);
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.userRooms.push(action.payload);
      })
      .addCase(getRoomById.fulfilled, (state, action) => {
        state.currentRoom = action.payload.room;
        state.currentMembers = action.payload.members;
      })
      .addCase(leaveRoom.fulfilled, (state, action) => {
        state.userRooms = state.userRooms.filter(r => r.id !== action.payload);
        state.currentRoom = null;
        state.currentMembers = [];
      });
  },
});

export const { clearError, setCurrentRoom, setCurrentMembers } = roomSlice.actions;
export default roomSlice.reducer;
