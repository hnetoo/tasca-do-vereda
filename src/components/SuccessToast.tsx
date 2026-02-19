'use client';

import React, { useEffect } from 'react';
import { CircleCheck, X } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  onClose: () => void;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message, onClose }) => {
  return (
    <div
      className="p-4 rounded shadow-lg border backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-right fade-in duration-300 bg-green-900/80 border-green-500/50 text-green-100 relative"
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 shrink-0">
        <CircleCheck size={18} className="text-green-300" data-testid="circle-check-icon" />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="opacity-50 hover:opacity-100"
      >
        <X size={14} />
      </button>
      {/* Efeito visual subtil para confete - pode ser melhorado mais tarde */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500 opacity-20 animate-ping absolute"></div>
        </div>
      </div>
    </div>
  );
};

export default SuccessToast;
