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
  BookOpen
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { SystemSettings } from '@/types';

const Sidebar = () => {
  const pathname = usePathname();
  const { logout, settings } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { path: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/pos', icon: <ShoppingBag size={20} />, label: 'POS' },
    { path: '/kitchen', icon: <ChefHat size={20} />, label: 'Cozinha' },
    { path: '/encomendas', icon: <ClipboardList size={20} />, label: 'Encomendas' },
    { path: '/tablelayout', icon: <LayoutGrid size={20} />, label: 'Mesas' },
    { path: '/reservations', icon: <CalendarCheck size={20} />, label: 'Reservas' },
    { path: '/customers', icon: <Users size={20} />, label: 'Clientes' },
    { path: '/products', icon: <Package size={20} />, label: 'Produtos' },
    { path: '/categories', icon: <Tags size={20} />, label: 'Categorias' },
    { path: '/inventory', icon: <Warehouse size={20} />, label: 'Inventário' },
    { path: '/finance', icon: <DollarSign size={20} />, label: 'Finanças' },
    { path: '/schedules', icon: <Calendar size={20} />, label: 'Escalas' },
    { path: '/employees', icon: <UserCog size={20} />, label: 'Funcionários' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Relatórios' },
    { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analítica' },
    { path: '/qrmenumanager', icon: <QrCode size={20} />, label: 'QR Menu' },
    { path: '/qrcodeanalytics', icon: <BarChart3 size={20} />, label: 'QR Analytics' },
    { path: '/qrscanner', icon: <ScanLine size={20} />, label: 'QR Scanner' },
    { path: '/mobiledashboard', icon: <Smartphone size={20} />, label: 'Mobile' },
    { path: '/developersettings', icon: <Code size={20} />, label: 'Desenvolvedor' },
    { path: '/systemhealth', icon: <Activity size={20} />, label: 'Saúde' },
    { path: '/systemmanual', icon: <BookOpen size={20} />, label: 'Manual' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Definições' },
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
          {menuItems.map((item) => (
            <li key={item.path}>
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
            </li>
          ))}
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
