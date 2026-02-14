
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LineChart, 
  LayoutTemplate, 
  ClipboardList, 
  Wallet, 
  MonitorPlay, 
  UserCog, 
  CalendarClock, 
  UtensilsCrossed, 
  Utensils,
  CalendarCheck, 
  Tags, 
  Truck, 
  Users, 
  BookOpen, 
  Settings2, 
  LogOut, 
  Menu, 
  ChevronLeft,
  ChefHat,
  AlertCircle,
  Activity
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { logger } from '../services/logger';
import { Permission } from '../types';
import { hasPermission } from '../services/permissionsService';

const Sidebar = () => {
  const { logout, currentUser, settings, toggleSidebar } = useStore();
  const isCollapsed = settings.isSidebarCollapsed;

  interface NavItem {
    to: string;
    icon: React.ReactNode;
    label: string;
    roles: string[];
    feature?: string;
    requiredPermission?: Permission;
  }

  const allItems: NavItem[] = [
    { to: "/", icon: <LayoutDashboard size={22} />, label: "Comando", roles: ['ADMIN'] },
    { to: "/analytics", icon: <LineChart size={22} />, label: "Analytics", roles: ['ADMIN'], requiredPermission: 'ACCESS_REPORTS' },
    { to: "/tables-layout", icon: <LayoutTemplate size={22} />, label: "Mesas", roles: ['ADMIN', 'CAIXA', 'GARCOM'], requiredPermission: 'MANAGE_TABLES' },
    { to: "/reports", icon: <ClipboardList size={22} />, label: "Relatórios", roles: ['ADMIN'], requiredPermission: 'ACCESS_REPORTS' },
    { to: "/finance", icon: <Wallet size={22} />, label: "Finanças", roles: ['ADMIN'], requiredPermission: 'VIEW_FINANCIAL' },
    { to: "/pos", icon: <MonitorPlay size={22} />, label: "POS Terminal", roles: ['ADMIN', 'CAIXA', 'GARCOM'], requiredPermission: 'CREATE_ORDER' },
    { to: "/employees", icon: <UserCog size={22} />, label: "Gestão de Staff", roles: ['ADMIN'], requiredPermission: 'MANAGE_EMPLOYEES' },
    { to: "/schedules", icon: <CalendarClock size={22} />, label: "Escalas", roles: ['ADMIN'], requiredPermission: 'MANAGE_EMPLOYEES' },
    { to: "/kitchen", icon: <UtensilsCrossed size={22} />, label: "Cozinha (KDS)", roles: ['ADMIN', 'COZINHA'], feature: 'kdsEnabled', requiredPermission: 'VIEW_KITCHEN' },
    { to: "/reservations", icon: <CalendarCheck size={22} />, label: "Reservas", roles: ['ADMIN', 'CAIXA'], requiredPermission: 'MANAGE_RESERVATIONS' },
    { to: "/products?tab=menu", icon: <Utensils size={22} />, label: "Inventário", roles: ['ADMIN'], requiredPermission: 'MANAGE_INVENTORY' },
    { to: "/products?tab=categories", icon: <Tags size={22} />, label: "Categorias", roles: ['ADMIN'], requiredPermission: 'MANAGE_INVENTORY' },
    { to: "/encomendas", icon: <Truck size={22} />, label: "Encomendas", roles: ['ADMIN', 'CAIXA'], requiredPermission: 'MANAGE_DELIVERIES' },
    { to: "/customers", icon: <Users size={22} />, label: "Clientes", roles: ['ADMIN', 'CAIXA'] },
    { to: "/manual", icon: <BookOpen size={22} />, label: "Manual", roles: ['ADMIN', 'CAIXA', 'GARCOM', 'COZINHA', 'GERENTE'] },
    { to: "/settings", icon: <Settings2 size={22} />, label: "Sistema", roles: ['ADMIN'], requiredPermission: 'MANAGE_USERS' },
    { to: "/system-health", icon: <Activity size={22} />, label: "Saúde do Sistema", roles: ['ADMIN'], requiredPermission: 'VIEW_SYSTEM_HEALTH' },
  ];

  const navItems = allItems.filter(item => {
    if (!currentUser) return false;
    
    // Verificar acesso por permissão (prioritário) ou por role (legado/fallback)
    const hasAccess = item.requiredPermission 
      ? hasPermission(currentUser.role, item.requiredPermission, settings.customRoles, currentUser.permissions)
      : item.roles.includes(currentUser.role);
      
    const featureMatch = !item.feature || (settings as any)[item.feature];
    return hasAccess && featureMatch
  });

  React.useEffect(() => {
    if (currentUser && navItems.length === 0) {
      logger.error('Sidebar items empty for logged in user', { 
        role: currentUser.role, 
        permissions: currentUser.permissions,
        customRoles: settings.customRoles 
      }, 'Sidebar');
    }
  }, [currentUser, navItems.length, settings.customRoles]);

  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const location = useLocation();

  // Fechar menu mobile ao navegar
  const handleMobileNav = () => {
    setIsMobileOpen(false);
  };

  const activeClass = `flex items-center gap-3 px-4 py-3 bg-primary/20 text-primary border-r-2 border-primary shadow-glow transition-all duration-200`;
  const inactiveClass = `flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 border-r-2 border-transparent`;

  const renderLogo = (size?: number) => {
    if (settings.appLogoUrl) {
      return (
        <img 
          src={settings.appLogoUrl} 
          alt="App Logo" 
          style={size ? { width: size, height: size } : { width: '100%', maxHeight: '180px' }}
          className="shrink-0 rounded-lg object-contain shadow-glow"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    return <ChefHat size={size || 40} className="text-white" />;
  };

  return (
    <>
      {/* Botão Mobile - Sempre visível em telas pequenas */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-[60] w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex md:hidden items-center justify-center text-white shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Overlay para Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[65] md:hidden animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Botão Collapse Desktop */}
      {isCollapsed && (
        <button 
          onClick={toggleSidebar}
          className="fixed left-4 top-6 z-[60] w-12 h-12 bg-primary rounded-2xl hidden md:flex items-center justify-center text-black shadow-glow hover:scale-110 transition-all duration-300 animate-in fade-in slide-in-from-left-4"
          title="Mostrar Menu"
        >
          <Menu size={24} />
        </button>
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-[70] md:z-20
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-0 md:opacity-0 md:invisible md:overflow-hidden' : 'md:w-64'} 
        h-full glass-panel flex flex-col transition-all duration-300 border-r border-white/5
      `}>
        {/* Botão Fechar Mobile */}
        <button 
            onClick={() => setIsMobileOpen(false)}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white md:hidden z-50"
        >
            <ChevronLeft size={24} />
        </button>

        {!isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full hidden md:flex items-center justify-center text-black shadow-glow hover:scale-110 transition-transform z-30"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div className="shrink-0 relative border-b border-white/5 bg-black/20">
          <div className={`flex items-center gap-3 px-5 py-6 ${isCollapsed ? 'justify-center px-2' : ''}`}>
             <div className="shrink-0 transition-transform duration-300 hover:scale-105">
               {renderLogo(isCollapsed ? 32 : 40)}
             </div>
             
             {!isCollapsed && (
               <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                 <h1 className="text-sm font-extrabold text-white truncate leading-tight tracking-tight" title={settings.restaurantName}>
                   {settings.restaurantName || "Gestão"}
                 </h1>
                 <span className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-90 mt-0.5">
                   {settings.restaurantSubtitle || "Sistema Integrado"}
                 </span>
               </div>
             )}
          </div>
        </div>
          
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Operador</p>
                    <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                </div>
            </div>

            {/* Local Mode Indicator */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Sistema</p>
                    <p className="text-[10px] font-bold text-white truncate">Local Mode</p>
                </div>
            </div>
          </div>

        <nav className="flex-1 px-0 space-y-1 overflow-y-auto py-2 no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleMobileNav}
              className={() => {
                const currentPathWithQuery = location.pathname + location.search;
                return item.to === currentPathWithQuery ? activeClass : inactiveClass;
              }}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors rounded-lg"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
