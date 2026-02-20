-- Enable UUID extension if not already enabled (optional for gen_random_uuid in PG13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    restaurant_name TEXT,
    nif TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    tax_percentage NUMERIC,
    currency VARCHAR(10) DEFAULT 'Kz',
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'pt',
    supabase_config JSONB,
    printer_config JSONB,
    backup_config JSONB,
    app_logo_url TEXT,
    agt_certificate TEXT,
    open_drawer_code TEXT,
    admin_pin TEXT,
    api_token TEXT,
    wifi_name TEXT,
    wifi_password TEXT,
    qr_code_title TEXT,
    qr_code_subtitle TEXT,
    qr_code_short_code TEXT,
    qr_menu_url TEXT,
    qr_menu_cloud_url TEXT,
    logo_url TEXT,
    name TEXT
);

-- Ensure currency column exists if table already existed but was missing it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'currency') THEN
        ALTER TABLE settings ADD COLUMN currency VARCHAR(10) DEFAULT 'Kz';
    END IF;
END $$;
