import { configureStore, Middleware } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice.js';
import chatReducer from './slices/chatSlice.js';
import usersReducer from './slices/usersSlice.js';
import socketMiddleware from './middleware/socketMiddleware.js';

export const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    users: usersReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(socketMiddleware as Middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
