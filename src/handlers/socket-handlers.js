// Manejadores de eventos Socket.IO
const {
    generateRoomCode,
    getRandomCategory,
    getRandomWord
} = require('../utils/utils');
const {
    assignRoles,
    assignWordAndCategory,
    processVotes,
    checkGameWinner
} = require('../logic/game-logic');
const { wordDatabase, categoryNames } = require('../data/game-data');
const {
    createRoom,
    addPlayerToRoom,
    addSpectator,
    removePlayerFromRoom,
    getPlayerFromRoom,
    getRoomHost,
    resetRoomForNewRound,
    getRoomPublicInfo,
    updateRoomStats,
    markPlayerDisconnected,
    reconnectPlayer
} = require('../managers/room-manager');
const { schemas, validateSocketInput } = require('../utils/validators');
const { saveGameResult } = require('../services/statsService');
const logger = require('../utils/logger');

const disconnectTimeouts = new Map(); // Key: "username-roomCode" -> TimeoutID

// Rate limiting por socket - prevenir spam de eventos
const socketRateLimits = new Map(); // Key: socketId -> { count, resetTime }
const RATE_LIMIT_WINDOW = 10000; // 10 segundos
const RATE_LIMIT_MAX_EVENTS = 30; // máximo 30 eventos por ventana

function checkSocketRateLimit(socketId) {
    const now = Date.now();
    const limit = socketRateLimits.get(socketId);

    if (!limit || now > limit.resetTime) {
        // Nueva ventana de tiempo
        socketRateLimits.set(socketId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (limit.count >= RATE_LIMIT_MAX_EVENTS) {
        return false; // Bloqueado por rate limit
    }

    limit.count++;
    return true;
}

/**
 * Registra todos los manejadores de Socket.IO
 */
function registerSocketHandlers(io, rooms) {
    io.on('connection', (socket) => {

        // Wrapper para aplicar rate limiting a todos los eventos críticos
        const rateLimitedOn = (event, handler) => {
            socket.on(event, (...args) => {
                if (!checkSocketRateLimit(socket.id)) {
                    logger.security(`Rate limit exceeded on event "${event}"`, { socketId: socket.id });
                    socket.emit('error', 'Too many requests. Please slow down.');
                    return;
                }
                handler(...args);
            });
        };

        // ========== CREAR SALA ==========
        socket.on('createRoom', (data) => {
            const error = validateSocketInput(schemas.createRoom, data);
            if (error) return socket.emit('error', 'Datos inválidos: ' + error);

            let roomCode;
            do {
                roomCode = generateRoomCode();
            } while (rooms.has(roomCode));

            const room = createRoom(roomCode, { id: socket.id, username: data.username });
            rooms.set(roomCode, room);
            socket.join(roomCode);


            socket.emit('roomCreated', {
                roomCode: roomCode,
                room: getRoomPublicInfo(room),
                categories: categoryNames
            });

            io.to(roomCode).emit('playerListUpdate', room.players);
        });

        // ========== UNIRSE A SALA ==========
        socket.on('joinRoom', (data) => {
            const error = validateSocketInput(schemas.joinRoom, data);
            if (error) return socket.emit('error', 'Datos inválidos: ' + error);

            const room = rooms.get(data.roomCode);

            if (!room) {
                socket.emit('error', 'La sala no existe');
                return;
            }

            // Validar si existe (Reconexión o Duplicado)
            const reconnectedPlayer = reconnectPlayer(room, data.username, socket.id);

            if (reconnectedPlayer) {
                // Éxito: Reconexión
                const timeoutKey = `${reconnectedPlayer.username}-${data.roomCode}`;
                if (disconnectTimeouts.has(timeoutKey)) {
                    clearTimeout(disconnectTimeouts.get(timeoutKey));
                    disconnectTimeouts.delete(timeoutKey);
                }

                socket.join(data.roomCode);

                // Enviar estado de sala
                socket.emit('roomJoined', {
                    roomCode: data.roomCode,
                    room: getRoomPublicInfo(room),
                    categories: categoryNames,
                    isReconnection: true
                });

                // Restaurar estado si está jugando
                if (room.gameState !== 'waiting') {
                    socket.emit('yourRole', {
                        isImpostor: reconnectedPlayer.role === 'impostor',
                        word: reconnectedPlayer.word,
                        category: categoryNames[room.category] || room.category,
                        players: room.players
                    });
                    socket.emit('gameStarted', {
                        category: categoryNames[room.category],
                        descriptionOrder: []
                    });
                    if (room.gameState === 'voting') {
                        io.to(room.code).emit('votingStarted', {
                            votingOrder: room.players,
                            currentVoterIndex: 0
                        });
                    }
                }

                io.to(data.roomCode).emit('playerListUpdate', room.players);
                io.to(data.roomCode).emit('chatMessage', {
                    senderName: 'Sistema',
                    content: `${data.username} se ha reconectado.`,
                    timestamp: Date.now()
                });
                return;
            }

            // Validar duplicado
            const existingPlayer = room.players.find(p => p.username.toLowerCase() === data.username.toLowerCase());
            if (existingPlayer) {
                socket.emit('error', 'Nombre ocupado (o jugador aún activo)');
                return;
            }

            // Espectador
            if (room.gameState !== 'waiting') {
                addSpectator(room, { id: socket.id, username: data.username });
                socket.join(data.roomCode);
                socket.emit('roomJoined', {
                    roomCode: data.roomCode,
                    room: getRoomPublicInfo(room),
                    categories: categoryNames,
                    isSpectator: true,
                    currentPeriod: { state: room.gameState, players: room.players, config: room.config }
                });
                io.to(data.roomCode).emit('spectatorJoined', { username: data.username });
                return;
            }

            if (!addPlayerToRoom(room, { id: socket.id, username: data.username })) {
                socket.emit('error', 'La sala está llena');
                return;
            }

            socket.join(data.roomCode);
            io.to(data.roomCode).emit('playerListUpdate', room.players);
            socket.emit('roomJoined', { roomCode: data.roomCode, room: getRoomPublicInfo(room), categories: categoryNames });
        });

        // ========== ACTUALIZAR CONFIGURACIÓN ========== (con rate limiting)
        rateLimitedOn('updateConfig', (data) => {
            const error = validateSocketInput(schemas.updateConfig, data);
            if (error) return;

            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost) {
                room.config = { ...room.config, ...data.config };
                io.to(data.roomCode).emit('configUpdate', room.config);
            }
        });

        // ========== CATEGORÍA ALEATORIA ========== (con rate limiting)
        rateLimitedOn('randomCategory', (data) => {
            if (!data || !data.roomCode) return;
            const room = rooms.get(data.roomCode);
            if (!room) return;
            // No strict validation needed, safe read
            const randomCat = getRandomCategory(categoryNames);
            io.to(data.roomCode).emit('categorySelected', {
                categoryKey: randomCat,
                categoryName: categoryNames[randomCat]
            });
        });

        // ========== INICIAR JUEGO ========== (con rate limiting)
        rateLimitedOn('startGame', (data) => {
            if (!data || !data.roomCode) return;
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost) {
                room.gameState = 'starting';
                room.currentRound = 1;

                let categoryKey = room.config.category;
                if (categoryKey === 'random') {
                    categoryKey = getRandomCategory(categoryNames);
                }
                const word = getRandomWord(wordDatabase[categoryKey]);
                room.category = categoryKey;
                room.word = word;

                // Asignar roles e impostores
                room.players = assignRoles(room.players, room.config.impostorCount);
                room.players = assignWordAndCategory(room.players, categoryNames[categoryKey], word);

                // Generar orden aleatorio
                room.descriptionOrder = [...room.players].sort(() => Math.random() - 0.5);

                io.to(data.roomCode).emit('gameStarted', {
                    category: categoryNames[categoryKey],
                    descriptionOrder: room.descriptionOrder.map(p => ({ id: p.id, username: p.username }))
                });

                // Enviar roles privados
                room.players.forEach(p => {
                    io.to(p.id).emit('yourRole', {
                        isImpostor: p.role === 'impostor',
                        word: p.word,
                        category: p.category,
                        players: room.players.map(pl => ({
                            id: pl.id,
                            username: pl.username,
                            isSpectator: false
                        }))
                    });
                });

                // Actualizar estado público a 'playing'
                room.gameState = 'playing';
            }
        });

        // ========== INICIAR VOTACIÓN ========== (con rate limiting)
        rateLimitedOn('startVoting', (data) => {
            if (!data || !data.roomCode) return;
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost) {
                room.gameState = 'voting';
                room.votes = []; // Reset votes
                io.to(data.roomCode).emit('votingStarted', {
                    votingOrder: room.players.filter(p => p.alive),
                    currentVoterIndex: 0
                });
            }
        });

        // ========== EMITIR VOTO ========== (con rate limiting)
        rateLimitedOn('castVote', (data) => {
            const error = validateSocketInput(schemas.vote, data);
            if (error) return;

            const room = rooms.get(data.roomCode);
            if (!room || room.gameState !== 'voting') return;

            const voter = getPlayerFromRoom(room, socket.id);
            if (!voter || voter.isSpectator) return;
            if (!voter.alive) return; // Dead men tell no tales

            const alreadyVoted = room.votes.find(v => v.voterId === socket.id);
            if (alreadyVoted) return;

            const votedForPlayer = getPlayerFromRoom(room, data.votedFor); // Use helper using ID
            // Helper uses ID? yes getPlayerFromRoom(room, id).
            // Actually room.players.find(p => p.id === id).
            // data.votedFor IS the ID.

            if (!votedForPlayer || !votedForPlayer.alive) return;

            room.votes.push({
                voterId: socket.id,
                voterName: voter.username,
                votedFor: data.votedFor
            });

            // Check if all alive players voted
            const alivePlayers = room.players.filter(p => p.alive);
            const allVoted = room.votes.length >= alivePlayers.length;

            if (allVoted) {
                // Auto finish
                // ... call logic to finish voting ...
                // Duplicate logic here from finishVoting? Better reuse or emit event?
                // Let's reuse the logic by calling a helper or emitting self.
                // For now, I will emit 'finishVoting' internally? No, just copy logic or call function if extracted.
                // It was inline before. I'll invoke finishVoting logic logic.
                // To keep it simple, I put inline logic of finishVoting here or call a local function.

                // Reuse finish logic
                finishVotingProcess(room, io, data.roomCode);
            } else {
                // Next voter logic
                io.to(data.roomCode).emit('voteCast', {
                    voterName: voter.username,
                    votedForName: votedForPlayer.username,
                    votingOrder: alivePlayers, // simplified
                    currentVoterIndex: room.votes.length // approx
                });
            }
        });

        // ========== FINALIZAR VOTACIÓN ==========
        socket.on('finishVoting', (data) => {
            if (!data || !data.roomCode) return;
            const room = rooms.get(data.roomCode);
            if (!room) return;

            // Only host or auto
            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost) {
                finishVotingProcess(room, io, data.roomCode);
            }
        });

        // ========== CANCELAR PARTIDA (VOLVER A LOBBY) ==========
        socket.on('cancelGame', (data) => {
            if (!data || !data.roomCode) return;
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost && room.gameState !== 'waiting') {
                resetRoomForNewRound(room);
                io.to(data.roomCode).emit('gameCancelled', {
                    message: 'El anfitrión canceló la partida',
                    room: getRoomPublicInfo(room),
                    categories: categoryNames
                });
                io.to(data.roomCode).emit('playerListUpdate', room.players);
            }
        });

        // ========== CONTINUAR EN LA SALA ==========
        socket.on('continueInRoom', (data) => {
            if (!data || !data.roomCode) return;
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost) {
                resetRoomForNewRound(room);
                io.to(data.roomCode).emit('gameResetToLobby', {
                    room: getRoomPublicInfo(room),
                    categories: categoryNames
                });
                io.to(data.roomCode).emit('playerListUpdate', room.players);
            }
        });

        // ========== REACTION ==========
        socket.on('sendReaction', (data) => {
            if (!data || !data.roomCode || !data.emoji) return;
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const p = getPlayerFromRoom(room, socket.id);
            if (p) {
                io.to(data.roomCode).emit('reactionReceived', { username: p.username, emoji: data.emoji });
            }
        });

        // ========== DESCONEXIÓN ==========
        socket.on('disconnect', () => {
            // Limpiar rate limit del socket desconectado
            socketRateLimits.delete(socket.id);

            for (const [roomCode, room] of rooms.entries()) {
                const playerToRemove = getPlayerFromRoom(room, socket.id);

                if (playerToRemove) {
                    if (playerToRemove.isHost) {
                        io.to(roomCode).emit('hostDisconnected', { message: 'El anfitrión se desconectó.' });
                        rooms.delete(roomCode);
                        io.socketsLeave(roomCode);
                    } else {
                        if (room.gameState !== 'waiting') {
                            const p = markPlayerDisconnected(room, socket.id);
                            if (p) {
                                io.to(roomCode).emit('chatMessage', {
                                    senderName: 'Sistema',
                                    content: `${p.username} perdió conexión. Esperando 45s...`,
                                    timestamp: Date.now()
                                });

                                const timeoutKey = `${p.username}-${roomCode}`;
                                const timeoutId = setTimeout(() => {
                                    if (p.disconnected) {
                                        resetRoomForNewRound(room);
                                        removePlayerFromRoom(room, p.id); // Old socket id
                                        io.to(roomCode).emit('gameInterrupted', {
                                            message: `${p.username} no volvió. Cancelado.`,
                                            categories: categoryNames
                                        });
                                        io.to(roomCode).emit('playerListUpdate', room.players);
                                        disconnectTimeouts.delete(timeoutKey);
                                    }
                                }, 45000);
                                disconnectTimeouts.set(timeoutKey, timeoutId);
                            }
                        } else {
                            removePlayerFromRoom(room, socket.id);
                            io.to(roomCode).emit('playerListUpdate', room.players);
                        }
                    }
                }
                break; // Found room
            }
        });
    });
}

// Logic helper for finish voting (shared by auto-finish and host-finish)
function finishVotingProcess(room, io, roomCode) {
    room.gameState = 'ending';
    const voteResult = processVotes(room, io); // Using logic module

    if (voteResult.isTie) {
        // Stats update logic for Tie...
        io.to(roomCode).emit('tieVoting', { players: voteResult.votedPlayers });

        // Continue
        room.gameState = 'playing';
        room.currentRound++;
        room.votes = [];
        io.to(roomCode).emit('continueGame', {
            alivePlayers: room.players.filter(p => p.alive),
            roundNumber: room.currentRound
        });
    } else {
        const eliminatedPlayer = getPlayerFromRoom(room, voteResult.eliminated);
        if (eliminatedPlayer) {
            eliminatedPlayer.alive = false;
            const winCondition = checkGameWinner(room);
            const gameOver = winCondition.gameOver;

            io.to(roomCode).emit('playerEliminated', {
                playerName: eliminatedPlayer.username,
                wasImpostor: voteResult.impostorFound,
                gameEnded: gameOver,
                winner: gameOver ? winCondition.winner : null,
                word: gameOver ? room.word : null,
                players: gameOver ? room.players : null
            });

            if (!gameOver) {
                room.gameState = 'playing';
                room.currentRound++;
                room.votes = [];
                io.to(roomCode).emit('continueGame', {
                    alivePlayers: room.players.filter(p => p.alive),
                    roundNumber: room.currentRound
                });
            } else {
                updateRoomStats(room, {
                    winner: winCondition.winner,
                    gameEnded: true,
                    correctVoters: voteResult.correctVoters || []
                });
                io.to(roomCode).emit('statsUpdate', room.players.map(p => ({ id: p.id, username: p.username, stats: p.stats })));

                // Save to DB
                saveGameResult({
                    roomCode: room.code,
                    category: room.category,
                    impostorCount: room.config.impostorCount,
                    playerCount: room.players.length,
                    winnerTeam: winCondition.winner,
                    duration: 0, // TODO: Add start time tracking
                    players: room.players.map(p => ({
                        name: p.username,
                        role: p.role,
                        isImpostor: p.role === 'impostor',
                        isWinner: (winCondition.winner === 'impostors' && p.role === 'impostor') ||
                            (winCondition.winner === 'innocents' && p.role === 'innocent'),
                        votedFor: room.votes.find(v => v.voterId === p.id)?.votedFor // Simplify: this is last round vote only
                    }))
                });
            }
        }
    }
}

module.exports = { registerSocketHandlers };
