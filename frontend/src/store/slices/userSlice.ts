import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index.js';

interface UserState {
  username: string;
  logged: boolean;
}

const initialState: UserState = {
  username: '',
  logged: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    setLogged: (state, action: PayloadAction<boolean>) => {
      state.logged = action.payload;
    },
    login: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
      state.logged = true;
    },
    logout: (state) => {
      state.username = '';
      state.logged = false;
    },
  },
});

export const { setUsername, setLogged, login, logout } = userSlice.actions;

// Selectors
export const selectUsername = (state: RootState) => state.user.username;
export const selectLogged = (state: RootState) => state.user.logged;

export default userSlice.reducer;
