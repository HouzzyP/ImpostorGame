const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./src/utils/logger');

const config = require('./config/config');
const { registerSocketHandlers } = require('./src/handlers/socket-handlers');

const PORT = config.PORT;

const app = express();

// Compresión Gzip (reduce tamaño de responses ~70%)
const compression = require('compression');
app.use(compression());

// Seguridad: Headers HTTP
app.use(helmet({
    contentSecurityPolicy: false // Desactivado por ahora para evitar problemas con scripts inline si los hay
}));

app.use(cors({
    origin: config.SOCKET_IO.cors.origin,
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requests por IP
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Configuración para proxys (necesario en Railway/Render/Heroku)
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = socketIO(server, config.SOCKET_IO);

// Servir archivos estáticos
// Servir archivos estáticos con caché optimizado
app.use(express.static('public', {
    maxAge: '1d', // Cache por 1 día para assets
    etag: false, // Desactivar etag para mejor performance
    lastModified: true
}));

const { getGlobalStats, saveEvent, getAnalytics } = require('./src/services/statsService');

// Middleware JSON (necesario para el body del post)
app.use(express.json());

// Rutas SEO
app.get('/como-jugar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'como-jugar.html'));
});
app.get('/reglas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reglas.html'));
});
app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});
app.get('/privacidad', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacidad.html'));
});

const adminAuth = require('./src/middleware/auth');

// Admin Panel (Protección básica)
app.get('/admin', adminAuth, (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// Health Check (para Render/Railway monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        activeRooms: rooms.size
    });
});

// API Stats (Admin - requiere autenticación)
app.get('/api/stats', adminAuth, async (req, res) => {
    const stats = await getGlobalStats();
    const analytics = await getAnalytics();

    if (!stats) return res.status(500).json({ error: 'Error fetching stats' });

    res.json({ ...stats, ...analytics });
});

// API Stats Públicas (sin autenticación - para SEO y engagement)
app.get('/api/stats/public', async (req, res) => {
    try {
        const stats = await getGlobalStats();

        // Retornar solo estadísticas no sensibles
        // Nota: getGlobalStats retorna total_games, impostor_wins, innocent_wins (snake_case)
        res.json({
            totalGames: stats?.total_games || 0,
            impostorWins: stats?.impostor_wins || 0,
            innocentWins: stats?.innocent_wins || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error fetching public stats', { error: error.message });
        res.status(500).json({ error: 'Error fetching stats' });
    }
});

// Analytics Ingest con validación
const analyticsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 50, // máximo 50 eventos por minuto por IP
    message: 'Too many analytics events',
    standardHeaders: true,
});

const ALLOWED_EVENT_TYPES = ['unique_visit', 'page_view', 'btn_click', 'game_start', 'game_end'];

app.post('/api/event', analyticsLimiter, (req, res) => {
    const { type, data } = req.body;

    // Validación básica
    if (!type || typeof type !== 'string') {
        return res.status(400).json({ error: 'Invalid event type' });
    }

    // Whitelist de tipos de eventos permitidos
    if (!ALLOWED_EVENT_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Event type not allowed' });
    }

    // Validar que data sea un objeto (no string, array, etc)
    if (data && typeof data !== 'object') {
        return res.status(400).json({ error: 'Invalid event data' });
    }

    // Sanitizar data para prevenir objetos muy grandes
    const sanitizedData = data ? JSON.parse(JSON.stringify(data).slice(0, 5000)) : {};

    saveEvent(type, sanitizedData);
    res.sendStatus(200);
});

const rooms = new Map();

registerSocketHandlers(io, rooms);
require('./src/handlers/chat-handlers').registerChatHandlers(io, rooms);

// Cleanup automático de salas vacías cada 10 minutos
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    rooms.forEach((room, code) => {
        // Eliminar salas sin jugadores o inactivas por más de 2 horas
        const isEmpty = room.players.length === 0;
        const isStale = room.createdAt && (now - room.createdAt) > (2 * 60 * 60 * 1000);

        if (isEmpty || isStale) {
            rooms.delete(code);
            cleaned++;
        }
    });

    if (cleaned > 0) {
        logger.info(`Cleaned ${cleaned} empty/stale rooms`, { activeRooms: rooms.size });
    }
}, 10 * 60 * 1000); // Cada 10 minutos

server.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`, {
        env: process.env.NODE_ENV || 'development',
        port: PORT
    });
});
