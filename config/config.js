/**
 * Configuración del Servidor
 * 
 * Variables de configuración centralizadas para el servidor
 */

module.exports = {
    // Puerto del servidor
    PORT: process.env.PORT || 3000,

    // Socket.IO config
    SOCKET_IO: {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
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
