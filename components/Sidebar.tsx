import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';
import { useStore } from '../store/useStore';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useStore();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/pos', icon: <ShoppingBag size={20} />, label: 'POS' },
    { path: '/kitchen', icon: <ChefHat size={20} />, label: 'Cozinha' },
    { path: '/customers', icon: <Users size={20} />, label: 'Clientes' },
    { path: '/finance', icon: <DollarSign size={20} />, label: 'Finanças' },
    { path: '/products', icon: <Package size={20} />, label: 'Produtos' },
    { path: '/schedules', icon: <Calendar size={20} />, label: 'Escalas' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Relatórios' },
    { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analítica' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Definições' },
  ];

  return (
    <div className="w-64 h-full bg-slate-900 text-white flex flex-col border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <h1 className="font-bold text-xl text-yellow-500">Tasca do Vereda</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path) 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
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
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
