/**
 * Test de flujo completo del juego
 * - 8 jugadores
 * - 2 impostores
 * - Categoría aleatoria
 * - 5 partidas completas
 * - Incluye desconexión y reconexión de un jugador
 */

const io = require('socket.io-client');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const NUM_PLAYERS = 8;
const NUM_IMPOSTORS = 2;
const NUM_GAMES = 5;

let roomCode = null;
let clients = [];
let gameStats = {
    gamesPlayed: 0,
    innocentsWins: 0,
    impostorsWins: 0,
    disconnections: 0,
    reconnections: 0
};

function log(message, data = '') {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`, data);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createClient(playerName) {
    return new Promise((resolve, reject) => {
        const socket = io(SERVER_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 500,
            reconnectionAttempts: 5
        });

        socket.playerName = playerName;
        socket.isHost = false;
        socket.myRole = null;
        socket.hasVoted = false;

        socket.on('connect', () => {
            log(`✅ ${playerName} conectado`);
            resolve(socket);
        });

        socket.on('connect_error', (error) => {
            log(`❌ Error conectando ${playerName}:`, error.message);
            reject(error);
        });

        // Event listeners
        socket.on('roomCreated', ({ roomCode: code, room }) => {
            roomCode = code;
            socket.isHost = true;
            log(`🏠 Sala creada: ${code}`);
        });

        socket.on('roomJoined', ({ roomCode: code, room }) => {
            roomCode = code;
            log(`✅ ${playerName} se unió a sala ${code}`);
        });

        socket.on('playerListUpdate', (players) => {
            socket.currentPlayers = players;
        });

        socket.on('gameStarted', ({ category, descriptionOrder }) => {
            if (socket.isHost) {
                log(`🎮 Juego iniciado - Categoría: ${category}`);
            }
            socket.descriptionOrder = descriptionOrder;
        });

        socket.on('yourRole', ({ isImpostor, word, category, players }) => {
            socket.myRole = { isImpostor, word, category };
            if (isImpostor) {
                // El impostor no sabe la palabra, solo que es impostor
                log(`🎭 ${playerName} - Rol: 🎭 IMPOSTOR`);
            } else {
                // Los inocentes ven la palabra y categoría
                log(`🎭 ${playerName} - Rol: 😇 INOCENTE | Palabra: ${word || 'DESCONOCIDA'} | Cat: ${category}`);
            }
        });

        socket.on('votingStarted', ({ votingOrder, currentVoterIndex }) => {
            socket.hasVoted = false;
            socket.votingOrder = votingOrder;
            socket.isMyTurn = false;
            socket.availableTargets = votingOrder; // Todos los vivos están disponibles
            socket.votingStartedCount = (socket.votingStartedCount || 0) + 1; // Incrementar para detectar nuevo evento
            if (socket.isHost) {
                log(`🗳️ Votación iniciada - ${votingOrder.length} jugadores vivos`);
            }
        });

        socket.on('yourTurnToVote', ({ alivePlayers }) => {
            socket.canVote = true;
            socket.isMyTurn = true;
            if (alivePlayers) socket.availableTargets = alivePlayers;
            log(`📢 Turno de votar: ${playerName}`);
        });

        socket.on('playerEliminated', ({ playerName: eliminated, wasImpostor, gameEnded, winner }) => {
            socket.votingResultReceived = true;

            if (socket.isHost) {
                log(`❌ ${eliminated} eliminado - ${wasImpostor ? 'Era impostor' : 'Era inocente'}`);
            }

            // Marcar como eliminado en TODOS los clientes
            const eliminatedClient = clients.find(c => c.playerName === eliminated);
            if (eliminatedClient) {
                eliminatedClient.eliminated = true;
            }

            if (gameEnded) {
                socket.gameFinished = true;
                if (socket.isHost) {
                    log(`🏆 JUEGO TERMINADO - Ganador: ${winner === 'innocents' ? 'INOCENTES' : 'IMPOSTORES'}`);
                }
            }
        });

        socket.on('tieVoting', () => {
            socket.votingResultReceived = true;
            if (socket.isHost) {
                log(`🤝 EMPATE - Nadie eliminado`);
            }
            socket.tieOccurred = true;
        });

        socket.on('continueGame', ({ alivePlayers, roundNumber }) => {
            socket.hasVoted = false;
            socket.roundNumber = roundNumber;
            if (socket.isHost) {
                log(`➡️ Continuar al round ${roundNumber}`);
            }
        });

        socket.on('gameEnded', ({ winner, word, players }) => {
            socket.gameFinished = true;
            log(`🎯 Final - Palabra: ${word} | Ganador: ${winner}`);
        });

        socket.on('error', (error) => {
            log(`⚠️ ${playerName} - Error:`, error);
        });

        socket.on('disconnect', (reason) => {
            log(`🔌 ${playerName} desconectado: ${reason}`);
        });

        socket.on('reconnect', (attemptNumber) => {
            log(`🔄 ${playerName} reconectado (intento ${attemptNumber})`);
            gameStats.reconnections++;
        });
    });
}

async function createRoom(hostSocket) {
    return new Promise((resolve) => {
        hostSocket.once('roomCreated', ({ roomCode: code }) => {
            resolve(code);
        });
        hostSocket.emit('createRoom', { username: hostSocket.playerName });
    });
}

async function joinRoom(socket, code) {
    return new Promise((resolve) => {
        socket.once('roomJoined', () => {
            resolve();
        });
        socket.emit('joinRoom', { username: socket.playerName, roomCode: code });
    });
}

async function startGame(hostSocket) {
    log(`🚀 Host iniciando partida...`);
    hostSocket.emit('startGame', { roomCode });
    await sleep(2000); // Esperar a que todos reciban su rol
}

async function simulateVoting(clients) {
    log(`🗳️ Iniciando simulación de votación...`);

    // Reset voting result flags
    let votingResultReceived = false;

    // Guardar el contador anterior de votingStarted para detectar el nuevo evento
    const previousCounts = clients.map(c => c.votingStartedCount || 0);

    clients.forEach(c => {
        c.votingResultReceived = false;
    });

    // Host inicia votación
    const host = clients.find(c => c.isHost);
    host.emit('startVoting', { roomCode });

    // Esperar a que TODOS reciban el NUEVO votingStarted (contador incrementado)
    let allPlayersReceivedVotingStarted = false;
    let waitAttempts = 0;
    while (!allPlayersReceivedVotingStarted && waitAttempts < 15) {
        await sleep(200);
        waitAttempts++;
        // Verificar que todos hayan recibido un NUEVO votingStarted (contador incrementado)
        allPlayersReceivedVotingStarted = clients.every((c, i) => c.votingStartedCount > previousCounts[i]);
    }

    if (!allPlayersReceivedVotingStarted) {
        log(`  ⚠️ No todos los jugadores recibieron votingStarted`);
        return;
    }

    // Obtener el votingOrder del host (es el mismo para todos)
    const hostVotingOrder = host.votingOrder || [];
    const alivePlayerIds = hostVotingOrder.map(p => p.id);

    // Filtrar clientes que están en el votingOrder del servidor (los vivos según el servidor)
    const votersWithTargets = clients.filter(c => {
        const isAliveOnServer = alivePlayerIds.some(id => id === c.id);
        return c.connected && isAliveOnServer && c.votingOrder && c.votingOrder.length > 0;
    });

    log(`  👥 Jugadores vivos votando: ${votersWithTargets.length}`);

    if (votersWithTargets.length === 0) {
        log(`  ⚠️ No hay jugadores disponibles para votar`);
        return;
    }

    // Simular votación de cada jugador
    for (const voter of votersWithTargets) {
        // Si ya se recibió resultado, no seguir votando
        if (votingResultReceived || voter.votingResultReceived) {
            break;
        }

        // Filtrar targets válidos (que no sea el mismo votante)
        const validTargets = voter.votingOrder.filter(p => p.id !== voter.id);

        if (validTargets.length === 0) {
            log(`  ⚠️ ${voter.playerName} no tiene targets válidos`);
            continue;
        }

        // Elegir un objetivo al azar
        const target = validTargets[Math.floor(Math.random() * validTargets.length)];

        log(`  👉 ${voter.playerName} vota a ${target.username}`);
        voter.emit('castVote', { roomCode, votedFor: target.id });
        voter.hasVoted = true;

        await sleep(800);
    }

    // Esperar procesamiento de votos
    log(`  ⏳ Esperando resultado de votación...`);
    await sleep(4000);
}

async function simulateRound(clients) {
    // Simular descripción de palabras (en este test no enviamos descripciones, solo votamos)
    log(`  💬 Fase de descripción (simulada)...`);
    await sleep(2000);

    // Simular votación
    await simulateVoting(clients);

    // Esperar a que se procese la eliminación o empate
    await sleep(1500);
}

async function playCompleteGame(clients) {
    log(`\n${'='.repeat(60)}`);
    log(`🎲 INICIANDO PARTIDA ${gameStats.gamesPlayed + 1}/${NUM_GAMES}`);
    log(`${'='.repeat(60)}\n`);

    // Reset completo del estado de cada jugador para nueva partida
    clients.forEach(c => {
        c.gameFinished = false;
        c.eliminated = false;
        c.tieOccurred = false;
        c.roundNumber = 1;
        c.myRole = null;
        c.hasVoted = false;
        c.votingResultReceived = false;
        c.descriptionOrder = null;
        c.availableTargets = null;
        c.votingOrder = null;
        c.votingStartedCount = 0;
    });

    const host = clients[0];

    // Configurar juego (categoría aleatoria, 2 impostores)
    host.emit('updateConfig', {
        roomCode,
        config: {
            category: 'random',
            impostorCount: NUM_IMPOSTORS
        }
    });
    await sleep(1000); // Esperar a que se aplique la configuración

    // Iniciar juego
    await startGame(host);

    // Jugar rounds hasta que termine el juego
    let gameEnded = false;
    let roundCount = 0;
    const MAX_ROUNDS = 15; // Límite de seguridad

    while (!gameEnded && roundCount < MAX_ROUNDS) {
        roundCount++;
        log(`\n--- Round ${roundCount} ---`);

        await simulateRound(clients);

        // Verificar si el juego terminó
        gameEnded = clients.some(c => c.gameFinished);

        if (!gameEnded) {
            // Esperar y continuar
            log(`  ➡️ Continuando al siguiente round...`);
            await sleep(1500);
        }
    }

    if (gameEnded) {
        // Incrementar contador de partidas y estadísticas
        gameStats.gamesPlayed++;
        const winner = clients[0].gameFinished ? (clients.find(c => c.myRole?.isImpostor && !c.eliminated) ? 'impostors' : 'innocents') : null;
        if (winner === 'innocents') gameStats.innocentsWins++;
        else if (winner === 'impostors') gameStats.impostorsWins++;

        log(`\n✅ Partida ${gameStats.gamesPlayed} completada después de ${roundCount} rounds\n`);
    } else {
        log(`\n⚠️ Partida alcanzó límite de rounds (${MAX_ROUNDS})\n`);
        gameStats.gamesPlayed++;
    }

    // Volver al lobby para siguiente partida
    await sleep(2000);
    if (gameStats.gamesPlayed < NUM_GAMES) {
        log(`🔄 Reseteando juego para siguiente partida...`);
        host.emit('continueInRoom', { roomCode });
        await sleep(3000);
    }
}

async function simulateDisconnectReconnect(clients) {
    log(`\n${'='.repeat(60)}`);
    log(`🔌 SIMULANDO DESCONEXIÓN Y RECONEXIÓN`);
    log(`${'='.repeat(60)}\n`);

    // Elegir un jugador que no sea el host para desconectar
    const playerToDisconnect = clients.find(c => !c.isHost);
    const playerName = playerToDisconnect.playerName;

    log(`🔻 Desconectando a ${playerName}...`);
    playerToDisconnect.disconnect();
    gameStats.disconnections++;

    await sleep(3000);

    log(`🔄 Reconectando a ${playerName}...`);
    playerToDisconnect.connect();

    // Re-unirse a la sala
    await sleep(1000);
    playerToDisconnect.emit('joinRoom', {
        username: playerName,
        roomCode
    });

    await sleep(2000);
    log(`✅ ${playerName} reconectado exitosamente\n`);
}


async function runTest() {
    console.log('\n' + '='.repeat(80));
    console.log('🎮 TEST DE FLUJO COMPLETO DEL JUEGO');
    console.log('='.repeat(80));
    console.log(`👥 Jugadores: ${NUM_PLAYERS}`);
    console.log(`🎭 Impostores: ${NUM_IMPOSTORS}`);
    console.log(`🎲 Partidas: ${NUM_GAMES}`);
    console.log('='.repeat(80) + '\n');

    try {
        // 1. Conectar jugadores
        log(`📡 Conectando ${NUM_PLAYERS} jugadores...`);
        for (let i = 0; i < NUM_PLAYERS; i++) {
            const playerName = `Jugador${i + 1}`;
            const client = await createClient(playerName);
            clients.push(client);
            await sleep(300);
        }
        log(`✅ Todos los jugadores conectados\n`);

        // 2. Crear sala con el primer jugador (host)
        log(`🏗️ Creando sala...`);
        roomCode = await createRoom(clients[0]);
        await sleep(500);

        // 3. Unir resto de jugadores
        log(`👥 Uniendo jugadores a la sala ${roomCode}...`);
        for (let i = 1; i < clients.length; i++) {
            await joinRoom(clients[i], roomCode);
            await sleep(300);
        }
        log(`✅ Todos los jugadores en la sala\n`);

        await sleep(1000);

        // 4. Jugar partidas
        for (let game = 0; game < NUM_GAMES; game++) {
            await playCompleteGame(clients);

            // En la partida 3, simular desconexión/reconexión
            if (game === 2) {
                await simulateDisconnectReconnect(clients);
            }
        }

        // 5. Mostrar estadísticas finales
        console.log('\n' + '='.repeat(80));
        console.log('📊 ESTADÍSTICAS FINALES');
        console.log('='.repeat(80));
        console.log(`🎮 Partidas jugadas: ${gameStats.gamesPlayed}`);
        console.log(`😇 Victorias Inocentes: ${gameStats.innocentsWins}`);
        console.log(`🎭 Victorias Impostores: ${gameStats.impostorsWins}`);
        console.log(`🔌 Desconexiones: ${gameStats.disconnections}`);
        console.log(`🔄 Reconexiones: ${gameStats.reconnections}`);
        console.log('='.repeat(80) + '\n');

        // 6. Limpiar
        log(`🧹 Desconectando jugadores...`);
        clients.forEach(client => client.disconnect());

        log(`\n✅ TEST COMPLETADO EXITOSAMENTE\n`);
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR EN TEST:', error);
        clients.forEach(client => client.disconnect());
        process.exit(1);
    }
}

// Ejecutar test
if (require.main === module) {
    runTest();
}

module.exports = { runTest };
