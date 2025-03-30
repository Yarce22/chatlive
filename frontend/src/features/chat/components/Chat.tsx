import { useState, useRef, useEffect, useCallback, memo } from "react";
import { CardContent, Card, Form, FormField, Container, Input } from 'semantic-ui-react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { Message as MessageType } from "../../../shared/types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { socketActions } from "../../../shared/middleware/socketMiddleware";
import { selectGroup } from "../../../store/slices/chatSlice";
import MessageBubble from "../../../common/components/MessageBubble";
import { ErrorType, handleError } from "../../../shared/services/errorService";
import { TYPING_INDICATOR_TIMEOUT } from "../../../shared/config/constants";

interface ChatProps {
  messages: MessageType[];
  sendMessage: (message: string) => void;
  recipient: string;
  currentUser: string;
  isGroup?: boolean;
}

const Chat = memo(({ messages, sendMessage, recipient, currentUser, isGroup = false }: ChatProps) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dispatch = useAppDispatch();
    
    const group = useAppSelector(state => isGroup ? selectGroup(state, recipient) : null);
    
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        try {
            if (messages && messages.length > 0) {
                messages.forEach(message => {
                    if (!message.read) {
                        if ((isGroup && message.groupId === recipient) || 
                            (!isGroup && message.from === recipient)) {
                        
                        dispatch({
                            type: socketActions.MARK_AS_READ,
                            payload: message.id
                        });
                    }
                }
            });
        }
    } catch (error) {
        handleError(error, ErrorType.Unknown, { component: 'Chat', method: 'useEffect[messages]' });
    }
    }, [messages, recipient, dispatch, isGroup]);
    
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);
    
    useEffect(() => {
        console.log('Chat activo cambiado a:', recipient, isGroup ? '(grupo)' : '(usuario)');
        setCurrentMessage('');
        setIsTyping(false);
    }, [recipient, isGroup]);
    
    const handleSendMessage = useCallback(() => {
        if (currentMessage.trim()) {
            sendMessage(currentMessage);
            setCurrentMessage('');
            setIsTyping(false);
        }
    }, [currentMessage, sendMessage]);

    const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentMessage(e.target.value);
        
        if (!isTyping) {
            setIsTyping(true);
        }
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, TYPING_INDICATOR_TIMEOUT);
    }, [isTyping]);

    const chatTitle = isGroup && group ? group.name : recipient;
    
    return (
        <Container fluid className="chat-container">
            <Card>
                <CardContent>
                    <div className="chat-header">
                        <h3>{chatTitle}</h3>
                        {isGroup && group && (
                            <div className="group-info">
                                <p>Miembros: {group.members.join(', ')}</p>
                                <p>Creado por: {group.createdBy}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
                <div className="messages-area" style={{ height: '400px', overflowY: 'auto' }}>
                    <ScrollToBottom>
                        <CardContent>
                            {messages.length === 0 ? (
                                <div className="no-messages" style={{ textAlign: 'center', padding: '20px' }}>
                                    <p>No hay mensajes. u00a1Envu00eda el primero!</p>
                                </div>
                            ) : (
                                messages.map((messageData, index) => {
                                    const isCurrentUser = messageData.from === currentUser;
                                    return (
                                        <MessageBubble
                                            key={`${messageData.id || index}-${messageData.read ? 'read' : 'unread'}`}
                                            message={messageData.message}
                                            sender={messageData.from}
                                            time={messageData.time}
                                            read={messageData.read}
                                            isCurrentUser={isCurrentUser}
                                            isGroupMessage={isGroup}
                                            groupName={isGroup && group ? group.name : undefined}
                                        />
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>
                    </ScrollToBottom>
                </div>
                <div className="input-area">
                    <CardContent>
                        <Form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                            <FormField>
                                <Input 
                                    fluid 
                                    action={{
                                        content: 'Enviar',
                                        onClick: handleSendMessage,
                                        color: 'blue'
                                    }}
                                    placeholder={`Escribe un mensaje para ${isGroup ? 'el grupo' : recipient}...`}
                                    value={currentMessage}
                                    onChange={handleMessageChange}
                                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                                />
                            </FormField>
                        </Form>
                    </CardContent>
                </div>
            </Card>
        </Container>
    );
});

export { Chat };
