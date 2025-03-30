import { List, ListItem, Image, ListContent, ListHeader, Label } from "semantic-ui-react";
import { faker } from '@faker-js/faker'
import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.js';
import { selectUserAvatars, addUserAvatar } from '../../store/slices/usersSlice.js';

interface UserLoggedProps {
    usersList: string[];
    onSelectUser: (username: string) => void;
    activeChat: string;
    unreadMessages: {[key: string]: number};
}

const UserLogged: React.FC<UserLoggedProps> = ({ usersList, onSelectUser, activeChat, unreadMessages }) => {
    const dispatch = useAppDispatch();
    const userAvatars = useAppSelector(selectUserAvatars);
    
    // Usar useMemo para crear un objeto que mapee nombres de usuario a URLs de avatar
    // Este objeto solo se recalculará cuando cambie la lista de usuarios
    useMemo(() => {
        usersList.forEach(user => {
            if (!userAvatars[user]) {
                const avatar = faker.image.avatar();
                dispatch(addUserAvatar({ username: user, avatar }));
            }
        });
    }, [usersList, userAvatars, dispatch]);

    return (
        <div className="users-panel">
            <h1>Usuarios conectados</h1>
            <input type="text" placeholder="Buscar usuario" />
            <div className="users-list">
                {usersList.length === 0 ? (
                    <p>No hay usuarios conectados</p>
                ) : (
                    usersList.map((user) => {
                        const unreadCount = unreadMessages[user] || 0;
                        return (
                            <List selection key={user} onClick={() => onSelectUser(user)}>
                                <ListItem active={activeChat === user}>
                                    <Image avatar src={userAvatars[user]} />
                                    <ListContent>
                                        <ListHeader as='a'>
                                            {user}
                                            {unreadCount > 0 && (
                                                <Label circular color="red" size="mini" className="unread-badge">
                                                    {unreadCount}
                                                </Label>
                                            )}
                                        </ListHeader>
                                    </ListContent>
                                </ListItem>
                            </List>
                        );
                    })
                )}
            </div>  
        </div>
    )
}

export { UserLogged }