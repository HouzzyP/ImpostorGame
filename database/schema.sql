-- Games Table
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(10) NOT NULL,
    category VARCHAR(50),
    impostor_count INTEGER,
    player_count INTEGER,
    winner_team VARCHAR(20), -- 'impostors' or 'innocents'
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Players Table (for stats)
CREATE TABLE IF NOT EXISTS game_players (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_name VARCHAR(50),
    role VARCHAR(20), -- 'impostor' or 'innocent'
    is_impostor BOOLEAN,
    is_winner BOOLEAN,
    voted_for VARCHAR(50), -- Name of person they voted for (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Global Events / Clicks (Optional for analytics)
CREATE TABLE IF NOT EXISTS analytical_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50), -- 'btn_click', 'page_view'
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
