'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export function useTableInspector() {
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const inspectTable = async () => {
      try {
        console.log('🔍 Inspecionando estrutura real da tabela restaurant_tables...');
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Buscar uma linha só para ver as colunas
        const { data, error } = await supabase
          .from('restaurant_tables')
          .select('*')
          .limit(1);

        if (error) {
          console.error('❌ Erro ao inspecionar tabela:', error);
          setError(error.message);
          return;
        }

        if (data && data.length > 0) {
          const realColumns = Object.keys(data[0]);
          console.log('🎯 COLUNAS REAIS:', realColumns);
          console.log('🎯 DADOS EXEMPLO:', data[0]);
          
          setColumns(realColumns);
        } else {
          console.log('⚠️ Tabela vazia, tentando descobrir estrutura...');
          // Se não há dados, tentar uma query vazia para ver a estrutura
          const { data: emptyData, error: emptyError } = await supabase
            .from('restaurant_tables')
            .select('*')
            .eq('id', 'non-existent-id');

          if (emptyError) {
            console.log('📋 Erro da query (pode mostrar estrutura):', emptyError);
          }
        }
      } catch (err) {
        console.error('❌ Erro ao inspecionar:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    inspectTable();
  }, []);

  return { columns, loading, error };
}
