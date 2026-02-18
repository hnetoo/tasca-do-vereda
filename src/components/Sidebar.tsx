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

const Sidebar = () => {
  const pathname = usePathname();
  const { logout, settings, user } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/system', '/menu-management', '/staff', '/room']);

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
    { path: '/dashboard', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { path: '/admin/owner', icon: <Home size={20} />, label: 'Owner' },
    { path: '/pos', icon: <Monitor size={20} />, label: 'POS' },
    { path: '/kitchen', icon: <ChefHat size={20} />, label: 'Cozinha' },
    { path: '/encomendas', icon: <Truck size={20} />, label: 'Encomendas' },
    
    { 
      path: '/menu-management', 
      icon: <UtensilsCrossed size={20} />, 
      label: 'Menu',
      subItems: [
        { path: '/products', icon: <ShoppingBag size={20} />, label: 'Produtos' },
        { path: '/categories', icon: <Tags size={20} />, label: 'Categorias' },
        { path: '/menu', icon: <BookOpen size={20} />, label: 'Menu Digital' },
        { path: '/qrmenumanager', icon: <QrCode size={20} />, label: 'QR Menu' },
      ]
    },

    { 
      path: '/room', 
      icon: <Warehouse size={20} />, 
      label: 'Sala',
      subItems: [
        { path: '/tablelayout', icon: <LayoutGrid size={20} />, label: 'Mesas' },
        { path: '/reservations', icon: <CalendarCheck size={20} />, label: 'Reservas' },
      ]
    },

    { path: '/customers', icon: <Users size={20} />, label: 'Clientes' },
    { path: '/inventory', icon: <Package size={20} />, label: 'Stocks' },
    
    { 
      path: '/staff', 
      icon: <UserCog size={20} />, 
      label: 'Equipa',
      subItems: [
        { path: '/employees', icon: <Users size={20} />, label: 'Funcionários' },
        { path: '/schedules', icon: <Calendar size={20} />, label: 'Escalas' },
      ]
    },

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
        { path: '/qrscanner', icon: <ScanLine size={20} />, label: 'QR Scanner' },
        { path: '/mobiledashboard', icon: <Smartphone size={20} />, label: 'Mobile' },
        { path: '/developersettings', icon: <Code size={20} />, label: 'Desenvolvedor' },
        { path: '/systemhealth', icon: <Activity size={20} />, label: 'Saúde' },
      ]
    },
  ];

  // Define allowed roles for sensitive modules
  const isAdminOrOwner = user?.role === 'ADMIN' || user?.role === 'OWNER';
  
  // Filter menu items based on Page Context AND User Role
  const getFilteredItems = () => {
    // 1. If on Owner Dashboard page, show ONLY specific items (Finance, Reports, Analytics, System)
    // plus the Owner Dashboard itself to maintain context.
    if (pathname?.startsWith('/admin/owner')) {
      return menuItems.filter(item => 
        ['/admin/owner', '/finance', '/reports', '/analytics', '/settings'].includes(item.path)
      );
    }

    // 2. General Role-Based Access Control
    // If NOT Admin/Owner, hide sensitive modules (Settings, Finance, Reports, Analytics, Staff, Inventory, Menu Management)
    if (!isAdminOrOwner) {
      return menuItems.filter(item => 
        ['/pos', '/kitchen', '/encomendas', '/room', '/customers', '/dashboard'].includes(item.path)
      );
    }

    // 3. Default: Show all items for Admin/Owner on other pages
    return menuItems;
  };

  const visibleMenuItems = getFilteredItems();

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleMobileSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-800"
        aria-label="Toggle Menu"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        h-full bg-slate-900 text-white flex flex-col border-r border-slate-800 
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {(!isCollapsed || isMobileOpen) && (
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
          <button onClick={toggleSidebar} className="hidden md:block p-2 rounded-full hover:bg-slate-800">
            <ChevronLeft size={20} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <ul className="space-y-1 px-2">
            {visibleMenuItems.map((item) => {
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
                          {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                        </div>
                        {(!isCollapsed || isMobileOpen) && (
                          expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        )}
                      </button>
                      
                      {(!isCollapsed || isMobileOpen) && expanded && (
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
                      {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
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
            {(!isCollapsed || isMobileOpen) && <span>Sair</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
