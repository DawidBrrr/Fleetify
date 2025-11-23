-- Fleet telemetry powering dashboard endpoints
CREATE TABLE IF NOT EXISTS vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin             VARCHAR(32) UNIQUE NOT NULL,
    label           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational','maintenance','offline')),
    driver_name     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_metrics (
    id              BIGSERIAL PRIMARY KEY,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    odometer_km     NUMERIC(10, 2) NOT NULL,
    fuel_level_pct  NUMERIC(5, 2) NOT NULL,
    location        JSONB,
    avg_speed_kmh   NUMERIC(6, 2),
    harsh_events    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vehicle_metrics_vehicle_time ON vehicle_metrics(vehicle_id, recorded_at DESC);
