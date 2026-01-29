const { getPlayerFromRoom } = require('../managers/room-manager');

// Map to track user message timestamps: socket.id -> timestamp[]
const messageTimestamps = new Map();

// Spam protection constants
const MAX_MSG_LENGTH = 100;
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const MAX_MSGS_PER_WINDOW = 8;
const BLOCK_DURATION_MS = 5000; // 5 seconds block

/**
 * Registers chat-related socket handlers
 * @param {Object} io - Socket.IO instance
 * @param {Map} rooms - Map of rooms
 */
function registerChatHandlers(io, rooms) {
    io.on('connection', (socket) => {

        socket.on('sendChat', (data) => {
            const { roomCode, message } = data;

            // 1. Validate Room & Player
            const room = rooms.get(roomCode);
            if (!room) return;

            const player = getPlayerFromRoom(room, socket.id);
            if (!player) return;

            // 2. Validate Message Content
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return;
            }

            if (message.length > MAX_MSG_LENGTH) {
                socket.emit('error', `El mensaje no puede exceder ${MAX_MSG_LENGTH} caracteres.`);
                return;
            }

            // 3. Spam Protection (Rate Limiting)
            const now = Date.now();
            let timestamps = messageTimestamps.get(socket.id) || [];

            // Remove timestamps older than the window
            timestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

            // Check if user is blocked (if we tracked blocks separately, but here we just check count)
            // Ideally we could have a separate 'blockedUntil' map, but simple window counting works for "limit quantity".
            // To implement "block for X seconds", we need strict state.

            // Let's implement strict blocking
            if (messageTimestamps.has(`blocked_${socket.id}`)) {
                const blockedUntil = messageTimestamps.get(`blocked_${socket.id}`);
                if (now < blockedUntil) {
                    socket.emit('error', `Estás enviando mensajes muy rápido. Espera unos segundos.`);
                    return;
                } else {
                    messageTimestamps.delete(`blocked_${socket.id}`);
                }
            }

            if (timestamps.length >= MAX_MSGS_PER_WINDOW) {
                // Block user
                messageTimestamps.set(`blocked_${socket.id}`, now + BLOCK_DURATION_MS);
                socket.emit('error', `Estás enviando mensajes muy rápido. Espera ${BLOCK_DURATION_MS / 1000} segundos.`);
                return;
            }

            // Add new timestamp
            timestamps.push(now);
            messageTimestamps.set(socket.id, timestamps);

            // 4. Emit Message
            const chatMessage = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                senderId: socket.id,
                senderName: player.username,
                content: message.trim(),
                timestamp: now,
                isSpectator: player.isSpectator || false
            };

            io.to(roomCode).emit('chatMessage', chatMessage);
        });

        // Cleanup on disconnect
        socket.on('disconnect', () => {
            messageTimestamps.delete(socket.id);
            messageTimestamps.delete(`blocked_${socket.id}`);
        });
    });
}

module.exports = { registerChatHandlers };
