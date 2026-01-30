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
                word: null,
                stats: { impostorWins: 0, innocentWins: 0, gamesPlayed: 0, correctVotes: 0 }
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
        gameWinner: null,
        spectators: [] // Lista de espectadores
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
        word: null,
        stats: { impostorWins: 0, innocentWins: 0, gamesPlayed: 0, correctVotes: 0 }
    });

    return true;
}

/**
 * Actualiza las estadísticas de los jugadores
 * @param {Object} room - Sala actual
 * @param {Object} updates - Objeto con actualizaciones { winner, gameEnded, correctVoters: [id] }
 */
function updateRoomStats(room, updates) {
    room.players.forEach(p => {
        // Actualizar victorias al finalizar partida
        if (updates.winner) {
            if (updates.winner === 'impostors' && p.role === 'impostor') {
                p.stats.impostorWins++;
            } else if (updates.winner === 'innocents' && p.role !== 'impostor') {
                p.stats.innocentWins++;
            }
        }

        // Contar partidas jugadas
        if (updates.gameEnded) {
            p.stats.gamesPlayed++;
        }

        // Contar votos correctos (votó por un impostor que fue eliminado)
        if (updates.correctVoters && updates.correctVoters.includes(p.id)) {
            p.stats.correctVotes++;
        }
    });
}

/**
 * Agrega un espectador a la sala
 * @param {Object} room - Objeto de la sala
 * @param {Object} player - Objeto del espectador
 */
function addSpectator(room, player) {
    // Evitar duplicados
    if (!room.spectators.find(s => s.id === player.id)) {
        room.spectators.push({
            id: player.id,
            username: player.username,
            isSpectator: true
        });
    }
}

/**
 * Promueve espectadores a jugadores si hay espacio
 * @param {Object} room - Objeto de la sala
 */
function promoteSpectators(room) {
    if (room.spectators.length === 0) return;

    // Intentar mover cada espectador a la lista de jugadores
    // Usamos un bucle inverso para poder eliminar elementos seguros
    for (let i = room.spectators.length - 1; i >= 0; i--) {
        const spectator = room.spectators[i];

        // Verificar espacio
        if (room.players.length < room.config.maxPlayers) {
            addPlayerToRoom(room, { id: spectator.id, username: spectator.username });
            room.spectators.splice(i, 1); // Remover de espectadores
        }
    }
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

    // También buscar en espectadores
    const specIndex = room.spectators.findIndex(s => s.id === playerId);
    if (specIndex > -1) {
        return room.spectators.splice(specIndex, 1)[0];
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
    const player = room.players.find(p => p.id === playerId);
    if (player) return player;

    return room.spectators.find(s => s.id === playerId) || null;
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
    // Primero, promover espectadores que estaban esperando
    promoteSpectators(room);

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
            alive: p.alive,
            stats: p.stats
        })),
        spectators: room.spectators.map(s => ({
            id: s.id,
            username: s.username
        })),
        gameState: room.gameState,
        currentRound: room.currentRound,
        maxPlayers: room.config.maxPlayers
    };
}


/**
 * Marca a un jugador como desconectado
 * @param {Object} room 
 * @param {String} playerId 
 * @returns {Object|null} El jugador desconectado o null
 */
function markPlayerDisconnected(room, playerId) {
    const player = room.players.find(p => p.id === playerId);
    if (player) {
        player.disconnected = true;
        player.disconnectTime = Date.now();
        return player;
    }
    return null;
}

/**
 * Actualiza el socket ID de un jugador (Reconexión)
 * @param {Object} room 
 * @param {String} username 
 * @param {String} newSocketId 
 * @returns {Object|null} El jugador actualizado o null
 */
function reconnectPlayer(room, username, newSocketId) {
    const player = room.players.find(p => p.username.toLowerCase() === username.toLowerCase());
    // Reconexion simple por nombre. 
    // SOLO si estaba marcado como desconectado O si la conexion es muy reciente (race condition)
    // Para seguridad, asumimos que si esta desconectado es seguro reconectar.
    if (player && player.disconnected) {
        player.id = newSocketId; // Actualizar ID de socket
        player.disconnected = false;
        player.disconnectTime = null;
        return player;
    }
    return null;
}

module.exports = {
    createRoom,
    addPlayerToRoom,
    addSpectator,
    promoteSpectators,
    removePlayerFromRoom,
    getPlayerFromRoom,
    getRoomHost,
    resetRoomForNewRound,
    getRoomPublicInfo,
    updateRoomStats,
    markPlayerDisconnected,
    reconnectPlayer
};
