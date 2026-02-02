const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('./config/config');
const { registerSocketHandlers } = require('./src/handlers/socket-handlers');

const PORT = config.PORT;

const app = express();

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
// Servir archivos estáticos con caché (1 día para assets)
app.use(express.static('public', {
    maxAge: '1d', // Cachear por 1 día
    etag: true
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

// API Stats
app.get('/api/stats', adminAuth, async (req, res) => {
    const stats = await getGlobalStats();
    const analytics = await getAnalytics();

    if (!stats) return res.status(500).json({ error: 'Error fetching stats' });

    res.json({ ...stats, ...analytics });
});

// Analytics Ingest
app.post('/api/event', (req, res) => {
    const { type, data } = req.body;
    if (type) {
        saveEvent(type, data || {});
    }
    res.sendStatus(200);
});

const rooms = new Map();

registerSocketHandlers(io, rooms);
require('./src/handlers/chat-handlers').registerChatHandlers(io, rooms);

server.listen(PORT, () => {
    return;
});
