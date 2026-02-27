'use client';

import React from 'react';
import { Menu, X } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

const SidebarToggle = () => {
  const { isMainSidebarHidden, toggleMainSidebar } = useSidebar();

  return (
    <button
      onClick={toggleMainSidebar}
      className={`fixed top-4 left-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
        isMainSidebarHidden 
          ? 'bg-primary text-black shadow-lg shadow-primary/30 hover:scale-110' 
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
      }`}
      title={isMainSidebarHidden ? 'Mostrar Menu' : 'Esconder Menu'}
    >
      {isMainSidebarHidden ? <Menu size={20} /> : <X size={20} />}
    </button>
  );
};

export default SidebarToggle;
