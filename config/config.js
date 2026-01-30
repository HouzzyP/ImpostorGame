/**
 * Configuración del Servidor
 * 
 * Variables de configuración centralizadas para el servidor
 */

// Cargar variables de entorno
require('dotenv').config();

module.exports = {
    // Puerto del servidor
    PORT: process.env.PORT || 3001,

    // Socket.IO config
    SOCKET_IO: {
        cors: {
            origin: process.env.ALLOWED_ORIGINS || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    },

    // Configuración de juego (defaults)
    GAME_CONFIG: {
        maxPlayers: 8,
        impostorCount: 1,
        minPlayers: 4,
        votingTime: 30,        // segundos
        discussionTime: 30,    // segundos
        roundsBeforeWin: 1,
        category: 'random'
    },

    // Configuración de logs
    LOGGING: {
        enabled: true,
        level: 'info'  // 'debug', 'info', 'warn', 'error'
    },

    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Debug mode
    DEBUG: process.env.DEBUG === 'true' || false
};
