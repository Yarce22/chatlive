import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index.js';

interface UsersState {
  usersList: string[];
  userAvatars: { [key: string]: string };
}

const initialState: UsersState = {
  usersList: [],
  userAvatars: {},
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsersList: (state, action: PayloadAction<string[]>) => {
      state.usersList = action.payload;
    },
    addUserAvatar: (state, action: PayloadAction<{username: string, avatar: string}>) => {
      const { username, avatar } = action.payload;
      state.userAvatars[username] = avatar;
    },
    setUserAvatars: (state, action: PayloadAction<{[key: string]: string}>) => {
      state.userAvatars = action.payload;
    },
  },
});

export const { setUsersList, addUserAvatar, setUserAvatars } = usersSlice.actions;

// Selectors
export const selectUsersList = (state: RootState) => state.users.usersList;
export const selectUserAvatars = (state: RootState) => state.users.userAvatars;

export default usersSlice.reducer;
