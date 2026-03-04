'use client';

import React from 'react';
import { useStatusMonitor } from '@/hooks/useStatusMonitor';

interface StatusIndicatorProps {
  type: 'supabase' | 'kitchen' | 'reservations';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  type, 
  showText = false, 
  size = 'sm' 
}) => {
  const { getStatusConfig } = useStatusMonitor();
  const statusConfig = getStatusConfig(type);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`
          ${sizeClasses[size]} 
          ${statusConfig.bgColor} 
          rounded-full 
          ${statusConfig.pulse ? 'animate-pulse' : ''}
        `}
      />
      {showText && (
        <span className={`${textSizeClasses[size]} ${statusConfig.color}`}>
          {statusConfig.text}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
