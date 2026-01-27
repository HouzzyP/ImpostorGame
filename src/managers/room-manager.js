// Gestión de salas y jugadores

/**
 * Crea una nueva sala de juego
 * @param {String} roomCode - Código único de la sala
 * @param {Object} player - Objeto del jugador que crea la sala
 * @returns {Object} Objeto de la sala inicializado
 */
function createRoom(roomCode, player) {
    return {
        code: roomCode,
        players: [
            {
                id: player.id,
                username: player.username,
                isHost: true,
                role: null,
                alive: true,
                category: null,
                word: null
            }
        ],
        config: {
            maxPlayers: 8,
            impostorCount: 1,
            votingTime: 30,
            discussionTime: 30,
            roundsBeforeWin: 1,
            category: 'random'
        },
        gameState: 'waiting', // waiting, starting, playing, voting, ending
        currentRound: 0,
        word: null,
        category: null,
        votes: [],
        discussionEndTime: null,
        votingEndTime: null,
        gameWinner: null
    };
}

/**
 * Agrega un jugador a una sala existente
 * @param {Object} room - Objeto de la sala
 * @param {Object} player - Objeto del jugador a agregar
 * @returns {boolean} True si se agregó correctamente, false si la sala está llena
 */
function addPlayerToRoom(room, player) {
    if (room.players.length >= room.config.maxPlayers) {
        return false;
    }

    room.players.push({
        id: player.id,
        username: player.username,
        isHost: false,
        role: null,
        alive: true,
        category: null,
        word: null
    });

    return true;
}

/**
 * Remueve un jugador de la sala
 * @param {Object} room - Objeto de la sala
 * @param {String} playerId - ID del jugador a remover
 * @returns {Object} Objeto del jugador removido o null
 */
function removePlayerFromRoom(room, playerId) {
    const index = room.players.findIndex(p => p.id === playerId);
    if (index > -1) {
        return room.players.splice(index, 1)[0];
    }
    return null;
}

/**
 * Busca un jugador en la sala por su ID
 * @param {Object} room - Objeto de la sala
 * @param {String} playerId - ID del jugador
 * @returns {Object|null} Objeto del jugador o null
 */
function getPlayerFromRoom(room, playerId) {
    return room.players.find(p => p.id === playerId) || null;
}

/**
 * Obtiene el anfitrión de la sala
 * @param {Object} room - Objeto de la sala
 * @returns {Object|null} Objeto del jugador anfitrión o null
 */
function getRoomHost(room) {
    return room.players.find(p => p.isHost) || null;
}

/**
 * Reinicia la configuración de la sala para una nueva ronda
 * @param {Object} room - Objeto de la sala
 */
function resetRoomForNewRound(room) {
    room.players.forEach(player => {
        player.role = null;
        player.alive = true;
        player.category = null;
        player.word = null;
    });

    room.currentRound = 0;
    room.word = null;
    room.category = null;
    room.votes = [];
    room.gameState = 'waiting';
    room.gameWinner = null;
    room.discussionEndTime = null;
    room.votingEndTime = null;
}

/**
 * Obtiene información pública de la sala (sin datos sensibles)
 * @param {Object} room - Objeto de la sala
 * @returns {Object} Información pública de la sala
 */
function getRoomPublicInfo(room) {
    return {
        code: room.code,
        players: room.players.map(p => ({
            id: p.id,
            username: p.username,
            isHost: p.isHost,
            alive: p.alive
        })),
        gameState: room.gameState,
        currentRound: room.currentRound,
        maxPlayers: room.config.maxPlayers
    };
}

module.exports = {
    createRoom,
    addPlayerToRoom,
    removePlayerFromRoom,
    getPlayerFromRoom,
    getRoomHost,
    resetRoomForNewRound,
    getRoomPublicInfo
};
