import { useState, useRef, useEffect } from "react"
import { CardContent, Card, Form, FormField, Container, Input, Message, MessageHeader, Icon } from 'semantic-ui-react'
import ScrollToBottom from 'react-scroll-to-bottom'

interface Message {
  id: string;
  message: string;
  from: string;
  to?: string;
  time: string;
  read: boolean;
}

interface ChatProps {
  messages: Message[];
  sendMessage: (message: string) => void;
  recipient: string;
  currentUser: string;
}

const Chat = ({ messages, sendMessage, recipient, currentUser }: ChatProps) => {
    const [currentMessage, setCurrentMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    
    // Función para desplazarse al final de los mensajes
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    
    // Desplazarse hacia abajo cuando cambian los mensajes
    useEffect(() => {
        scrollToBottom()
    }, [messages])
    
    const handleSendMessage = () => {
        if (currentMessage.trim()) {
            sendMessage(currentMessage);
            setCurrentMessage('');
        }
    }
    
    return (
        <Container fluid className="chat-container">
            <Card>
                <CardContent header={recipient} />
                <div className="messages-area">
                    <ScrollToBottom>
                        <CardContent>
                            {messages.map((messageData, index) => {
                                const isCurrentUser = messageData.from === currentUser;
                                return (
                                    <Message
                                        key={index}
                                        style={{ textAlign: isCurrentUser ? "right" : "left" }}
                                        success={isCurrentUser}
                                        info={!isCurrentUser}
                                    >
                                        <MessageHeader>{messageData.message}</MessageHeader>
                                        <div className="message-footer">
                                            <span className="message-time">{messageData.time}</span>
                                            {isCurrentUser && (
                                                <span className="read-status">
                                                    {messageData.read ? (
                                                        <Icon name="check circle" color="blue" />
                                                    ) : (
                                                        <Icon name="check circle outline" color="grey" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </Message>
                                );
                            })}
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
                                        onClick: handleSendMessage
                                    }}
                                    placeholder="Escribe un mensaje..."
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
    )
}

export { Chat }