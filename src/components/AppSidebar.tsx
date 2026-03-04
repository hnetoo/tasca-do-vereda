'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, 
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

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const AppSidebar = ({ showSidebar = true }: { showSidebar?: boolean }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Menu items for different user roles
  const staffMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: <Home size={24} />, label: 'Dashboard' },
    { path: '/pos', icon: <Monitor size={24} />, label: 'POS Terminal' },
    { path: '/encomendas', icon: <ShoppingBag size={24} />, label: 'Comando' },
    { path: '/kitchen', icon: <ChefHat size={24} />, label: 'Cozinha' },
    { path: '/tablelayout', icon: <UtensilsCrossed size={24} />, label: 'Layout de Mesas' },
  ];

  const ownerMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: <Home size={24} />, label: 'Dashboard' },
    { path: '/pos', icon: <Monitor size={24} />, label: 'POS Terminal' },
    { path: '/encomendas', icon: <ShoppingBag size={24} />, label: 'Comando' },
    { path: '/kitchen', icon: <ChefHat size={24} />, label: 'Cozinha' },
    { path: '/tablelayout', icon: <UtensilsCrossed size={24} />, label: 'Layout de Mesas' },
    { path: '/customers', icon: <Users size={24} />, label: 'Clientes' },
    { path: '/reservations', icon: <Calendar size={24} />, label: 'Reservas' },
    { path: '/inventory', icon: <Warehouse size={24} />, label: 'Inventário' },
  ];

  const financeMenuItems: MenuItem[] = [
    { path: '/finance', icon: <DollarSign size={24} />, label: 'Finanças' },
    { path: '/settings/payroll', icon: <Wallet size={24} />, label: 'Folha Salarial' },
  ];

  const analyticsMenuItems: MenuItem[] = [
    { path: '/analytics', icon: <BarChart2 size={24} />, label: 'Analytics' },
    { path: '/reports', icon: <BarChart3 size={24} />, label: 'Relatórios' },
  ];

  const staffMenuItems2: MenuItem[] = [
    { path: '/roles', icon: <UserCog size={24} />, label: 'Staff' },
    { path: '/settings/staff/escalas', icon: <CalendarCheck size={24} />, label: 'Escalas' },
    { path: '/settings/system/users', icon: <UserPlus size={24} />, label: 'Utilizadores' },
    { path: '/settings/system/roles', icon: <Briefcase size={24} />, label: 'Cargos' },
  ];

  const systemMenuItems: MenuItem[] = [
    { path: '/settings/system/health', icon: <Activity size={24} />, label: 'Monitorização' },
    { path: '/settings/system/cloud', icon: <Cloud size={24} />, label: 'Nuvem' },
    { path: '/settings/system/backup', icon: <Database size={24} />, label: 'Backup/Restore' },
  ];

  const settingsMenuItems: MenuItem[] = [
    { path: '/settings', icon: <Settings size={24} />, label: 'Configurações' },
    { path: '/qrcodeanalytics', icon: <QrCode size={24} />, label: 'QR Code Analytics' },
    { path: '/qrmenumanager', icon: <QrCode size={24} />, label: 'QR Code Menu Manager' },
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
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold text-white">Tasca</h2>
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
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {item.badge && !collapsed && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
          
          {/* Submenu Administração */}
          {!collapsed && (
            <li>
              <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2 mt-4 mb-2">
                Administração
              </div>
              {staffMenuItems2.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ml-4 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </li>
          )}
          
          {/* Submenu Sistema */}
          {!collapsed && (
            <li>
              <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2 mt-4 mb-2">
                Sistema
              </div>
              {systemMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ml-4 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </li>
          )}
          
          {/* Submenu Financeiro */}
          {!collapsed && (
            <li>
              <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2 mt-4 mb-2">
                Financeiro
              </div>
              {financeMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ml-4 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </li>
          )}
          
          {/* Submenu Analytics */}
          {!collapsed && (
            <li>
              <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2 mt-4 mb-2">
                Analytics
              </div>
              {analyticsMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ml-4 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </li>
          )}
          
          {/* Submenu Definições */}
          {!collapsed && (
            <li>
              <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2 mt-4 mb-2">
                Definições
              </div>
              {settingsMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ml-4 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </li>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
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
