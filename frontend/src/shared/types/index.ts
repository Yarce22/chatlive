/**
 * Definiciones de tipos globales para la aplicaciu00f3n
 * Este archivo centraliza todos los tipos que se comparten a travu00e9s de diferentes features
 */

/**
 * Representa un mensaje de chat, ya sea privado o de grupo
 * @property id - Identificador u00fanico del mensaje
 * @property from - Nombre de usuario del remitente
 * @property to - Nombre de usuario del destinatario (solo para mensajes privados)
 * @property message - Contenido del mensaje
 * @property time - Timestamp del mensaje en formato string
 * @property read - Indica si el mensaje ha sido leu00eddo
 * @property isGroupMessage - Indica si es un mensaje de grupo
 * @property groupId - ID del grupo (solo para mensajes de grupo)
 */
export interface Message {
  id: string;
  from: string;
  to?: string;
  message: string;
  time: string;
  read: boolean;
  isGroupMessage?: boolean;
  groupId?: string;
}

/**
 * Representa un grupo de chat
 * @property id - Identificador u00fanico del grupo
 * @property name - Nombre del grupo
 * @property members - Array con los nombres de usuario de los miembros
 * @property createdBy - Nombre de usuario del creador del grupo
 */
export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
}

/**
 * Tipo que representa el estado de un mensaje de chat
 */
export type MessageStatus = 'sent' | 'delivered' | 'read';

/**
 * Tipo que representa un usuario conectado
 */
export interface ConnectedUser {
  username: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}
