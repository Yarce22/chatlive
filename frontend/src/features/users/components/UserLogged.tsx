/**
 * Componente que muestra la lista de usuarios y grupos disponibles
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { List, ListItem, Image, ListContent, ListHeader, Label, Button, Modal, Form, Checkbox } from "semantic-ui-react";
import { faker } from '@faker-js/faker';
import { useAppDispatch, useAppSelector } from '../../../store/hooks.js';
import { selectUserAvatars, addUserAvatar } from '../slices/usersSlice.js';
import { selectGroups } from '../../chat/slices/chatSlice.js';
import { socketActions } from '../../../shared/middleware/socketMiddleware.js';
import { ErrorType, handleError } from '../../../shared/services/errorService.js';
import { Group } from '../../../shared/types/index.js';

interface UserLoggedProps {
    /** Lista de usuarios conectados */
    usersList: string[];
    /** ID del chat activo */
    activeChat: string;
    /** Contador de mensajes no leu00eddos por usuario/grupo */
    unreadMessages: {[key: string]: number};
    /** Funciu00f3n para seleccionar un usuario de la lista */
    onSelectUser: (username: string) => void;
}

/**
 * Componente para mostrar usuarios y grupos disponibles, optimizado con memo
 */
const UserLogged: React.FC<UserLoggedProps> = memo(({ usersList, activeChat, unreadMessages, onSelectUser }) => {
    const dispatch = useAppDispatch();
    const userAvatars = useAppSelector(selectUserAvatars);
    const groups = useAppSelector(selectGroups);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    
    // Generar y almacenar avatares para usuarios que no los tengan
    useMemo(() => {
        try {
            usersList.forEach(user => {
                if (!userAvatars[user]) {
                    const avatar = faker.image.avatar();
                    dispatch(addUserAvatar({ username: user, avatar }));
                }
            });
        } catch (error) {
            handleError(error, ErrorType.Unknown, { component: 'UserLogged', method: 'useMemo[generateAvatars]' });
        }
    }, [usersList, userAvatars, dispatch]);

    // Generar avatares para grupos
    const groupAvatars = useMemo(() => {
        try {
            const avatars: {[key: string]: string} = {};
            Object.values(groups as Record<string, Group>).forEach(group => {
                if (!avatars[group.id]) {
                    avatars[group.id] = faker.image.avatar();
                }
            });
            return avatars;
        } catch (error) {
            handleError(error, ErrorType.Unknown, { component: 'UserLogged', method: 'useMemo[groupAvatars]' });
            return {};
        }
    }, [groups]);

    // Optimizaciones con useCallback para evitar recrear funciones
    const handleCreateGroup = useCallback(() => {
        try {
            if (groupName.trim() && selectedMembers.length > 0) {
                dispatch({
                    type: socketActions.CREATE_GROUP,
                    payload: {
                        name: groupName.trim(),
                        members: selectedMembers
                    }
                });
                // Limpiar el formulario y cerrar el modal
                setGroupName('');
                setSelectedMembers([]);
                setIsModalOpen(false);
            }
        } catch (error) {
            handleError(error, ErrorType.Unknown, { component: 'UserLogged', method: 'handleCreateGroup' });
        }
    }, [groupName, selectedMembers, dispatch]);

    const handleMemberToggle = useCallback((username: string) => {
        try {
            setSelectedMembers(prevMembers => {
                if (prevMembers.includes(username)) {
                    return prevMembers.filter(member => member !== username);
                } else {
                    return [...prevMembers, username];
                }
            });
        } catch (error) {
            handleError(error, ErrorType.Unknown, { component: 'UserLogged', method: 'handleMemberToggle' });
        }
    }, []);

    const handleSelectChat = useCallback((chatId: string, isGroup: boolean) => {
        try {
            dispatch({
                type: 'chat/setActiveChat',
                payload: { chatId, isGroup }
            });
        } catch (error) {
            handleError(error, ErrorType.Unknown, { component: 'UserLogged', method: 'handleSelectChat' });
        }
    }, [dispatch]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    // Filtrar usuarios y grupos seguu00fan el tu00e9rmino de bu00basqueda
    const filteredUsers = useMemo(() => {
        return usersList.filter(user => 
            user.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [usersList, searchTerm]);

    const filteredGroups = useMemo(() => {
        return Object.values(groups as Record<string, Group>).filter(group => 
            group.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [groups, searchTerm]);

    /**
     * Renderiza un elemento de grupo en la lista
     */
    const renderGroupItem = useCallback((group: Group) => {
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
    }, [activeChat, groupAvatars, handleSelectChat, unreadMessages]);

    /**
     * Renderiza un elemento de usuario en la lista
     */
    const renderUserItem = useCallback((user: string) => {
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
    }, [activeChat, onSelectUser, unreadMessages, userAvatars]);

    return (
        <div className="users-panel">
            <h1>Chats</h1>
            <div className="search-container">
                <input 
                    type="text" 
                    placeholder="Buscar usuario o grupo" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    aria-label="Buscar usuarios o grupos"
                />
                <Button primary onClick={() => setIsModalOpen(true)}>Crear Grupo</Button>
            </div>
            <div className="users-list">
                {filteredUsers.length === 0 && filteredGroups.length === 0 ? (
                    <p>No hay usuarios o grupos que coincidan con la bu00basqueda</p>
                ) : (
                    <>
                        {filteredGroups.length > 0 && (
                            <div className="groups-section">
                                <h3>Grupos</h3>
                                {filteredGroups.map((group) => renderGroupItem(group))}
                            </div>
                        )}
                        
                        {filteredUsers.length > 0 && (
                            <div className="users-section">
                                <h3>Usuarios</h3>
                                {filteredUsers.map(renderUserItem)}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Modal para crear grupo */}
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
                                aria-label="Nombre del grupo"
                                maxLength={50}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Seleccionar miembros</label>
                            <div className="members-list">
                                {usersList.map(user => (
                                    <div key={user} className="member-checkbox">
                                        <Checkbox 
                                            label={user}
                                            checked={selectedMembers.includes(user)}
                                            onChange={() => handleMemberToggle(user)}
                                        />
                                    </div>
                                ))}
                            </div>
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
    );
});

// Asignar displayName para facilitar la depuraciu00f3n
UserLogged.displayName = 'UserLogged';

export { UserLogged };
