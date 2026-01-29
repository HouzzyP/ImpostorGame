const socket = io();
let currentRoom = null;
let myPlayerId = null;
let isHost = false;
let isSpectator = false;
let myRole = null;
let categories = {};
let hasVoted = false;
let pendingNextState = null; // caches continueGame or gameEnded payloads
let inEliminationScreen = false; // true while showing elimination/tie feedback
let descriptionOrder = []; // orden aleatorio de descripción
let votingStartTime = null; // para mostrar tiempo transcurrido en votación
let livePlayersState = {}; // { playerId: { username, alive, voted } }

// ============================================
// THEME MANAGEMENT
// ============================================

function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    document.querySelector('.icon-sun').style.display = theme === 'dark' ? 'block' : 'none';
    document.querySelector('.icon-moon').style.display = theme === 'light' ? 'block' : 'none';
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = savedTheme;
    updateThemeIcon(savedTheme);
}

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showHomeScreen() {
    showScreen('homeScreen');
}

function showJoinScreen() {
    const name = document.getElementById('playerNameInput').value.trim();
    if (name) document.getElementById('joinNameInput').value = name;
    showScreen('joinScreen');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

// ============================================
// ROOM FUNCTIONS
// ============================================

function copyRoomCode() {
    if (currentRoom) {
        navigator.clipboard.writeText(currentRoom)
            .then(() => toast('Codigo copiado'))
            .catch(() => toast('No se pudo copiar', 'error'));
    }
}

function createRoom() {
    const name = document.getElementById('playerNameInput').value.trim();
    if (!name) return toast('Ingresa tu nombre', 'error');
    socket.emit('createRoom', { username: name });
}

function joinRoom() {
    const name = document.getElementById('joinNameInput').value.trim();
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    if (!name || !code) return toast('Completa todos los campos', 'error');
    socket.emit('joinRoom', { roomCode: code, username: name });
}

// ============================================
// CATEGORIES & CONFIG
// ============================================

function populateCategories(cats) {
    categories = cats;
    const select = document.getElementById('categorySelect');
    select.innerHTML = '';
    for (const [key, name] of Object.entries(cats)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = name;
        select.appendChild(opt);
    }
}

function loadCategories() {
    populateCategories(categories);
}

function updateConfig() {
    socket.emit('updateConfig', {
        roomCode: currentRoom,
        config: {
            category: document.getElementById('categorySelect').value,
            impostorCount: parseInt(document.getElementById('impostorCountSelect').value)
        }
    });
}

function randomCategory() {
    socket.emit('randomCategory', { roomCode: currentRoom });
}

// ============================================
// GAME FUNCTIONS
// ============================================

function startGame() {
    socket.emit('startGame', { roomCode: currentRoom });
}

function startVoting() {
    socket.emit('startVoting', { roomCode: currentRoom });
}

function finishVoting() {
    socket.emit('finishVoting', { roomCode: currentRoom });
}

function castVote(id) {
    if (hasVoted) return;
    hasVoted = true;
    socket.emit('castVote', { roomCode: currentRoom, votedFor: id });
}

function sendReaction(emoji) {
    socket.emit('sendReaction', { roomCode: currentRoom, emoji });
}

let votingTimerInterval = null;

function startVotingTimer() {
    const timerEl = document.getElementById('votingTimer');
    if (!timerEl) return;

    // Limpia intervalos previos
    if (votingTimerInterval) clearInterval(votingTimerInterval);

    const updateTimer = () => {
        if (!votingStartTime) return;
        const elapsed = Math.floor((Date.now() - votingStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    updateTimer();
    votingTimerInterval = setInterval(updateTimer, 500);
}

function continueGame() {
    // Apply any pending next state after elimination/tie feedback
    if (pendingNextState) {
        if (pendingNextState.type === 'continueGame') {
            const { alivePlayers, roundNumber } = pendingNextState.payload;
            updateRoleDisplay('Game', myRole.isImpostor, myRole.word, null);
            document.getElementById('roundNumber').textContent = roundNumber;

            // Solo resetear estados de votos, no reinicializar (evita flicker)
            resetVotesInPanel();

            document.getElementById('startVotingBtn').style.display = isHost ? 'block' : 'none';
            document.getElementById('waitingVoteMessage').style.display = isHost ? 'none' : 'block';
            showScreen('gameScreen');
        } else if (pendingNextState.type === 'gameEnded') {
            const { winner, players, word } = pendingNextState.payload;
            const banner = document.getElementById('winnerBanner');
            const title = document.getElementById('winnerTitle');
            const msg = document.getElementById('winnerMessage');

            if (winner === 'innocents') {
                banner.className = 'result-banner innocents';
                title.textContent = 'Ganaron los inocentes';
                msg.textContent = 'Todos los impostores fueron eliminados';
            } else {
                banner.className = 'result-banner impostors';
                title.textContent = 'Ganaron los impostores';
                msg.textContent = 'Los impostores dominaron';
            }

            document.getElementById('revealedWord').textContent = word || '';
            document.getElementById('finalPlayerList').innerHTML = (players || []).map(p => `
                <div class="reveal-item ${p.isImpostor ? 'impostor' : ''}">
                    <span class="player-name">${escapeHtml(p.name)}</span>
                    <span class="reveal-role">${p.isImpostor ? 'Impostor' : 'Inocente'}</span>
                </div>
            `).join('');

            document.getElementById('continueButton').style.display = isHost ? 'block' : 'none';
            document.getElementById('resetButton').style.display = isHost ? 'block' : 'none';
            showScreen('endScreen');
        }
    }
    // Clear elimination state
    pendingNextState = null;
    inEliminationScreen = false;
}

function continueInRoom() {
    socket.emit('continueInRoom', { roomCode: currentRoom });
}

function resetGame() {
    socket.emit('resetGame', { roomCode: currentRoom });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderPlayerList(players, elementId) {
    document.getElementById(elementId).innerHTML = players.map(p => `
        <div class="player-item ${p.isHost ? 'host' : ''} ${!p.alive ? 'dead' : ''}">
            <span class="player-name">${escapeHtml(p.username)}</span>
            ${p.isHost ? '<span class="badge">Host</span>' : ''}
        </div>
    `).join('');
}

function initLivePlayersPanel(players) {
    livePlayersState = {};
    players.forEach(p => {
        livePlayersState[p.id] = { username: p.username, alive: true, voted: false };
    });
    // Mostrar el panel global
    const globalPanel = document.getElementById('globalLivePlayersPanel');
    if (globalPanel) globalPanel.style.display = 'block';
    updateLivePlayersPanel();
}

function updateLivePlayersPanel() {
    // Actualizar panel global (persistente durante todo el juego)
    const panel = document.getElementById('globalLivePlayersList');
    if (panel) {
        const playerIds = Object.keys(livePlayersState);
        panel.innerHTML = playerIds.map(id => {
            const p = livePlayersState[id];
            const statusClass = !p.alive ? 'eliminated' : (p.voted ? 'voted' : 'alive');
            const statusText = p.voted ? '✓' : (p.alive ? '●' : '✗');
            return `
                <div class="live-player-item ${statusClass}">
                    <span class="live-player-name">${escapeHtml(p.username)}</span>
                    <span class="live-player-status">${statusText}</span>
                </div>
            `;
        }).join('');
    }
}

function markPlayerVoted(playerId) {
    if (livePlayersState[playerId]) {
        livePlayersState[playerId].voted = true;
        updateLivePlayersPanel();
    }
}

function markPlayerEliminated(playerId) {
    if (livePlayersState[playerId]) {
        livePlayersState[playerId].alive = false;
        updateLivePlayersPanel();
    }
}

function clearLivePlayersPanel() {
    livePlayersState = {};
    const globalPanel = document.getElementById('globalLivePlayersPanel');
    if (globalPanel) {
        globalPanel.style.display = 'none';
        document.getElementById('globalLivePlayersList').innerHTML = '';
    }
}

// Reset vote states for a new round (without reinitializing the panel)
function resetVotesInPanel() {
    Object.values(livePlayersState).forEach(p => {
        p.voted = false;
    });
    updateLivePlayersPanel();
}

function updateRoleDisplay(prefix, isImpostor, word, category) {
    const isGame = prefix === 'Game';
    const card = document.getElementById(isGame ? 'roleCardGame' : 'roleCard');
    const title = document.getElementById(isGame ? 'roleTitleGame' : 'roleTitle');
    const wordEl = document.getElementById(isGame ? 'wordDisplayGame' : 'wordDisplay');
    const hint = document.getElementById(isGame ? 'roleHintGame' : 'roleHint');

    card.className = 'role-card ' + (isImpostor ? 'impostor' : 'innocent');
    title.textContent = isImpostor ? 'Impostor' : 'Inocente';
    wordEl.textContent = isImpostor ? '???' : word;
    hint.textContent = isImpostor ? 'Descubre la palabra sin ser descubierto' : 'Describe la palabra sin ser obvio';

    if (!isGame && category) {
        document.getElementById('categoryTag').textContent = 'Categoria: ' + category;
    }
}

function updateVotingUI(votingOrder, currentVoterIndex) {
    const current = votingOrder[currentVoterIndex];
    const isMyTurn = current.id === myPlayerId;
    const status = document.getElementById('votingStatus');

    status.classList.toggle('my-turn', isMyTurn);
    document.getElementById('currentVoterDisplay').textContent = isMyTurn ? 'Es tu turno' : 'Turno de ' + current.username;

    // Actualizar orden con badges de estado
    const orderDisplay = document.getElementById('descriptionOrderDisplay');
    if (orderDisplay && votingOrder.length > 0) {
        orderDisplay.innerHTML = votingOrder.map((p, i) => {
            let className = '';
            if (i < currentVoterIndex) className = 'done';
            else if (i === currentVoterIndex) className = 'current';
            return `<span class="${className}">${escapeHtml(p.username)}</span>`;
        }).join('');
    }

    const btns = document.getElementById('votingButtons');
    if (isMyTurn) {
        btns.innerHTML = votingOrder
            .filter(p => p.id !== myPlayerId)
            .map(p => `<button class="btn btn-vote" onclick="castVote('${p.id}')">${escapeHtml(p.username)}</button>`)
            .join('');
    } else {
        btns.innerHTML = '<p class="waiting">Esperando...</p>';
    }
}

// ============================================
// SOCKET EVENTS - ROOM SETUP
// ============================================

socket.on('roomCreated', ({ roomCode, room, categories: cats }) => {
    currentRoom = roomCode;
    myPlayerId = socket.id;
    isHost = true;
    populateCategories(cats);
    document.getElementById('roomCodeDisplay').textContent = roomCode;

    // Chat Setup
    document.getElementById('chatToggleBtn').style.display = 'block';
    document.getElementById('chatMessages').innerHTML = '<div class="chat-system-msg">¡Bienvenido al chat!</div>';
    document.getElementById('chatContainer').style.display = 'flex'; // Open by default

    showScreen('lobbyHostScreen');
});

socket.on('roomJoined', ({ roomCode, room, categories: cats, isSpectator: spec, currentPeriod }) => {
    currentRoom = roomCode;
    myPlayerId = socket.id;
    isHost = false;
    isSpectator = spec || false;
    categories = cats;
    document.getElementById('roomCodePlayer').textContent = roomCode;

    // Chat Setup
    document.getElementById('chatToggleBtn').style.display = 'block';
    document.getElementById('chatMessages').innerHTML = '<div class="chat-system-msg">¡Bienvenido al chat!</div>';
    document.getElementById('chatContainer').style.display = 'flex'; // Open by default

    if (isSpectator) {
        toast('Unido como espectador');
        // Handle Mid-Game Join
        if (currentPeriod) {
            handleMidGameJoin(currentPeriod);
        } else {
            showScreen('spectatorScreen');
            document.getElementById('roomCodeSpectator').textContent = roomCode;
        }
    } else {
        showScreen('lobbyPlayerScreen');
    }
});

socket.on('playerListUpdate', (players) => {
    const count = players.length;
    const me = players.find(p => p.id === myPlayerId);
    if (me) {
        isHost = me.isHost;
        // If I was a spectator and now I'm in the player list, I've been promoted!
        if (isSpectator) {
            isSpectator = false;
            toast('¡Te has unido a la partida!');
            // Refresh screen to lobby
            showScreen('lobbyPlayerScreen');
        }
    }

    if (isHost) {
        document.getElementById('playerCount').textContent = count;
        renderPlayerList(players, 'playerListHost');
        document.getElementById('startButton').disabled = count < 4;
    } else {
        document.getElementById('playerCountPlayer').textContent = count;
        renderPlayerList(players, 'playerListPlayer');
    }

    // Update roomStats from player list (includes stats)
    roomStats = players.map(p => ({
        id: p.id,
        username: p.username,
        stats: p.stats || { impostorWins: 0, innocentWins: 0, gamesPlayed: 0, correctVotes: 0 }
    }));
    updateLobbyLeaderboard();
});

socket.on('configUpdate', (config) => {
    document.getElementById('categorySelect').value = config.category;
    document.getElementById('impostorCountSelect').value = config.impostorCount;
});

socket.on('categorySelected', ({ categoryKey }) => {
    document.getElementById('categorySelect').value = categoryKey;
    // Also update config on server
    updateConfig();
});

socket.on('statsUpdate', (players) => {
    // Update roomStats with new stats from server
    roomStats = players.map(p => ({
        id: p.id,
        username: p.username,
        stats: p.stats || { impostorWins: 0, innocentWins: 0, gamesPlayed: 0, correctVotes: 0 }
    }));
    updateLobbyLeaderboard();
});

socket.on('becameHost', () => {
    isHost = true;
    toast('Ahora eres el host');
});

// ============================================
// SOCKET EVENTS - GAME LOGIC
// ============================================

socket.on('yourRole', ({ isImpostor, word, category, players }) => {
    myRole = { isImpostor, word };
    updateRoleDisplay('', isImpostor, word, category);
    document.getElementById('readyButton').style.display = isHost ? 'block' : 'none';
    document.getElementById('waitingMessage').style.display = isHost ? 'none' : 'block';

    // Inicializar panel de jugadores en vivo
    if (players) {
        const alivePlayers = players.filter(p => !p.isSpectator);
        initLivePlayersPanel(alivePlayers);
    }

    showScreen('roleScreen');
});

socket.on('gameStarted', ({ category, descriptionOrder: order }) => {
    descriptionOrder = order || [];

    // Mostrar orden de descripción inicial (sin estado aun)
    if (descriptionOrder.length > 0) {
        const orderDisplay = document.getElementById('descriptionOrderDisplay');
        if (orderDisplay) {
            orderDisplay.innerHTML = descriptionOrder.map((p) =>
                `<span>${escapeHtml(p.username)}</span>`
            ).join('');
        }
    }

    toast(`Categoría: ${category}`);
});

socket.on('votingStarted', ({ votingOrder, currentVoterIndex }) => {
    hasVoted = false;
    votingStartTime = Date.now(); // Inicia el contador de tiempo transcurrido
    document.getElementById('votesDisplay').innerHTML = '';

    // Resetear votos en el panel de jugadores
    Object.values(livePlayersState).forEach(p => { p.voted = false; });
    updateLivePlayersPanel();

    if (isSpectator) {
        document.getElementById('finishVotingBtn').style.display = 'none';
        document.getElementById('votingButtons').innerHTML = '<p class="waiting">Observando votación...</p>';
        document.getElementById('votingStatus').style.display = 'none';
    } else {
        updateVotingUI(votingOrder, currentVoterIndex);
        // document.getElementById('finishVotingBtn').style.display = isHost ? 'block' : 'none';
    }
    showScreen('votingScreen');
    startVotingTimer(); // Muestra timer de tiempo transcurrido
});

socket.on('voteCast', ({ voterName, votedForName, votingOrder, currentVoterIndex, votingFinished }) => {
    hasVoted = false;
    const log = document.getElementById('votesDisplay');
    log.innerHTML += `<div class="vote-entry"><span>${escapeHtml(voterName)}</span> voto por <span>${escapeHtml(votedForName)}</span></div>`;
    log.scrollTop = log.scrollHeight;

    // Marcar al votante en el panel en vivo
    const voterPlayer = Object.entries(livePlayersState).find(([_, p]) => p.username === voterName);
    if (voterPlayer) markPlayerVoted(voterPlayer[0]);

    if (!votingFinished) updateVotingUI(votingOrder, currentVoterIndex);
});

socket.on('playerEliminated', ({ playerName, wasImpostor, gameEnded, winner, word, players }) => {
    // Marcar al jugador como eliminado en el panel en vivo
    const eliminatedPlayer = Object.entries(livePlayersState).find(([_, p]) => p.username === playerName);
    if (eliminatedPlayer) markPlayerEliminated(eliminatedPlayer[0]);

    // Show elimination feedback first
    inEliminationScreen = true;
    document.getElementById('eliminatedName').textContent = playerName + ' fue eliminado';
    document.getElementById('eliminatedRole').textContent = wasImpostor ? 'Era un impostor' : 'Era inocente';
    showScreen('eliminationScreen');

    if (gameEnded) {
        // Cache end state and allow user to proceed
        pendingNextState = { type: 'gameEnded', payload: { winner, word, players } };
        // Optionally auto-advance after short delay for smoother UX
        setTimeout(() => {
            if (inEliminationScreen && pendingNextState && pendingNextState.type === 'gameEnded') {
                continueGame();
            }
        }, 1500);
    }
});

socket.on('tieVoting', ({ players }) => {
    inEliminationScreen = true;
    const bannerId = document.getElementById('eliminatedName');
    bannerId.textContent = '¡EMPATE!';
    document.getElementById('eliminatedRole').textContent = 'Nadie fue eliminado';
    showScreen('eliminationScreen');
});

socket.on('continueGame', ({ alivePlayers, roundNumber }) => {
    // Cache next game state; apply after user clicks "Continuar"
    pendingNextState = { type: 'continueGame', payload: { alivePlayers, roundNumber } };
    // If not showing elimination/tie feedback, proceed immediately
    if (!inEliminationScreen) {
        continueGame();
    }
});

socket.on('gameEnded', ({ winner, players, word }) => {
    // Limpiar panel de jugadores en vivo
    clearLivePlayersPanel();

    const banner = document.getElementById('winnerBanner');
    const title = document.getElementById('winnerTitle');
    const msg = document.getElementById('winnerMessage');

    if (winner === 'innocents') {
        banner.className = 'result-banner innocents';
        title.textContent = 'Ganaron los inocentes';
        msg.textContent = 'Todos los impostores fueron eliminados';
    } else {
        banner.className = 'result-banner impostors';
        title.textContent = 'Ganaron los impostores';
        msg.textContent = 'Los impostores dominaron';
    }

    document.getElementById('revealedWord').textContent = word;
    document.getElementById('finalPlayerList').innerHTML = players.map(p => `
        <div class="reveal-item ${p.isImpostor ? 'impostor' : ''}">
            <span class="player-name">${escapeHtml(p.name)}</span>
            <span class="reveal-role">${p.isImpostor ? 'Impostor' : 'Inocente'}</span>
        </div>
    `).join('');

    document.getElementById('continueButton').style.display = isHost ? 'block' : 'none';
    document.getElementById('resetButton').style.display = isHost ? 'block' : 'none';
    showScreen('endScreen');
});

socket.on('gameResetToLobby', ({ categories: cats }) => {
    // Limpiar panel de jugadores en vivo
    clearLivePlayersPanel();

    categories = cats;
    populateCategories(cats);
    if (isHost) {
        document.getElementById('playerCount').textContent = document.querySelectorAll('#playerListHost .player-item').length;
        document.getElementById('startButton').disabled = document.querySelectorAll('#playerListHost .player-item').length < 4;
        showScreen('lobbyHostScreen');
    } else {
        showScreen('lobbyPlayerScreen');
    }
});

socket.on('gameInterrupted', ({ message, categories: cats }) => {
    // Limpiar panel de jugadores en vivo
    clearLivePlayersPanel();

    categories = cats;
    populateCategories(cats);
    toast(message, 'warning');
    pendingNextState = null;
    inEliminationScreen = false;
    if (votingTimerInterval) clearInterval(votingTimerInterval);

    if (isHost) {
        document.getElementById('playerCount').textContent = document.querySelectorAll('#playerListHost .player-item').length;
        document.getElementById('startButton').disabled = document.querySelectorAll('#playerListHost .player-item').length < 4;
        showScreen('lobbyHostScreen');
    } else {
        showScreen('lobbyPlayerScreen');
    }
});

socket.on('playerDisconnected', ({ playersRemaining }) => {
    toast(`Jugador desconectado (${playersRemaining})`);
});

socket.on('spectatorJoined', ({ username }) => {
    toast(`${username} se unió como espectador`);
});

socket.on('reactionReceived', ({ username, emoji }) => {
    // Mostrar emoji temporalmente cerca del nombre del jugador
    const msg = document.createElement('div');
    msg.className = 'reaction-popup';
    msg.textContent = `${username} ${emoji}`;
    msg.style.position = 'fixed';
    msg.style.top = Math.random() * 40 + 20 + '%';
    msg.style.left = Math.random() * 60 + 20 + '%';
    msg.style.zIndex = '9999';
    msg.style.animation = 'fadeOut 2s forwards';
    msg.style.fontSize = '20px';
    msg.style.pointerEvents = 'none';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
});

socket.on('error', msg => {
    toast(msg, 'error');
});

// Helper to sync state for late joiners
function handleMidGameJoin(state) {
    const { state: gameState, players, config } = state;

    // Initial live players setup
    const alivePlayers = players.filter(p => !p.isSpectator); // Simple filter
    initLivePlayersPanel(alivePlayers);

    // Force specific screen based on state
    if (gameState === 'playing' || gameState === 'discussing') {
        setupSpectatorGameView('Jugando');
    } else if (gameState === 'voting') {
        setupSpectatorGameView('Votación en curso');
        showScreen('votingScreen');
        document.getElementById('finishVotingBtn').style.display = 'none';
        document.getElementById('votingButtons').innerHTML = '<p class="waiting">Solo observando la votación...</p>';
    } else {
        showScreen('spectatorScreen');
        document.getElementById('roomCodeSpectator').textContent = currentRoom;
    }
}

function setupSpectatorGameView(statusText) {
    showScreen('gameScreen');
    // Hide private info
    document.getElementById('roleCardGame').style.display = 'none';
    document.getElementById('startVotingBtn').style.display = 'none';
    document.getElementById('waitingVoteMessage').textContent = statusText;
    document.getElementById('waitingVoteMessage').style.display = 'block';

    // Show role as Spectator
    const roleTitle = document.getElementById('roleTitleGame');
    if (roleTitle) roleTitle.textContent = 'Espectador';
}

socket.on('spectatorGameStart', ({ players, category }) => {
    toast(`Juego iniciado (Espectador) - Categoría: ${category}`);
    const alivePlayers = players.filter(p => !p.isSpectator);
    initLivePlayersPanel(alivePlayers);
    setupSpectatorGameView('Observando partida...');
});

socket.on('hostDisconnected', ({ message }) => {
    toast(message, 'error');
    setTimeout(() => {
        location.reload();
    }, 2000);
});

socket.on('statsUpdate', (data) => {
    // data: [{id, username, stats}]
    roomStats = data;
    updateLobbyLeaderboard();
});

// Update local stats when game ends or round ends
socket.on('playerEliminated', (data) => {
    // Logic:
    // 1. Game Ended?
    if (data.gameEnded) {
        // Am I Impostor?
        const roleTitle = document.getElementById('roleTitleGame');
        const amImpostor = roleTitle && roleTitle.textContent === 'Impostor';

        let updates = { gamePlayed: true, impostorWin: false, innocentWin: false, roundSurvived: false };

        if ((data.winner === 'impostor' || data.winner === 'impostors') && amImpostor) updates.impostorWin = true;
        if ((data.winner === 'innocent' || data.winner === 'innocents') && !amImpostor) updates.innocentWin = true;

        updateLocalStats(updates);
    }
});

socket.on('continueGame', (data) => {
    // A round finished and game continues.
    const amAlive = data.alivePlayers.some(p => p.id === socket.id);
    if (amAlive) {
        updateLocalStats({ roundSurvived: true });
    }
});

// ============================================
// STATS LOGIC
// ============================================
let roomStats = []; // [{id, username, stats: {impostorWins, innocentWins, roundsSurvived}}]

// Inicializar estadísticas locales
if (!localStorage.getItem('impostorStats')) {
    localStorage.setItem('impostorStats', JSON.stringify({
        impostorWins: 0,
        innocentWins: 0,
        roundsSurvived: 0,
        gamesPlayed: 0
    }));
}

function getLocalStats() {
    return JSON.parse(localStorage.getItem('impostorStats'));
}

function updateLocalStats(updates) {
    const stats = getLocalStats();
    if (updates.impostorWin) stats.impostorWins++;
    if (updates.innocentWin) stats.innocentWins++;
    if (updates.roundSurvived) stats.roundsSurvived++;
    if (updates.gamePlayed) stats.gamesPlayed++;

    localStorage.setItem('impostorStats', JSON.stringify(stats));
}

function showLocalStats() {
    const stats = getLocalStats();

    // Ensure properties exist (migration for old data)
    stats.gamesPlayed = stats.gamesPlayed || 0;
    stats.impostorWins = stats.impostorWins || 0;
    stats.innocentWins = stats.innocentWins || 0;

    const totalWins = stats.impostorWins + stats.innocentWins;
    const winRate = stats.gamesPlayed > 0 ? Math.round((totalWins / stats.gamesPlayed) * 100) : 0;

    document.getElementById('localImpWins').textContent = stats.impostorWins;
    document.getElementById('localInnWins').textContent = stats.innocentWins;
    document.getElementById('localGames').textContent = stats.gamesPlayed;
    document.getElementById('localWinRate').textContent = winRate + '%';

    document.getElementById('localStatsModal').style.display = 'flex';
}

function updateLobbyLeaderboard() {
    // Renderizar tabla en ambos lobbys (Host y Player)
    const targets = ['roomStatsBodyHost', 'roomStatsBodyPlayer'];

    // Ordenar: Victorias Impostor > Votos Correctos > Victorias Inocente > Partidas
    const sortedStats = [...roomStats].sort((a, b) => {
        if (b.stats.impostorWins !== a.stats.impostorWins) return b.stats.impostorWins - a.stats.impostorWins;
        if (b.stats.correctVotes !== a.stats.correctVotes) return b.stats.correctVotes - a.stats.correctVotes;
        if (b.stats.innocentWins !== a.stats.innocentWins) return b.stats.innocentWins - a.stats.innocentWins;
        return b.stats.gamesPlayed - a.stats.gamesPlayed;
    });

    targets.forEach(id => {
        const tbody = document.getElementById(id);
        if (!tbody) return;

        tbody.innerHTML = '';

        if (sortedStats.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="waiting-text">Aún no hay datos</td></tr>';
            return;
        }

        sortedStats.forEach(p => {
            const row = document.createElement('tr');
            // Resaltar al propio jugador
            if (p.id === myPlayerId) row.style.fontWeight = 'bold';
            if (p.id === myPlayerId) row.style.color = 'var(--accent)';

            row.innerHTML = `
                <td style="text-align: left; padding-left: 10px;">${escapeHtml(p.username || '???')}</td>
                <td>${p.stats.gamesPlayed || 0}</td>
                <td>${p.stats.correctVotes || 0}</td>
                <td>${p.stats.impostorWins || 0}</td>
                <td>${p.stats.innocentWins || 0}</td>
            `;
            tbody.appendChild(row);
        });
    });
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ============================================
// CHAT FUNCTIONS
// ============================================

function toggleChat() {
    const chat = document.getElementById('chatContainer');
    const isHidden = chat.style.display === 'none';
    chat.style.display = isHidden ? 'flex' : 'none';

    // Auto focus input when opening
    if (isHidden) {
        setTimeout(() => document.getElementById('chatInput').focus(), 100);
    }
}

function sendChat(e) {
    e.preventDefault();
    if (!currentRoom) return;

    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;
    if (message.length > 100) {
        toast('El mensaje es muy largo (máx 100 caracteres)', 'error');
        return;
    }

    socket.emit('sendChat', { roomCode: currentRoom, message });
    input.value = '';
    input.focus();
}

function appendChatMessage(msg) {
    const chatContainer = document.getElementById('chatMessages');
    const div = document.createElement('div');
    const isMine = msg.senderId === myPlayerId;

    div.className = `chat-message ${isMine ? 'mine' : 'others'} ${msg.isSpectator ? 'spectator' : ''}`;

    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="chat-msg-header">
            <span class="chat-sender">${escapeHtml(msg.senderName)}</span>
            <span class="chat-time">${time}</span>
        </div>
        <div class="chat-msg-bubble">${escapeHtml(msg.content)}</div>
    `;

    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // If chat is closed and we receive a message, maybe show a badge? 
    // For now, user didn't ask for notification badge, so ignore.
}

socket.on('chatMessage', (msg) => {
    appendChatMessage(msg);
});

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
    initializeTheme();
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('playerNameInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') createRoom();
    });
    document.getElementById('joinNameInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') document.getElementById('roomCodeInput').focus();
    });
    document.getElementById('roomCodeInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') joinRoom();
    });
}


// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
