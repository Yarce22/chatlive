import { useState } from "react"
import { CardContent, Card, Form, FormField, Container, Input, Message, MessageHeader } from 'semantic-ui-react'
import ScrollToBottom from 'react-scroll-to-bottom'

interface ChatProps {
  messages: { message: string; from: string; time: string }[];
  sendMessage: (message: string) => void;
  recipient: string;
  currentUser: string;
}

const Chat = ({ messages, sendMessage, recipient, currentUser }: ChatProps) => {
    const [currentMessage, setCurrentMessage] = useState('')
    
    const handleSendMessage = () => {
        if (currentMessage.trim()) {
            sendMessage(currentMessage);
            setCurrentMessage('');
        }
    }
    
    return (
        <Container fluid>
            <Card>
                <CardContent header={`Chat con ${recipient}`} />
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
                                    <p>{messageData.time}</p>
                                </Message>
                            );
                        })}
                    </CardContent>
                </ScrollToBottom>
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
            </Card>
        </Container>
    )
}

export { Chat }