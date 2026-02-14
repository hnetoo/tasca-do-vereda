-- Migration to add QR Menu URL fields to restaurant_settings table

ALTER TABLE public.restaurant_settings 
ADD COLUMN IF NOT EXISTS qr_menu_url TEXT,
ADD COLUMN IF NOT EXISTS qr_menu_cloud_url TEXT;
