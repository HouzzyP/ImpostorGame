/**
 * 🎮 TEST DE INTEGRACIÓN COMPLETO - EL IMPOSTOR
 * 
 * Simula 5 partidas consecutivas con:
 * - 8 jugadores (máximo permitido)
 * - 2 impostores
 * - Votaciones aleatorias
 * - Manejo de empates
 * - Reconexión mid-game
 */

const io = require('socket.io-client');

// ============ CONFIGURACIÓN ============
const SERVER_URL = process.env.TEST_URL || 'http://localhost:4000';
const PLAYERS_COUNT = 8;  // Máximo permitido
const IMPOSTORS_COUNT = 2;
const TOTAL_GAMES = 5;
const TEST_TIMEOUT_MS = 180000; // 3 minutos para más rondas
const DEBUG = false;

// ============ ESTADO GLOBAL ============
let testsPassed = 0;
let testsFailed = 0;
const gameResults = [];

// ============ UTILIDADES ============
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const log = (emoji, msg) => console.log(`[${new Date().toLocaleTimeString()}] ${emoji} ${msg}`);
const debug = (msg) => DEBUG && console.log(`    [DEBUG] ${msg}`);

class TestClient {
    constructor(name) {
        this.name = name;
        this.socket = null;
        this.role = null;
        this.word = null;
        this.isAlive = true;
        this.isHost = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true,
                timeout: 10000
            });

            const timeout = setTimeout(() => reject(new Error(`Timeout: ${this.name}`)), 10000);
            this.socket.on('connect', () => { clearTimeout(timeout); resolve(this); });
            this.socket.on('connect_error', (e) => { clearTimeout(timeout); reject(e); });
        });
    }

    waitFor(event, timeoutMs = 10000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Timeout: ${event}`)), timeoutMs);
            this.socket.once(event, (data) => { clearTimeout(timer); resolve(data); });
        });
    }

    disconnect() {
        if (this.socket) this.socket.disconnect();
    }
}

// ============ MAIN TEST ============
async function runTest() {
    const startTime = Date.now();

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║    🎮 TEST DE INTEGRACIÓN - EL IMPOSTOR 🎮                 ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  URL: ${SERVER_URL.padEnd(52)}║`);
    console.log(`║  Jugadores: ${PLAYERS_COUNT} (máx), Impostores: ${IMPOSTORS_COUNT}, Partidas: ${TOTAL_GAMES}       ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const clients = [];
    let roomCode = null;

    try {
        // 1. CONECTAR JUGADORES
        log('🔌', 'Conectando jugadores...');
        for (let i = 0; i < PLAYERS_COUNT; i++) {
            const client = await new TestClient(`Player${i + 1}`).connect();
            clients.push(client);
        }
        log('✅', `${PLAYERS_COUNT} jugadores conectados`);

        // 2. CREAR SALA
        const host = clients[0];
        host.isHost = true;

        host.socket.emit('createRoom', {
            username: host.name,
            category: 'Lugares',
            impostors: IMPOSTORS_COUNT
        });

        const roomData = await host.waitFor('roomCreated');
        roomCode = roomData.roomCode;
        log('🏠', `Sala creada: ${roomCode}`);

        // 3. CONFIGURAR SALA CON 2 IMPOSTORES
        host.socket.emit('updateConfig', {
            roomCode,
            config: { impostorCount: IMPOSTORS_COUNT }
        });
        await delay(200);
        log('⚙️', `Configuración: ${IMPOSTORS_COUNT} impostores`);

        // 4. UNIR JUGADORES
        for (let i = 1; i < clients.length; i++) {
            clients[i].socket.emit('joinRoom', { username: clients[i].name, roomCode });
            await delay(100);
        }
        await delay(500);
        log('👥', `${PLAYERS_COUNT} jugadores unidos`);

        // 5. JUGAR 5 PARTIDAS
        for (let gameNum = 1; gameNum <= TOTAL_GAMES; gameNum++) {
            // Reset estado
            clients.forEach(c => { c.isAlive = true; c.role = null; });

            const result = await playOneGame(clients, roomCode, gameNum);
            gameResults.push(result);

            if (result.success) {
                testsPassed++;
                log('✅', `Partida ${gameNum} completada: ${result.winner} ganó en ${result.rounds} rondas`);
            } else {
                testsFailed++;
                log('❌', `Partida ${gameNum} falló: ${result.error || 'timeout'}`);
            }

            // Continuar para siguiente partida
            if (gameNum < TOTAL_GAMES) {
                host.socket.emit('continueInRoom', { roomCode });
                await delay(1500);
            }
        }

        // 6. TEST DE RECONEXIÓN
        log('🔄', '\n══════════ TEST DE RECONEXIÓN ══════════');
        const reconnectResult = await testReconnection(clients, roomCode);
        gameResults.push({ success: reconnectResult, rounds: 0, winner: 'Reconexión', error: null });
        if (reconnectResult) {
            testsPassed++;
            log('✅', 'Reconexión exitosa');
        } else {
            testsFailed++;
            log('❌', 'Reconexión falló');
        }

    } catch (error) {
        log('💥', `ERROR FATAL: ${error.message}`);
        testsFailed++;
    } finally {
        clients.forEach(c => c.disconnect());
    }

    // RESUMEN
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const successfulGames = gameResults.filter((g, i) => i < TOTAL_GAMES && g.success).length;

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                   📊 RESUMEN DE TESTS                      ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Tiempo total: ${elapsed.padEnd(44)}s║`);
    console.log(`║  Partidas exitosas: ${successfulGames}/${TOTAL_GAMES}                                   ║`);
    console.log(`║  Tests pasados: ${testsPassed}                                        ║`);
    console.log(`║  Tests fallidos: ${testsFailed}                                       ║`);
    console.log('╠════════════════════════════════════════════════════════════╣');

    gameResults.slice(0, TOTAL_GAMES).forEach((g, i) => {
        const status = g.success ? '✅' : '❌';
        const info = g.success
            ? `${g.rounds} rondas, Ganador: ${g.winner}`
            : `${g.rounds} rondas, Error: ${g.error || 'timeout'}`;
        console.log(`║  Partida ${i + 1}: ${status} ${info.substring(0, 40).padEnd(40)}║`);
    });

    if (gameResults.length > TOTAL_GAMES) {
        const reconnect = gameResults[TOTAL_GAMES];
        console.log(`║  Reconexión: ${reconnect.success ? '✅ OK' : '❌ FALLÓ'}                                  ║`);
    }

    console.log('╚════════════════════════════════════════════════════════════╝');

    if (testsFailed === 0) {
        console.log('\n🎉 ¡TODOS LOS TESTS PASARON! 🎉\n');
        process.exit(0);
    } else {
        console.log('\n⚠️ Algunos tests fallaron\n');
        process.exit(1);
    }
}

async function playOneGame(clients, roomCode, gameNum) {
    const host = clients[0];
    const result = { success: false, rounds: 0, winner: null, error: null };

    try {
        log('🎯', `\n══════════ PARTIDA ${gameNum}/${TOTAL_GAMES} ══════════`);

        // Setup listeners para yourRole (que contiene isImpostor)
        const rolePromises = clients.map(c =>
            c.waitFor('yourRole').then(data => {
                c.role = data.isImpostor ? 'impostor' : 'civil';
                c.word = data.word;
                debug(`${c.name} es ${c.role}`);
                return data;
            })
        );

        // Iniciar juego
        host.socket.emit('startGame', { roomCode });

        // Esperar roles
        await Promise.all(rolePromises);

        const impostors = clients.filter(c => c.role === 'impostor');
        const civils = clients.filter(c => c.role === 'civil');

        log('🎮', `Juego iniciado - Impostores (${impostors.length}): ${impostors.map(i => i.name).join(', ')}`);
        debug(`Civiles (${civils.length}): ${civils.map(c => c.name).join(', ')}`);

        // Loop de rondas
        let roundNum = 0;
        let gameEnded = false;

        while (!gameEnded && roundNum < 15) {
            roundNum++;
            result.rounds = roundNum;

            const alivePlayers = clients.filter(c => c.isAlive);
            const aliveImpostors = alivePlayers.filter(c => c.role === 'impostor');
            const aliveCivils = alivePlayers.filter(c => c.role === 'civil');

            if (alivePlayers.length < 3) {
                log('⚠️', 'Menos de 3 jugadores vivos');
                break;
            }

            log('🗳️', `Ronda ${roundNum}: ${alivePlayers.length} vivos (${aliveImpostors.length}I/${aliveCivils.length}C)`);

            // Esperar resultado de votación
            const votingResultPromise = new Promise((resolve) => {
                let resolved = false;

                const onElimination = (data) => {
                    if (!resolved) {
                        resolved = true;
                        host.socket.off('tieVoting', onTie);
                        resolve({ type: 'elimination', data });
                    }
                };

                const onTie = (data) => {
                    if (!resolved) {
                        resolved = true;
                        host.socket.off('playerEliminated', onElimination);
                        resolve({ type: 'tie', data });
                    }
                };

                host.socket.once('playerEliminated', onElimination);
                host.socket.once('tieVoting', onTie);

                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        host.socket.off('playerEliminated', onElimination);
                        host.socket.off('tieVoting', onTie);
                        resolve({ type: 'timeout' });
                    }
                }, 10000);
            });

            // Iniciar votación
            host.socket.emit('startVoting', { roomCode });
            await delay(300);

            // Votar - forzar votos concentrados
            const commonTarget = randomChoice(alivePlayers);

            for (const voter of alivePlayers) {
                let target;
                if (Math.random() < 0.85 && commonTarget !== voter) {
                    target = commonTarget;
                } else {
                    const targets = alivePlayers.filter(p => p !== voter);
                    target = randomChoice(targets);
                }

                voter.socket.emit('castVote', { votedFor: target.socket.id, roomCode });
                await delay(20);
            }

            // Esperar resultado
            const votingResult = await votingResultPromise;

            if (votingResult.type === 'timeout') {
                log('⏰', 'Timeout esperando resultado');
                result.error = 'timeout votación';
                break;
            }

            if (votingResult.type === 'tie') {
                log('🔄', `Empate - continuando`);
                await delay(400);
                continue;
            }

            if (votingResult.type === 'elimination') {
                const elimData = votingResult.data;
                const eliminated = clients.find(c => c.name === elimData.playerName);
                if (eliminated) {
                    eliminated.isAlive = false;
                    const wasImpostor = eliminated.role === 'impostor';
                    log('💀', `Eliminado: ${elimData.playerName} (${wasImpostor ? '🔴 IMPOSTOR' : '🟢 civil'})`);
                }

                if (elimData.gameEnded) {
                    gameEnded = true;
                    result.winner = elimData.winner;
                    result.success = true;

                    const finalImpostors = clients.filter(c => c.role === 'impostor' && c.isAlive).length;
                    const finalCivils = clients.filter(c => c.role === 'civil' && c.isAlive).length;
                    log('🏆', `¡Ganador: ${elimData.winner}! (${finalImpostors}I/${finalCivils}C restantes)`);
                }
            }

            await delay(400);
        }

        if (!result.success && roundNum >= 15) {
            result.error = 'máximo de rondas';
        }

    } catch (err) {
        result.error = err.message;
    }

    return result;
}

async function testReconnection(clients, roomCode) {
    try {
        const host = clients[0];
        const testPlayer = clients[1];

        clients.forEach(c => { c.isAlive = true; c.role = null; });

        const rolePromises = clients.map(c => c.waitFor('yourRole', 5000).catch(() => null));
        host.socket.emit('startGame', { roomCode });
        await Promise.all(rolePromises);

        log('🔌', `${testPlayer.name} desconectándose...`);
        testPlayer.socket.disconnect();
        await delay(2000);

        return new Promise((resolve) => {
            const newSocket = io(SERVER_URL, { transports: ['websocket'], forceNew: true });
            let resolved = false;

            const cleanup = () => {
                if (!resolved) {
                    resolved = true;
                    newSocket.disconnect();
                }
            };

            newSocket.on('connect', () => {
                newSocket.emit('joinRoom', { username: testPlayer.name, roomCode });

                newSocket.once('roomJoined', () => {
                    log('✅', `${testPlayer.name} reconectó`);
                    resolved = true;
                    newSocket.disconnect();
                    resolve(true);
                });

                newSocket.once('error', (err) => {
                    log('⚠️', `Error reconexión: ${err}`);
                    cleanup();
                    resolve(false);
                });
            });

            newSocket.on('connect_error', () => {
                cleanup();
                resolve(false);
            });

            setTimeout(() => {
                cleanup();
                resolve(false);
            }, 5000);
        });

    } catch (err) {
        log('❌', `Error test reconexión: ${err.message}`);
        return false;
    }
}

// Timeout global
setTimeout(() => {
    console.log('\n⏰ TIMEOUT GLOBAL');
    process.exit(1);
}, TEST_TIMEOUT_MS);

runTest();
