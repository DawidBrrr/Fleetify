CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    label VARCHAR(50) NOT NULL,
    value INTEGER NOT NULL,
    delta VARCHAR(10),
    tone VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_costs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_alerts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_assignments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(100),
    vehicle_vin VARCHAR(50),
    vehicle_mileage VARCHAR(50),
    vehicle_battery INTEGER,
    vehicle_tire_pressure VARCHAR(20),
    task_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_trips (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    route VARCHAR(200),
    distance VARCHAR(50),
    cost VARCHAR(50),
    efficiency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_reminders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for admin (ID 1)
-- Note: Since we switched to UUIDs, these integer IDs won't match real users.
-- They are placeholders. Real users will have empty dashboards initially.
INSERT INTO user_stats (user_id, label, value, delta, tone) VALUES
('00000000-0000-0000-0000-000000000001', 'Pojazdy', 42, '+2', 'success'),
('00000000-0000-0000-0000-000000000001', 'Aktywne Wypożyczenia', 12, '+5', 'info'),
('00000000-0000-0000-0000-000000000001', 'W Serwisie', 3, '-1', 'warning');

INSERT INTO user_costs (user_id, category, amount) VALUES
('00000000-0000-0000-0000-000000000001', 'Paliwo', 1200.00),
('00000000-0000-0000-0000-000000000001', 'Serwis', 500.00),
('00000000-0000-0000-0000-000000000001', 'Ubezpieczenie', 300.00),
('00000000-0000-0000-0000-000000000001', 'Leasing', 2000.00);

INSERT INTO user_alerts (user_id, type, message, severity) VALUES
('00000000-0000-0000-0000-000000000001', 'Wypożyczenie', 'Pojazd #123 wypożyczony przez Jana Kowalskiego', 'info'),
('00000000-0000-0000-0000-000000000001', 'Serwis', 'Pojazd #456 wymaga wymiany oleju', 'warning');
