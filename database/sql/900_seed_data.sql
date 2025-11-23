-- Basic seed data for local development
INSERT INTO users (email, password_hash, full_name, role)
VALUES
    ('admin@fleetify.io', crypt('admin', gen_salt('bf')), 'Fleet Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, full_name, role)
VALUES
    ('driver@fleetify.io', crypt('driver', gen_salt('bf')), 'Demo Driver', 'employee')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vehicles (vin, label, status, driver_name)
VALUES
    ('1FTEX1EP5KKD12345', 'Delivery Van 01', 'operational', 'Demo Driver'),
    ('1C6RR7YT9JS123456', 'Maintenance Truck', 'maintenance', 'N/A')
ON CONFLICT (vin) DO NOTHING;

INSERT INTO notification_channels (name, description)
VALUES
    ('email', 'Default SMTP channel'),
    ('sms', 'Twilio SMS channel'),
    ('push', 'Mobile push notifications')
ON CONFLICT (name) DO NOTHING;
