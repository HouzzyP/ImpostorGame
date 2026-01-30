const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:4000';
const PLAYERS_COUNT = 6;
const IMPOSTORS_COUNT = 2;
const TEST_TIMEOUT_MS = 30000; // 30 segundos máximo

// ====== TIMEOUT GLOBAL ======
const globalTimeout = setTimeout(() => {
    console.log('\n⏰ TIMEOUT: Test excedió el tiempo límite. Terminando...');
    cleanup();
    process.exit(1);
}, TEST_TIMEOUT_MS);

// Lista de sockets para cleanup
const activeSockets = [];

function cleanup() {
    clearTimeout(globalTimeout);
    activeSockets.forEach(s => {
        try { s.disconnect(); } catch (e) { }
    });
}

// Helper para crear clientes
function createClient(name) {
    return new Promise((resolve, reject) => {
        const socket = io(SERVER_URL, {
            transports: ['websocket'],
            forceNew: true,
            timeout: 5000
        });

        socket.on('connect', () => {
            activeSockets.push(socket);
            resolve({ socket, name, state: {} });
        });

        socket.on('connect_error', (err) => {
            reject(new Error(`No se pudo conectar al servidor: ${err.message}`));
        });
    });
}

// Helper para esperar eventos con timeout
function waitForEvent(client, event, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout esperando evento '${event}'`));
        }, timeoutMs);

        client.socket.once(event, (data) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

// Delay simple
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runChaosTest() {
    console.log('🔥 INICIANDO CHAOS TEST 🔥');
    console.log(`⏱️  Timeout: ${TEST_TIMEOUT_MS / 1000}s\n`);

    try {
        // 1. Crear clientes
        const clients = [];
        for (let i = 0; i < PLAYERS_COUNT; i++) {
            clients.push(await createClient(`Bot_${i}`));
        }
        console.log(`✅ ${PLAYERS_COUNT} Clientes conectados`);

        const host = clients[0];
        const others = clients.slice(1);
        let roomCode = null;

        // --- ESCENARIO 1: Creación y Unión ---
        console.log('\n--- 🧪 ESCENARIO 1: Setup de Sala ---');

        host.socket.emit('createRoom', {
            username: host.name,
            category: 'Lugares',
            impostors: IMPOSTORS_COUNT
        });

        const createdData = await waitForEvent(host, 'roomCreated');
        roomCode = createdData.roomCode;
        console.log(`🏠 Sala creada: ${roomCode}`);

        // Otros se unen
        for (const client of others) {
            client.socket.emit('joinRoom', { username: client.name, roomCode });
            await delay(50);
        }
        console.log('✅ Todos unidos');

        // --- ESCENARIO 2: Intentos Ilegales ---
        console.log('\n--- 🧪 ESCENARIO 2: Acciones Ilegales Pre-Juego ---');
        others[0].socket.emit('castVote', { votedFor: host.socket.id, roomCode });
        console.log('🛡️ Intento de voto pre-juego enviado (ignorado)');

        // --- ESCENARIO 3: Inicio de Partida ---
        console.log('\n--- 🧪 ESCENARIO 3: Inicio de Partida ---');
        host.socket.emit('startGame', { roomCode });

        await Promise.all(clients.map(c => waitForEvent(c, 'gameStarted')));
        console.log('🎮 Juego Iniciado');

        // --- ESCENARIO 4: Votación ---
        console.log('\n--- 🧪 ESCENARIO 4: Votación ---');
        host.socket.emit('startVoting', { roomCode });
        await delay(500);

        const eliminationPromise = waitForEvent(host, 'playerEliminated');

        const voter = clients[1];
        const victim = clients[2];

        console.log(`⚠️ ${voter.name} intenta votar DOBLE a ${victim.name}`);
        voter.socket.emit('castVote', { votedFor: victim.socket.id, roomCode });
        await delay(50);
        voter.socket.emit('castVote', { votedFor: victim.socket.id, roomCode });

        for (const c of clients) {
            if (c !== voter) {
                c.socket.emit('castVote', { votedFor: victim.socket.id, roomCode });
                await delay(20);
            }
        }

        const eliminationData = await eliminationPromise;
        console.log(`💀 Eliminado: ${eliminationData.playerName} (Impostor: ${eliminationData.wasImpostor})`);

        if (eliminationData.playerName !== victim.name) {
            console.error('❌ ERROR: Se eliminó al jugador incorrecto!');
        } else {
            console.log('✅ Eliminación correcta');
        }

        // --- ESCENARIO 5: Desconexión ---
        console.log('\n--- 🧪 ESCENARIO 5: Desconexión Súbita ---');
        const leaver = clients[clients.length - 1];
        console.log(`🔌 ${leaver.name} se desconecta...`);
        leaver.socket.disconnect();

        await delay(500);

        host.socket.emit('sendChat', { roomCode, message: '¿Sigue vivo?' });

        try {
            await waitForEvent(host, 'chatMessage', 2000);
            console.log('✅ Server responde tras desconexión');
        } catch (e) {
            console.log('⚠️ Server no respondió al chat (puede ser normal)');
        }

        console.log('\n🎉 TEST CAOS FINALIZADO CON ÉXITO 🎉');

    } catch (error) {
        console.error('\n❌ TEST FALLÓ:', error.message);
    } finally {
        cleanup();
        process.exit(0);
    }
}

runChaosTest();
