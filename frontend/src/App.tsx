import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { Container } from "semantic-ui-react"
import { Chat } from './components/Chat'
import { LogIn } from './components/LogIn'
import { UserLogged } from './components/UserLogged'
import './App.css'

const socket = io('http://localhost:3000')

function App() {
  const [username, setUsername] = useState('')
  const [logged, setLogged] = useState(false)
  const [usersList, setUsersList] = useState<string[]>([])
  const [activeChat, setActiveChat] = useState<string>('')
  const [chats, setChats] = useState<{[key: string]: {message: string, from: string, time: string}[]}>({})
  const [unreadMessages, setUnreadMessages] = useState<{[key: string]: number}>({})

  useEffect(() => {
    // Escuchar actualizaciones de la lista de usuarios
    socket.on('users_list', (users: string[]) => {
      console.log('Usuarios conectados:', users);
      setUsersList(users.filter(user => user !== username));
    });

    // Escuchar mensajes privados
    socket.on('receive_private_message', (data: {message: string, from: string, time: string}) => {
      console.log('Mensaje privado recibido:', data);
      const { from } = data;
      
      // Actualizar el chat con este usuario
      setChats(prevChats => ({
        ...prevChats,
        [from]: [...(prevChats[from] || []), data]
      }));

      // Incrementar contador de mensajes no leídos si no es el chat activo
      if (from !== activeChat) {
        setUnreadMessages(prev => ({
          ...prev,
          [from]: (prev[from] || 0) + 1
        }));
      }
    });

    return () => {
      socket.off('users_list');
      socket.off('receive_private_message');
    };
  }, [username, activeChat]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (username) {
      socket.emit('login', username)
      setLogged(true)
    }
  }

  const handleChatSelect = (selectedUser: string) => {
    setActiveChat(selectedUser);
    // Inicializar el chat si no existe
    if (!chats[selectedUser]) {
      setChats(prev => ({
        ...prev,
        [selectedUser]: []
      }));
    }
    
    // Resetear contador de mensajes no leídos para este usuario
    setUnreadMessages(prev => ({
      ...prev,
      [selectedUser]: 0
    }));
  }

  const sendPrivateMessage = (message: string) => {
    if (message && activeChat) {
      const messageData = {
        to: activeChat,
        from: username,
        message,
        time: new Date().toLocaleTimeString()
      };

      // Enviar mensaje al servidor
      socket.emit('private_message', messageData);

      // Actualizar el chat local
      const chatMessage = {
        message,
        from: username,
        time: messageData.time
      };

      setChats(prevChats => ({
        ...prevChats,
        [activeChat]: [...(prevChats[activeChat] || []), chatMessage]
      }));
    }
  }

  return (
    <Container>
      {!logged 
        ? <LogIn
            handleLogin={handleLogin}
            username={username}
            setUsername={setUsername}
          />
        : <section className="chatContainer">
            <UserLogged
              usersList={usersList}
              onSelectUser={handleChatSelect}
              activeChat={activeChat}
              unreadMessages={unreadMessages}
            />
            {activeChat && (
              <Chat
                messages={chats[activeChat] || []}
                sendMessage={sendPrivateMessage}
                recipient={activeChat}
                currentUser={username}
              />
            )}
          </section>
      }
    </Container>
  )
}

export default App
