'use client';

import React from 'react';
import Card from '../../../components/Card';
import { Settings, Users, Activity } from 'lucide-react';

const SistemaGeralPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold text-primary mb-8">Configurações Gerais do Sistema</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
        <Card
          title="Configurações Básicas"
          description="Ajuste as configurações fundamentais do sistema."
          icon={<Settings size={48} />}
          href="/sistema/geral/basicas"
        />
        <Card
          title="Preferências de Usuário"
          description="Gerencie as preferências de exibição e comportamento."
          icon={<Users size={48} />}
          href="/sistema/geral/preferencias"
        />
        <Card
          title="Logs do Sistema"
          description="Visualize os registros de atividades e eventos."
          icon={<Activity size={48} />}
          href="/sistema/geral/logs"
        />
      </div>
    </div>
  );
};

export default SistemaGeralPage;
