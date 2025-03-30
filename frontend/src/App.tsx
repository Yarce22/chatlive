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
  const [room, setRoom] = useState('')
  const [logged, setLogged] = useState(false)
  const [usernameList, setUsernameList] = useState<string[]>([])

  useEffect(() => {
    // Escuchar actualizaciones de la lista de usuarios
    socket.on('users_in_room', (users: string[]) => {
      console.log('Usuarios en la sala:', users);
      setUsernameList(users);
    });

    return () => {
      socket.off('users_in_room');
    };
  }, []);

  const joinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (username && room) {
      socket.emit('join_room', { username, room })
      setLogged(true)
    }
  }

  return (
    <Container>
      {!logged 
        ? <LogIn
          joinRoom={joinRoom}
            username={username}
            setUsername={setUsername}
          room={room}
          setRoom={setRoom}
          />
        : <section className="chatContainer">
            <UserLogged
            usernameList={usernameList}
            username={username}
            />
              <Chat
            socket={socket}
            username={username}
            room={room}
          />
          </section>
      }
    </Container>
  )
}

export default App
