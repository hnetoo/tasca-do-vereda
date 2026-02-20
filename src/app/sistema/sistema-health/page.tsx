'use client';

import React from 'react';
import { SystemCard } from '@/components/SystemCard';
import { Activity, Bug, HardDrive, Cpu } from 'lucide-react';

export default function SistemaHealthPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SystemCard
        title="Diagnóstico do Sistema"
        description="Execute verificações automáticas para identificar problemas."
        icon={Activity}
        href="/sistema/sistema-health/diagnostico"
        color="blue"
      />
      <SystemCard
        title="Logs de Erro"
        description="Visualize o histórico de erros e exceções do sistema."
        icon={Bug}
        href="/sistema/sistema-health/logs"
        color="red"
      />
      <SystemCard
        title="Recursos do Sistema"
        description="Monitore o uso de memória, disco e performance."
        icon={Cpu}
        href="/sistema/sistema-health/recursos"
        color="emerald"
      />
      <SystemCard
        title="Integridade da Base de Dados"
        description="Verifique e repare inconsistências na base de dados local."
        icon={HardDrive}
        href="/sistema/sistema-health/database"
        color="amber"
      />
    </div>
  );
}
