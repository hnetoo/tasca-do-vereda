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
  History as HistoryIcon
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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path) 
        : [...prev, path]
    );
  };

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
    { 
      path: '/settings', 
      icon: <Settings size={24} />, 
      label: 'Definições',
      subItems: [
        { path: '/settings/general', icon: <Settings size={20} />, label: 'Geral' },
        { path: '/settings/fiscal', icon: <DollarSign size={20} />, label: 'Fiscal' },
        { path: '/settings/tables', icon: <ChefHat size={20} />, label: 'Mesas' },
        { path: '/settings/qr', icon: <QrCode size={20} />, label: 'Menu QR' },
        { path: '/settings/system', icon: <MonitorPlay size={20} />, label: 'Sistema' },
        { path: '/settings/system/users', icon: <Users size={20} />, label: 'Utilizadores' },
        { path: '/settings/system/roles', icon: <Shield size={20} />, label: 'Cargos' },
        { path: '/settings/system/integrations', icon: <Share2 size={20} />, label: 'Integrações' },
        { path: '/settings/system/health', icon: <Activity size={20} />, label: 'Monitorização' },
        { path: '/settings/system/cloud', icon: <Cloud size={20} />, label: 'Nuvem / App' },
        { path: '/settings/system/backup', icon: <Save size={20} />, label: 'Backup / Restore' },
        { path: '/settings/system/agt', icon: <FileText size={20} />, label: 'AGT' },
        { path: '/settings/system/dlp', icon: <Lock size={20} />, label: 'DLP' },
        { path: '/settings/system/history', icon: <HistoryIcon size={20} />, label: 'Histórico' },
      ]
    },

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
          className={`fixed inset-0 bg-black/80 z-40 backdrop-blur-sm ${showSidebar ? 'md:hidden' : ''}`}
          onClick={toggleMobileMenu}
        />
      )}

      <div className={`
        fixed ${showSidebar ? 'md:static' : ''} inset-y-0 left-0 z-50
        h-full bg-slate-900 text-white flex flex-col border-r border-slate-800 
        transition-all duration-300 ease-in-out
        ${(showSidebar || isMobileMenuOpen) ? 'translate-x-0 w-72' : '-translate-x-full w-0'}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {(showSidebar || isMobileMenuOpen) && (
            <div className="flex items-center gap-3">
              {settings?.appLogoUrl ? (
              <Image src={settings.appLogoUrl} alt="App Logo" className="h-10 w-10 object-contain" width={40} height={40} />
            ) : (
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                 <ChefHat className="text-primary" size={24} />
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
              const expanded = expandedItems.includes(item.path);

              return (
                <li key={item.path}>
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.path)}
                        className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          active 
                            ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 shadow-md transform scale-[1.02]' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          {(showSidebar || isMobileMenuOpen) && <span>{item.label}</span>}
                        </div>
                        {(showSidebar || isMobileMenuOpen) && (
                          expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        )}
                      </button>

                      {(showSidebar || isMobileMenuOpen) && expanded && (
                        <ul className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-2">
                          {item.subItems.map((sub) => {
                            const subActive = isActive(sub.path);
                            return (
                              <li key={sub.path}>
                                <Link
                                  href={sub.path}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    subActive
                                      ? 'text-white bg-white/10'
                                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                                  }`}
                                  onClick={() => isMobileMenuOpen && toggleMobileMenu()}
                                >
                                  {sub.icon}
                                  <span>{sub.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
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
                  )}
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
