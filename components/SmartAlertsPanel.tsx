import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { AlertTriangle, TrendingDown, Clock, Zap, X } from 'lucide-react';

interface SmartAlert {
  id: string;
  type: 'stock' | 'performance' | 'sales' | 'inventory' | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}

const ALERT_ICONS = {
  stock: <Zap size={20} className="text-orange-500" />,
  sales: <TrendingDown size={20} className="text-orange-500" />,
  performance: <Zap size={20} className="text-blue-500" />,
  system: <Clock size={20} className="text-purple-500" />,
  critical: <AlertTriangle size={20} className="text-red-500" />
};

export const SmartAlertsPanel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stock, activeOrders, employees, getStockAnalytics, getMenuAnalytics, getDailySalesAnalytics } = useStore();
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('dismissedAlerts');
    return saved ? JSON.parse(saved) : [];
  });

  const alerts = useMemo<SmartAlert[]>(() => {
    const allAlerts: SmartAlert[] = [];
    
    // Safety checks
    if (!stock || !activeOrders || !employees) return [];

    try {
      // Alert 1: Stock baixo
      if (stock) {
        const lowStockItems = stock.filter(item => item && item.quantity <= (item.minThreshold || 5));
        if (lowStockItems.length > 0) {
          allAlerts.push({
            id: 'low-stock',
            type: 'stock',
            severity: lowStockItems.length > 3 ? 'critical' : 'warning',
            title: '⚠️ Stock Baixo',
            message: `Existem ${lowStockItems.length} itens com stock abaixo do mínimo.`,
            icon: lowStockItems.length > 3 ? ALERT_ICONS.critical : ALERT_ICONS.stock,
            action: () => navigate('/stock'),
            actionLabel: 'Ver Stock'
          });
        }
      }

      // Alert 2: Queda em vendas
      if (getDailySalesAnalytics) {
        const dailyAnalytics = getDailySalesAnalytics(7);
        if (dailyAnalytics && Array.isArray(dailyAnalytics) && dailyAnalytics.length >= 2) {
          const lastDay = dailyAnalytics[dailyAnalytics.length - 1];
          const prevDay = dailyAnalytics[dailyAnalytics.length - 2];
          
          if (lastDay && prevDay && prevDay.totalSales > 0) {
            const decline = ((lastDay.totalSales - prevDay.totalSales) / prevDay.totalSales) * 100;

            if (decline < -20) {
              allAlerts.push({
                id: 'sales-decline',
                type: 'sales',
                severity: 'warning',
                title: 'Queda de vendas detectada',
                message: `Vendas caíram ${Math.abs(decline).toFixed(1)}% comparado ao dia anterior`,
                icon: ALERT_ICONS.sales,
                action: () => navigate('/analytics'),
                actionLabel: 'Analisar'
              });
            }
          }
        }
      }

      // Alert 3: Pratos com baixo desempenho
      if (getMenuAnalytics) {
        const menuAnalytics = getMenuAnalytics(30);
        if (menuAnalytics && Array.isArray(menuAnalytics)) {
          const underperforming = menuAnalytics.filter(m => m && m.sold === 0 && m.revenue === 0);
          
          if (underperforming.length > 0) {
            allAlerts.push({
              id: 'underperforming-dishes',
              type: 'performance',
              severity: 'info',
              title: `${underperforming.length} pratos não vendidos`,
              message: `Considere remover ou repromoçionar: ${underperforming[0]?.dishName || 'Prato'}`,
              icon: ALERT_ICONS.performance,
              action: () => navigate('/analytics'),
              actionLabel: 'Revisar Menu'
            });
          }
        }
      }

      // Alert 4: Pico de pedidos
      if (activeOrders) {
        const now = new Date().getHours();
        const currentHourOrders = activeOrders.filter(o => o && o.timestamp && new Date(o.timestamp).getHours() === now);
        
        if (currentHourOrders.length > 10) {
          allAlerts.push({
            id: 'busy-hour',
            type: 'system',
            severity: 'info',
            title: '📊 Horário de pico detectado',
            message: `${currentHourOrders.length} pedidos ativos. Verifique a cozinha.`,
            icon: ALERT_ICONS.system,
            action: () => navigate('/kitchen'),
            actionLabel: 'Ver KDS'
          });
        }
      }
    } catch (error) {
      console.error("Error generating smart alerts:", error);
    }

    return allAlerts.filter(a => !dismissedIds.includes(a.id));
  }, [getMenuAnalytics, getDailySalesAnalytics, activeOrders, navigate, dismissedIds, stock, employees]);

  // Show only on specific pages
  const allowedPaths = ['/finance', '/reports', '/analytics'];
  
  // Also check for user permission or other conditions if needed
  const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));
  
  if (!isAllowedPath) return null;

  if (alerts.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => {
      const newIds = [...prev, id];
      // Optional: Persist to sessionStorage if you want them to stay dismissed during session
      sessionStorage.setItem('dismissedAlerts', JSON.stringify(newIds));
      return newIds;
    });
  };

  const handleAction = (alert: SmartAlert) => {
    if (alert.action) {
      alert.action();
      handleDismiss(alert.id);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 max-h-96 overflow-y-auto space-y-2 flex flex-col-reverse pointer-events-none">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`pointer-events-auto glass-panel rounded-xl p-4 border animate-in slide-in-from-right-10 flex gap-3 relative group shadow-2xl ${
            alert.severity === 'critical'
              ? 'bg-red-950/90 border-red-500/50 text-red-100'
              : alert.severity === 'warning'
              ? 'bg-orange-950/90 border-orange-500/50 text-orange-100'
              : 'bg-slate-900/90 border-blue-500/50 text-blue-100'
          }`}
        >
          <button 
            onClick={() => handleDismiss(alert.id)}
            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>

          <div className="shrink-0">{alert.icon}</div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="font-bold text-white text-sm">{alert.title}</p>
            <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
            {alert.action && (
              <button
                onClick={() => handleAction(alert)}
                className={`mt-2 text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : alert.severity === 'warning'
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {alert.actionLabel}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SmartAlertsPanel;
