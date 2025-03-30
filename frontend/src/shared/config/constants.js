/**
 * Constantes de configuraciu00f3n global para la aplicaciu00f3n
 */

// URLs y endpoints
export const SOCKET_SERVER_URL = 'http://localhost:3000';
export const API_BASE_URL = 'http://localhost:3000/api';

// Configuraciones de la aplicaciu00f3n
export const APP_NAME = 'ChatLive';
export const MESSAGE_PAGE_SIZE = 50; // Nu00famero de mensajes a cargar por pu00e1gina en la paginaciu00f3n
export const TYPING_INDICATOR_TIMEOUT = 3000; // Tiempo en ms para ocultar el indicador de escritura

// Tiempos
export const MESSAGE_POLLING_INTERVAL = 5000; // Intervalo para verificar nuevos mensajes (fallback)
export const CONNECTION_RETRY_DELAY = 3000; // Tiempo entre intentos de reconexiu00f3n

// Lu00edmites
export const MAX_MESSAGE_LENGTH = 1000; // Longitud mu00e1xima de un mensaje
export const MAX_GROUP_NAME_LENGTH = 50; // Longitud mu00e1xima del nombre de un grupo
export const MAX_GROUP_MEMBERS = 50; // Nu00famero mu00e1ximo de miembros en un grupo

// Claves de almacenamiento local
export const LOCAL_STORAGE_USER_KEY = 'chatLive_user';
export const LOCAL_STORAGE_TOKEN_KEY = 'chatLive_token';

// Configuraciones visuales
export const THEME = {
  primary: '#2185d0',
  secondary: '#1b1c1d',
  success: '#21ba45',
  warning: '#fbbd08',
  error: '#db2828',
  info: '#31CCEC'
};
