import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Order, PaymentMethod, AuditLog } from '../types';
import { CheckCircle, Edit, History, XCircle, ChevronDown } from 'lucide-react';

const PaymentCorrectionDashboard = () => {
  const { activeOrders, correctPayment, auditLogs, addNotification } = useStore();
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod | ''>('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedOrderHistory, setSelectedOrderHistory] = useState<AuditLog[]>([]);

  const ordersNeedingCorrection = useMemo(() => {
    return activeOrders.filter(order => order.status === 'FECHADO' || order.status === 'PAGO');
  }, [activeOrders]);

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleOpenCorrectionModal = (order: Order) => {
    setSelectedOrder(order);
    setNewPaymentMethod(order.paymentMethod || ''); 
    setCorrectionReason('');
    setIsCorrectionModalOpen(true);
  };

  const handleSaveCorrection = async () => {
    if (!selectedOrder || !newPaymentMethod || !correctionReason) {
      addNotification('error', 'Por favor, preencha todos os campos para a correção.');
      return;
    }

    if (selectedOrder.paymentMethod === newPaymentMethod) {
      addNotification('info', 'O novo método de pagamento é o mesmo que o atual. Nenhuma alteração será feita.');
      setIsCorrectionModalOpen(false);
      return;
    }

    try {
      // Criar a estrutura de novos pagamentos (mesmo sendo um único método nesta interface)
      const newPayments = [{
        id: `corr-item-${Date.now()}`,
        method: newPaymentMethod,
        amount: selectedOrder.total,
        timestamp: new Date()
      }];

      const success = await correctPayment(selectedOrder.id, newPayments, correctionReason);
      
      if (success) {
        setIsCorrectionModalOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      addNotification('error', `Erro ao atualizar método de pagamento: ${(error as Error).message}`);
    }
  };

  const handleViewHistory = (orderId: string) => {
    const history = auditLogs.filter(log => 
      log.action === 'PAYMENT_METHOD_CHANGED' && 
      log.metadata?.orderId === orderId
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setSelectedOrderHistory(history);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="p-6 bg-background text-slate-200">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Edit size={24} className="text-primary" /> Gestão de Correção de Pagamentos
      </h3>
      <p className="text-slate-400 mb-8">
        Visualize e corrija métodos de pagamento para pedidos já finalizados. Todas as alterações são registadas para auditoria.
      </p>

      <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="p-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Pedido #</th>
                <th className="p-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Mesa</th>
                <th className="p-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Total</th>
                <th className="p-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Método Atual</th>
                <th className="p-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Data Fecho</th>
                <th className="p-4 text-slate-400 font-bold text-xs uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordersNeedingCorrection.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-8">
                    Nenhum pedido finalizado encontrado que possa necessitar de correção.
                  </td>
                </tr>
              ) : (
                ordersNeedingCorrection.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors border-t border-white/5">
                    <td className="p-4 font-bold text-white">{order.invoiceNumber || order.id.substring(0, 8)}</td>
                    <td className="p-4 text-slate-300">{order.tableId}</td>
                    <td className="p-4 font-mono text-primary">{formatKz(order.total)}</td>
                    <td className="p-4 text-slate-300">{order.paymentMethod || 'N/A'}</td>
                    <td className="p-4 text-slate-300">
                      {order.timestamp ? formatDate(order.timestamp) : 'N/A'}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenCorrectionModal(order)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-bold transition-all"
                      >
                        <Edit size={14} /> Corrigir
                      </button>
                      <button 
                        onClick={() => handleViewHistory(order.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-bold transition-all"
                      >
                        <History size={14} /> Histórico
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-slate-800 text-white border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">Corrigir Pagamento</h2>
            <p className="text-slate-400 text-sm mb-6">
              Altere o método de pagamento para o pedido #{selectedOrder?.invoiceNumber || selectedOrder?.id?.substring(0, 8)}.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Método Atual</label>
                <input
                  type="text"
                  value={selectedOrder?.paymentMethod || 'N/A'}
                  className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-2.5 text-white opacity-60"
                  readOnly
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Novo Método</label>
                <div className="relative">
                  <select 
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-2.5 text-white appearance-none focus:border-primary outline-none transition-all"
                  >
                    <option value="" disabled>Selecione o novo método</option>
                    <option value="NUMERARIO">Numerário</option>
                    <option value="TPA">TPA</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="QR_CODE">QR Code</option>
                    <option value="CONTA_CORRENTE">Conta Corrente</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Razão</label>
                <textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-2.5 text-white min-h-[100px] focus:border-primary outline-none transition-all"
                  placeholder="Descreva o motivo da correção (ex: Cliente pediu para mudar de TPA para Numerário)"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setIsCorrectionModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveCorrection}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-black font-bold hover:brightness-110 shadow-glow transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-slate-800 text-white border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Histórico de Alterações</h2>
                <p className="text-slate-400 text-sm">
                  Registos de todas as alterações de método de pagamento para este pedido.
                </p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-slate-400">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedOrderHistory.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Nenhum histórico de alteração encontrado para este pedido.</p>
              ) : (
                <div className="space-y-4">
                  {selectedOrderHistory.map((log) => (
                    <div key={log.id} className="bg-slate-700/50 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-white">
                          {formatDate(log.timestamp)}
                        </p>
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                          {log.metadata?.userName || 'Desconhecido'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-400 line-through">{log.metadata?.oldMethod}</span>
                        <span className="text-primary font-bold">→</span>
                        <span className="text-white font-bold">{log.metadata?.newMethod}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-2 italic">Razão: {log.metadata?.reason || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCorrectionDashboard;
