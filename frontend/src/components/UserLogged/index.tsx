import { List, ListItem, Image, ListContent, ListHeader, Label, Button, Modal, Form, Checkbox } from "semantic-ui-react";
import { faker } from '@faker-js/faker'
import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.js';
import { selectUserAvatars, addUserAvatar } from '../../store/slices/usersSlice.js';
import { selectGroups } from '../../store/slices/chatSlice.js';
import { socketActions } from '../../store/middleware/socketMiddleware.js';

interface UserLoggedProps {
    usersList: string[];
    onSelectUser: (username: string) => void;
    activeChat: string;
    unreadMessages: {[key: string]: number};
}

const UserLogged: React.FC<UserLoggedProps> = ({ usersList, activeChat, unreadMessages }) => {
    const dispatch = useAppDispatch();
    const userAvatars = useAppSelector(selectUserAvatars);
    const groups = useAppSelector(selectGroups);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    
    useMemo(() => {
        usersList.forEach(user => {
            if (!userAvatars[user]) {
                const avatar = faker.image.avatar();
                dispatch(addUserAvatar({ username: user, avatar }));
            }
        });
    }, [usersList, userAvatars, dispatch]);

    const groupAvatars = useMemo(() => {
        const avatars: {[key: string]: string} = {};
        Object.values(groups).forEach(group => {
            if (!avatars[group.id]) {
                avatars[group.id] = faker.image.avatar();
            }
        });
        return avatars;
    }, [groups]);

    const handleCreateGroup = () => {
        if (groupName.trim() && selectedMembers.length > 0) {
            dispatch({
                type: socketActions.CREATE_GROUP,
                payload: {
                    name: groupName.trim(),
                    members: selectedMembers
                }
            });
            setGroupName('');
            setSelectedMembers([]);
            setIsModalOpen(false);
        }
    };

    const handleMemberToggle = (username: string) => {
        if (selectedMembers.includes(username)) {
            setSelectedMembers(selectedMembers.filter(member => member !== username));
        } else {
            setSelectedMembers([...selectedMembers, username]);
        }
    };

    const handleSelectChat = (chatId: string, isGroup: boolean) => {
        dispatch({
            type: 'chat/setActiveChat',
            payload: { chatId, isGroup }
        });
    };

    const filteredUsers = usersList.filter(user => 
        user.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredGroups = Object.values(groups).filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="users-panel">
            <h1>Chats</h1>
            <div className="search-container">
                <input 
                    type="text" 
                    placeholder="Buscar usuario o grupo" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button primary onClick={() => setIsModalOpen(true)}>Crear Grupo</Button>
            </div>
            <div className="users-list">
                {filteredUsers.length === 0 && filteredGroups.length === 0 ? (
                    <p>No hay usuarios o grupos que coincidan con la búsqueda</p>
                ) : (
                    <>
                        {filteredGroups.length > 0 && (
                            <div className="groups-section">
                                <h3>Grupos</h3>
                                {filteredGroups.map((group) => {
                                    const unreadCount = unreadMessages[group.id] || 0;
                                    return (
                                        <List selection key={group.id} onClick={() => handleSelectChat(group.id, true)}>
                                            <ListItem active={activeChat === group.id}>
                                                <Image avatar src={groupAvatars[group.id] || faker.image.avatar()} />
                                                <ListContent>
                                                    <ListHeader as='a'>
                                                        {group.name}
                                                        {unreadCount > 0 && (
                                                            <Label circular color="red" size="mini" className="unread-badge">
                                                                {unreadCount}
                                                            </Label>
                                                        )}
                                                    </ListHeader>
                                                    <div className="group-members">
                                                        {group.members.length} miembros
                                                    </div>
                                                </ListContent>
                                            </ListItem>
                                        </List>
                                    );
                                })}
                            </div>
                        )}
                        
                        {filteredUsers.length > 0 && (
                            <div className="users-section">
                                <h3>Usuarios</h3>
                                {filteredUsers.map((user) => {
                                    const unreadCount = unreadMessages[user] || 0;
                                    return (
                                        <List selection key={user} onClick={() => handleSelectChat(user, false)}>
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
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <Modal.Header>Crear nuevo grupo</Modal.Header>
                <Modal.Content>
                    <Form>
                        <Form.Field>
                            <label>Nombre del grupo</label>
                            <input 
                                type="text" 
                                placeholder="Nombre del grupo" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Seleccionar miembros</label>
                            {usersList.map(user => (
                                <div key={user} className="member-checkbox">
                                    <Checkbox 
                                        label={user}
                                        checked={selectedMembers.includes(user)}
                                        onChange={() => handleMemberToggle(user)}
                                    />
                                </div>
                            ))}
                        </Form.Field>
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button primary onClick={handleCreateGroup} disabled={!groupName.trim() || selectedMembers.length === 0}>
                        Crear Grupo
                    </Button>
                </Modal.Actions>
            </Modal>
        </div>
    )
}

export { UserLogged }