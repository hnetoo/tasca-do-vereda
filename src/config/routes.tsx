/**
 * Routes Configuration for New Integrations Features
 * 
 * Add these routes to your App.tsx to enable:
 * - Mobile Dashboard (for restaurant owner remote access)
 * - Developer Settings (for API key & webhook management)
 */

// ==================== IMPORTS ====================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Dashboard from '../pages/Dashboard';
import POS from '../pages/POS';
import Kitchen from '../pages/Kitchen';
import TableLayout from '../pages/TableLayout';
import Customers from '../pages/Customers';
import Employees from '../pages/Employees';
import Inventory from '../pages/Inventory';
import Finance from '../pages/Finance';
import Reports from '../pages/Reports';
import Reservations from '../pages/Reservations';
import Settings from '../pages/Settings';
import Login from '../pages/Login';

// NEW: Integration Pages
import MobileDashboard from '../pages/MobileDashboard';
import DeveloperSettings from '../pages/DeveloperSettings';

// ==================== ROUTE CONFIGURATION ====================

export const mainRoutes = [
  // Core Routes
  {
    path: '/dashboard',
    label: '📊 Dashboard',
    element: <Dashboard />,
    icon: 'BarChart3',
    requiresAuth: true,
    roles: ['ADMIN']
  },
  {
    path: '/pos',
    label: '🛒 POS',
    element: <POS />,
    icon: 'ShoppingCart',
    requiresAuth: true,
    roles: ['ADMIN', 'CAIXA', 'GARCOM']
  },
  {
    path: '/kitchen',
    label: '👨‍🍳 Cozinha',
    element: <Kitchen />,
    icon: 'ChefHat',
    requiresAuth: true,
    roles: ['ADMIN', 'COZINHA']
  },
  {
    path: '/tables',
    label: '🪑 Mesas',
    element: <TableLayout />,
    icon: 'Grid',
    requiresAuth: true,
    roles: ['ADMIN', 'GARCOM']
  },
  {
    path: '/customers',
    label: '👥 Clientes',
    element: <Customers />,
    icon: 'Users',
    requiresAuth: true,
    roles: ['ADMIN']
  },
  {
    path: '/employees',
    label: '👔 Funcionários',
    element: <Employees />,
    icon: 'Users',
    requiresAuth: true,
    roles: ['ADMIN']
  },
  {
    path: '/inventory',
    label: '📦 Inventário',
    element: <Inventory />,
    icon: 'Package',
    requiresAuth: true,
    roles: ['ADMIN']
  },
  {
    path: '/finance',
    label: '💰 Finanças',
    element: <Finance />,
    icon: 'DollarSign',
    requiresAuth: true,
    roles: ['ADMIN']
  },
  {
    path: '/reports',
    label: '📈 Relatórios',
    element: <Reports />,
    icon: 'BarChart3',
    requiresAuth: true,
    roles: ['ADMIN']
  },
  {
    path: '/reservations',
    label: '📅 Reservas',
    element: <Reservations />,
    icon: 'Calendar',
    requiresAuth: true,
    roles: ['ADMIN', 'GARCOM']
  },
  {
    path: '/settings',
    label: '⚙️ Configurações',
    element: <Settings />,
    icon: 'Settings',
    requiresAuth: true,
    roles: ['ADMIN']
  },

  // NEW: Integration Routes
  {
    path: '/mobile-dashboard',
    label: '📱 Mobile',
    element: <MobileDashboard />,
    icon: 'Smartphone',
    requiresAuth: true,
    roles: ['ADMIN'],
    category: 'integrations'
  },
  {
    path: '/developer-settings',
    label: '👨‍💻 Desenvolvedor',
    element: <DeveloperSettings />,
    icon: 'Code',
    requiresAuth: true,
    roles: ['ADMIN'],
    category: 'integrations'
  },

  // Auth Routes
  {
    path: '/login',
    label: 'Login',
    element: <Login />,
    icon: 'LogIn',
    requiresAuth: false
  }
];

// ==================== SIDEBAR GROUPS ====================

/**
 * Organize sidebar menu into groups
 */
export const sidebarGroups = [
  {
    title: 'Operações',
    routes: [
      'dashboard', 'pos', 'kitchen', 'tables'
    ]
  },
  {
    title: 'Gestão',
    routes: [
      'customers', 'employees', 'inventory', 'reservations'
    ]
  },
  {
    title: 'Financeiro',
    routes: [
      'finance', 'reports'
    ]
  },
  {
    title: 'Sistema',
    routes: [
      'settings'
    ]
  },
  {
    title: 'Integrações',
    routes: [
      'mobile-dashboard', 'developer-settings'
    ]
  }
];

// ==================== APP ROUTE COMPONENT ====================

/**
 * Main router component for the app
 * Usage in App.tsx:
 * 
 * import { AppRoutes } from './config/routes';
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <AppRoutes />
 *     </Routes>
 *   );
 * }
 */

export function AppRoutes() {
  return (
    <Routes>
      {mainRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            route.requiresAuth ? (
              <ProtectedRoute
                element={route.element}
                allowedRoles={route.roles}
              />
            ) : (
              route.element
            )
          }
        />
      ))}
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ==================== PROTECTED ROUTE COMPONENT ====================

/**
 * Route protection based on authentication and roles
 */

import { useStore } from '../store/useStore';

interface ProtectedRouteProps {
  element: React.ReactElement;
  allowedRoles?: string[];
}

function ProtectedRoute({ element, allowedRoles }: ProtectedRouteProps) {
  const { currentUser } = useStore();

  // Check if user is logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}

// ==================== INTEGRATION ROUTES ONLY ====================

/**
 * If you want to keep integration routes separate,
 * you can use this helper to filter and display them
 */

export function getIntegrationRoutes() {
  return mainRoutes.filter(route => route.category === 'integrations');
}

export function getMainRoutes() {
  return mainRoutes.filter(route => !route.category);
}

// ==================== MOBILE ROUTES ====================

/**
 * For mobile-only routing (if needed)
 */

export function getMobileRoutes() {
  return mainRoutes.filter(route => 
    route.path === '/mobile-dashboard' ||
    route.path === '/pos' ||
    route.path === '/kitchen' ||
    route.path === '/login'
  );
}

// ==================== BREADCRUMB HELPER ====================

/**
 * Generate breadcrumb from current path
 * 
 * Usage:
 * const breadcrumbs = getBreadcrumbs('/finance/reports');
 * // Returns: [{ label: 'Home', path: '/' }, { label: 'Finanças', path: '/finance' }, { label: 'Relatórios', path: '/finance/reports' }]
 */

export function getBreadcrumbs(path: string) {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', path: '/' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const route = mainRoutes.find(r => r.path === currentPath);
    if (route) {
      breadcrumbs.push({
        label: route.label,
        path: currentPath
      });
    }
  }

  return breadcrumbs;
}

// ==================== PERMISSION HELPER ====================

/**
 * Check if user has permission for a route
 * 
 * Usage:
 * if (canAccessRoute('/developer-settings', currentUser)) {
 *   // Show link
 * }
 */

export function canAccessRoute(path: string, user: any) {
  const route = mainRoutes.find(r => r.path === path);
  
  if (!route) return false;
  if (!route.requiresAuth) return true;
  if (!user) return false;
  
  return route.roles?.includes(user.role) ?? true;
}

// ==================== INTEGRATION SETTINGS HELPER ====================

/**
 * Get settings for integration routes
 * Can be used to determine if features should be shown/hidden
 */

export const integrationSettings = {
  mobileDashboard: {
    enabled: true,
    icon: 'Smartphone',
    description: 'Ver movimentos do restaurante em tempo real no telemóvel',
    requiredPermissions: ['ADMIN'],
    apiEndpoints: [
      'GET /api/dashboard/summary',
      'GET /api/orders',
      'GET /api/analytics'
    ]
  },
  
  developerSettings: {
    enabled: true,
    icon: 'Code',
    description: 'Gerenciar integrações, webhooks e API keys',
    requiredPermissions: ['ADMIN'],
    features: [
      'API Key Management',
      'Webhook Configuration',
      'Biometric Device Registration',
      'Integration Logging',
      'API Documentation'
    ]
  },
  
  biometricIntegration: {
    enabled: true,
    description: 'Integração com sistemas biométricos para controlo de presença',
    supportedDevices: ['FINGERPRINT', 'FACIAL', 'RFID', 'PIN'],
    autoFeatures: [
      'Automatic attendance record',
      'Late detection',
      'Overtime calculation',
      'Finance linking'
    ]
  }
};

// ==================== USAGE IN APP.TSX ====================

/**
 * SIMPLE USAGE:
 * 
 * import { AppRoutes } from './config/routes';
 * 
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <Layout>
 *         <AppRoutes />
 *       </Layout>
 *     </BrowserRouter>
 *   );
 * }
 * 
 * 
 * CUSTOM USAGE:
 * 
 * import { mainRoutes } from './config/routes';
 * import { canAccessRoute } from './config/routes';
 * 
 * function Sidebar({ user }) {
 *   return (
 *     <nav>
 *       {mainRoutes
 *         .filter(route => canAccessRoute(route.path, user))
 *         .map(route => (
 *           <Link key={route.path} to={route.path}>
 *             {route.label}
 *           </Link>
 *         ))}
 *     </nav>
 *   );
 * }
 */

export default mainRoutes;
