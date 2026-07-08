import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const startSession = createAsyncThunk(
  'pomodoro/startSession',
  async ({ roomId, durationMinutes, sessionType }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/pomodoro/${roomId}/start`, {
        duration_minutes: durationMinutes,
        session_type: sessionType,
      });
      return response.data.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start session');
    }
  }
);

export const endSession = createAsyncThunk(
  'pomodoro/endSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await api.put(`/pomodoro/${sessionId}/end`);
      return sessionId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end session');
    }
  }
);

export const getSessions = createAsyncThunk(
  'pomodoro/getSessions',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/pomodoro/${roomId}`);
      return response.data.data.sessions;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sessions');
    }
  }
);

export const getUserStats = createAsyncThunk(
  'pomodoro/getUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/pomodoro/stats/user');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user stats');
    }
  }
);

const pomodoroSlice = createSlice({
  name: 'pomodoro',
  initialState: {
    sessions: [],
    totalStudyHours: 0,
    completedSessions: 0,
    roomsJoined: 0,
    currentSession: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
      })
      .addCase(getUserStats.fulfilled, (state, action) => {
        state.totalStudyHours = action.payload.totalStudyHours;
        state.completedSessions = action.payload.completedSessions;
        state.roomsJoined = action.payload.roomsJoined;
      })
      .addCase(startSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      });
  },
});

export const { clearError, setCurrentSession } = pomodoroSlice.actions;
export default pomodoroSlice.reducer;
