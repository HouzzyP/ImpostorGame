const socket = io();
let currentRoom = null;
let myPlayerId = null;
let isHost = false;
let myRole = null;
let categories = {};

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
    socket.emit('createRoom', name);
}

function joinRoom() {
    const name = document.getElementById('joinNameInput').value.trim();
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    if (!name || !code) return toast('Completa todos los campos', 'error');
    socket.emit('joinRoom', { roomCode: code, playerName: name });
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
    socket.emit('startGame', currentRoom);
}

function startVoting() {
    socket.emit('startVoting', currentRoom);
}

function castVote(id) {
    socket.emit('castVote', { roomCode: currentRoom, votedForId: id });
}

function continueGame() {
    showScreen('gameScreen');
}

function continueInRoom() {
    socket.emit('continueInRoom', currentRoom);
}

function resetGame() {
    socket.emit('resetGame', currentRoom);
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
        <div class="player-item ${p.isHost ? 'host' : ''} ${!p.isAlive ? 'dead' : ''}">
            <span class="player-name">${escapeHtml(p.name)}</span>
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
    document.getElementById('currentVoterDisplay').textContent = isMyTurn ? 'Es tu turno' : 'Turno de ' + current.name;

    const btns = document.getElementById('votingButtons');
    if (isMyTurn) {
        btns.innerHTML = votingOrder
            .filter(p => p.id !== myPlayerId)
            .map(p => `<button class="btn btn-vote" onclick="castVote('${p.id}')">${escapeHtml(p.name)}</button>`)
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

socket.on('roomJoined', ({ roomCode, room, categories: cats }) => {
    currentRoom = roomCode;
    myPlayerId = socket.id;
    isHost = false;
    categories = cats;
    document.getElementById('roomCodePlayer').textContent = roomCode;
    showScreen('lobbyPlayerScreen');
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
    document.getElementById('votesDisplay').innerHTML = '';
    updateVotingUI(votingOrder, currentVoterIndex);
    showScreen('votingScreen');
});

socket.on('voteCast', ({ voterName, votedForName, votingOrder, currentVoterIndex, votingFinished }) => {
    const log = document.getElementById('votesDisplay');
    log.innerHTML += `<div class="vote-entry"><span>${escapeHtml(voterName)}</span> voto por <span>${escapeHtml(votedForName)}</span></div>`;
    log.scrollTop = log.scrollHeight;
    if (!votingFinished) updateVotingUI(votingOrder, currentVoterIndex);
});

socket.on('playerEliminated', ({ playerName, wasImpostor }) => {
    document.getElementById('eliminatedName').textContent = playerName + ' fue eliminado';
    document.getElementById('eliminatedRole').textContent = wasImpostor ? 'Era un impostor' : 'Era inocente';
    showScreen('eliminationScreen');
});

socket.on('continueGame', ({ alivePlayers, roundNumber }) => {
    updateRoleDisplay('Game', myRole.isImpostor, myRole.word, null);
    document.getElementById('alivePlayersList').innerHTML = alivePlayers.map(p => `
        <div class="player-item"><span class="player-name">${escapeHtml(p.name)}</span></div>
    `).join('');
    document.getElementById('roundNumber').textContent = roundNumber;
    document.getElementById('startVotingBtn').style.display = isHost ? 'block' : 'none';
    document.getElementById('waitingVoteMessage').style.display = isHost ? 'none' : 'block';
    showScreen('gameScreen');
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

socket.on('error', msg => {
    toast(msg, 'error');
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
