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
    socket.emit('randomCategory', currentRoom);
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

function startVotingTimer() {
    const timerEl = document.getElementById('votingTimer');
    if (!timerEl) return;

    const updateTimer = () => {
        if (!votingStartTime) return;
        const elapsed = Math.floor((Date.now() - votingStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    updateTimer();
    const interval = setInterval(() => {
        if (document.activeElement && document.activeElement.id !== 'votingScreen') clearInterval(interval);
        updateTimer();
    }, 500);
}

function continueGame() {
    // Apply any pending next state after elimination/tie feedback
    if (pendingNextState) {
        if (pendingNextState.type === 'continueGame') {
            const { alivePlayers, roundNumber } = pendingNextState.payload;
            updateRoleDisplay('Game', myRole.isImpostor, myRole.word, null);
            document.getElementById('alivePlayersList').innerHTML = alivePlayers.map(p => `
                <div class="player-item"><span class="player-name">${escapeHtml(p.username)}</span></div>
            `).join('');
            document.getElementById('roundNumber').textContent = roundNumber;
            document.getElementById('startVotingBtn').style.display = isHost ? 'block' : 'none';
            document.getElementById('waitingVoteMessage').style.display = isHost ? 'none' : 'block';
            showScreen('gameScreen');
        } else if (pendingNextState.type === 'gameEnded') {
            const { winner, players, word } = pendingNextState.payload;
            const banner = document.getElementById('winnerBanner');
            const title = document.getElementById('winnerTitle');
            const msg = document.getElementById('winnerMessage');

            if (winner === 'innocents' || winner === 'civiles') {
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
    showScreen('lobbyHostScreen');
});

socket.on('roomJoined', ({ roomCode, room, categories: cats, isSpectator: spec }) => {
    currentRoom = roomCode;
    myPlayerId = socket.id;
    isHost = false;
    isSpectator = spec || false;
    categories = cats;
    document.getElementById('roomCodePlayer').textContent = roomCode;

    if (isSpectator) {
        toast('Unido como espectador');
        showScreen('spectatorScreen');
    } else {
        showScreen('lobbyPlayerScreen');
    }
});

socket.on('playerListUpdate', (players) => {
    const count = players.length;
    const me = players.find(p => p.id === myPlayerId);
    if (me) isHost = me.isHost;

    if (isHost) {
        document.getElementById('playerCount').textContent = count;
        renderPlayerList(players, 'playerListHost');
        document.getElementById('startButton').disabled = count < 4;
    } else {
        document.getElementById('playerCountPlayer').textContent = count;
        renderPlayerList(players, 'playerListPlayer');
    }
});

socket.on('configUpdate', (config) => {
    document.getElementById('categorySelect').value = config.category;
    document.getElementById('impostorCountSelect').value = config.impostorCount;
});

socket.on('becameHost', () => {
    isHost = true;
    toast('Ahora eres el host');
});

// ============================================
// SOCKET EVENTS - GAME LOGIC
// ============================================

socket.on('yourRole', ({ isImpostor, word, category }) => {
    myRole = { isImpostor, word };
    updateRoleDisplay('', isImpostor, word, category);
    document.getElementById('readyButton').style.display = isHost ? 'block' : 'none';
    document.getElementById('waitingMessage').style.display = isHost ? 'none' : 'block';
    showScreen('roleScreen');
});

socket.on('votingStarted', ({ votingOrder, currentVoterIndex }) => {
    hasVoted = false;
    votingStartTime = Date.now(); // Inicia el contador de tiempo transcurrido
    document.getElementById('votesDisplay').innerHTML = '';
    updateVotingUI(votingOrder, currentVoterIndex);
    document.getElementById('finishVotingBtn').style.display = isHost ? 'block' : 'none';
    showScreen('votingScreen');
    startVotingTimer(); // Muestra timer de tiempo transcurrido
});

socket.on('voteCast', ({ voterName, votedForName, votingOrder, currentVoterIndex, votingFinished }) => {
    hasVoted = false;
    const log = document.getElementById('votesDisplay');
    log.innerHTML += `<div class="vote-entry"><span>${escapeHtml(voterName)}</span> voto por <span>${escapeHtml(votedForName)}</span></div>`;
    log.scrollTop = log.scrollHeight;
    if (!votingFinished) updateVotingUI(votingOrder, currentVoterIndex);
});

socket.on('playerEliminated', ({ playerName, wasImpostor, gameEnded, winner, word, players }) => {
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

socket.on('hostDisconnected', ({ message }) => {
    toast(message, 'error');
    setTimeout(() => {
        location.reload();
    }, 2000);
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
