// @ts-nocheck
import { createClient as createBrowserClient } from '../lib/supabase/client';

// Since we are building for Tauri/Static Export, we force the browser client.
// The server client (ssr) relies on 'next/headers' which is not available in static export.
// This allows the app to bundle successfully.

export const client = Promise.resolve(createBrowserClient());
