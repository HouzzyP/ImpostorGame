// Sistema de tracking de visitas únicas
const SESSION_KEY = 'impostor-session-id';
const LAST_SESSION_KEY = 'impostor-last-session-id'; // Para recuperar sesión
const VISIT_TIMESTAMP_KEY = 'impostor-last-visit';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inactividad = nueva sesión

/**
 * Genera un ID único para la sesión
 */
function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica si es una visita única (nueva sesión)
 * Usa sessionStorage (se borra al cerrar tab) + timeout de inactividad
 */
function isUniqueVisit() {
    // 1. Revisar si ya hay sesión activa (sessionStorage)
    const existingSession = sessionStorage.getItem(SESSION_KEY);
    if (existingSession) {
        // Ya tiene sesión activa, no es visita única
        return false;
    }

    // 2. Revisar timestamp de última actividad (localStorage)
    const lastVisit = localStorage.getItem(VISIT_TIMESTAMP_KEY);
    const lastSessionId = localStorage.getItem(LAST_SESSION_KEY);
    const now = Date.now();

    if (lastVisit && lastSessionId) {
        const timeSinceLastVisit = now - parseInt(lastVisit, 10);

        // Si pasaron menos de 30 minutos, continuar sesión existente
        if (timeSinceLastVisit < SESSION_TIMEOUT) {
            // Recuperar sesión (el usuario cerró el tab pero volvió rápido)
            sessionStorage.setItem(SESSION_KEY, lastSessionId);
            localStorage.setItem(VISIT_TIMESTAMP_KEY, now.toString());
            return false; // No es visita nueva, es continuación
        }
    }

    // 3. Es una visita nueva (no hay sesión activa y pasó tiempo suficiente o es primera vez)
    const sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
    localStorage.setItem(LAST_SESSION_KEY, sessionId);
    localStorage.setItem(VISIT_TIMESTAMP_KEY, now.toString());

    return true;
}

/**
 * Actualiza el timestamp de última actividad
 * Llamar esto en cada interacción para mantener la sesión viva
 */
function updateActivity() {
    const now = Date.now();
    const currentSessionId = getSessionId();
    localStorage.setItem(VISIT_TIMESTAMP_KEY, now.toString());
    if (currentSessionId) {
        localStorage.setItem(LAST_SESSION_KEY, currentSessionId);
    }
}

/**
 * Obtiene el ID de sesión actual (o null si no hay sesión)
 */
function getSessionId() {
    return sessionStorage.getItem(SESSION_KEY);
}

export function trackEvent(type, data = {}) {
    // Agregar sessionId a todos los eventos
    const sessionId = getSessionId();
    const eventData = {
        ...data,
        sessionId: sessionId || 'no-session',
        timestamp: Date.now()
    };


    // Send fire-and-forget request
    fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: eventData })
    }).catch(err => console.warn('Analytics error:', err));

    // Actualizar actividad en cada evento
    updateActivity();
}

export function initAnalytics() {
    // 1. Verificar si es visita única
    const isNewVisit = isUniqueVisit();

    // DEBUG: Temporal para verificar en producción
    console.log('[Analytics] Is new visit:', isNewVisit, 'SessionID:', getSessionId());

    if (isNewVisit) {
        // Solo enviar evento de "nueva visita" si es sesión única
        console.log('[Analytics] Sending unique_visit event');
        trackEvent('unique_visit', {
            path: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        });
    } else {
        console.log('[Analytics] Not a unique visit, skipping unique_visit event');
    }

    // 2. Page View (se envía siempre para analytics de navegación interna)
    trackEvent('page_view', {
        path: window.location.pathname,
        referrer: document.referrer
    });

    // 3. Button Clicks (Delegation)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn && btn.id) {
            trackEvent('btn_click', { id: btn.id });
        }
    });

    // 4. Actualizar timestamp periódicamente mientras el usuario está activo
    let activityTimeout;
    function resetActivityTimer() {
        clearTimeout(activityTimeout);
        activityTimeout = setTimeout(() => {
            updateActivity();
        }, 60000); // Actualizar cada minuto de actividad
    }

    // Detectar actividad del usuario
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
        document.addEventListener(eventType, resetActivityTimer, { passive: true });
    });

}
