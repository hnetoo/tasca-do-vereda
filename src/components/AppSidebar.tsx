'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingCart,
  ShoppingBag,
  ChefHat, 
  Users, 
  BarChart2, 
  Settings, 
  FileText,
  DollarSign,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  CalendarCheck,
  Warehouse,
  UserCog,
  QrCode,
  BarChart3,
  ScanLine,
  Smartphone,
  Code,
  Activity,
  BookOpen,
  UserPlus,
  Briefcase,
  Cloud,
  Database,
  Shield,
  Lock,
  UtensilsCrossed,
  Monitor,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth.types';
import StatusIndicator from '@/components/StatusIndicator';
import { useStore } from '@/store/useStore';

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  statusType?: 'supabase' | 'kitchen' | 'reservations';
}

const AppSidebar = ({ showSidebar = true }: { showSidebar?: boolean }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { settings } = useStore();

  // Sincronizar logo com as configurações globais
  const getLogoDisplay = () => {
    if (settings?.logo) {
      return (
        <Image 
          src={settings.logo} 
          alt="Logo" 
          width={40} 
          height={40}
          className="rounded-lg object-cover"
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">T</span>
      </div>
    );
  };

  // Menu items for different user roles
  const staffMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: <Home size={24} />, label: 'Dashboard' },
    { path: '/menu', icon: <UtensilsCrossed size={24} />, label: 'Menu' },
    { path: '/orders', icon: <ShoppingBag size={24} />, label: 'Pedidos' },
    { path: '/tablelayout', icon: <LayoutGrid size={24} />, label: 'Mesas' },
    { path: '/finance', icon: <DollarSign size={24} />, label: 'Finanças' },
    { path: '/analytics', icon: <BarChart2 size={24} />, label: 'Analytics' },
    { path: '/reports', icon: <BarChart3 size={24} />, label: 'Relatórios' },
    { path: '/sistema', icon: <Settings size={24} />, label: 'Sistema' },
  ];

  const ownerMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: <Home size={24} />, label: 'Dashboard' },
    { path: '/pos', icon: <ShoppingCart size={24} />, label: 'POS Terminal' },
    { path: '/menu', icon: <UtensilsCrossed size={24} />, label: 'Menu' },
    { path: '/orders', icon: <ShoppingBag size={24} />, label: 'Pedidos' },
    { path: '/tablelayout', icon: <LayoutGrid size={24} />, label: 'Mesas' },
    { path: '/inventory', icon: <Warehouse size={24} />, label: 'Inventário' },
    { path: '/finance', icon: <DollarSign size={24} />, label: 'Finanças' },
    { path: '/analytics', icon: <BarChart2 size={24} />, label: 'Analytics' },
    { path: '/reports', icon: <BarChart3 size={24} />, label: 'Relatórios' },
    { path: '/settings', icon: <Settings size={24} />, label: 'Configurações' },
  ];

  const menuItems = user?.role === UserRole.Owner || user?.role === UserRole.Admin ? ownerMenuItems : staffMenuItems;

  const toggleMenu = (menuPath: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuPath) 
        ? prev.filter(p => p !== menuPath)
        : [...prev, menuPath]
    );
  };

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className={`bg-[#020617] text-white transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    } min-h-screen border-r border-gray-800`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {getLogoDisplay()}
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold text-white">{settings?.restaurantName || 'Tasca'}</h2>
                <p className="text-xs text-gray-400">Sistema de Gestão</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    <div className="ml-auto flex items-center gap-2">
                      {item.statusType && (
                        <StatusIndicator type={item.statusType} size="sm" />
                      )}
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {/* User Status */}
        {!collapsed && (
          <div className="mb-3 p-2 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">Online</span>
            </div>
            {user && (
              <div className="mt-1 text-xs text-gray-400">
                {user.name} • {user.role}
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );
};

export default AppSidebar;
