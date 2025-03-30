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
        
        // Obtener el ID del socket del destinatario
        const recipientSocketId = connectedUsers[to];
        
        if (recipientSocketId) {
            // Enviar el mensaje al destinatario
            socket.to(recipientSocketId).emit("receive_private_message", {
                message,
                from,
                time
            });
            console.log(`Private message from ${from} to ${to}: ${message}`);
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