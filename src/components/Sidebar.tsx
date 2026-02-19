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
  ChevronRight,
  UtensilsCrossed,
  Monitor,
  Cloud, // Adicionado para o submenu Nuvem.db
  Truck,
  Menu,
  X
} from 'lucide-react';
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
  const { logout, settings, user, isMobileMenuOpen, toggleMobileMenu } = useStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (path: string) => {
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

  const ownerMenuItems: MenuItem[] = [
    { path: '/admin/owner', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { path: '/admin/owner/analytics', icon: <BarChart2 size={20} />, label: 'Análises' },
    { path: '/admin/owner/pos', icon: <Monitor size={20} />, label: 'POS' },
    { path: '/admin/owner/staff', icon: <Users size={20} />, label: 'Gestão de Pessoal' },
    { path: '/admin/owner/finance', icon: <DollarSign size={20} />, label: 'Finanças' },
    { path: '/admin/owner/settings', icon: <Settings size={20} />, label: 'Definições' },
  ];

  const generalMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: <LayoutGrid size={20} />, label: 'Comando' },
    { path: '/encomendas', icon: <ShoppingBag size={20} />, label: 'Encomendas' },
    { path: '/products', icon: <Package size={20} />, label: 'Produtos' },
    { path: '/categories', icon: <Tags size={20} />, label: 'Categorias' },
    {
      path: '/sistema', // Caminho pai para o menu "Sistema"
      icon: <Settings size={20} />,
      label: 'Sistema',
      subItems: [
        { path: '/settings', icon: <Settings size={20} />, label: 'Geral' },
        { path: '/pos-access', icon: <Lock size={20} />, label: 'Acesso POS' },
        { path: '/developersettings', icon: <Code size={20} />, label: 'Developer Settings' },
        { path: '/roles', icon: <UserCog size={20} />, label: 'Roles' },
        { path: '/systemmanual', icon: <BookOpen size={20} />, label: 'Manual do Sistema' },
        { path: '/dlprecovery', icon: <Shield size={20} />, label: 'DLP Recovery' },
        { path: '/sistema/agt', icon: <Activity size={20} />, label: 'AGT' }, // Placeholder
        { path: '/sistema/nuvem-db', icon: <Cloud size={20} />, label: 'Nuvem.db' }, // Placeholder
      ],
    },
    { path: '/systemhealth', icon: <Activity size={20} />, label: 'Sistema Health' },
    { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    { path: '/tablelayout', icon: <UtensilsCrossed size={20} />, label: 'Mesas' },
    { path: '/reports', icon: <BarChart3 size={20} />, label: 'Relatórios' },
    { path: '/finance', icon: <DollarSign size={20} />, label: 'Finanças' },
    { path: '/pos', icon: <Monitor size={20} />, label: 'POS Terminal' },
    { path: '/employees', icon: <Users size={20} />, label: 'Gestão de Staff' },
    { path: '/schedules', icon: <CalendarCheck size={20} />, label: 'Escalas' },
    { path: '/inventory', icon: <Warehouse size={20} />, label: 'Inventário' },
    { path: '/kitchen', icon: <ChefHat size={20} />, label: 'Cozinha' },
    { path: '/customers', icon: <Users size={20} />, label: 'Clientes' },
    { path: '/reservations', icon: <Calendar size={20} />, label: 'Reservas' },
    { path: '/qrcodeanalytics', icon: <QrCode size={20} />, label: 'QR Code Analytics' },
    { path: '/qrmenumanager', icon: <Menu size={20} />, label: 'QR Menu Manager' },
  ];

  const menuItems: MenuItem[] = pathname.startsWith('/admin/owner')
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
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleMobileMenu}
        />
      )}

      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        h-full bg-slate-900 text-white flex flex-col border-r border-slate-800 
        transition-all duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0 w-64' : '-translate-x-full md:w-0'}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {showSidebar && (
            <div className="flex items-center gap-3">
              {settings?.appLogoUrl ? (
              <img src={settings.appLogoUrl} alt="App Logo" className="h-10 w-10 object-contain" />
            ) : (
              <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                 <ChefHat className="text-emerald-500" size={24} />
              </div>
            )}
              <div className="flex flex-col">
                <h1 className="font-bold text-base text-white leading-none tracking-wide">
                  Tasca Do <span className="font-black">VEREDA</span>
                </h1>
                <span className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] mt-1">
                  RESTAURANTE
                </span>
              </div>
            </div>
          )}

        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
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
                          {showSidebar && <span>{item.label}</span>}
                        </div>
                        {showSidebar && (
                          expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        )}
                      </button>
                      
                      {showSidebar && expanded && (
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
                      {showSidebar && <span>{item.label}</span>}
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
            {showSidebar && <span>Sair</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
