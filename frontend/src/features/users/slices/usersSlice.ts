/**
 * Slice de Redux para el manejo de usuarios conectados
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../store';

interface UsersState {
  /** Lista de usuarios conectados */
  users: string[];
  /** Mapa de avatares por nombre de usuario */
  avatars: { [key: string]: string };
}

interface AvatarPayload {
  username: string;
  avatar: string;
}

const initialState: UsersState = {
  users: [],
  avatars: {}
};

/**
 * Slice que contiene los reducers y acciones para la gestiu00f3n de usuarios
 */
export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    /**
     * Actualiza la lista de usuarios conectados
     * @param state Estado actual
     * @param action Payload con array de nombres de usuario
     */
    setUsersList: (state, action: PayloadAction<string[]>) => {
      state.users = action.payload;
    },
    
    /**
     * Au00f1ade o actualiza un avatar para un usuario especu00edfico
     * @param state Estado actual
     * @param action Payload con nombre de usuario y URL de avatar
     */
    addUserAvatar: (state, action: PayloadAction<AvatarPayload>) => {
      const { username, avatar } = action.payload;
      state.avatars[username] = avatar;
    }
  }
});

// Exportar acciones
export const { setUsersList, addUserAvatar } = usersSlice.actions;

// Selectores
export const selectUsersList = (state: RootState) => state.users.users;
export const selectUserAvatars = (state: RootState) => state.users.avatars;

export default usersSlice.reducer;
