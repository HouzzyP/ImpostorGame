const db = require('../../database/db');

async function saveGameResult(gameData) {
    const { roomCode, category, impostorCount, playerCount, winnerTeam, duration, players } = gameData;

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Insert Game
        const gameRes = await client.query(
            `INSERT INTO games (room_code, category, impostor_count, player_count, winner_team, duration_seconds)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [roomCode, category, impostorCount, playerCount, winnerTeam, duration]
        );
        const gameId = gameRes.rows[0].id;

        // Insert Players
        for (const p of players) {
            await client.query(
                `INSERT INTO game_players (game_id, player_name, role, is_impostor, is_winner, voted_for)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [gameId, p.name, p.role, p.isImpostor, p.isWinner, p.votedFor || null]
            );
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error saving game stats:', e);
    } finally {
        client.release();
    }
}

async function getGlobalStats() {
    try {
        const games = await db.query('SELECT COUNT(*) FROM games');
        const impostorWins = await db.query("SELECT COUNT(*) FROM games WHERE winner_team = 'impostors'");
        const innocentWins = await db.query("SELECT COUNT(*) FROM games WHERE winner_team = 'innocents'");

        // Top 5 Categories
        const categories = await db.query(`
            SELECT category, COUNT(*) as count 
            FROM games 
            GROUP BY category 
            ORDER BY count DESC 
            LIMIT 5
        `);

        return {
            total_games: parseInt(games.rows[0].count),
            impostor_wins: parseInt(impostorWins.rows[0].count),
            innocent_wins: parseInt(innocentWins.rows[0].count),
            top_categories: categories.rows
        };
    } catch (e) {
        console.error('Error fetching global stats:', e);
        return null;
    }
}

async function saveEvent(eventType, eventData) {
    try {
        await db.query(
            "INSERT INTO analytical_events (event_type, event_data) VALUES ($1, $2)",
            [eventType, eventData]
        );
    } catch (e) {
        console.error('Error saving analytical event:', e);
    }
}

async function getAnalytics() {
    try {
        // Visitas únicas (unique_visit)
        const uniqueVisits = await db.query(
            "SELECT COUNT(*) FROM analytical_events WHERE event_type = 'unique_visit'"
        );

        // Page views totales
        const pageViews = await db.query(
            "SELECT COUNT(*) FROM analytical_events WHERE event_type = 'page_view'"
        );

        // Sesiones únicas (contar sessionIds distintos)
        const uniqueSessions = await db.query(`
            SELECT COUNT(DISTINCT event_data->>'sessionId') as count 
            FROM analytical_events 
            WHERE event_data->>'sessionId' IS NOT NULL 
            AND event_data->>'sessionId' != 'no-session'
        `);

        // Eventos agrupados por tipo (excluyendo page_view y unique_visit)
        const events = await db.query(`
            SELECT event_type, COUNT(*) as count 
            FROM analytical_events 
            WHERE event_type NOT IN ('page_view', 'unique_visit')
            GROUP BY event_type
            ORDER BY count DESC
        `);

        // Top páginas visitadas
        const topPages = await db.query(`
            SELECT event_data->>'path' as path, COUNT(*) as visits
            FROM analytical_events
            WHERE event_type = 'page_view' AND event_data->>'path' IS NOT NULL
            GROUP BY event_data->>'path'
            ORDER BY visits DESC
            LIMIT 10
        `);

        return {
            unique_visits: parseInt(uniqueVisits.rows[0].count) || 0,
            page_views: parseInt(pageViews.rows[0].count) || 0,
            unique_sessions: parseInt(uniqueSessions.rows[0]?.count) || 0,
            events: events.rows,
            top_pages: topPages.rows
        };
    } catch (e) {
        console.error('Error fetching analytics:', e);
        return {
            unique_visits: 0,
            page_views: 0,
            unique_sessions: 0,
            events: [],
            top_pages: []
        };
    }
}

module.exports = {
    saveGameResult,
    getGlobalStats,
    saveEvent,
    getAnalytics
};
