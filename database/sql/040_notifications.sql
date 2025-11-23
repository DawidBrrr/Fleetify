-- Notification history for the notifications microservice
CREATE TABLE IF NOT EXISTS notification_channels (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    channel_id      INTEGER REFERENCES notification_channels(id) ON DELETE SET NULL,
    subject         TEXT NOT NULL,
    body            TEXT NOT NULL,
    priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
    metadata        JSONB,
    sent_at         TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id      INTEGER NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    schedule        TEXT DEFAULT 'anytime'
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_pref_user_channel
    ON notification_preferences(user_id, channel_id);
