// Lógica del juego - Votación, asignación de roles, etc.
const { shuffleArray, getRandomWord } = require('../utils/utils');

/**
 * Asigna roles a los jugadores (uno es impostor, el resto son civiles)
 * @param {Array} players - Array de objetos jugador
 * @returns {Array} Array de jugadores con rol asignado
 */
function assignRoles(players) {
    const impostorIndex = Math.floor(Math.random() * players.length);
    return players.map((player, index) => ({
        ...player,
        role: index === impostorIndex ? 'impostor' : 'civil'
    }));
}

/**
 * Asigna la palabra y categoría a los jugadores
 * @param {Array} players - Array de jugadores
 * @param {String} category - Categoría seleccionada
 * @param {String} word - Palabra del juego
 * @returns {Array} Array de jugadores con palabra/categoría asignada
 */
function assignWordAndCategory(players, category, word) {
    return players.map(player => ({
        ...player,
        category: player.role === 'impostor' ? null : category,
        word: player.role === 'impostor' ? null : word
    }));
}

/**
 * Procesa los votos y determina quién será eliminado
 * @param {Object} room - Objeto de la sala
 * @param {Object} io - Socket.IO instance
 * @returns {Object} { eliminated: string|null, impostorFound: boolean, isTie: boolean }
 */
function processVotes(room, io) {
    const voteCount = {};
    let maxVotes = 0;

    // Contar votos
    room.votes.forEach(vote => {
        if (vote.votedFor) {
            voteCount[vote.votedFor] = (voteCount[vote.votedFor] || 0) + 1;
            maxVotes = Math.max(maxVotes, voteCount[vote.votedFor]);
        }
    });

    // Detectar empate
    const playersWithMaxVotes = Object.keys(voteCount).filter(
        player => voteCount[player] === maxVotes
    );

    if (playersWithMaxVotes.length > 1) {
        // Hay empate - no se elimina a nadie
        return {
            eliminated: null,
            impostorFound: false,
            isTie: true,
            votedPlayers: playersWithMaxVotes
        };
    }

    const eliminated = playersWithMaxVotes[0];

    // Verificar si el impostor fue eliminado
    const eliminatedPlayer = room.players.find(p => p.id === eliminated);
    const impostorFound = eliminatedPlayer && eliminatedPlayer.role === 'impostor';

    return {
        eliminated: eliminated,
        impostorFound: impostorFound,
        isTie: false,
        votedPlayers: playersWithMaxVotes
    };
}

/**
 * Verifica si el juego debe terminar y determina el ganador
 * @param {Object} room - Objeto de la sala
 * @returns {Object} { gameOver: boolean, winner: string|null, reason: string }
 */
function checkGameWinner(room) {
    const aliveImpostors = room.players.filter(
        p => p.role === 'impostor' && p.alive
    );
    const aliveCivils = room.players.filter(
        p => p.role === 'civil' && p.alive
    );

    // El impostor fue eliminado
    if (aliveImpostors.length === 0) {
        return {
            gameOver: true,
            winner: 'civiles',
            reason: 'El impostor fue encontrado'
        };
    }

    // Los impostores son igual o más que los civiles
    if (aliveImpostors.length >= aliveCivils.length) {
        return {
            gameOver: true,
            winner: 'impostores',
            reason: 'Los impostores se han apoderado de la sala'
        };
    }

    return {
        gameOver: false,
        winner: null,
        reason: ''
    };
}

/**
 * Obtiene estadísticas finales del juego
 * @param {Object} room - Objeto de la sala
 * @returns {Object} Estadísticas del juego
 */
function getGameStats(room) {
    const stats = {
        winner: room.gameWinner?.winner || 'desconocido',
        reason: room.gameWinner?.reason || '',
        players: room.players.map(p => ({
            id: p.id,
            username: p.username,
            role: p.role,
            alive: p.alive,
            isHost: p.isHost
        }))
    };
    return stats;
}

module.exports = {
    assignRoles,
    assignWordAndCategory,
    processVotes,
    checkGameWinner,
    getGameStats
};
