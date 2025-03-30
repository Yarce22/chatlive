import React from 'react';
import { Message as SemanticMessage, MessageHeader, Icon, Label } from 'semantic-ui-react';

interface MessageBubbleProps {
  message: string;
  sender: string;
  time: string;
  read: boolean;
  isCurrentUser: boolean;
  groupName?: string;
  isGroupMessage?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  time,
  read,
  isCurrentUser,
  isGroupMessage
}) => {

  const renderReadIndicator = () => {
    if (isCurrentUser) {
        return (
            <Icon 
                name="check" 
                color={read ? "green" : "grey"} 
                style={{ marginLeft: '5px' }} 
            />
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
