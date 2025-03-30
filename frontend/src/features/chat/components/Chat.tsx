/**
 * Componente principal de chat que muestra mensajes y permite enviar nuevos mensajes
 */

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { CardContent, Card, Form, FormField, Container, Input } from 'semantic-ui-react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { Message as MessageType } from "../../../shared/types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { socketActions } from "../../../shared/middleware/socketMiddleware";
import { selectGroup } from "../slices/chatSlice";
import MessageBubble from "../../../common/components/MessageBubble";
import { ErrorType, handleError } from "../../../shared/services/errorService";
import { TYPING_INDICATOR_TIMEOUT } from "../../../shared/config/constants";

interface ChatProps {
  /** Lista de mensajes a mostrar */
  messages: MessageType[];
  /** Funciu00f3n para enviar un nuevo mensaje */
  sendMessage: (message: string) => void;
  /** ID del destinatario o grupo */
  recipient: string;
  /** Nombre de usuario del usuario actual */
  currentUser: string;
  /** Indica si se trata de un chat grupal */
  isGroup?: boolean;
}

/**
 * Componente de chat optimizado con memo para evitar renderizados innecesarios
 */
const Chat = memo(({ messages, sendMessage, recipient, currentUser, isGroup = false }: ChatProps) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dispatch = useAppDispatch();
    
    // Seleccionar datos del grupo si es un chat grupal
    const group = useAppSelector(state => isGroup ? selectGroup(state, recipient) : null);
    
    // Optimizaciu00f3n: useCallback para evitar recreaciones innecesarias de funciones
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);
    
    // Efecto para desplazarse al final cuando cambian los mensajes
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Efecto para marcar mensajes como leu00eddos cuando se muestran en el chat activo
    useEffect(() => {
        try {
            if (messages && messages.length > 0) {
                // Procesar todos los mensajes no leu00eddos del remitente actual o del grupo actual
                messages.forEach(message => {
                    if (!message.read) {
                        // Para mensajes de grupo, verificar si el mensaje pertenece a este grupo
                        if ((isGroup && message.groupId === recipient) || 
                            // Para mensajes privados, verificar si el mensaje es del usuario seleccionado
                            (!isGroup && message.from === recipient)) {
                            
                            console.log('Chat component: Marcando mensaje como leu00eddo:', message.id);
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
    
    // Efecto de limpieza para el timeout de escritura
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);
    
    // Resetear cuando cambia el chat activo
    useEffect(() => {
        console.log('Chat activo cambiado a:', recipient, isGroup ? '(grupo)' : '(usuario)');
        setCurrentMessage('');
        setIsTyping(false);
    }, [recipient, isGroup]);
    
    // Manejador de envio de mensajes optimizado con useCallback
    const handleSendMessage = useCallback(() => {
        if (currentMessage.trim()) {
            sendMessage(currentMessage);
            setCurrentMessage('');
            setIsTyping(false);
        }
    }, [currentMessage, sendMessage]);

    // Manejador de cambio de mensaje con indicador de escritura
    const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentMessage(e.target.value);
        
        // Implementar indicador de escritura
        if (!isTyping) {
            setIsTyping(true);
            // Au00f1adir lu00f3gica para emitir evento de escritura si es necesario
        }
        
        // Reiniciar el timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            // Au00f1adir lu00f3gica para emitir evento de fin de escritura si es necesario
        }, TYPING_INDICATOR_TIMEOUT);
    }, [isTyping]);

    // Obtener el tu00edtulo del chat (nombre del usuario o nombre del grupo)
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

// Asignar displayName para facilitar la depuraciu00f3n
Chat.displayName = 'Chat';

export { Chat };
