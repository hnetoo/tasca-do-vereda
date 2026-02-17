'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Package,
  Calendar,
  LogOut,
  ChevronLeft,
  ClipboardList,
  LayoutGrid,
  CalendarCheck,
  Tags,
  Warehouse,
  UserCog,
  QrCode,
  BarChart3,
  ScanLine,
  Smartphone,
  Code,
  Activity,
  BookOpen,
  Shield,
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { SystemSettings } from '@/types';

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  subItems?: MenuItem[];
}

const Sidebar = () => {
  const pathname = usePathname();
  const { logout, settings } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/system']); // Auto-expand system for visibility

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMenu = (path: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path) 
        : [...prev, path]
    );
  };

  const isActive = (path: string) => pathname === path;
  const isParentActive = (item: MenuItem) => {
    if (item.path === pathname) return true;
    return item.subItems?.some(sub => sub.path === pathname);
  };

  const menuItems: MenuItem[] = [
    { path: '/admin/owner', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/finance', icon: <DollarSign size={20} />, label: 'Finanças' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Relatórios' },
    { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analítica' },
    { 
      path: '/settings', 
      icon: <Settings size={20} />, 
      label: 'Definições',
      subItems: [
        { path: '/pos-access', icon: <Lock size={20} />, label: 'Acesso POS' },
        { path: '/roles', icon: <Shield size={20} />, label: 'Cargos' },
        { path: '/qrmenumanager', icon: <QrCode size={20} />, label: 'QR Menu' },
        { path: '/qrscanner', icon: <ScanLine size={20} />, label: 'QR Scanner' },
        { path: '/mobiledashboard', icon: <Smartphone size={20} />, label: 'Mobile' },
        { path: '/developersettings', icon: <Code size={20} />, label: 'Desenvolvedor' },
        { path: '/systemhealth', icon: <Activity size={20} />, label: 'Saúde' },
      ]
    },
  ];

  return (
    <div className={`h-full bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            {settings?.appLogoUrl && (
              <img src={settings.appLogoUrl} alt="App Logo" className="h-8 w-8" />
            )}
            <h1 className="font-bold text-xl text-yellow-500">Tasca do Vereda</h1>
          </div>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-slate-800">
          <ChevronLeft size={20} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const expanded = expandedMenus.includes(item.path);
            const active = isActive(item.path) || (hasSubItems && isParentActive(item));

            return (
              <li key={item.path}>
                {hasSubItems ? (
                  <>
                    <button 
                      onClick={() => toggleMenu(item.path)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        active 
                          ? 'bg-slate-800 text-white' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                      )}
                    </button>
                    
                    {!isCollapsed && expanded && (
                      <ul className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-2">
                        {item.subItems!.map(sub => (
                          <li key={sub.path}>
                            <Link 
                              href={sub.path}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                                isActive(sub.path) 
                                  ? 'bg-blue-600/20 text-blue-400' 
                                  : 'text-slate-500 hover:text-white'
                              }`}
                            >
                              {sub.icon}
                              <span>{sub.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link 
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path) 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
