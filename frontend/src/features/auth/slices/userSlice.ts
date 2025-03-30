/**
 * Slice de Redux para la autenticaciu00f3n de usuario
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import { LOCAL_STORAGE_USER_KEY } from '../../../shared/config/constants';

interface UserState {
  /** Nombre de usuario actual */
  username: string;
  /** Indica si el usuario ha iniciado sesiu00f3n */
  logged: boolean;
}

// Recuperar usuario del localStorage si existe
const getSavedUser = (): string => {
  try {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    return savedUser || '';
  } catch (error) {
    console.error('Error al recuperar usuario del localStorage:', error);
    return '';
  }
};

const initialState: UserState = {
  username: getSavedUser(),
  logged: !!getSavedUser()
};

/**
 * Slice que contiene los reducers y acciones para la autenticaciu00f3n de usuario
 */
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * Establece el nombre de usuario (antes de iniciar sesiu00f3n)
     * @param state Estado actual
     * @param action Payload con nombre de usuario
     */
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },

    /**
     * Establece el estado de inicio de sesiu00f3n del usuario
     * @param state Estado actual
     * @param action Payload con nombre de usuario
     */
    login: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
      state.logged = true;
      
      // Guardar usuario en localStorage para persistencia
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, action.payload);
      } catch (error) {
        console.error('Error al guardar usuario en localStorage:', error);
      }
    },
    
    /**
     * Cierra la sesiu00f3n del usuario actual
     * @param state Estado actual
     */
    logout: (state) => {
      state.username = '';
      state.logged = false;
      
      // Eliminar usuario del localStorage
      try {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      } catch (error) {
        console.error('Error al eliminar usuario del localStorage:', error);
      }
    }
  }
});

// Exportar acciones
export const { setUsername, login, logout } = userSlice.actions;

// Selectores
export const selectUsername = (state: RootState) => state.user.username;
export const selectLogged = (state: RootState) => state.user.logged;

export default userSlice.reducer;
