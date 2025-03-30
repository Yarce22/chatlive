/**
 * Slice de Redux para el manejo del estado del chat
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import { Message, Group } from '../../../shared/types';

interface ChatState {
  /** ID del chat activo */
  activeChat: string;
  /** Indica si el chat activo es un grupo */
  activeChatIsGroup: boolean;
  /** Registro de mensajes por chat (privado o grupo) */
  chats: { [key: string]: Message[] };
  /** Registro de grupos disponibles */
  groups: { [key: string]: Group };
  /** Contador de mensajes no leu00eddos por usuario o grupo */
  unreadMessages: { [key: string]: number };
}

const initialState: ChatState = {
  activeChat: '',
  activeChatIsGroup: false,
  chats: {},
  groups: {},
  unreadMessages: {},
};

/**
 * Slice que contiene los reducers y acciones para la funcionalidad de chat
 */
export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /**
     * Establece el chat activo actual
     * @param state Estado actual
     * @param action Payload con ID del chat y si es grupo
     */
    setActiveChat: (state, action: PayloadAction<{chatId: string, isGroup: boolean}>) => {
      state.activeChat = action.payload.chatId;
      state.activeChatIsGroup = action.payload.isGroup;
      
      // Si no existe el chat, lo creamos
      if (!state.chats[action.payload.chatId]) {
        state.chats[action.payload.chatId] = [];
      }
      
      // Inicializar contador de mensajes no leu00eddos si no existe
      if (state.unreadMessages[action.payload.chatId] === undefined) {
        state.unreadMessages[action.payload.chatId] = 0;
      } else {
        // Resetear contador de mensajes no leu00eddos para este chat
        state.unreadMessages[action.payload.chatId] = 0;
      }

      console.log('chatSlice: Cambiando chat activo a', action.payload.chatId, 'isGroup:', action.payload.isGroup);
      console.log('chatSlice: Contadores de mensajes no leu00eddos:', state.unreadMessages);
    },
    
    /**
     * Au00f1ade un mensaje a un chat privado
     * @param state Estado actual
     * @param action Payload con datos del mensaje
     */
    addMessage: (state, action: PayloadAction<Message>) => {
      const { to, from } = action.payload;
      const otherUser = from === state.activeChat ? from : to;
      
      // Si el chat no existe, lo creamos
      if (!state.chats[otherUser]) {
        state.chats[otherUser] = [];
      }
      
      // Au00f1adir el mensaje al chat
      state.chats[otherUser].push(action.payload);
      
      console.log(`chatSlice: Mensaje au00f1adido al chat con ${otherUser}`, action.payload);
    },
    
    /**
     * Procesa un mensaje recibido (privado)
     * @param state Estado actual
     * @param action Payload con datos del mensaje recibido
     */
    receiveMessage: (state, action: PayloadAction<Message>) => {
      const { from } = action.payload;
      
      // Si el chat no existe, lo creamos
      if (!state.chats[from]) {
        state.chats[from] = [];
      }
      
      // Verificar si el mensaje ya existe para evitar duplicados
      const messageExists = state.chats[from].some(msg => msg.id === action.payload.id);
      
      if (!messageExists) {
        // Au00f1adir el mensaje solo si no existe
        state.chats[from].push(action.payload);
        
        // Incrementar contador de mensajes no leu00eddos si no es el chat activo
        if (state.activeChat !== from || state.activeChatIsGroup) {
          if (state.unreadMessages[from] === undefined) {
            state.unreadMessages[from] = 1;
          } else {
            state.unreadMessages[from]++;
          }
          console.log('chatSlice: Incrementando contador de mensajes no leu00eddos para', from, 'a', state.unreadMessages[from]);
        }
      }
    },
    
    /**
     * Marca un mensaje especu00edfico como leu00eddo
     * @param state Estado actual
     * @param action Payload con ID del mensaje a marcar
     */
    markMessageAsRead: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      
      // Buscar el mensaje en todos los chats
      Object.keys(state.chats).forEach(chatId => {
        const chat = state.chats[chatId];
        const messageIndex = chat.findIndex(msg => msg.id === messageId);
        
        if (messageIndex >= 0) {
          // Marcar el mensaje como leu00eddo
          chat[messageIndex].read = true;
        }
      });
    },
    
    /**
     * Elimina los mensajes no leu00eddos para un chat especu00edfico
     * @param state Estado actual
     * @param action Payload con ID del chat a limpiar
     */
    clearUnreadMessages: (state, action: PayloadAction<string>) => {
      const chatUser = action.payload;
      
      // Verificar que el contador exista
      if (state.unreadMessages[chatUser] === undefined) {
        state.unreadMessages[chatUser] = 0;
      }
      state.unreadMessages[chatUser] = 0;
    },
    
    /**
     * Crea un nuevo grupo
     * @param state Estado actual
     * @param action Payload con datos del grupo
     */
    createGroup: (state, action: PayloadAction<Group>) => {
      const group = action.payload;
      state.groups[group.id] = group;
      // Crear un chat vacu00edo para el grupo
      if (!state.chats[group.id]) {
        state.chats[group.id] = [];
      }
      if (state.unreadMessages[group.id] === undefined) {
        state.unreadMessages[group.id] = 0;
      }
    },
    
    /**
     * Actualiza datos de un grupo existente
     * @param state Estado actual
     * @param action Payload con ID del grupo y cambios a aplicar
     */
    updateGroup: (state, action: PayloadAction<{groupId: string, updates: Partial<Group>}>) => {
      const { groupId, updates } = action.payload;
      if (state.groups[groupId]) {
        state.groups[groupId] = { ...state.groups[groupId], ...updates };
      }
    },
    
    /**
     * Au00f1ade un miembro a un grupo
     * @param state Estado actual
     * @param action Payload con ID del grupo y nombre de usuario a au00f1adir
     */
    addMemberToGroup: (state, action: PayloadAction<{groupId: string, username: string}>) => {
      const { groupId, username } = action.payload;
      if (state.groups[groupId] && !state.groups[groupId].members.includes(username)) {
        state.groups[groupId].members.push(username);
      }
    },
    
    /**
     * Elimina un miembro de un grupo
     * @param state Estado actual
     * @param action Payload con ID del grupo y nombre de usuario a eliminar
     */
    removeMemberFromGroup: (state, action: PayloadAction<{groupId: string, username: string}>) => {
      const { groupId, username } = action.payload;
      if (state.groups[groupId]) {
        state.groups[groupId].members = state.groups[groupId].members.filter(member => member !== username);
      }
    },
    
    /**
     * Au00f1ade un mensaje a un chat grupal
     * @param state Estado actual
     * @param action Payload con datos del mensaje
     */
    addGroupMessage: (state, action: PayloadAction<Message>) => {
      const { groupId } = action.payload;
      if (groupId) {
        // Crear el chat de grupo si no existe
        if (!state.chats[groupId]) {
          state.chats[groupId] = [];
        }
        
        // Verificar si el mensaje ya existe para evitar duplicados
        const messageExists = state.chats[groupId].some(msg => msg.id === action.payload.id);
        
        if (!messageExists) {
          // Au00f1adir el mensaje solo si no existe
          state.chats[groupId].push(action.payload);
          
          // Incrementar contador de mensajes no leu00eddos si no es el chat activo
          if (state.activeChat !== groupId || !state.activeChatIsGroup) {
            if (state.unreadMessages[groupId] === undefined) {
              state.unreadMessages[groupId] = 1;
            } else {
              state.unreadMessages[groupId]++;
            }
            console.log('chatSlice: Incrementando contador de mensajes no leu00eddos para grupo', groupId, 'a', state.unreadMessages[groupId]);
          }
        }
      }
    },
  },
});

// Exportar acciones
export const { 
  setActiveChat, 
  addMessage, 
  receiveMessage, 
  markMessageAsRead, 
  clearUnreadMessages,
  createGroup,
  updateGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  addGroupMessage
} = chatSlice.actions;

// Selectores
export const selectActiveChat = (state: RootState) => state.chat.activeChat;
export const selectActiveChatIsGroup = (state: RootState) => state.chat.activeChatIsGroup;
export const selectChats = (state: RootState) => state.chat.chats;
export const selectGroups = (state: RootState) => state.chat.groups;
export const selectUnreadMessages = (state: RootState) => state.chat.unreadMessages;
export const selectActiveChatMessages = (state: RootState) => {
  return state.chat.chats[state.chat.activeChat] || [];
};
export const selectGroup = (state: RootState, groupId: string) => state.chat.groups[groupId];

export default chatSlice.reducer;
