

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
    [key: string]: unknown 
  };
  old: { id: string; status: string; [key: string]: unknown };
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
    [key: string]: unknown 
  };
  old: { date: string; total_revenue: number; total_expenses: number; total_product_cost: number; total_orders: number; net_profit: number; [key: string]: unknown };
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
  // Auth Slice
  isAuthenticated: boolean;
  login: (pin: string, userId?: string, rememberMe?: boolean) => Promise<boolean>;
  users: User[];
  
  // Operational Slice (assumed)
  settings: SystemSettings;
  isInitialized: boolean;

  // Analytics Slice
  dailyAnalyticsData: DailyAnalyticsPayload['new'] | null;
  setDailyAnalyticsData: (data: DailyAnalyticsPayload['new'] | null) => void;
  supabaseSyncStatus: SupabaseSyncStatus;
  
  // Allow other properties (temporary fix for incomplete types)
  [key: string]: any;
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
  [key: string]: unknown;
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
