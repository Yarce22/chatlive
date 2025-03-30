import { io, Socket } from 'socket.io-client';
import { Middleware } from '@reduxjs/toolkit';
import { receiveMessage, markMessageAsRead, Message, addMessage, setActiveChat, clearUnreadMessages } from '../slices/chatSlice.js';
import { setUsersList } from '../slices/usersSlice.js';
import { login as userLogin } from '../slices/userSlice.js';

// Tipos para las acciones
interface MessagePayload {
  message: string;
  to: string;
}

// Tipo base para las acciones de socket
type ActionPayload = string | MessagePayload | { messageId: string };

interface SocketAction {
  type: string;
  payload: ActionPayload;
}

// Acciones personalizadas para el middleware
export const socketActions = {
  SEND_MESSAGE: 'socket/sendMessage',
  MARK_AS_READ: 'socket/markAsRead',
  LOGIN: 'socket/login',
  LOGOUT: 'socket/logout',
  SET_ACTIVE_CHAT: 'socket/setActiveChat'
};

// Verificador de tipo para acciones de socket
const isSocketAction = (action: unknown): action is SocketAction => {
  return (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    'payload' in action
  );
};

// Singleton para la instancia de socket
let socket: Socket | null = null;

// Inicializar socket si no existe
const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:3000');
  }
  return socket;
};

// Middleware de socket
export const socketMiddleware: Middleware = store => next => (action: unknown) => {
  // Asegurarse de que el socket esté inicializado
  const socket = initializeSocket();
  
  // Configurar listeners de socket si no están configurados
  if (!socket.hasListeners('users_list')) {
    // Listener para la lista de usuarios
    socket.on('users_list', (users: string[]) => {
      const state = store.getState();
      const username = state.user.username;
      store.dispatch(setUsersList(users.filter(user => user !== username)));
    });

    // Listener para mensajes privados recibidos
    socket.on('receive_private_message', (data: Message) => {
      store.dispatch(receiveMessage(data));
      
      // Si es el chat activo, marcar el mensaje como leído inmediatamente
      const state = store.getState();
      if (state.chat.activeChat === data.from) {
        socket.emit('message_read', data.id);
        store.dispatch(markMessageAsRead(data.id));
      }
    });

    // Listener para confirmación de mensajes enviados
    socket.on('message_sent', (data: Message) => {
      // No volver a añadir el mensaje, ya que lo añadimos antes de enviarlo
      console.log('Mensaje enviado confirmado por el servidor:', data.id);
      
      // Actualizar el ID del mensaje si el servidor asignó uno nuevo
      if (data.id && data.to) {
        // Buscar el mensaje en el estado actual y actualizarlo si es necesario
        const state = store.getState();
        const chats = state.chat.chats;
        
        if (chats[data.to]) {
          const messages = chats[data.to];
          const lastMessage = messages[messages.length - 1];
          
          // Si el último mensaje tiene un ID temporal diferente, actualizarlo
          if (lastMessage && lastMessage.from === state.user.username && 
              lastMessage.message === data.message && lastMessage.id !== data.id) {
            // Marcar el mensaje con el ID correcto como leído si el original estaba marcado como leído
            if (lastMessage.read) {
              store.dispatch(markMessageAsRead(data.id));
            }
          }
        }
      }
    });

    // Listener para confirmación de lectura de mensajes
    socket.on('message_read_confirmation', (messageId: string) => {
      console.log('Mensaje marcado como leído:', messageId);
      store.dispatch(markMessageAsRead(messageId));
    });
  }

  // Verificar que la acción tenga la estructura correcta
  if (!isSocketAction(action)) {
    // Si es la acción setActiveChat, manejarla especialmente
    if (action && typeof action === 'object' && 'type' in action && action.type === setActiveChat.type) {
      const payload = 'payload' in action ? action.payload : null;
      if (typeof payload === 'string') {
        const newActiveChat = payload;
        const state = store.getState();
        const messages = state.chat.chats[newActiveChat] || [];
        
        console.log('Cambiando a chat activo:', newActiveChat);
        console.log('Mensajes en este chat:', messages.length);
        
        // Resetear contador de mensajes no leídos
        store.dispatch(clearUnreadMessages(newActiveChat));
        
        // Marcar todos los mensajes no leídos como leídos
        let unreadMessagesCount = 0;
        messages.forEach((message: Message) => {
          if (!message.read && message.from === newActiveChat) {
            unreadMessagesCount++;
            console.log('Marcando mensaje como leído al cambiar chat:', message.id);
            socket.emit('message_read', message.id);
            store.dispatch(markMessageAsRead(message.id));
          }
        });
        
        console.log(`Marcados ${unreadMessagesCount} mensajes como leídos`);
      }
    }
    
    return next(action);
  }

  // Manejar acciones específicas de socket
  if (action.type === socketActions.LOGIN && typeof action.payload === 'string') {
    socket.emit('login', action.payload);
    store.dispatch(userLogin(action.payload));
  } else if (action.type === socketActions.SEND_MESSAGE && typeof action.payload === 'object' && 'message' in action.payload && 'to' in action.payload) {
    const payload = action.payload as MessagePayload;
    const state = store.getState();
    
    const messageData: Message = {
      id: Date.now().toString(),
      to: payload.to,
      from: state.user.username,
      message: payload.message,
      time: new Date().toLocaleTimeString(),
      read: false
    };
    
    // Añadir mensaje al estado local
    store.dispatch(addMessage(messageData));
    
    // Enviar mensaje al servidor
    socket.emit('private_message', messageData);
  } else if (action.type === socketActions.MARK_AS_READ && typeof action.payload === 'string') {
    const messageId = action.payload;
    console.log('Enviando confirmación de lectura para mensaje:', messageId);
    socket.emit('message_read', messageId);
    store.dispatch(markMessageAsRead(messageId));
  }

  // Pasar la acción al siguiente middleware
  return next(action);
};

export default socketMiddleware;
