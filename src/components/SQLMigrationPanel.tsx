import React from 'react';
import { Database } from 'lucide-react';

const SQLMigrationPanel = () => {
  return (
    <div className="p-4 border border-slate-700 bg-slate-800 rounded-lg text-slate-300 mt-8">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
        <Database size={20} />
        Painel de Migração SQL
      </h3>
      <p>Ferramentas de migração e manutenção de base de dados.</p>
      <div className="mt-4 p-3 bg-slate-900 rounded text-sm font-mono text-yellow-500">
        Status: Sistema Operacional (SQLite/Tauri Store)
      </div>
    </div>
  );
};

export default SQLMigrationPanel;
