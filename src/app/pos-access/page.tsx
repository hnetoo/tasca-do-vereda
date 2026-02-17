'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import POSAccessManagement from '@/components/POSAccessManagement';

export default function POSAccessPage() {
  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-900 text-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-red-500/10 rounded-xl">
          <Lock size={32} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Acesso POS</h1>
          <p className="text-slate-400">Controlo de acesso e segurança dos terminais</p>
        </div>
      </div>

      <div className="grid gap-6">
        <POSAccessManagement />
      </div>
    </div>
  );
}
