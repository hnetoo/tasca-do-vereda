import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, TrendingUp, Users, X } from 'lucide-react';

interface SmartRecommendation {
  dish: any;
  reason: string;
  score: number;
  icon: string;
}

export const SmartRecommendations: React.FC<{ tableId?: number }> = ({ tableId }) => {
  const { menu, activeOrders, customers, addToOrder, currentUser, addNotification } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const recommendations = useMemo<SmartRecommendation[]>(() => {
    if (!menu.length) return [];

    const currentOrder = activeOrders.find(o => o.tableId === tableId && o.status === 'ABERTO');
    const orderedDishIds = new Set(currentOrder?.items.map(i => i.dishId) || []);

    // Filtro: remover pratos já pedidos
    const availableDishes = menu.filter(d => !orderedDishIds.has(d.id));

    // 1. Scoring por popularidade
    const popularity: Record<string, number> = {};
    activeOrders
      .filter(o => o.status === 'FECHADO')
      .forEach(o => {
        o.items.forEach(item => {
          popularity[item.dishId] = (popularity[item.dishId] || 0) + item.quantity;
        });
      });

    // 2. Cross-sell baseado em pedidos anteriores semelhantes
    const crossSellScores: Record<string, number> = {};
    if (currentOrder?.items.length) {
      activeOrders
        .filter(o => o.status === 'FECHADO' && o.id !== currentOrder.id)
        .forEach(order => {
          const hasCommonItems = order.items.some(oi =>
            currentOrder.items.some(ci => ci.dishId === oi.dishId)
          );
          if (hasCommonItems) {
            order.items.forEach(item => {
              if (!orderedDishIds.has(item.dishId)) {
                crossSellScores[item.dishId] = (crossSellScores[item.dishId] || 0) + 1;
              }
            });
          }
        });
    }

    const recommendations = availableDishes
      .map(dish => {
        let score = 0;
        let reason = '';
        let icon = '⭐';

        const popularityScore = (popularity[dish.id] || 0) / 10;
        const crossSellScore = (crossSellScores[dish.id] || 0) / 5;

        if (crossSellScore > 0) {
          score = Math.min(100, crossSellScore * 50);
          reason = 'Frequentemente peço com estes itens';
          icon = '🔗';
        } else if (popularityScore > 2) {
          score = Math.min(100, popularityScore * 20);
          reason = 'Muito popular agora';
          icon = '🔥';
        } else if (popularityScore > 0.5) {
          score = Math.min(100, popularityScore * 15);
          reason = 'Tendência em alta';
          icon = '📈';
        }

        return { dish, reason, score: Math.round(score), icon };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return recommendations;
  }, [menu, activeOrders, tableId]);

  if (!isOpen || recommendations.length === 0) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl hover:scale-110 transition-all flex items-center justify-center group"
        title="Recomendações Inteligentes"
      >
        <Sparkles size={24} className="group-hover:animate-spin" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-96 glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Sparkles size={20} className="text-purple-400" /> Recomendações
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div
            key={rec.dish.id}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-purple-500/30 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{rec.dish.name}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <span>{rec.icon}</span>
                  {rec.reason}
                </p>
              </div>
              <div className="text-right ml-2">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-8 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${rec.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-400">{rec.score}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (tableId) {
                  addToOrder(tableId, rec.dish, 1);
                  addNotification('success', `${rec.dish.name} adicionado!`);
                }
              }}
              className="w-full py-1.5 px-2 rounded-lg bg-purple-600 text-white text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
            >
              + Adicionar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <p className="text-xs text-purple-200 text-center font-bold">
          💡 Dica: Nossas sugestões aprendem dos seus pedidos
        </p>
      </div>
    </div>
  );
};

export default SmartRecommendations;
