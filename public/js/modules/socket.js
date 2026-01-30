import { game } from './game.js';
import * as UI from './ui.js';
import { toast } from './utils.js';

let votingTimerInterval = null;

export function setupSocketListeners(socket) {

    // ================= CONNECTION =================

    socket.on('roomCreated', ({ roomCode, room, categories: cats }) => {
        game.currentRoom = roomCode;
        game.myPlayerId = socket.id;
        game.isHost = true;
        game.categories = cats;

        UI.updateCategorySelect(cats);
        document.getElementById('roomCodeDisplay').textContent = roomCode;

        // Chat Setup Defaults
        document.getElementById('chatToggleBtn').style.display = 'block';
        document.getElementById('chatMessages').innerHTML = '<div class="chat-system-msg">¡Bienvenido al chat!</div>';

        if (window.innerWidth > 768) {
            document.getElementById('chatContainer').style.display = 'flex';
        } else {
            document.getElementById('chatContainer').style.display = 'none';
        }

        UI.showScreen('lobbyHostScreen');
    });

    socket.on('roomJoined', ({ roomCode, room, categories: cats, isSpectator: spec, currentPeriod }) => {
        game.currentRoom = roomCode;
        game.myPlayerId = socket.id;
        game.isHost = false;
        game.isSpectator = spec || false;
        game.categories = cats;

        UI.updateCategorySelect(cats);
        document.getElementById('roomCodePlayer').textContent = roomCode;

        // Chat Setup
        document.getElementById('chatToggleBtn').style.display = 'block';
        document.getElementById('chatMessages').innerHTML = '<div class="chat-system-msg">¡Bienvenido al chat!</div>';

        if (window.innerWidth > 768) {
            document.getElementById('chatContainer').style.display = 'flex';
        } else {
            document.getElementById('chatContainer').style.display = 'none';
        }

        if (game.isSpectator) {
            toast('Unido como espectador');
            if (currentPeriod) {
                handleMidGameJoin(currentPeriod);
            } else {
                UI.showScreen('spectatorScreen');
                document.getElementById('roomCodeSpectator').textContent = roomCode;
            }
        } else {
            UI.showScreen('lobbyPlayerScreen');
        }
    });

    socket.on('playerListUpdate', (players) => {
        const count = players.length;
        const me = players.find(p => p.id === game.myPlayerId);

        if (me) {
            game.isHost = me.isHost;
            if (game.isSpectator) {
                game.isSpectator = false;
                toast('¡Te has unido a la partida!');
                UI.showScreen('lobbyPlayerScreen');
            }
        }

        if (game.isHost) {
            const countEl = document.getElementById('playerCount');
            if (countEl) countEl.textContent = count;
            UI.renderPlayerList(players, 'playerListHost');
            const startBtn = document.getElementById('startButton');
            if (startBtn) startBtn.disabled = count < 4;
        } else {
            const countEl = document.getElementById('playerCountPlayer');
            if (countEl) countEl.textContent = count;
            UI.renderPlayerList(players, 'playerListPlayer');
        }

        // Stats update logic
        const roomStats = players.map(p => ({
            id: p.id,
            username: p.username,
            stats: p.stats || { impostorWins: 0, innocentWins: 0, gamesPlayed: 0, correctVotes: 0 }
        }));
        UI.updateLobbyLeaderboard(roomStats, game.myPlayerId);
    });

    socket.on('configUpdate', (config) => {
        const catSelect = document.getElementById('categorySelect');
        const impSelect = document.getElementById('impostorCountSelect');
        if (catSelect) catSelect.value = config.category;
        if (impSelect) impSelect.value = config.impostorCount;
    });

    socket.on('categorySelected', ({ categoryKey }) => {
        const catSelect = document.getElementById('categorySelect');
        if (catSelect) catSelect.value = categoryKey;
        // In original script this called updateConfig() which emits back to server... potential loop?
        // Let's assume server broadcast implies sync.
    });

    socket.on('becameHost', () => {
        game.isHost = true;
        toast('Ahora eres el host');
        // Refresh UI state potentially needed here
    });

    // ================= GAME LOGIC =================

    socket.on('yourRole', ({ isImpostor, word, category, players }) => {
        game.myRole = { isImpostor, word };
        UI.updateRoleDisplay('', isImpostor, word, category);

        const readyBtn = document.getElementById('readyButton');
        const cancelRoleBtn = document.getElementById('cancelGameRoleBtn');
        const waitMsg = document.getElementById('waitingMessage');
        if (readyBtn) readyBtn.style.display = game.isHost ? 'block' : 'none';
        if (cancelRoleBtn) cancelRoleBtn.style.display = game.isHost ? 'inline-block' : 'none';
        if (waitMsg) waitMsg.style.display = game.isHost ? 'none' : 'block';

        if (players) {
            const alivePlayers = players.filter(p => !p.isSpectator);
            game.initLivePlayers(alivePlayers);
        }

        UI.showScreen('roleScreen');
    });

    socket.on('gameStarted', ({ category, descriptionOrder }) => {
        toast(`Categoría: ${category}`);
        // Reset local state if needed
    });

    socket.on('votingStarted', ({ votingOrder, currentVoterIndex }) => {
        game.hasVoted = false;
        game.votingStartTime = Date.now();
        document.getElementById('votesDisplay').innerHTML = '';

        game.resetVotesInPanel();

        if (game.isSpectator) {
            document.getElementById('finishVotingBtn').style.display = 'none';
            document.getElementById('votingButtons').innerHTML = '<p class="waiting">Observando votación...</p>';
            document.getElementById('votingStatus').style.display = 'none';
        } else {
            UI.updateVotingUI(votingOrder, currentVoterIndex, game.myPlayerId, (id) => game.castVote(id));
        }

        UI.showScreen('votingScreen');
        startVotingTimer();
    });

    socket.on('voteCast', ({ voterName, votedForName, votingOrder, currentVoterIndex, votingFinished }) => {
        game.hasVoted = false; // Reset local lock just in case? No, hasVoted tracks 'this round'. 
        // Logic: hasVoted is strictly for current user turn. 
        // If it's my turn again (not possible in this game mode), I'd need reset.

        const log = document.getElementById('votesDisplay');
        if (log) {
            log.innerHTML += `<div class="vote-entry"><span>${UI.escapeHtml(voterName)}</span> voto por <span>${UI.escapeHtml(votedForName)}</span></div>`;
            log.scrollTop = log.scrollHeight;
        }

        const voterPlayer = Object.entries(game.livePlayersState).find(([_, p]) => p.username === voterName);
        if (voterPlayer) game.markPlayerVoted(voterPlayer[0]);

        if (!votingFinished) {
            UI.updateVotingUI(votingOrder, currentVoterIndex, game.myPlayerId, (id) => game.castVote(id));
        }
    });

    socket.on('playerEliminated', ({ playerName, wasImpostor, gameEnded, winner, word, players }) => {
        const eliminatedPlayer = Object.entries(game.livePlayersState).find(([_, p]) => p.username === playerName);
        if (eliminatedPlayer) game.markPlayerEliminated(eliminatedPlayer[0]);

        game.inEliminationScreen = true;
        const nameEl = document.getElementById('eliminatedName');
        const roleEl = document.getElementById('eliminatedRole');
        if (nameEl) nameEl.textContent = playerName + ' fue eliminado';
        if (roleEl) roleEl.textContent = wasImpostor ? 'Era un impostor' : 'Era inocente';

        UI.showScreen('eliminationScreen');

        if (gameEnded) {
            game.pendingNextState = { type: 'gameEnded', payload: { winner, word, players } };
            setTimeout(() => {
                if (game.inEliminationScreen && game.pendingNextState && game.pendingNextState.type === 'gameEnded') {
                    game.continueGame(); // Auto-advance logic
                }
            }, 1500);

            // Stats logic here (simplified)
            updateLocalStatsOnEnd(winner, word, players);
        }
    });

    socket.on('tieVoting', ({ players }) => {
        game.inEliminationScreen = true;
        document.getElementById('eliminatedName').textContent = '¡EMPATE!';
        document.getElementById('eliminatedRole').textContent = 'Nadie fue eliminado';
        UI.showScreen('eliminationScreen');
    });

    socket.on('continueGame', ({ alivePlayers, roundNumber }) => {
        game.pendingNextState = { type: 'continueGame', payload: { alivePlayers, roundNumber } };

        // Update local stats for survival
        const amAlive = alivePlayers.some(p => p.id === socket.id);
        if (amAlive) updateLocalStats({ roundSurvived: true });

        if (!game.inEliminationScreen) {
            game.continueGame();
        }
    });

    // ... statsUpdate, gameResetToLobby, gameInterrupted (similar pattern)

    socket.on('gameResetToLobby', ({ categories: cats }) => {
        game.clearLivePlayers();
        game.categories = cats;
        UI.updateCategorySelect(cats);

        if (game.isHost) {
            // Re-verify host UI
            UI.showScreen('lobbyHostScreen');
        } else {
            UI.showScreen('lobbyPlayerScreen');
        }
    });

    socket.on('gameCancelled', ({ message, categories: cats }) => {
        game.clearLivePlayers();
        game.categories = cats;
        UI.updateCategorySelect(cats);
        game.pendingNextState = null;
        game.inEliminationScreen = false;
        if (votingTimerInterval) clearInterval(votingTimerInterval);

        toast(message, 'info');

        if (game.isHost) {
            UI.showScreen('lobbyHostScreen');
        } else {
            UI.showScreen('lobbyPlayerScreen');
        }
    });

    socket.on('gameInterrupted', ({ message, categories: cats }) => {
        game.clearLivePlayers();
        game.categories = cats;
        UI.updateCategorySelect(cats);
        toast(message, 'warning');
        game.pendingNextState = null;
        game.inEliminationScreen = false;
        if (votingTimerInterval) clearInterval(votingTimerInterval);

        // Force back to lobby
        UI.showHomeScreen(); // Or lobby? Usually user is still connected.
        // Logic says go to Lobby
        if (game.isHost) UI.showScreen('lobbyHostScreen');
        else UI.showScreen('lobbyPlayerScreen');
    });

    socket.on('chatMessage', (msg) => {
        UI.appendChatMessage(msg, game.myPlayerId);
    });

    socket.on('reactionReceived', ({ username, emoji }) => {
        // Show reaction popup
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

    socket.on('error', (msg) => toast(msg, 'error'));
}

// Helpers
function startVotingTimer() {
    const timerEl = document.getElementById('votingTimer');
    if (!timerEl) return;
    if (votingTimerInterval) clearInterval(votingTimerInterval);

    const updateTimer = () => {
        if (!game.votingStartTime) return;
        const elapsed = Math.floor((Date.now() - game.votingStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    updateTimer();
    votingTimerInterval = setInterval(updateTimer, 500);
}

function handleMidGameJoin(state) {
    const { state: gameState, players } = state;
    const alivePlayers = players.filter(p => !p.isSpectator);
    game.initLivePlayers(alivePlayers);

    if (gameState === 'playing' || gameState === 'discussing') {
        setupSpectatorGameView('Jugando');
    } else if (gameState === 'voting') {
        setupSpectatorGameView('Votación en curso');
        UI.showScreen('votingScreen');
        const endBtn = document.getElementById('finishVotingBtn');
        if (endBtn) endBtn.style.display = 'none';
        const vBtn = document.getElementById('votingButtons');
        if (vBtn) vBtn.innerHTML = '<p class="waiting">Solo observando la votación...</p>';
    } else {
        UI.showScreen('spectatorScreen');
        document.getElementById('roomCodeSpectator').textContent = game.currentRoom;
    }
}

function setupSpectatorGameView(statusText) {
    UI.showScreen('gameScreen');
    document.getElementById('roleCardGame').style.display = 'none';
    document.getElementById('startVotingBtn').style.display = 'none';
    const cancelBtn = document.getElementById('cancelGameBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    document.getElementById('waitingVoteMessage').textContent = statusText;
    document.getElementById('waitingVoteMessage').style.display = 'block';
    const roleTitle = document.getElementById('roleTitleGame');
    if (roleTitle) roleTitle.textContent = 'Espectador';
}

// Stats Helpers (Local)
function getLocalStats() {
    const s = localStorage.getItem('impostorStats');
    return s ? JSON.parse(s) : { impostorWins: 0, innocentWins: 0, roundsSurvived: 0, gamesPlayed: 0 };
}

function updateLocalStats(updates) {
    const stats = getLocalStats();
    if (updates.impostorWin) stats.impostorWins++;
    if (updates.innocentWin) stats.innocentWins++;
    if (updates.roundSurvived) stats.roundsSurvived++;
    if (updates.gamePlayed) stats.gamesPlayed++;
    localStorage.setItem('impostorStats', JSON.stringify(stats));
}

function updateLocalStatsOnEnd(winner, word, players) {
    const amImpostor = game.myRole && game.myRole.isImpostor;
    let updates = { gamePlayed: true, impostorWin: false, innocentWin: false, roundSurvived: false };

    if ((winner === 'impostor' || winner === 'impostors') && amImpostor) updates.impostorWin = true;
    if ((winner === 'innocent' || winner === 'innocents') && !amImpostor) updates.innocentWin = true;

    updateLocalStats(updates);
}

export function showLocalStats() {
    const stats = getLocalStats();
    // Ensure properties exist
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
