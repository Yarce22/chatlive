import { useState, useRef, useEffect } from "react";
import { CardContent, Card, Form, FormField, Container, Input, Message as SemanticMessage, MessageHeader, Icon, Label } from 'semantic-ui-react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { Message as MessageType } from "../../store/slices/chatSlice.js";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import { socketActions } from "../../store/middleware/socketMiddleware.js";
import { selectGroup } from "../../store/slices/chatSlice.js";

interface ChatProps {
  messages: MessageType[];
  sendMessage: (message: string) => void;
  recipient: string;
  currentUser: string;
  isGroup?: boolean;
}

const Chat = ({ messages, sendMessage, recipient, currentUser, isGroup = false }: ChatProps) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();
    const group = useAppSelector(state => isGroup ? selectGroup(state, recipient) : null);
    
    // Función para desplazarse al final de los mensajes
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Desplazarse hacia abajo cuando cambian los mensajes
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Marcar mensajes como leídos cuando se muestran en el chat activo
    useEffect(() => {
        // Verificar si hay mensajes nuevos para marcar como leídos
        if (messages && messages.length > 0) {
            // Procesar todos los mensajes no leídos del remitente actual o del grupo actual
            messages.forEach(message => {
                if (!message.read) {
                    // Para mensajes de grupo, verificar si el mensaje pertenece a este grupo
                    if ((isGroup && message.groupId === recipient) || 
                        // Para mensajes privados, verificar si el mensaje es del usuario seleccionado
                        (!isGroup && message.from === recipient)) {
                        
                        console.log('Chat component: Marcando mensaje como leído:', message.id);
                        dispatch({
                            type: socketActions.MARK_AS_READ,
                            payload: message.id
                        });
                    }
                }
            });
        }
    }, [messages, recipient, dispatch, isGroup]);
    
    // Resetear cuando cambia el chat activo
    useEffect(() => {
        console.log('Chat activo cambiado a:', recipient, isGroup ? '(grupo)' : '(usuario)');
    }, [recipient, isGroup]);
    
    const handleSendMessage = () => {
        if (currentMessage.trim()) {
            sendMessage(currentMessage);
            setCurrentMessage('');
        }
    };

    // Función para renderizar el indicador de lectura
    const renderReadIndicator = (messageData: MessageType) => {
        if (messageData.from === currentUser) {
            return (
                <span className="read-status" style={{ marginLeft: '8px' }}>
                    {messageData.read ? (
                        <Icon name="check circle" color="blue" size="small" title="Leído por todos" />
                    ) : (
                        <Icon name="check circle outline" color="grey" size="small" title="Enviado" />
                    )}
                </span>
            );
        }
        return null;
    };

    // Obtener el título del chat (nombre del usuario o nombre del grupo)
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
                                    <p>No hay mensajes. ¡Envía el primero!</p>
                                </div>
                            ) : (
                                messages.map((messageData, index) => {
                                    const isCurrentUser = messageData.from === currentUser;
                                    return (
                                        <SemanticMessage
                                            key={`${messageData.id || index}-${messageData.read ? 'read' : 'unread'}`}
                                            style={{ 
                                                textAlign: isCurrentUser ? "right" : "left",
                                                marginBottom: '10px'
                                            }}
                                            success={isCurrentUser}
                                            info={!isCurrentUser}
                                        >
                                            {isGroup && !isCurrentUser && (
                                                <Label color="blue" size="tiny" style={{ marginBottom: '5px' }}>
                                                    {messageData.from}
                                                </Label>
                                            )}
                                            <MessageHeader>{messageData.message}</MessageHeader>
                                            <div className="message-footer" style={{ display: 'flex', justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
                                                <span className="message-time" style={{ fontSize: '0.8em', color: '#888' }}>{messageData.time}</span>
                                                {renderReadIndicator(messageData)}
                                            </div>
                                        </SemanticMessage>
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
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                                />
                            </FormField>
                        </Form>
                    </CardContent>
                </div>
            </Card>
        </Container>
    );
};

export { Chat };