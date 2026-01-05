-- Update existing admin user with a 1-month subscription
-- Replace 'your-email@example.com' with your actual admin email

UPDATE users 
SET 
    subscription_plan = '1_month',
    subscription_active_until = NOW() + INTERVAL '30 days',
    updated_at = NOW()
WHERE 
    email = 'your-email@example.com' 
    AND role = 'admin';

-- Verify the update
SELECT 
    email, 
    role, 
    subscription_plan, 
    subscription_active_until,
    subscription_active_until - NOW() as time_remaining
FROM users 
WHERE role = 'admin';
