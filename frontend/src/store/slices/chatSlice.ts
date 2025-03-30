import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index.js';

export interface Message {
  id: string;
  message: string;
  from: string;
  to?: string;
  time: string;
  read: boolean;
}

interface ChatState {
  activeChat: string;
  chats: { [key: string]: Message[] };
  unreadMessages: { [key: string]: number };
}

const initialState: ChatState = {
  activeChat: '',
  chats: {},
  unreadMessages: {},
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string>) => {
      state.activeChat = action.payload;
      
      // Si no existe el chat, lo creamos
      if (!state.chats[action.payload]) {
        state.chats[action.payload] = [];
      }
      
      // Inicializar contador de mensajes no leídos si no existe
      if (state.unreadMessages[action.payload] === undefined) {
        state.unreadMessages[action.payload] = 0;
      } else {
        // Resetear contador de mensajes no leídos para este chat
        state.unreadMessages[action.payload] = 0;
      }

      console.log('chatSlice: Cambiando chat activo a', action.payload);
      console.log('chatSlice: Contadores de mensajes no leídos:', state.unreadMessages);
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const { from, to } = action.payload;
      const chatUser = to || from;
      
      // Crear el chat si no existe
      if (!state.chats[chatUser]) {
        state.chats[chatUser] = [];
      }
      
      // Verificar si el mensaje ya existe para evitar duplicados
      const messageExists = state.chats[chatUser].some(msg => msg.id === action.payload.id);
      
      if (!messageExists) {
        // Añadir el mensaje solo si no existe
        state.chats[chatUser].push(action.payload);
      }
    },
    receiveMessage: (state, action: PayloadAction<Message>) => {
      const { from } = action.payload;
      
      // Crear el chat si no existe
      if (!state.chats[from]) {
        state.chats[from] = [];
      }
      
      // Verificar si el mensaje ya existe para evitar duplicados
      const messageExists = state.chats[from].some(msg => msg.id === action.payload.id);
      
      if (!messageExists) {
        // Añadir el mensaje solo si no existe
        state.chats[from].push(action.payload);
        
        // Incrementar contador de mensajes no leídos si no es el chat activo
        if (state.activeChat !== from) {
          if (state.unreadMessages[from] === undefined) {
            state.unreadMessages[from] = 1;
          } else {
            state.unreadMessages[from]++;
          }
          console.log('chatSlice: Incrementando contador de mensajes no leídos para', from, 'a', state.unreadMessages[from]);
        } else {
          console.log('chatSlice: Mensaje recibido en chat activo, no incrementando contador');
        }
      }
    },
    markMessageAsRead: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      let messageFound = false;
      
      // Actualizar estado de lectura para el mensaje en todos los chats
      Object.keys(state.chats).forEach(chatUser => {
        state.chats[chatUser] = state.chats[chatUser].map(msg => {
          if (msg.id === messageId && !msg.read) {
            messageFound = true;
            return { ...msg, read: true };
          }
          return msg;
        });
      });
      
      if (messageFound) {
        console.log('chatSlice: Mensaje marcado como leído:', messageId);
      }
    },
    clearUnreadMessages: (state, action: PayloadAction<string>) => {
      const chatUser = action.payload;
      if (state.unreadMessages[chatUser] > 0) {
        console.log('chatSlice: Limpiando contador de mensajes no leídos para', chatUser, 'de', state.unreadMessages[chatUser], 'a 0');
      }
      state.unreadMessages[chatUser] = 0;
    },
  },
});

export const { 
  setActiveChat, 
  addMessage, 
  receiveMessage, 
  markMessageAsRead, 
  clearUnreadMessages 
} = chatSlice.actions;

// Selectors
export const selectActiveChat = (state: RootState) => state.chat.activeChat;
export const selectChats = (state: RootState) => state.chat.chats;
export const selectUnreadMessages = (state: RootState) => state.chat.unreadMessages;
export const selectActiveChatMessages = (state: RootState) => {
  return state.chat.chats[state.chat.activeChat] || [];
};

export default chatSlice.reducer;
