/**
 * Componente reutilizable para mostrar burbujas de mensajes en chats
 */

import React from 'react';
import { Message as SemanticMessage, MessageHeader, Icon, Label } from 'semantic-ui-react';

interface MessageBubbleProps {
  /** Contenido del mensaje */
  message: string;
  /** Remitente del mensaje */
  sender: string;
  /** Timestamp del mensaje */
  time: string;
  /** Indica si el mensaje ha sido leu00eddo */
  read: boolean;
  /** Indica si el mensaje es del usuario actual */
  isCurrentUser: boolean;
  /** Nombre del grupo (opcional, solo para mensajes de grupo) */
  groupName?: string;
  /** Indica si es un mensaje de grupo */
  isGroupMessage?: boolean;
}

/**
 * Componente de burbuja de mensaje reutilizable
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  time,
  read,
  isCurrentUser,
  groupName,
  isGroupMessage
}) => {
  /**
   * Renderiza el indicador de lectura para mensajes enviados
   */
  const renderReadIndicator = () => {
    if (isCurrentUser) {
      return (
        <span className="read-status" style={{ marginLeft: '8px' }}>
          {read ? (
            <Icon name="check circle" color="blue" size="small" title="Leu00eddo por todos" />
          ) : (
            <Icon name="check circle outline" color="grey" size="small" title="Enviado" />
          )}
        </span>
      );
    }
    return null;
  };

  return (
    <SemanticMessage
      style={{
        textAlign: isCurrentUser ? "right" : "left",
        marginBottom: '10px'
      }}
      success={isCurrentUser}
      info={!isCurrentUser}
      className={`message-bubble ${isCurrentUser ? 'sent' : 'received'}`}
    >
      {isGroupMessage && !isCurrentUser && (
        <Label color="blue" size="tiny" style={{ marginBottom: '5px' }}>
          {sender}
        </Label>
      )}
      <MessageHeader>{message}</MessageHeader>
      <div 
        className="message-footer" 
        style={{ 
          display: 'flex', 
          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', 
          alignItems: 'center'
        }}
      >
        <span className="message-time" style={{ fontSize: '0.8em', color: '#888' }}>
          {time}
        </span>
        {renderReadIndicator()}
      </div>
    </SemanticMessage>
  );
};

export default MessageBubble;
