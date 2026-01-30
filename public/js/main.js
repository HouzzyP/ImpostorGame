import { game } from './modules/game.js';
import * as UI from './modules/ui.js';
import { setupSocketListeners, showLocalStats } from './modules/socket.js';
import { toast, } from './modules/utils.js';

// Initialize Socket
const socket = io();
game.setSocket(socket);
setupSocketListeners(socket);

// ==========================================
// EXPOSE GLOBAL FUNCTIONS (Bridge for HTML)
// ==========================================

// UI & Theme
window.toggleTheme = UI.toggleTheme;
window.showLocalStats = showLocalStats;
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.showHomeScreen = UI.showHomeScreen;
window.showJoinScreen = UI.showJoinScreen;

// Room Management
// Helper for username validation
function validateUsername(name) {
    if (!name) return 'Ingresa tu nombre';
    if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres';
    if (name.length > 15) return 'El nombre no puede tener más de 15 caracteres';
    if (!/[a-zA-Z]/.test(name)) return 'El nombre debe tener al menos una letra';
    if (!/^[a-zA-Z0-9 ]+$/.test(name)) return 'El nombre solo puede tener letras, números y espacios';
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

    if (!code) return toast('Ingresa el código de sala', 'error');
    if (code.length !== 4) return toast('El código de sala debe tener 4 caracteres', 'error');

    game.joinRoom(name, code);
};

window.copyRoomCode = () => {
    if (game.currentRoom) {
        UI.copyTextToClipboard(game.currentRoom, 'Codigo copiado');
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
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
