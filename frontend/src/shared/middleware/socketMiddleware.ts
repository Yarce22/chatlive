/**
 * Middleware de sockets para Redux
 * Este middleware permite la comunicaciu00f3n en tiempo real entre el frontend y el backend
 * utilizando Socket.IO, y se integra con el flujo de Redux.
 */

import { io, Socket } from 'socket.io-client';
import { Middleware } from '@reduxjs/toolkit';
import { Group, Message } from '../types';
import { AppDispatch, RootState } from '../../store';

// Importaciu00f3n de acciones desde sus respectivos slices
import { 
  receiveMessage, 
  markMessageAsRead, 
  addMessage, 
  setActiveChat, 
  clearUnreadMessages,
  createGroup,
  addGroupMessage,
  updateGroup,
  addMemberToGroup,
  removeMemberFromGroup
} from '../../features/chat/slices/chatSlice';

import { setUsersList } from '../../features/users/slices/usersSlice';
import { login as userLogin } from '../../features/auth/slices/userSlice';

// Configuraciones
import { SOCKET_SERVER_URL } from '../config/constants';

// Tipos para las acciones
interface MessagePayload {
  message: string;
  to: string;
}

interface GroupMessagePayload {
  message: string;
  groupId: string;
}

interface CreateGroupPayload {
  name: string;
  members: string[];
}

interface GroupActionPayload {
  groupId: string;
  username?: string;
  name?: string;
  members?: string[];
  updates?: Partial<Group>;
}

// Tipo base para las acciones de socket
type ActionPayload = string | MessagePayload | { messageId: string } | CreateGroupPayload | GroupMessagePayload | GroupActionPayload;

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
  SET_ACTIVE_CHAT: 'socket/setActiveChat',
  CREATE_GROUP: 'socket/createGroup',
  SEND_GROUP_MESSAGE: 'socket/sendGroupMessage',
  ADD_MEMBER_TO_GROUP: 'socket/addMemberToGroup',
  REMOVE_MEMBER_FROM_GROUP: 'socket/removeMemberFromGroup',
  UPDATE_GROUP: 'socket/updateGroup'
};

/**
 * Verificador de tipo para acciones de socket
 * @param action - La acciu00f3n a verificar
 * @returns Boolean indicando si la acciu00f3n es una acciu00f3n de socket vu00e1lida
 */
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

/**
 * Inicializa y devuelve una instancia de Socket.IO
 * Implementa el patru00f3n Singleton para garantizar una u00fanica instancia
 * @returns Una instancia de Socket.IO
 */
const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL);
  }
  return socket;
};

/**
 * Configura los listeners del socket
 * @param socket - La instancia del socket
 * @param store - El store de Redux
 */
const setupSocketListeners = (socket: Socket, store: { getState: () => RootState; dispatch: AppDispatch }) => {
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
      
      // Si es el chat activo, marcar el mensaje como leu00eddo inmediatamente
      const state = store.getState();
      if (state.chat.activeChat === data.from && !state.chat.activeChatIsGroup) {
        socket.emit('message_read', data.id);
        store.dispatch(markMessageAsRead(data.id));
      }
    });

    // Listener para confirmaciu00f3n de mensajes enviados
    socket.on('message_sent', (data: Message) => {
      // No volver a au00f1adir el mensaje, ya que lo au00f1adimos antes de enviarlo
      console.log('Mensaje enviado confirmado por el servidor:', data.id);
      
      // Actualizar el ID del mensaje si el servidor asignu00f3 uno nuevo
      if (data.id) {
        // Buscar el mensaje en el estado actual y actualizarlo si es necesario
        const state = store.getState();
        const chats = state.chat.chats;
        
        if (data.to && chats[data.to]) {
          const messages = chats[data.to];
          const lastMessage = messages[messages.length - 1];
          
          // Si el u00faltimo mensaje tiene un ID temporal diferente, actualizarlo
          if (lastMessage && lastMessage.from === state.user.username && 
              lastMessage.message === data.message && lastMessage.id !== data.id) {
            // Marcar el mensaje con el ID correcto como leu00eddo si el original estaba marcado como leu00eddo
            if (lastMessage.read) {
              store.dispatch(markMessageAsRead(data.id));
            }
          }
        } else if (data.groupId && chats[data.groupId]) {
          const messages = chats[data.groupId];
          const lastMessage = messages[messages.length - 1];
          
          // Si el u00faltimo mensaje tiene un ID temporal diferente, actualizarlo
          if (lastMessage && lastMessage.from === state.user.username && 
              lastMessage.message === data.message && lastMessage.id !== data.id) {
            // Marcar el mensaje con el ID correcto como leu00eddo si el original estaba marcado como leu00eddo
            if (lastMessage.read) {
              store.dispatch(markMessageAsRead(data.id));
            }
          }
        }
      }
    });

    // Listener para confirmaciu00f3n de lectura de mensajes
    socket.on('message_read_confirmation', (messageId: string) => {
      console.log('Mensaje marcado como leu00eddo:', messageId);
      store.dispatch(markMessageAsRead(messageId));
    });

    // Listeners para grupos
    socket.on('group_created', (group: Group) => {
      console.log('Grupo creado:', group);
      store.dispatch(createGroup(group));
    });

    // Listener para la lista de grupos
    socket.on('groups_list', (groups: Group[]) => {
      console.log('Lista de grupos recibida:', groups);
      groups.forEach(group => {
        store.dispatch(createGroup(group));
      });
    });

    socket.on('receive_group_message', (data: Message) => {
      console.log('Mensaje de grupo recibido:', data);
      store.dispatch(addGroupMessage(data));
      
      // Si es el chat de grupo activo, marcar el mensaje como leu00eddo inmediatamente
      const state = store.getState();
      if (state.chat.activeChat === data.groupId && state.chat.activeChatIsGroup) {
        socket.emit('message_read', data.id);
        store.dispatch(markMessageAsRead(data.id));
      }
    });

    socket.on('group_updated', (data: {groupId: string, updates: Partial<Group>}) => {
      console.log('Grupo actualizado:', data);
      store.dispatch(updateGroup(data));
    });

    socket.on('member_added_to_group', (data: {groupId: string, username: string}) => {
      console.log('Miembro au00f1adido al grupo:', data);
      store.dispatch(addMemberToGroup(data));
    });

    socket.on('member_removed_from_group', (data: {groupId: string, username: string}) => {
      console.log('Miembro eliminado del grupo:', data);
      store.dispatch(removeMemberFromGroup(data));
    });

    socket.on('removed_from_group', (data: {groupId: string}) => {
      console.log('Has sido eliminado del grupo:', data.groupId);
      // Si el chat activo es el grupo del que fuiste eliminado, cambiar a otro chat
      const state = store.getState();
      if (state.chat.activeChat === data.groupId && state.chat.activeChatIsGroup) {
        // Cambiar a ningu00fan chat activo
        store.dispatch(setActiveChat({ chatId: '', isGroup: false }));
      }
    });
  }
};

/**
 * Middleware de Socket.IO para Redux
 * Intercepta acciones relacionadas con sockets y las gestiona adecuadamente
 */
export const socketMiddleware: Middleware = store => next => (action: unknown) => {
  // Asegurarse de que el socket estu00e9 inicializado
  const socket = initializeSocket();
  
  // Configurar listeners de socket
  setupSocketListeners(socket, store);

  // Verificar que la acciu00f3n tenga la estructura correcta
  if (!isSocketAction(action)) {
    // Si es la acciu00f3n setActiveChat, manejarla especialmente
    if (action && typeof action === 'object' && 'type' in action && action.type === setActiveChat.type) {
      const payload = 'payload' in action ? action.payload : null;
      if (payload && typeof payload === 'object' && 'chatId' in payload) {
        const { chatId, isGroup } = payload as {chatId: string, isGroup: boolean};
        const state = store.getState();
        const messages = state.chat.chats[chatId] || [];
        
        console.log('Cambiando a chat activo:', chatId, 'isGroup:', isGroup);
        console.log('Mensajes en este chat:', messages.length);
        
        // Resetear contador de mensajes no leu00eddos
        store.dispatch(clearUnreadMessages(chatId));
        
        // Marcar todos los mensajes no leu00eddos como leu00eddos
        let unreadMessagesCount = 0;
        messages.forEach((message: Message) => {
          if (!message.read && ((isGroup && message.groupId === chatId) || (!isGroup && message.from === chatId))) {
            unreadMessagesCount++;
            console.log('Marcando mensaje como leu00eddo al cambiar chat:', message.id);
            socket.emit('message_read', message.id);
            store.dispatch(markMessageAsRead(message.id));
          }
        });
        
        console.log(`Marcados ${unreadMessagesCount} mensajes como leu00eddos`);
      }
    }
    
    return next(action);
  }

  // Manejar acciones especu00edficas de socket
  handleSocketAction(action, socket, store);

  // Pasar la acciu00f3n al siguiente middleware
  return next(action);
};

/**
 * Maneja acciones especu00edficas de socket
 * @param action - La acciu00f3n a manejar
 * @param socket - La instancia del socket
 * @param store - El store de Redux
 */
const handleSocketAction = (action: SocketAction, socket: Socket, store: { getState: () => RootState; dispatch: AppDispatch }) => {
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
    
    // Au00f1adir mensaje al estado local
    store.dispatch(addMessage(messageData));
    
    // Enviar mensaje al servidor
    socket.emit('private_message', messageData);
  } else if (action.type === socketActions.MARK_AS_READ && typeof action.payload === 'string') {
    const messageId = action.payload;
    console.log('Enviando confirmaciu00f3n de lectura para mensaje:', messageId);
    socket.emit('message_read', messageId);
    store.dispatch(markMessageAsRead(messageId));
  } else if (action.type === socketActions.CREATE_GROUP && typeof action.payload === 'object' && 'name' in action.payload && 'members' in action.payload) {
    const payload = action.payload as CreateGroupPayload;
    const state = store.getState();
    
    // Au00f1adir al usuario actual como miembro del grupo
    const members = [...payload.members];
    if (!members.includes(state.user.username)) {
      members.push(state.user.username);
    }
    
    const groupData: Group = {
      id: 'group_' + Date.now().toString(),
      name: payload.name,
      members: members,
      createdBy: state.user.username
    };
    
    // Enviar la solicitud de creaciu00f3n de grupo al servidor
    socket.emit('create_group', groupData);
  } else if (action.type === socketActions.SEND_GROUP_MESSAGE && typeof action.payload === 'object' && 'message' in action.payload && 'groupId' in action.payload) {
    const payload = action.payload as GroupMessagePayload;
    const state = store.getState();
    
    const messageData: Message = {
      id: Date.now().toString(),
      from: state.user.username,
      message: payload.message,
      time: new Date().toLocaleTimeString(),
      read: false,
      isGroupMessage: true,
      groupId: payload.groupId
    };
    
    // Au00f1adir mensaje al estado local
    store.dispatch(addGroupMessage(messageData));
    
    // Enviar mensaje al servidor
    socket.emit('group_message', messageData);
  } else if (action.type === socketActions.ADD_MEMBER_TO_GROUP && typeof action.payload === 'object' && 'groupId' in action.payload && 'username' in action.payload) {
    const payload = action.payload as GroupActionPayload;
    socket.emit('add_member_to_group', payload);
  } else if (action.type === socketActions.REMOVE_MEMBER_FROM_GROUP && typeof action.payload === 'object' && 'groupId' in action.payload && 'username' in action.payload) {
    const payload = action.payload as GroupActionPayload;
    socket.emit('remove_member_from_group', payload);
  } else if (action.type === socketActions.UPDATE_GROUP && typeof action.payload === 'object' && 'groupId' in action.payload) {
    const payload = action.payload as GroupActionPayload;
    socket.emit('update_group', payload);
  }
};

export default socketMiddleware;
