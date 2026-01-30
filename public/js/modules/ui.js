import { toast } from './utils.js';

// ============================================
// THEME MANAGEMENT
// ============================================

export function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

export function updateThemeIcon(theme) {
    const sun = document.querySelector('.icon-sun');
    const moon = document.querySelector('.icon-moon');
    if (sun) sun.style.display = theme === 'dark' ? 'block' : 'none';
    if (moon) moon.style.display = theme === 'light' ? 'block' : 'none';
}

export function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = savedTheme;
    updateThemeIcon(savedTheme);
}

// ============================================
// SCREEN MANAGEMENT
// ============================================

export function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}

export function showHomeScreen() {
    showScreen('homeScreen');
}

export function showJoinScreen() {
    const nameInput = document.getElementById('playerNameInput');
    const joinNameInput = document.getElementById('joinNameInput');
    if (nameInput && joinNameInput) {
        const name = nameInput.value.trim();
        if (name) joinNameInput.value = name;
    }
    showScreen('joinScreen');
}

// ============================================
// DOM HELPERS
// ============================================

export function copyTextToClipboard(text, successMsg = 'Copiado') {
    if (text) {
        navigator.clipboard.writeText(text)
            .then(() => toast(successMsg))
            .catch(() => toast('No se pudo copiar', 'error'));
    }
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

export function renderPlayerList(players, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = players.map(p => `
        <div class="player-item ${p.isHost ? 'host' : ''} ${!p.alive ? 'dead' : ''}">
            <span class="player-name">${escapeHtml(p.username)}</span>
            ${p.isHost ? '<span class="badge">Host</span>' : ''}
        </div>
    `).join('');
}

export function updateLivePlayersUI(livePlayersState) {
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

export function toggleLivePlayersPanel(show) {
    const globalPanel = document.getElementById('globalLivePlayersPanel');
    if (globalPanel) {
        globalPanel.style.display = show ? 'block' : 'none';
        if (!show) {
            document.getElementById('globalLivePlayersList').innerHTML = '';
        }
    }
}

export function updateRoleDisplay(prefix, isImpostor, word, category) {
    const isGame = prefix === 'Game';
    const card = document.getElementById(isGame ? 'roleCardGame' : 'roleCard');
    const title = document.getElementById(isGame ? 'roleTitleGame' : 'roleTitle');
    const wordEl = document.getElementById(isGame ? 'wordDisplayGame' : 'wordDisplay');
    const hint = document.getElementById(isGame ? 'roleHintGame' : 'roleHint');

    if (!card || !title || !wordEl || !hint) return;

    card.className = 'role-card ' + (isImpostor ? 'impostor' : 'innocent');
    title.textContent = isImpostor ? 'Impostor' : 'Inocente';
    wordEl.textContent = isImpostor ? '???' : word;
    hint.textContent = isImpostor ? 'Descubre la palabra sin ser descubierto' : 'Describe la palabra sin ser obvio';

    if (!isGame && category) {
        const catTag = document.getElementById('categoryTag');
        if (catTag) catTag.textContent = 'Categoria: ' + category;
    }
}

export function updateCategorySelect(categories) {
    const select = document.getElementById('categorySelect');
    if (!select) return;
    select.innerHTML = '';
    for (const [key, name] of Object.entries(categories)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = name;
        select.appendChild(opt);
    }
}

export function updateVotingUI(votingOrder, currentVoterIndex, myPlayerId, castVoteCallback) {
    if (!votingOrder || votingOrder.length === 0) return;

    // Safety check for index out of bounds
    if (currentVoterIndex >= votingOrder.length) currentVoterIndex = 0;

    const current = votingOrder[currentVoterIndex];
    if (!current) return;

    const isMyTurn = current.id === myPlayerId;
    const status = document.getElementById('votingStatus');

    if (status) {
        status.classList.toggle('my-turn', isMyTurn);
        document.getElementById('currentVoterDisplay').textContent = isMyTurn ? 'Es tu turno' : 'Turno de ' + current.username;
    }

    // Actualizar orden con badges de estado
    const orderDisplay = document.getElementById('descriptionOrderDisplay');
    if (orderDisplay) {
        orderDisplay.innerHTML = votingOrder.map((p, i) => {
            let className = '';
            if (i < currentVoterIndex) className = 'done';
            else if (i === currentVoterIndex) className = 'current';
            return `<span class="${className}">${escapeHtml(p.username)}</span>`;
        }).join('');
    }

    const btns = document.getElementById('votingButtons');
    if (btns) {
        if (isMyTurn) {
            // Nota: El botón llama a una funcion onclick. 
            // Como estamos en modulo, 'castVote' no está en global scope.
            // Solución: Usamos data-attributes y event delegation en main.js, 
            // O generamos botones con addEventListener dinámico.
            // Por simplicidad ahora: generamos HTML con data-id y adjuntamos listener en main.

            // Espera, onclick="castVote" NO funcionará. 
            // Necesitamos generar los botones Y adjuntarles listeners después.
            // O devolver el HTML y que quien llame a esta funcion se encargue (complejo).
            // Mejor: Limpiamos innerHTML y creamos elementos DOM reales.

            btns.innerHTML = '';
            votingOrder
                .filter(p => p.id !== myPlayerId)
                .forEach(p => {
                    const b = document.createElement('button');
                    b.className = 'btn btn-vote';
                    b.textContent = p.username;
                    b.onclick = () => castVoteCallback(p.id);
                    btns.appendChild(b);
                });

        } else {
            btns.innerHTML = '<p class="waiting">Esperando...</p>';
        }
    }
}

// ============================================
// CHAT & LEADERBOARD
// ============================================

export function toggleChat() {
    const chat = document.getElementById('chatContainer');
    const isHidden = chat.style.display === 'none';
    chat.style.display = isHidden ? 'flex' : 'none';

    if (isHidden) {
        setTimeout(() => {
            const input = document.getElementById('chatInput');
            if (input) input.focus();
        }, 100);
    }
}

export function appendChatMessage(msg, myPlayerId) {
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;

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
}

export function updateLobbyLeaderboard(roomStats, myPlayerId) {
    // Renderizar tabla en ambos lobbys (Host y Player)
    const targets = ['roomStatsBodyHost', 'roomStatsBodyPlayer'];

    // Ordenar: Victorias Impostor > Votos Correctos > Victorias Inocente > Partidas
    const sortedStats = [...roomStats].sort((a, b) => {
        const statsA = a.stats || {};
        const statsB = b.stats || {};
        if ((statsB.impostorWins || 0) !== (statsA.impostorWins || 0)) return (statsB.impostorWins || 0) - (statsA.impostorWins || 0);
        if ((statsB.correctVotes || 0) !== (statsA.correctVotes || 0)) return (statsB.correctVotes || 0) - (statsA.correctVotes || 0);
        if ((statsB.innocentWins || 0) !== (statsA.innocentWins || 0)) return (statsB.innocentWins || 0) - (statsA.innocentWins || 0);
        return (statsB.gamesPlayed || 0) - (statsA.gamesPlayed || 0);
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
            const ps = p.stats || {};
            const row = document.createElement('tr');
            // Resaltar al propio jugador
            if (p.id === myPlayerId) {
                row.style.fontWeight = 'bold';
                row.style.color = 'var(--accent)';
            }

            row.innerHTML = `
                <td style="text-align: left; padding-left: 10px;">${escapeHtml(p.username || '???')}</td>
                <td>${ps.gamesPlayed || 0}</td>
                <td>${ps.correctVotes || 0}</td>
                <td>${ps.impostorWins || 0}</td>
                <td>${ps.innocentWins || 0}</td>
            `;
            tbody.appendChild(row);
        });
    });
}

