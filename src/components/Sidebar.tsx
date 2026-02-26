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
  Shield,
  Lock,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  Monitor,
  Cloud, // Adicionado para o submenu Nuvem.db
  Truck,
  Menu,
  X,
  Tags,
  Package,
  MonitorPlay,
  Share2,
  Save,
  History as HistoryIcon,
  Image as ImageIcon
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/reduxStore';
import { logoutUser } from '@/store/slices/authSlice';
import { useStore } from '../store/useStore';
import { SystemSettings } from '@/types';

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  subItems?: MenuItem[];
}

const Sidebar = ({ showSidebar }: { showSidebar: boolean }) => {
  const pathname = usePathname();
  const { settings, isMobileMenuOpen, toggleMobileMenu } = useStore();
  const dispatch = useDispatch<AppDispatch>();

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path + '/'));

  const ownerMenuItems: MenuItem[] = [
    { path: '/owner', icon: <LayoutGrid size={24} />, label: 'Dashboard' },
    { path: '/owner/analytics', icon: <BarChart2 size={24} />, label: 'Análises' },
    { path: '/owner/pos', icon: <Monitor size={24} />, label: 'POS' },
    { path: '/owner/staff', icon: <Users size={24} />, label: 'Gestão de Pessoal' },
    { path: '/owner/finance', icon: <DollarSign size={24} />, label: 'Finanças' },
    { path: '/owner/settings', icon: <Settings size={24} />, label: 'Definições' },
  ];

  const generalMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: <LayoutGrid size={24} />, label: 'Comando' },
    { path: '/encomendas', icon: <ShoppingBag size={24} />, label: 'Encomendas' },
    { path: '/settings', icon: <Settings size={24} />, label: 'Definições' },

    { path: '/analytics', icon: <BarChart2 size={24} />, label: 'Analytics' },
    { path: '/tablelayout', icon: <UtensilsCrossed size={24} />, label: 'Mesas' },
    { path: '/reports', icon: <BarChart3 size={24} />, label: 'Relatórios' },
    { path: '/finance', icon: <DollarSign size={24} />, label: 'Finanças' },
    { path: '/pos', icon: <Monitor size={24} />, label: 'POS Terminal' },
    { path: '/employees', icon: <Users size={24} />, label: 'Gestão de Staff' },
    { path: '/schedules', icon: <CalendarCheck size={24} />, label: 'Escalas' },
    { path: '/inventory', icon: <Warehouse size={24} />, label: 'Inventário' },
    { path: '/kitchen', icon: <ChefHat size={24} />, label: 'Cozinha' },
    { path: '/customers', icon: <Users size={24} />, label: 'Clientes' },
    { path: '/reservations', icon: <Calendar size={24} />, label: 'Reservas' },
    { path: '/qrcodeanalytics', icon: <QrCode size={24} />, label: 'QR Code Analytics' },
    { path: '/qrmenumanager', icon: <Menu size={24} />, label: 'QR Menu Manager' },
  ];

  const menuItems: MenuItem[] = pathname.startsWith('/owner')
    ? ownerMenuItems
    : generalMenuItems;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-800"
        aria-label="Toggle Menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className={`fixed inset-0 bg-black/80 z-[55] backdrop-blur-sm ${showSidebar ? 'md:hidden' : ''}`}
          onClick={toggleMobileMenu}
        />
      )}

      <div className={`
        fixed ${showSidebar ? 'md:static' : ''} inset-y-0 left-0 z-[60]
        h-full bg-slate-900 text-white flex flex-col border-r border-slate-800 
        transition-all duration-300 ease-in-out
        ${(showSidebar || isMobileMenuOpen) ? 'translate-x-0 w-72' : '-translate-x-full w-0'}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {(showSidebar || isMobileMenuOpen) && (
            <div className="flex items-center gap-3">
              {settings?.logo ? (
                <img src={settings.logo} alt="Restaurant Logo" className="h-10 w-10 object-contain rounded-lg" width={40} height={40} />
              ) : (
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                   <ImageIcon className="text-primary" size={24} />
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="font-bold text-lg text-white leading-none tracking-wide">
                  Tasca Do <span className="font-black">VEREDA</span>
                </h1>
                <span className="text-xs font-bold text-primary tracking-[0.2em] mt-1">
                  RESTAURANTE
                </span>
              </div>
            </div>
          )}

        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 shadow-md transform scale-[1.02]' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                    }`}
                    onClick={() => isMobileMenuOpen && toggleMobileMenu()}
                  >
                    {item.icon}
                    {(showSidebar || isMobileMenuOpen) && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => dispatch(logoutUser())}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={24} />
            {(showSidebar || isMobileMenuOpen) && <span>Sair</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
