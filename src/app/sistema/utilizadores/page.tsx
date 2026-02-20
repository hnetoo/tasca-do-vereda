'use client';

import React from 'react';
import { SystemCard } from '@/components/SystemCard';
import { Users, UserCog, KeyRound, Shield } from 'lucide-react';

export default function SistemaUtilizadoresPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SystemCard
        title="Gestão de Utilizadores"
        description="Adicione, remova ou edite contas de utilizadores do sistema."
        icon={Users}
        href="/sistema/utilizadores/lista"
        color="blue"
      />
      <SystemCard
        title="Perfis e Permissões"
        description="Defina o que cada tipo de utilizador pode fazer no sistema."
        icon={Shield}
        href="/sistema/utilizadores/permissoes"
        color="emerald"
      />
      <SystemCard
        title="Códigos de Acesso"
        description="Gerencie PINs e códigos de acesso rápido para o POS."
        icon={KeyRound}
        href="/sistema/utilizadores/acessos"
        color="amber"
      />
      <SystemCard
        title="Log de Atividades"
        description="Veja quem fez o quê e quando no sistema."
        icon={UserCog}
        href="/sistema/utilizadores/logs"
        color="slate"
      />
    </div>
  );
}
