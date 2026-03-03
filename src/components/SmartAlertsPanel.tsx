'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import { CircleAlert, X } from 'lucide-react';
import SuccessToast from './SuccessToast';

const SmartAlertsPanel = () => {
  const { notifications, removeNotification } = useStore();

  const activeAlerts = notifications.slice(0, 3);

  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {activeAlerts.map((alert) => {
        if (alert.type === 'success') {
          return (
            <SuccessToast
              key={alert.id}
              message={alert.message}
              onClose={() => removeNotification(alert.id)}
            />
          );
        }
        return (
          <div 
            key={alert.id}
            className={`p-4 rounded shadow-lg border backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-right fade-in duration-300
              ${alert.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' : ''}
              ${alert.type === 'warning' ? 'bg-yellow-900/80 border-yellow-500/50 text-yellow-100' : ''}
              ${alert.type === 'info' ? 'bg-blue-900/80 border-blue-500/50 text-blue-100' : ''}
            `}
          >
            <div className="mt-0.5 shrink-0">
              {alert.type === 'error' && <CircleAlert size={18} />}
              {alert.type === 'warning' && <CircleAlert size={18} />}
              {alert.type === 'info' && <CircleAlert size={18} />}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{alert.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(alert.id)}
              className="opacity-50 hover:opacity-100"
              title="Fechar notificação"
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SmartAlertsPanel;
