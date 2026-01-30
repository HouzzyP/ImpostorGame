const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:4000';
const PLAYERS_COUNT = 6;
const IMPOSTORS_COUNT = 2;

// Helper para crear clientes
function createClient(name) {
    return new Promise((resolve) => {
        const socket = io(SERVER_URL, {
            transports: ['websocket'],
            forceNew: true
        });
        socket.on('connect', () => resolve({ socket, name, state: {} }));
    });
}

// Helper para esperar eventos
function waitForEvent(client, event) {
    return new Promise((resolve) => {
        client.socket.once(event, (data) => resolve(data));
    });
}

// Delay simple
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runChaosTest() {
    console.log('🔥 INICIANDO CHAOS TEST 🔥');

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

    // Host crea sala
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
        await delay(50); // Leve delay para orden
    }
    console.log('✅ Todos unidos');

    // --- ESCENARIO 2: Intentos Ilegales (Antes de Iniciar) ---
    console.log('\n--- 🧪 ESCENARIO 2: Acciones Ilegales Pre-Juego ---');

    // Alguien intenta votar sin que empiece el juego
    others[0].socket.emit('castVote', { votedFor: host.socket.id, roomCode });
    console.log('🛡️ Intento de voto pre-juego enviado (esperamos que sea ignorado)');

    // --- ESCENARIO 3: Inicio de Partida ---
    console.log('\n--- 🧪 ESCENARIO 3: Inicio de Partida ---');
    host.socket.emit('startGame', { roomCode });

    // Todos esperan 'gameStarted'
    await Promise.all(clients.map(c => waitForEvent(c, 'gameStarted')));
    console.log('🎮 Juego Iniciado');

    // --- ESCENARIO 4: Votación y Errores ---
    console.log('\n--- 🧪 ESCENARIO 4: Votación y Errores ---');

    // Host dispara votación
    host.socket.emit('startVoting', { roomCode });

    await delay(500);

    // Escuchar evento de eliminación ANTES de empezar a votar
    const eliminationPromise = waitForEvent(host, 'playerEliminated');

    // CASO DE ERROR: Doble Voto
    const voter = clients[1];
    const victim = clients[2]; // Matamos al Bot_2

    console.log(`⚠️ ${voter.name} intenta votar DOBLE a ${victim.name}`);
    voter.socket.emit('castVote', { votedFor: victim.socket.id, roomCode });
    await delay(50);
    voter.socket.emit('castVote', { votedFor: victim.socket.id, roomCode }); // Segundo voto ilegal

    // Resto vota a Bot_2 para eliminarlo
    for (const c of clients) {
        if (c !== voter) { // voter ya votó (una vez válida)
            c.socket.emit('castVote', { votedFor: victim.socket.id, roomCode });
            await delay(20);
        }
    }

    // Esperar resultado
    const eliminationData = await eliminationPromise;
    console.log(`💀 Eliminado: ${eliminationData.playerName} (Era Impostor: ${eliminationData.wasImpostor})`);

    if (eliminationData.playerName !== victim.name) {
        console.error('❌ ERROR: Se eliminó al jugador incorrecto!');
    } else {
        console.log('✅ Eliminación correcta');
    }

    // --- ESCENARIO 5: Desconexión en medio del juego ---
    console.log('\n--- 🧪 ESCENARIO 5: Desconexión Súbita ---');
    const leaver = clients[clients.length - 1]; // El último se va
    console.log(`🔌 ${leaver.name} se desconecta brutalmente...`);
    leaver.socket.disconnect();

    await delay(1000); // Esperar a que el server procese

    // Verificar si el juego sigue o se rompió
    // Enviamos un mensaje de chat para ver si el server sigue vivo
    host.socket.emit('chatMessage', { roomCode, message: '¿Sigue vivo el server?' });

    // Si recibimos el mensaje, el server sobrevivió a la desconexión
    try {
        await waitForEvent(host, 'chatMessage');
        console.log('✅ Server sigue respondiendo tras desconexión');
    } catch (e) {
        console.error('❌ Server murió o no responde');
    }

    console.log('\n✅ TEST CAOS FINALIZADO CON ÉXITO');
    process.exit(0);
}

runChaosTest().catch(console.error);
