-- Migration to add QR Code fields to restaurant_settings table

ALTER TABLE public.restaurant_settings 
ADD COLUMN IF NOT EXISTS qr_code_title TEXT,
ADD COLUMN IF NOT EXISTS qr_code_subtitle TEXT,
ADD COLUMN IF NOT EXISTS qr_code_short_code TEXT;

-- Verify if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurant_settings';
