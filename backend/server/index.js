import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const port = 3000;
const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: import.meta.env.BASE_URL, 
        methods: ["GET", "POST"]
    }
});

// Objeto para almacenar usuarios conectados y sus sockets
const connectedUsers = {};

// Objeto para almacenar mensajes y su estado de lectura
const messagesStatus = {};

// Objeto para almacenar grupos
const groups = {};

// Objeto para almacenar quién ha leído cada mensaje de grupo
const groupMessageReads = {};

io.on("connection", (socket) => {
    console.log(`The user ${socket.id} connected`);

    socket.on("login", (username) => {
        // Guardar información del usuario
        socket.username = username;
        connectedUsers[username] = socket.id;
        
        // Emitir la lista actualizada de usuarios a todos
        io.emit("users_list", Object.keys(connectedUsers));
        
        // Enviar la lista de grupos existentes al usuario que se conecta
        socket.emit("groups_list", Object.values(groups));
        
        console.log(`The user ${username} (${socket.id}) logged in`);
        console.log(`Connected users:`, Object.keys(connectedUsers));
    });

    socket.on("private_message", (data) => {
        const { to, message, from, time } = data;
        
        // Generar un ID único para el mensaje
        const messageId = Date.now().toString();
        
        // Guardar estado del mensaje
        messagesStatus[messageId] = {
            read: false,
            to,
            from
        };
        
        // Obtener el ID del socket del destinatario
        const recipientSocketId = connectedUsers[to];
        
        // Añadir el ID del mensaje a los datos
        const messageData = {
            ...data,
            id: messageId,
            read: false
        };
        
        if (recipientSocketId) {
            // Enviar el mensaje al destinatario
            socket.to(recipientSocketId).emit("receive_private_message", messageData);
            console.log(`Private message from ${from} to ${to}: ${message}`);
        }
        
        // Enviar confirmación al remitente con el ID del mensaje
        socket.emit("message_sent", messageData);
    });
    
    socket.on("message_read", (messageId) => {
        // Actualizar el estado del mensaje como leído
        if (messagesStatus[messageId]) {
            messagesStatus[messageId].read = true;
            
            // Notificar al remitente que el mensaje ha sido leído
            const { from } = messagesStatus[messageId];
            const senderSocketId = connectedUsers[from];
            
            if (senderSocketId) {
                socket.to(senderSocketId).emit("message_read_confirmation", messageId);
            }
        } else if (groupMessageReads[messageId]) {
            // Es un mensaje de grupo
            const username = socket.username;
            if (!groupMessageReads[messageId].readBy.includes(username)) {
                groupMessageReads[messageId].readBy.push(username);
                
                // Verificar si todos los miembros del grupo han leído el mensaje
                const groupId = groupMessageReads[messageId].groupId;
                const group = groups[groupId];
                
                if (group && groupMessageReads[messageId].readBy.length === group.members.length) {
                    // Todos los miembros han leído el mensaje
                    groupMessageReads[messageId].allRead = true;
                    
                    // Notificar a todos los miembros que el mensaje ha sido leído por todos
                    group.members.forEach(member => {
                        const memberSocketId = connectedUsers[member];
                        if (memberSocketId) {
                            io.to(memberSocketId).emit("message_read_confirmation", messageId);
                        }
                    });
                }
            }
        }
    });

    // Manejar la creación de grupos
    socket.on("create_group", (groupData) => {
        const { id, name, members, createdBy } = groupData;
        
        // Guardar el grupo
        groups[id] = {
            id,
            name,
            members,
            createdBy
        };
        
        console.log(`Group created: ${name} (${id}) by ${createdBy}`);
        console.log(`Group members:`, members);
        
        // Notificar a todos los miembros del grupo sobre su creación
        members.forEach(member => {
            const memberSocketId = connectedUsers[member];
            if (memberSocketId) {
                io.to(memberSocketId).emit("group_created", groups[id]);
            }
        });
    });

    // Manejar mensajes de grupo
    socket.on("group_message", (data) => {
        const { groupId, message, from, time } = data;
        
        // Verificar que el grupo exista
        if (!groups[groupId]) {
            console.log(`Group ${groupId} not found`);
            return;
        }
        
        // Generar un ID único para el mensaje
        const messageId = Date.now().toString();
        
        // Inicializar el registro de lecturas para este mensaje
        groupMessageReads[messageId] = {
            groupId,
            from,
            readBy: [from], // El remitente ya lo ha leído
            allRead: false
        };
        
        // Añadir el ID del mensaje a los datos
        const messageData = {
            ...data,
            id: messageId,
            read: false
        };
        
        // Enviar el mensaje a todos los miembros del grupo excepto al remitente
        groups[groupId].members.forEach(member => {
            if (member !== from) {
                const memberSocketId = connectedUsers[member];
                if (memberSocketId) {
                    socket.to(memberSocketId).emit("receive_group_message", messageData);
                }
            }
        });
        
        console.log(`Group message to ${groupId} from ${from}: ${message}`);
        
        // Enviar confirmación al remitente
        socket.emit("message_sent", messageData);
    });

    // Manejar la adición de miembros a un grupo
    socket.on("add_member_to_group", (data) => {
        const { groupId, username } = data;
        
        if (groups[groupId] && !groups[groupId].members.includes(username)) {
            groups[groupId].members.push(username);
            
            // Notificar a todos los miembros sobre el nuevo integrante
            groups[groupId].members.forEach(member => {
                const memberSocketId = connectedUsers[member];
                if (memberSocketId) {
                    io.to(memberSocketId).emit("member_added_to_group", { groupId, username });
                }
            });
            
            // Notificar al nuevo miembro sobre el grupo
            const newMemberSocketId = connectedUsers[username];
            if (newMemberSocketId) {
                io.to(newMemberSocketId).emit("group_created", groups[groupId]);
            }
        }
    });

    // Manejar la eliminación de miembros de un grupo
    socket.on("remove_member_from_group", (data) => {
        const { groupId, username } = data;
        
        if (groups[groupId]) {
            groups[groupId].members = groups[groupId].members.filter(member => member !== username);
            
            // Notificar a todos los miembros restantes
            groups[groupId].members.forEach(member => {
                const memberSocketId = connectedUsers[member];
                if (memberSocketId) {
                    io.to(memberSocketId).emit("member_removed_from_group", { groupId, username });
                }
            });
            
            // Notificar al miembro eliminado
            const removedMemberSocketId = connectedUsers[username];
            if (removedMemberSocketId) {
                io.to(removedMemberSocketId).emit("removed_from_group", { groupId });
            }
        }
    });

    // Manejar la actualización de información de un grupo
    socket.on("update_group", (data) => {
        const { groupId, updates } = data;
        
        if (groups[groupId]) {
            // Actualizar propiedades del grupo
            Object.assign(groups[groupId], updates);
            
            // Notificar a todos los miembros sobre la actualización
            groups[groupId].members.forEach(member => {
                const memberSocketId = connectedUsers[member];
                if (memberSocketId) {
                    io.to(memberSocketId).emit("group_updated", { groupId, updates });
                }
            });
        }
    });

    socket.on("disconnect", () => {
        const username = socket.username;
        
        // Si el usuario estaba conectado, eliminarlo de la lista
        if (username && connectedUsers[username]) {
            delete connectedUsers[username];
            
            // Emitir la lista actualizada
            io.emit("users_list", Object.keys(connectedUsers));
        }
        
        console.log(`The user ${socket.id} disconnected`);
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});