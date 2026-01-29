/**
 * El Impostor - Servidor Principal
 * 
 * Servidor de juego multiplayer en tiempo real usando Express y Socket.IO
 * La lógica está dividida en módulos separados para mejor mantenibilidad
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Importar configuración
const config = require('./config/config');

// Importar módulos especializados
const { registerSocketHandlers } = require('./src/handlers/socket-handlers');

// ========== CONFIGURACIÓN DEL SERVIDOR ==========
const PORT = config.PORT;

const app = express();
const server = http.createServer(app);
const io = socketIO(server, config.SOCKET_IO);

// Servir archivos estáticos
app.use(express.static('public'));

// ========== ALMACENAMIENTO DE DATOS ==========
const rooms = new Map();

// ========== REGISTRO DE MANEJADORES ==========
registerSocketHandlers(io, rooms);
require('./src/handlers/chat-handlers').registerChatHandlers(io, rooms);

// ========== INICIAR SERVIDOR ==========
server.listen(PORT, () => {
    console.log(`[${new Date().toLocaleTimeString()}] Servidor de El Impostor ejecutándose en puerto ${PORT}`);
    console.log(`Accede a http://localhost:${PORT}`);
});
