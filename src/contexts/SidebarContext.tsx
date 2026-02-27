'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isMainSidebarHidden: boolean;
  toggleMainSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isMainSidebarHidden: false, toggleMainSidebar: () => {} }; // Default seguro
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isMainSidebarHidden, setMainSidebarHidden] = useState(false);

  const toggleMainSidebar = () => {
    setMainSidebarHidden(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{
      isMainSidebarHidden,
      toggleMainSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
