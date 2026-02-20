'use client';

import React from 'react';
import { SystemCard } from '@/components/SystemCard';
import { FileText, Percent, BadgeCheck, ShieldAlert } from 'lucide-react';

export default function SistemaFiscalPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SystemCard
        title="Certificação AGT"
        description="Gerencie o certificado digital e a comunicação com a AGT."
        icon={BadgeCheck}
        href="/sistema/fiscal/agt"
        color="blue"
      />
      <SystemCard
        title="Taxas e Impostos"
        description="Configure as taxas de IVA e outros impostos aplicáveis."
        icon={Percent}
        href="/sistema/fiscal/impostos"
        color="emerald"
      />
      <SystemCard
        title="Relatórios Fiscais"
        description="Gere ficheiros SAF-T e outros relatórios obrigatórios."
        icon={FileText}
        href="/sistema/fiscal/relatorios"
        color="amber"
      />
      <SystemCard
        title="Auditoria Fiscal"
        description="Verifique a integridade das sequências de documentos e assinaturas."
        icon={ShieldAlert}
        href="/sistema/fiscal/auditoria"
        color="red"
      />
    </div>
  );
}
