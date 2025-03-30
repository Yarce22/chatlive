import { Container } from "semantic-ui-react"
import { Chat } from './components/Chat'
import { LogIn } from './components/LogIn'
import { UserLogged } from './components/UserLogged'
import { useAppDispatch, useAppSelector } from './store/hooks.js'
import { selectUsername, selectLogged } from './store/slices/userSlice.js'
import { selectActiveChat, selectActiveChatMessages, selectActiveChatIsGroup } from './store/slices/chatSlice.js'
import { selectUsersList } from './store/slices/usersSlice.js'
import { socketActions } from './store/middleware/socketMiddleware.js'
import './App.css'

function App() {
  const dispatch = useAppDispatch();
  const username = useAppSelector(selectUsername);
  const logged = useAppSelector(selectLogged);
  const usersList = useAppSelector(selectUsersList);
  const activeChat = useAppSelector(selectActiveChat);
  const activeChatIsGroup = useAppSelector(selectActiveChatIsGroup);
  const messages = useAppSelector(selectActiveChatMessages);
  const unreadMessages = useAppSelector(state => state.chat.unreadMessages);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (username) {
      dispatch({ type: socketActions.LOGIN, payload: username });
    }
  }

  const handleChatSelect = (selectedUser: string) => {
    dispatch({
      type: 'chat/setActiveChat',
      payload: { chatId: selectedUser, isGroup: false }
    });
  }

  const sendMessage = (message: string) => {
    if (message && activeChat) {
      if (activeChatIsGroup) {
        dispatch({
          type: socketActions.SEND_GROUP_MESSAGE,
          payload: {
            message,
            groupId: activeChat
          }
        });
      } else {
        dispatch({
          type: socketActions.SEND_MESSAGE,
          payload: {
            message,
            to: activeChat
          }
        });
      }
    }
  }

  const handleUsernameChange = (value: string) => {
    dispatch({ type: 'user/setUsername', payload: value });
  }

  return (
    <Container>
      {!logged 
        ? <LogIn
            handleLogin={handleLogin}
            username={username}
            setUsername={handleUsernameChange}
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
                messages={messages}
                sendMessage={sendMessage}
                recipient={activeChat}
                currentUser={username}
                isGroup={activeChatIsGroup}
              />
            )}
          </section>
      }
    </Container>
  )
}

export default App
