import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roomReducer from './slices/roomSlice';
import messageReducer from './slices/messageSlice';
import taskReducer from './slices/taskSlice';
import noteReducer from './slices/noteSlice';
import notificationReducer from './slices/notificationSlice';
import pomodoroReducer from './slices/pomodoroSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomReducer,
    messages: messageReducer,
    tasks: taskReducer,
    notes: noteReducer,
    notifications: notificationReducer,
    pomodoro: pomodoroReducer,
  },
});

export default store;

