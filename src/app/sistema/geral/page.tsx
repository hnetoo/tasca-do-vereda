'use client';

import React from 'react';
import { SystemCard } from '@/components/SystemCard';
import { Settings, Printer, Save, Globe } from 'lucide-react';

export default function SistemaGeralPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SystemCard
        title="Configurações Básicas"
        description="Defina o nome do restaurante, NIF, endereço e contatos principais."
        icon={Settings}
        href="/sistema/geral/basico"
        color="blue"
      />
      <SystemCard
        title="Impressoras e Hardware"
        description="Configure impressoras de talões, gavetas de dinheiro e outros dispositivos."
        icon={Printer}
        href="/sistema/geral/impressoras"
        color="emerald"
      />
      <SystemCard
        title="Backup e Dados"
        description="Gerencie backups locais, restauração de dados e limpeza do sistema."
        icon={Save}
        href="/sistema/geral/backup"
        color="amber"
      />
      <SystemCard
        title="Idioma e Região"
        description="Ajuste o idioma do sistema, fuso horário e formatos de data."
        icon={Globe}
        href="/sistema/geral/regiao"
        color="purple"
      />
    </div>
  );
}
