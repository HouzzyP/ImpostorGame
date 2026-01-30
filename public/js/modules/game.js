import * as UI from './ui.js';

class GameState {
    constructor() {
        this.socket = null; // Will be set by main
        this.currentRoom = null;
        this.myPlayerId = null;
        this.isHost = false;
        this.isSpectator = false;
        this.myRole = null;
        this.categories = {};

        // Voting & Live State
        this.hasVoted = false;
        this.votingStartTime = null;
        this.livePlayersState = {};

        // Caches
        this.pendingNextState = null;
        this.inEliminationScreen = false;
    }

    setSocket(socket) {
        this.socket = socket;
    }

    // ================= State Management =================

    initLivePlayers(players) {
        this.livePlayersState = {};
        players.forEach(p => {
            this.livePlayersState[p.id] = { username: p.username, alive: true, voted: false };
        });
        UI.toggleLivePlayersPanel(true);
        UI.updateLivePlayersUI(this.livePlayersState);
    }

    markPlayerVoted(playerId) {
        if (this.livePlayersState[playerId]) {
            this.livePlayersState[playerId].voted = true;
            UI.updateLivePlayersUI(this.livePlayersState);
        }
    }

    markPlayerEliminated(playerId) {
        if (this.livePlayersState[playerId]) {
            this.livePlayersState[playerId].alive = false;
            UI.updateLivePlayersUI(this.livePlayersState);
        }
    }

    resetVotesInPanel() {
        Object.values(this.livePlayersState).forEach(p => {
            p.voted = false;
        });
        UI.updateLivePlayersUI(this.livePlayersState);
    }

    clearLivePlayers() {
        this.livePlayersState = {};
        UI.toggleLivePlayersPanel(false);
    }

    // ================= Actions =================

    createRoom(username) {
        this.socket.emit('createRoom', { username });
    }

    joinRoom(username, roomCode) {
        this.socket.emit('joinRoom', { username, roomCode });
    }

    startGame() {
        this.socket.emit('startGame', { roomCode: this.currentRoom });
    }

    startVoting() {
        this.socket.emit('startVoting', { roomCode: this.currentRoom });
    }

    finishVoting() {
        this.socket.emit('finishVoting', { roomCode: this.currentRoom });
    }

    castVote(votedForId) {
        if (this.hasVoted) return;
        this.hasVoted = true;

        // Optimistic update
        this.markPlayerVoted(this.myPlayerId);

        this.socket.emit('castVote', { roomCode: this.currentRoom, votedFor: votedForId });
    }

    updateConfig(category, impostorCount) {
        this.socket.emit('updateConfig', {
            roomCode: this.currentRoom,
            config: { category, impostorCount }
        });
    }

    randomCategory() {
        this.socket.emit('randomCategory', { roomCode: this.currentRoom });
    }

    continueGame() {
        // Logic moved from script.js ensure we handle pending state
        if (this.pendingNextState) {
            if (this.pendingNextState.type === 'continueGame') {
                const { alivePlayers, roundNumber } = this.pendingNextState.payload;

                UI.updateRoleDisplay('Game', this.myRole.isImpostor, this.myRole.word, null);
                const roundEl = document.getElementById('roundNumber');
                if (roundEl) roundEl.textContent = roundNumber;

                this.resetVotesInPanel();

                const startBtn = document.getElementById('startVotingBtn');
                const waitMsg = document.getElementById('waitingVoteMessage');

                if (startBtn) startBtn.style.display = this.isHost ? 'block' : 'none';
                if (waitMsg) waitMsg.style.display = this.isHost ? 'none' : 'block';

                UI.showScreen('gameScreen');

            } else if (this.pendingNextState.type === 'gameEnded') {
                const { winner, players, word } = this.pendingNextState.payload;

                // Show end screen logic (simplified for now, ideally UI handles DOM)
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
                        <span class="player-name">${UI.escapeHtml(p.name)}</span>
                        <span class="reveal-role">${p.isImpostor ? 'Impostor' : 'Inocente'}</span>
                    </div>
                `).join('');

                const contBtn = document.getElementById('continueButton'); // Volver a jugar (mismo room)
                const resetBtn = document.getElementById('resetButton'); // Volver a lobby?

                // Actually 'continueInRoom' is continueButton
                if (contBtn) contBtn.style.display = this.isHost ? 'block' : 'none';

                UI.showScreen('endScreen');
            }
        }
        this.pendingNextState = null;
        this.inEliminationScreen = false;
    }

    continueInRoom() {
        this.socket.emit('continueInRoom', { roomCode: this.currentRoom });
    }

    sendReaction(emoji) {
        this.socket.emit('sendReaction', { roomCode: this.currentRoom, emoji });
    }
}

export const game = new GameState();
