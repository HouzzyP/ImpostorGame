/**
 * El Impostor - Servidor Principal
 * 
 * Servidor de juego multiplayer en tiempo real usando Express y Socket.IO
 * La lógica está dividida en módulos separados para mejor mantenibilidad
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Importar configuración
const config = require('./config/config');

// Importar módulos especializados
const { registerSocketHandlers } = require('./src/handlers/socket-handlers');

// ========== CONFIGURACIÓN DEL SERVIDOR ==========
const PORT = config.PORT;

const app = express();

// Seguridad: Headers HTTP
app.use(helmet({
    contentSecurityPolicy: false // Desactivado por ahora para evitar problemas con scripts inline si los hay
}));

// Seguridad: CORS HTTP
app.use(cors({
    origin: config.SOCKET_IO.cors.origin,
    credentials: true
}));

// Seguridad: Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requests por IP
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Configuración para proxys (necesario en Railway/Render/Heroku)
app.set('trust proxy', 1);

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
