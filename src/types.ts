import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface PedidoPayload {
  eventType: 'INSERT' | 'UPDATE';
  new: { 
    id: string; 
    status: string; 
    kitchen_status: string; 
    payment_status: string; 
    delivery_status: string; 
    table_id: number; 
    created_at: string; 
    updated_at: string; 
    [key: string]: any 
  };
  old: { id: string; status: string; [key: string]: any };
  schema: 'public';
  table: 'pedidos';
  commit_timestamp: string;
}

export interface DailyAnalyticsPayload {
  eventType: 'UPDATE';
  new: { 
    date: string; 
    total_revenue: number; 
    total_expenses: number; 
    total_product_cost: number; 
    total_orders: number; 
    net_profit: number; 
    [key: string]: any 
  };
  old: { date: string; total_revenue: number; total_expenses: number; total_product_cost: number; total_orders: number; net_profit: number; [key: string]: any };
  schema: 'public';
  table: 'daily_analytics';
  commit_timestamp: string;
}

export type RealtimePayload = PedidoPayload | DailyAnalyticsPayload;

export interface SupabaseSyncStatus {
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'retrying' | 'error';
  lastErrorAt: number | null;
  errorMessage: string | null;
  retries: number;
}

export interface StoreState {
  dailyAnalyticsData: DailyAnalyticsPayload['new'] | null;
  setDailyAnalyticsData: (data: DailyAnalyticsPayload['new'] | null) => void;
  supabaseSyncStatus: SupabaseSyncStatus;
  // Other existing StoreState properties would go here, but for now, we're just adding these.
  // This interface will be extended by the slices in useStore.ts
}

// Existing types from the original types.ts (if any) should be added here
// For now, assuming these are the only new types.

// Example of existing types that might be in a real types.ts file:
export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  categoryName?: string;
  image_url?: string;
  is_active: boolean;
  sort_order?: number;
  cost?: number;
  stock?: number;
  unit?: string;
  allergens?: string[];
  notes?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  sort_order?: number;
  is_active: boolean;
  parent_id?: string;
  parentId?: string; // For compatibility
}

export interface SystemSettings {
  id: string;
  restaurantName?: string;
  appLogoUrl?: string;
  qrMenuTitle?: string;
  qrMenuSubtitle?: string;
  qrMenuLogo?: string;
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    key: string;
  };
  [key: string]: any;
}

export interface User {
  id: string;
  name: string;
  role: string;
  pin: string;
  active: boolean;
  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
