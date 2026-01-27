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
    removePlayerFromRoom,
    getPlayerFromRoom,
    getRoomHost,
    resetRoomForNewRound,
    getRoomPublicInfo
} = require('../managers/room-manager');

/**
 * Registra todos los manejadores de Socket.IO
 * @param {Object} io - Socket.IO instance
 * @param {Map} rooms - Map de salas
 */
function registerSocketHandlers(io, rooms) {
    io.on('connection', (socket) => {
        console.log(`[${new Date().toLocaleTimeString()}] Usuario conectado: ${socket.id}`);

        // ========== CREAR SALA ==========
        socket.on('createRoom', (data) => {
            let roomCode;
            do {
                roomCode = generateRoomCode();
            } while (rooms.has(roomCode));

            const room = createRoom(roomCode, { id: socket.id, username: data.username });
            rooms.set(roomCode, room);
            socket.join(roomCode);

            console.log(`[${new Date().toLocaleTimeString()}] Sala creada: ${roomCode}`);

            socket.emit('roomCreated', {
                roomCode: roomCode,
                room: getRoomPublicInfo(room),
                categories: categoryNames
            });

            io.to(roomCode).emit('playerListUpdate', room.players);
        });

        // ========== UNIRSE A SALA ==========
        socket.on('joinRoom', (data) => {
            const room = rooms.get(data.roomCode);

            if (!room) {
                socket.emit('error', 'La sala no existe');
                return;
            }

            // Validar que no haya otro jugador con el mismo nombre en la sala
            const existingPlayer = room.players.find(p => p.username.toLowerCase() === data.username.toLowerCase());
            if (existingPlayer) {
                socket.emit('error', 'Ya hay un jugador con ese nombre en la sala');
                return;
            }

            // Permitir unirse como espectador si el juego ya empezó
            if (room.gameState !== 'waiting') {
                socket.join(data.roomCode);
                console.log(`[${new Date().toLocaleTimeString()}] ${data.username} se unió como espectador a ${data.roomCode}`);
                socket.emit('roomJoined', { roomCode: data.roomCode, room: getRoomPublicInfo(room), categories: categoryNames, isSpectator: true });
                io.to(data.roomCode).emit('spectatorJoined', { username: data.username });
                return;
            }

            if (!addPlayerToRoom(room, { id: socket.id, username: data.username })) {
                socket.emit('error', 'La sala está llena');
                return;
            }

            socket.join(data.roomCode);
            console.log(`[${new Date().toLocaleTimeString()}] ${data.username} se unió a ${data.roomCode}`);

            io.to(data.roomCode).emit('playerListUpdate', room.players);
            socket.emit('roomJoined', { roomCode: data.roomCode, room: getRoomPublicInfo(room), categories: categoryNames });
        });

        // ========== ACTUALIZAR CONFIGURACIÓN ==========
        socket.on('updateConfig', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost) {
                room.config = { ...room.config, ...data.config };
                io.to(data.roomCode).emit('configUpdate', room.config);
            }
        });

        // ========== CATEGORÍA ALEATORIA ==========
        socket.on('randomCategory', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const randomCat = getRandomCategory(categoryNames);
            io.to(data.roomCode).emit('categorySelected', {
                categoryKey: randomCat,
                categoryName: categoryNames[randomCat]
            });
        });

        // ========== INICIAR JUEGO ==========
        socket.on('startGame', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost) {
                room.gameState = 'starting';
                room.currentRound = 1;

                // Determinar categoría y palabra
                let categoryKey = room.config.category;
                if (categoryKey === 'random') {
                    categoryKey = getRandomCategory(categoryNames);
                }

                const words = wordDatabase[categoryKey];
                const word = getRandomWord(words);
                room.word = word;
                room.category = categoryKey;

                // Asignar roles (soporta múltiples impostores)
                room.players = assignRoles(room.players, room.config.impostorCount || 1);
                room.players = assignWordAndCategory(room.players, categoryKey, word);

                // Generar orden aleatorio de descripción (solo jugadores vivos)
                const alivePlayers = room.players.filter(p => p.alive);
                const shuffledOrder = [...alivePlayers].sort(() => Math.random() - 0.5);
                room.descriptionOrder = shuffledOrder.map(p => ({ id: p.id, username: p.username }));

                io.to(data.roomCode).emit('gameStarted', { category: categoryNames[categoryKey], descriptionOrder: room.descriptionOrder });

                // Enviar información privada a cada jugador
                room.players.forEach(p => {
                    const playerSocket = io.sockets.sockets.get(p.id);
                    if (playerSocket) {
                        const players = room.players.map(player => ({
                            id: player.id,
                            username: player.username,
                            isSpectator: player.isSpectator || false
                        }));
                        playerSocket.emit('yourRole', {
                            isImpostor: p.role === 'impostor',
                            word: p.word,
                            category: p.category,
                            players: players
                        });
                    }
                });

                room.gameState = 'playing';
                room.discussionEndTime = Date.now() + room.config.discussionTime * 1000;
                io.to(data.roomCode).emit('gameState', {
                    state: 'discussing',
                    timeRemaining: room.config.discussionTime
                });

                console.log(
                    `[${new Date().toLocaleTimeString()}] Juego iniciado en ${data.roomCode}. Palabra: ${word} (${categoryKey})`
                );
            }
        });

        // ========== INICIAR VOTACIÓN ==========
        socket.on('startVoting', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room) return;

            room.votes = [];
            room.gameState = 'voting';
            room.votingEndTime = Date.now() + room.config.votingTime * 1000;

            // Usar el orden de descripción para la votación
            const votingOrder = room.descriptionOrder || room.players.filter(p => p.alive).map(p => ({
                id: p.id,
                username: p.username
            }));

            io.to(data.roomCode).emit('votingStarted', {
                votingOrder: votingOrder,
                currentVoterIndex: 0
            });
        });

        // ========== EMITIR VOTO ==========
        socket.on('castVote', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room || room.gameState !== 'voting') return;

            const voter = getPlayerFromRoom(room, socket.id);
            if (!voter || voter.isSpectator) return;

            // Validar que el votante no haya votado ya
            const alreadyVoted = room.votes.find(v => v.voterId === socket.id);
            if (alreadyVoted) {
                console.log(`[${new Date().toLocaleTimeString()}] ${voter.username} intentó votar dos veces en ${data.roomCode}`);
                return;
            }

            const votedForPlayer = getPlayerFromRoom(room, data.votedFor);
            if (!votedForPlayer || !votedForPlayer.alive) return;

            // Registrar voto
            room.votes.push({
                voterId: socket.id,
                voterName: voter.username,
                votedFor: data.votedFor
            });

            // Calcular siguiente votante
            const alivePlayers = room.players.filter(p => p.alive);
            const allVoted = room.votes.length >= alivePlayers.length;

            if (allVoted) {
                // Todos votaron, finalizar votación automáticamente
                room.gameState = 'ending';
                const voteResult = processVotes(room, io);

                if (voteResult.isTie) {
                    io.to(data.roomCode).emit('tieVoting', {
                        players: voteResult.votedPlayers,
                        message: 'Empate! Nadie fue eliminado. El juego continúa.'
                    });
                    // Volver al juego después del empate
                    room.gameState = 'playing';
                    room.votes = [];
                    room.discussionEndTime = Date.now() + room.config.discussionTime * 1000;
                    io.to(data.roomCode).emit('continueGame', {
                        alivePlayers: room.players.filter(p => p.alive),
                        roundNumber: room.currentRound
                    });
                } else {
                    const eliminatedPlayer = getPlayerFromRoom(room, voteResult.eliminated);
                    if (eliminatedPlayer) {
                        eliminatedPlayer.alive = false;

                        const winCondition = checkGameWinner(room);
                        const gameOver = winCondition.gameOver;

                        io.to(data.roomCode).emit('playerEliminated', {
                            playerName: eliminatedPlayer.username,
                            wasImpostor: voteResult.impostorFound,
                            impostorFound: voteResult.impostorFound,
                            gameEnded: gameOver,
                            winner: gameOver ? winCondition.winner : null,
                            word: gameOver ? room.word : null,
                            players: gameOver ? room.players.map(p => ({
                                name: p.username,
                                isImpostor: p.role === 'impostor',
                                alive: p.alive
                            })) : null
                        });

                        if (!gameOver) {
                            // Juego continúa, volver a la pantalla de juego
                            room.gameState = 'playing';
                            room.currentRound++;
                            room.discussionEndTime = Date.now() + room.config.discussionTime * 1000;
                            io.to(data.roomCode).emit('continueGame', {
                                alivePlayers: room.players.filter(p => p.alive),
                                roundNumber: room.currentRound
                            });
                        } else {
                            room.gameWinner = winCondition;
                        }
                    }
                }
            } else {
                // Aún hay jugadores que deben votar
                const nextVoterIndex = room.votes.length % alivePlayers.length;

                io.to(data.roomCode).emit('voteCast', {
                    voterName: voter.username,
                    votedForName: votedForPlayer.username,
                    votingOrder: alivePlayers.map(p => ({
                        id: p.id,
                        username: p.username
                    })),
                    currentVoterIndex: nextVoterIndex,
                    votingFinished: false
                });
            }
        });

        // ========== FINALIZAR VOTACIÓN ==========
        socket.on('finishVoting', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room) return;

            room.gameState = 'ending';
            const voteResult = processVotes(room, io);

            if (voteResult.isTie) {
                // Hay empate - no se elimina a nadie
                io.to(data.roomCode).emit('tieVoting', {
                    players: voteResult.votedPlayers,
                    message: 'Empate! Nadie fue eliminado. El juego continúa.'
                });
                // Volver al juego después del empate
                room.gameState = 'playing';
                room.votes = [];
                room.discussionEndTime = Date.now() + room.config.discussionTime * 1000;
                io.to(data.roomCode).emit('continueGame', {
                    alivePlayers: room.players.filter(p => p.alive),
                    roundNumber: room.currentRound
                });
            } else {
                // Se elimina a alguien
                const eliminatedPlayer = getPlayerFromRoom(room, voteResult.eliminated);
                if (eliminatedPlayer) {
                    eliminatedPlayer.alive = false;

                    const winCondition = checkGameWinner(room);
                    const gameOver = winCondition.gameOver;

                    io.to(data.roomCode).emit('playerEliminated', {
                        playerName: eliminatedPlayer.username,
                        wasImpostor: voteResult.impostorFound,
                        impostorFound: voteResult.impostorFound,
                        gameEnded: gameOver,
                        winner: gameOver ? winCondition.winner : null,
                        word: gameOver ? room.word : null,
                        players: gameOver ? room.players.map(p => ({
                            name: p.username,
                            isImpostor: p.role === 'impostor',
                            alive: p.alive
                        })) : null
                    });

                    if (!gameOver) {
                        // Juego continúa, volver a la pantalla de juego
                        room.gameState = 'playing';
                        room.currentRound++;
                        room.discussionEndTime = Date.now() + room.config.discussionTime * 1000;
                        io.to(data.roomCode).emit('continueGame', {
                            alivePlayers: room.players.filter(p => p.alive),
                            roundNumber: room.currentRound
                        });
                    } else {
                        room.gameWinner = winCondition;
                    }
                }
            }
        });

        // ========== REINICIAR JUEGO ==========
        socket.on('resetGame', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (player && player.isHost) {
                resetRoomForNewRound(room);
                io.to(data.roomCode).emit('gameResetToLobby', {
                    room: getRoomPublicInfo(room),
                    categories: categoryNames
                });
                // Actualizar lista de jugadores después de reset
                io.to(data.roomCode).emit('playerListUpdate', room.players);
            }
        });

        // ========== CONTINUAR EN LA SALA ==========
        socket.on('continueInRoom', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room) return;

            resetRoomForNewRound(room);
            io.to(data.roomCode).emit('gameResetToLobby', {
                room: getRoomPublicInfo(room),
                categories: categoryNames
            });
            // Actualizar lista de jugadores después de reset
            io.to(data.roomCode).emit('playerListUpdate', room.players);
        });

        // ========== ENVIAR REACCIÓN (EMOJI) ==========
        socket.on('sendReaction', (data) => {
            const room = rooms.get(data.roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (!player) return;

            // Emitir reacción a todos en la sala
            io.to(data.roomCode).emit('reactionReceived', {
                username: player.username,
                emoji: data.emoji,
                timestamp: Date.now()
            });
        });

        // ========== DESCONECTAR ==========
        socket.on('disconnect', () => {
            console.log(`[${new Date().toLocaleTimeString()}] Usuario desconectado: ${socket.id}`);

            // Buscar y limpiar la sala
            for (const [roomCode, room] of rooms.entries()) {
                const playerToRemove = getPlayerFromRoom(room, socket.id);

                if (playerToRemove) {
                    // Si es el anfitrión, eliminar la sala
                    if (playerToRemove.isHost) {
                        io.to(roomCode).emit('hostDisconnected', {
                            message: 'El anfitrión se desconectó. La sala será cerrada.'
                        });
                        rooms.delete(roomCode);
                        console.log(`[${new Date().toLocaleTimeString()}] Sala ${roomCode} eliminada`);
                        io.socketsLeave(roomCode);
                    } else {
                        // Si la partida está en progreso, resetea la sala y devuelve a todos al lobby
                        if (room.gameState !== 'waiting') {
                            resetRoomForNewRound(room);
                            removePlayerFromRoom(room, socket.id);
                            io.to(roomCode).emit('gameInterrupted', {
                                message: `${playerToRemove.username} se desconectó. Volviendo al lobby.`,
                                categories: categoryNames
                            });
                            // Emitir lista actualizada sin el jugador desconectado
                            io.to(roomCode).emit('playerListUpdate', room.players);
                            console.log(`[${new Date().toLocaleTimeString()}] Partida en ${roomCode} interrumpida por desconexión`);
                        } else {
                            // Si está en lobby, solo remover
                            removePlayerFromRoom(room, socket.id);
                            io.to(roomCode).emit('playerListUpdate', room.players);
                            console.log(`[${new Date().toLocaleTimeString()}] Jugador removido de ${roomCode}`);
                        }
                    }
                }
                break;
            }
        }
        });
});
}

module.exports = { registerSocketHandlers };
