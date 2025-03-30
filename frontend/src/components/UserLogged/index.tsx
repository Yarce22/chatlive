import { List, ListItem, Image, ListContent, ListHeader } from "semantic-ui-react";
import { faker } from '@faker-js/faker'

interface UserLoggedProps {
    usersList: string[];
    onSelectUser: (username: string) => void;
    activeChat: string;
}

const UserLogged: React.FC<UserLoggedProps> = ({ usersList, onSelectUser, activeChat }) => {
    return (
        <div className="users-panel">
            <h1>Usuarios conectados</h1>
            <input type="text" placeholder="Buscar usuario" />
            <div className="users-list">
                {usersList.length === 0 ? (
                    <p>No hay usuarios conectados</p>
                ) : (
                    usersList.map((user) => (
                        <List selection key={user} onClick={() => onSelectUser(user)}>
                            <ListItem active={activeChat === user}>
                                <Image avatar src={faker.image.avatar()} />
                                <ListContent>
                                    <ListHeader as='a'>{user}</ListHeader>
                                </ListContent>
                            </ListItem>
                        </List>
                    ))
                )}
            </div>  
        </div>
    )
}

export { UserLogged }