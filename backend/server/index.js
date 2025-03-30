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
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"]
    }
});

// Objeto para almacenar usuarios conectados y sus sockets
const connectedUsers = {};

// Objeto para almacenar mensajes y su estado de lectura
const messagesStatus = {};

io.on("connection", (socket) => {
    console.log(`The user ${socket.id} connected`);

    socket.on("login", (username) => {
        // Guardar información del usuario
        socket.username = username;
        connectedUsers[username] = socket.id;
        
        // Emitir la lista actualizada de usuarios a todos
        io.emit("users_list", Object.keys(connectedUsers));
        
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