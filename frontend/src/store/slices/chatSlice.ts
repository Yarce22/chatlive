import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index.js';

export interface Message {
  id: string;
  message: string;
  from: string;
  to?: string;
  time: string;
  read: boolean;
  isGroupMessage?: boolean;
  groupId?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
}

interface ChatState {
  activeChat: string;
  activeChatIsGroup: boolean;
  chats: { [key: string]: Message[] };
  groups: { [key: string]: Group };
  unreadMessages: { [key: string]: number };
}

const initialState: ChatState = {
  activeChat: '',
  activeChatIsGroup: false,
  chats: {},
  groups: {},
  unreadMessages: {},
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<{chatId: string, isGroup: boolean}>) => {
      state.activeChat = action.payload.chatId;
      state.activeChatIsGroup = action.payload.isGroup;
      
      if (!state.chats[action.payload.chatId]) {
        state.chats[action.payload.chatId] = [];
      }
      
      if (state.unreadMessages[action.payload.chatId] === undefined) {
        state.unreadMessages[action.payload.chatId] = 0;
      } else {
        state.unreadMessages[action.payload.chatId] = 0;
      }

      console.log('chatSlice: Cambiando chat activo a', action.payload.chatId, 'isGroup:', action.payload.isGroup);
      console.log('chatSlice: Contadores de mensajes no leídos:', state.unreadMessages);
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const { from, to } = action.payload;
      const chatUser = to || from;
      
      if (!state.chats[chatUser]) {
        state.chats[chatUser] = [];
      }
      
      const messageExists = state.chats[chatUser].some(msg => msg.id === action.payload.id);
      
      if (!messageExists) {
        state.chats[chatUser].push(action.payload);
      }
    },
    receiveMessage: (state, action: PayloadAction<Message>) => {
      const { from } = action.payload;
      
      if (!state.chats[from]) {
        state.chats[from] = [];
      }
      
      const messageExists = state.chats[from].some(msg => msg.id === action.payload.id);
      
      if (!messageExists) {
        state.chats[from].push(action.payload);
        
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
    createGroup: (state, action: PayloadAction<Group>) => {
      const group = action.payload;
      state.groups[group.id] = group;
      if (!state.chats[group.id]) {
        state.chats[group.id] = [];
      }
      if (state.unreadMessages[group.id] === undefined) {
        state.unreadMessages[group.id] = 0;
      }
    },
    updateGroup: (state, action: PayloadAction<{groupId: string, updates: Partial<Group>}>) => {
      const { groupId, updates } = action.payload;
      if (state.groups[groupId]) {
        state.groups[groupId] = { ...state.groups[groupId], ...updates };
      }
    },
    addMemberToGroup: (state, action: PayloadAction<{groupId: string, username: string}>) => {
      const { groupId, username } = action.payload;
      if (state.groups[groupId] && !state.groups[groupId].members.includes(username)) {
        state.groups[groupId].members.push(username);
      }
    },
    removeMemberFromGroup: (state, action: PayloadAction<{groupId: string, username: string}>) => {
      const { groupId, username } = action.payload;
      if (state.groups[groupId]) {
        state.groups[groupId].members = state.groups[groupId].members.filter(member => member !== username);
      }
    },
    addGroupMessage: (state, action: PayloadAction<Message>) => {
      const { groupId } = action.payload;
      if (groupId) {
        if (!state.chats[groupId]) {
          state.chats[groupId] = [];
        }
        
        const messageExists = state.chats[groupId].some(msg => msg.id === action.payload.id);
        
        if (!messageExists) {
          state.chats[groupId].push(action.payload);
          
          if (state.activeChat !== groupId) {
            if (state.unreadMessages[groupId] === undefined) {
              state.unreadMessages[groupId] = 1;
            } else {
              state.unreadMessages[groupId]++;
            }
            console.log('chatSlice: Incrementando contador de mensajes no leídos para grupo', groupId, 'a', state.unreadMessages[groupId]);
          }
        }
      }
    },
  },
});

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
