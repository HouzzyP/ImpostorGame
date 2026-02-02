/**
 * Headless test: Voting scenarios for El Impostor
 * - Innocent elimination -> continue
 * - Impostor elimination -> end
 * - Tie -> continue
 */
const io = require('socket.io-client');

const SERVER_URL = `http://127.0.0.1:${process.env.TEST_PORT || 3000}`;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function withTimeout(promise, ms, label = 'operation') {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout waiting for ${label}`)), ms))
    ]);
}

function createClient(username) {
    const socket = io(SERVER_URL, { path: '/socket.io', transports: ['websocket', 'polling'], reconnection: false, forceNew: true });
    const state = { username, id: null, isImpostor: null };
    socket.on('connect', () => { state.id = socket.id; });
    socket.on('connect_error', (err) => { console.error('connect_error', username, err.message); });
    socket.on('error', (err) => { console.error('error', username, err); });
    socket.on('yourRole', ({ isImpostor }) => { state.isImpostor = isImpostor; });
    return { socket, state };
}

async function setupRoom() {
    const host = createClient('Host');
    const p2 = createClient('Player2');
    const p3 = createClient('Player3');

    const playersState = new Map();
    const joined = [];
    let roomCode = null;

    const collectPlayers = (list) => {
        list.forEach(p => playersState.set(p.id, { id: p.id, username: p.username, alive: p.alive }));
    };

    // Ensure all clients are connected before emitting events
    await withTimeout(Promise.all([
        new Promise(res => host.socket.once('connect', res)),
        new Promise(res => p2.socket.once('connect', res)),
        new Promise(res => p3.socket.once('connect', res)),
    ]), 5000, 'socket connect');

    // Create room
    const roomCreated = new Promise((resolve) => {
        host.socket.once('roomCreated', (payload) => { roomCode = payload.roomCode; resolve(payload); });
    });
    host.socket.emit('createRoom', { username: 'Host' });
    await withTimeout(roomCreated, 5000, 'roomCreated');

    // Listen playerListUpdate to collect player ids
    const onPlayerListUpdate = (sock) => sock.on('playerListUpdate', (list) => collectPlayers(list));
    onPlayerListUpdate(host.socket);
    onPlayerListUpdate(p2.socket);
    onPlayerListUpdate(p3.socket);

    // Join players
    const joinPromise2 = new Promise((resolve) => p2.socket.once('roomJoined', resolve));
    const joinPromise3 = new Promise((resolve) => p3.socket.once('roomJoined', resolve));
    p2.socket.emit('joinRoom', { roomCode, username: 'Player2' });
    p3.socket.emit('joinRoom', { roomCode, username: 'Player3' });
    await withTimeout(Promise.all([joinPromise2, joinPromise3]), 5000, 'roomJoined');

    // Start game by host
    const rolesReady = Promise.all([
        new Promise((resolve) => host.socket.once('yourRole', resolve)),
        new Promise((resolve) => p2.socket.once('yourRole', resolve)),
        new Promise((resolve) => p3.socket.once('yourRole', resolve))
    ]);
    host.socket.emit('startGame', { roomCode });
    await withTimeout(rolesReady, 5000, 'yourRole');

    // Map impostor and innocents
    const clients = [host, p2, p3];
    const impostor = clients.find(c => c.state.isImpostor);
    const innocents = clients.filter(c => !c.state.isImpostor);

    return { roomCode, host, p2, p3, clients, impostor, innocents, playersState };
}

async function startVoting(host, roomCode) {
    const votingStarted = new Promise((resolve) => host.socket.once('votingStarted', resolve));
    host.socket.emit('startVoting', { roomCode });
    const payload = await withTimeout(votingStarted, 5000, 'votingStarted');
    return payload;
}

async function scenarioInnocentElimination(ctx) {
    const { roomCode, clients, innocents } = ctx;
    const target = innocents[0];
    await startVoting(ctx.host, roomCode);

    const eliminated = new Promise((resolve) => ctx.host.socket.once('playerEliminated', resolve));
    // Every alive player votes for target
    clients.forEach(c => c.socket.emit('castVote', { roomCode, votedFor: target.state.id }));
    const result = await withTimeout(eliminated, 5000, 'playerEliminated');
    const continued = new Promise((resolve) => ctx.host.socket.once('continueGame', resolve));
    const contPayload = await withTimeout(continued, 5000, 'continueGame');
    return { result, contPayload };
}

async function scenarioImpostorElimination(ctx) {
    const { roomCode, clients, impostor } = ctx;
    await startVoting(ctx.host, roomCode);

    const eliminated = new Promise((resolve) => ctx.host.socket.once('playerEliminated', resolve));
    clients.forEach(c => c.socket.emit('castVote', { roomCode, votedFor: impostor.state.id }));
    const result = await withTimeout(eliminated, 5000, 'playerEliminated');
    return { result };
}

async function scenarioTie(ctx) {
    const { roomCode, host, clients } = ctx;
    await startVoting(host, roomCode);

    const tieEv = new Promise((resolve) => host.socket.once('tieVoting', resolve));
    const contEv = new Promise((resolve) => host.socket.once('continueGame', resolve));

    // Votes: A->B, B->C, C->A to produce 1-1-1
    const [a, b, c] = clients;
    a.socket.emit('castVote', { roomCode, votedFor: b.state.id });
    b.socket.emit('castVote', { roomCode, votedFor: c.state.id });
    c.socket.emit('castVote', { roomCode, votedFor: a.state.id });

    const tieRes = await withTimeout(tieEv, 5000, 'tieVoting');
    const contRes = await withTimeout(contEv, 5000, 'continueGame');
    return { tieRes, contRes };
}

async function run() {
    const ctx = await setupRoom();


    // Scenario 1: innocent elimination
    const s1 = await scenarioInnocentElimination(ctx);
    if (s1.result.wasImpostor) throw new Error('Expected innocent eliminated');
    if (s1.result.gameEnded) throw new Error('Game should continue after innocent elimination');

    // Scenario 2: impostor elimination (should end game)
    const s2 = await scenarioImpostorElimination(ctx);
    if (!s2.result.wasImpostor) throw new Error('Expected impostor eliminated');
    if (!s2.result.gameEnded) throw new Error('Game should end after impostor elimination');

    // Reset to lobby, new game for tie scenario
    await new Promise((resolve) => ctx.host.socket.once('gameResetToLobby', resolve));
    ctx.host.socket.emit('resetGame', { roomCode: ctx.roomCode });
    await delay(200);
    ctx.host.socket.emit('startGame', { roomCode: ctx.roomCode });
    await delay(300);

    const s3 = await scenarioTie(ctx);
    if (!s3.tieRes || !s3.contRes) throw new Error('Expected tie followed by continueGame');

    // Cleanup
    ctx.clients.forEach(c => c.socket.disconnect());
}

run().catch(err => {
    console.error('Scenario failed:', err);
    process.exitCode = 1;
});
