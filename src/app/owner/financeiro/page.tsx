'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getTodayRevenue, getTodayExpenses, getLatestTransactions } from '@/app/actions/finance-dashboard';
import { formatKz } from '@/services/utils/currencyFormatter';
import { RefreshCcw, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

export default function FinanceiroPage() {
  const [revenue, setRevenue] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [rev, exp, txs] = await Promise.all([
        getTodayRevenue(),
        getTodayExpenses(),
        getLatestTransactions()
      ]);
      setRevenue(rev);
      setExpenses(exp);
      setTransactions(txs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3 * 60 * 1000); // 3 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  const profit = revenue - expenses;
  const isProfitNegative = profit < 0;

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Painel Financeiro</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Atualizado às {formatDateInLuanda(lastUpdated, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <button 
            onClick={fetchData} 
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="Atualizar agora"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total de Vendas (Hoje)</p>
              <h3 className="text-2xl font-bold text-green-600">
                {formatKz(revenue)}
              </h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total de Custos (Hoje)</p>
              <h3 className="text-2xl font-bold text-red-600">
                {formatKz(expenses)}
              </h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${isProfitNegative ? 'border-red-500' : 'border-blue-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Lucro Líquido</p>
              <h3 className={`text-2xl font-bold ${isProfitNegative ? 'text-red-600' : 'text-blue-600'}`}>
                {formatKz(profit)}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${isProfitNegative ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Wallet size={20} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Últimas Transações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Descrição</th>
                <th className="p-4 font-medium">Método</th>
                <th className="p-4 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && transactions.length === 0 ? (
                 <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    A carregar dados...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800 font-medium">{tx.description || 'Sem descrição'}</td>
                    <td className="p-4 text-gray-600">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 font-medium">
                        {tx.payment_method || tx.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatKz(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
