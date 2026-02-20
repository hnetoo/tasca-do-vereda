'use client';

import React from 'react';
import { SystemCard } from '@/components/SystemCard';
import { Cloud, RefreshCw, Database, Radio } from 'lucide-react';

export default function SistemaNuvemPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SystemCard
        title="Configuração Supabase"
        description="Conecte sua aplicação ao Supabase para sincronização em tempo real."
        icon={Database}
        href="/sistema/nuvem/configuracao"
        color="blue"
      />
      <SystemCard
        title="Status de Sincronização"
        description="Monitore o estado da sincronização de dados entre dispositivos."
        icon={RefreshCw}
        href="/sistema/nuvem/sync"
        color="emerald"
      />
      <SystemCard
        title="Backup na Nuvem"
        description="Configure backups automáticos para a nuvem."
        icon={Cloud}
        href="/sistema/nuvem/backup"
        color="amber"
      />
       <SystemCard
        title="Conectividade"
        description="Teste a conexão com os serviços remotos e latência."
        icon={Radio}
        href="/sistema/nuvem/conectividade"
        color="purple"
      />
    </div>
  );
}
