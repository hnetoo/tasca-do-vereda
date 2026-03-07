import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Interface genérica para os dados do gráfico
export interface ChartDataItem {
  name: string; // Rótulo do eixo X (e.g., '10h', 'Seg')
  [key: string]: string | number; // Permite outras chaves, como 'Vendas'
}

interface HourlySalesChartProps {
  data: ChartDataItem[];
  dataKey: string; // A chave para os valores do eixo Y (e.g., "Vendas")
}

// Formata valores grandes para o eixo Y (ex: 10000 -> 10k)
const formatCurrencyForAxis = (value: any) => {
  const num = Number(value);
  if (isNaN(num)) return '';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${Math.round(num / 1000)}k`;
  }
  return num.toString();
};

// Tooltip customizado para mostrar a moeda corretamente
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = Number(payload[0].value);
    const formattedValue = new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);

    return (
      <div className="bg-white/90 backdrop-blur-sm p-2 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-bold text-gray-800">{`${label}`}</p>
        <p className="text-blue-600 font-semibold">{`Total: ${formattedValue}`}</p>
      </div>
    );
  }
  return null;
};

const HourlySalesChart: React.FC<HourlySalesChartProps> = ({ data, dataKey }) => {
  // Não renderizar o gráfico se não houver dados de vendas
  if (!data || data.length === 0 || data.every(d => d[dataKey] === 0)) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg text-sm text-gray-400">
        Sem dados para o período selecionado.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis 
            tickFormatter={formatCurrencyForAxis} 
            tick={{ fontSize: 10, fill: '#6b7280' }} 
            axisLine={false} tickLine={false} width={40} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.7)' }} />
          <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0] as [number, number, number, number]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlySalesChart;