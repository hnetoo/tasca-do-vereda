'use client';

import React from 'react';
import { OwnerTabs } from '@/components/OwnerTabs';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <div className="p-8 pb-0">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Área do Proprietário</h1>
        <p className="text-slate-400 mb-8">Gestão completa e análise do restaurante</p>
        <OwnerTabs />
      </div>
      <div className="flex-1 p-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
}
