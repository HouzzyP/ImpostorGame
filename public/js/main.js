import { game } from './modules/game.js';
import * as UI from './modules/ui.js';
import { setupSocketListeners, showLocalStats } from './modules/socket.js';
import { toast } from './modules/utils.js';
import { initAnalytics } from './modules/analytics.js?v=1';

// Initialize Analytics
initAnalytics();

// Cargar estadísticas públicas en el home
async function loadPublicStats() {
    try {
        const res = await fetch('/api/stats/public');
        if (!res.ok) throw new Error('Failed to fetch stats');

        const stats = await res.json();
        const totalGames = stats.totalGames || 0;

        const statsElement = document.getElementById('statsText');
        if (statsElement) {
            statsElement.textContent = `🌍 ${totalGames.toLocaleString()} partidas jugadas globalmente`;
        }
    } catch (error) {
        console.warn('Could not load public stats');
        // Si falla, solo ocultar el elemento
        const statsDiv = document.getElementById('publicStats');
        if (statsDiv) statsDiv.style.display = 'none';
    }
}

// Cargar stats cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPublicStats);
} else {
    loadPublicStats();
}

// Initialize Socket
const socket = io();
game.setSocket(socket);
setupSocketListeners(socket);

// Global Functions
window.toggleTheme = UI.toggleTheme;
window.showLocalStats = showLocalStats;
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.showHomeScreen = UI.showHomeScreen;
window.showJoinScreen = UI.showJoinScreen;
window.toggleChat = UI.toggleChat;
window.showChat = UI.showChat;
window.hideChat = UI.hideChat;

// Mensajes fijos en español (sin i18n)
const MESSAGES = {
    name_required: 'Ingresa tu nombre',
    name_short: 'El nombre debe tener al menos 2 caracteres',
    name_long: 'El nombre no puede tener más de 15 caracteres',
    name_chars: 'El nombre solo puede tener letras, números y espacios',
    code_required: 'Ingresa el código de sala',
    code_length: 'El código de sala debe tener 4 caracteres',
    share_text: '¡Jugá conmigo a El Impostor! 🕵️\nCódigo de sala: *{code}*\nEntrá acá:',
    share_copied: 'Invitación copiada al portapapeles',
    share_copied_code: 'Codigo copiado'
};

// Room Management
function validateUsername(name) {
    if (!name) return MESSAGES.name_required;
    if (name.length < 2) return MESSAGES.name_short;
    if (name.length > 15) return MESSAGES.name_long;
    if (!/[a-zA-Z]/.test(name)) return MESSAGES.name_chars;
    if (!/^[a-zA-Z0-9 ]+$/.test(name)) return MESSAGES.name_chars;
    return null;
}

window.createRoom = () => {
    const name = document.getElementById('playerNameInput').value.trim();
    const error = validateUsername(name);
    if (error) return toast(error, 'error');
    game.createRoom(name);
};

window.joinRoom = () => {
    const name = document.getElementById('joinNameInput').value.trim();
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();

    const nameError = validateUsername(name);
    if (nameError) return toast(nameError, 'error');

    if (!code) return toast(MESSAGES.code_required, 'error');
    if (code.length !== 4) return toast(MESSAGES.code_length, 'error');

    game.joinRoom(name, code);
};

window.copyRoomCode = () => {
    if (game.currentRoom) {
        UI.copyTextToClipboard(game.currentRoom, MESSAGES.share_copied_code);
    }
};

window.shareRoom = async () => {
    if (!game.currentRoom) return;
    const text = MESSAGES.share_text.replace('{code}', game.currentRoom);
    const url = 'https://elimpostormp.com';

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'El Impostor Online',
                text: text,
                url: url
            });
        } catch (err) {
            // User cancelled or error
        }
    } else {
        UI.copyTextToClipboard(`${text} ${url}`, MESSAGES.share_copied);
    }
};

// Game Configuration
window.updateConfig = () => {
    const cat = document.getElementById('categorySelect').value;
    const imp = parseInt(document.getElementById('impostorCountSelect').value);
    game.updateConfig(cat, imp);
};

window.randomCategory = () => {
    game.randomCategory();
};

// Game Actions
window.startGame = () => game.startGame();
window.cancelGame = () => game.cancelGame();
window.startVoting = () => game.startVoting();
window.finishVoting = () => game.finishVoting();
window.continueGame = () => game.continueGame();
window.continueInRoom = () => game.continueInRoom();
window.resetGame = () => game.socket.emit('resetGame', { roomCode: game.currentRoom });

// Chat & Social
window.toggleChat = UI.toggleChat;
window.sendChat = (e) => {
    e.preventDefault();
    if (!game.currentRoom) return;
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    if (message.length > 100) return toast('El mensaje es muy largo (máx 100 caracteres)', 'error');

    game.socket.emit('sendChat', { roomCode: game.currentRoom, message });
    input.value = '';
    input.focus();
};

window.sendReaction = (emoji) => {
    game.sendReaction(emoji);
};

// Init Logic
document.addEventListener('DOMContentLoaded', () => {
    UI.initializeTheme();

    // Setup inputs enter key
    document.getElementById('playerNameInput')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') window.createRoom();
    });
    document.getElementById('joinNameInput')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') document.getElementById('roomCodeInput').focus();
    });
    document.getElementById('roomCodeInput')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') window.joinRoom();
    });

    // Help Dropdown Logic
    const helpBtn = document.getElementById('helpBtn');
    const dropdown = document.getElementById('helpDropdown');

    if (helpBtn && dropdown) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !helpBtn.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    // Setup Navigation Modals (Hybrid SEO)
    const links = {
        '/como-jugar': 'howToPlayModal',
        '/reglas': 'rulesModal',
        '/faq': 'faqModal'
    };

    document.querySelectorAll('.nav-link').forEach(link => {
        const path = link.getAttribute('href');
        if (links[path]) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Close dropdown if open
                if (dropdown) dropdown.classList.remove('show');

                const modalId = links[path];
                const modal = document.getElementById(modalId);
                if (modal) {
                    // Close other modals first
                    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
                    modal.style.display = 'flex';
                }
            });
        }
    });
});

// PWA Logic copied from script.js
if ('serviceWorker' in navigator) {
    // UNREGISTER OLD WORKERS FIRST (Fix for broken cache)
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister();
        }
    }).then(() => {
        // Register new fixed worker
        navigator.serviceWorker.register('/sw.js');
    });
}
