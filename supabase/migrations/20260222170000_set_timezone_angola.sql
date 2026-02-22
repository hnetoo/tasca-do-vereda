-- Set timezone to Africa/Luanda for all roles
-- This ensures that when querying date/time functions like now(), current_timestamp, etc.
-- the database uses Angola time (UTC+1).

-- For the database itself (if allowed)
ALTER DATABASE postgres SET timezone TO 'Africa/Luanda';

-- For specific roles used by Supabase
ALTER ROLE postgres SET timezone TO 'Africa/Luanda';
ALTER ROLE anon SET timezone TO 'Africa/Luanda';
ALTER ROLE service_role SET timezone TO 'Africa/Luanda';
ALTER ROLE authenticated SET timezone TO 'Africa/Luanda';

-- Ensure new sessions use this timezone by default
SET timezone TO 'Africa/Luanda';
