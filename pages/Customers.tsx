
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Users, Phone, Calendar, Wallet, Printer, CheckCircle, X, Plus, Pencil, Trash2 } from 'lucide-react';
import { Customer } from '../types';
import ExportButton from '../components/ExportButton';

const Customers = () => {
  const { customers, settleCustomerDebt, addCustomer, updateCustomer, removeCustomer, currentUser, settings, addNotification } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ id: string, name: string, debt: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  
  // Customer Edit/Create State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
      /* Fix: Added missing nif to form state */
      name: '', phone: '', nif: '', points: 0, balance: 0
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

  const getExportConfig = () => {
    return {
      data: filteredCustomers.map(c => ({
        name: c.name,
        phone: c.phone,
        nif: c.nif || 'N/A',
        visits: c.visits,
        points: c.points,
        balance: formatKz(c.balance),
        status: c.balance > 0 ? 'Devedor' : 'Regular'
      })),
      columns: [
        { header: 'Nome', dataKey: 'name' },
        { header: 'Telefone', dataKey: 'phone' },
        { header: 'NIF', dataKey: 'nif' },
        { header: 'Visitas', dataKey: 'visits' },
        { header: 'Pontos', dataKey: 'points' },
        { header: 'Saldo', dataKey: 'balance' },
        { header: 'Estado', dataKey: 'status' }
      ],
      fileName: `relatorio_clientes_${new Date().toISOString().split('T')[0]}`,
      title: 'Relatório de Clientes e Dívidas'
    };
  };

  const printViaIframe = (html: string) => {
    // Remove script tags that might try to self-print/close to avoid conflicts
    const cleanHtml = html.replace(/<script>[\s\S]*?window\.print[\s\S]*?<\/script>/gi, '');
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(cleanHtml);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 500);
    }
  };

  const handleOpenCustomerModal = (customer?: Customer) => {
      if (customer) {
          setEditingCustomer(customer);
          setCustomerForm(customer);
      } else {
          setEditingCustomer(null);
          /* Fix: Reset form with nif */
          setCustomerForm({ name: '', phone: '', nif: '', points: 0, balance: 0 });
      }
      setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
      e.preventDefault();
      if (!customerForm.name || !customerForm.phone) return;

      if (editingCustomer) {
          /* Fix: Cast after ensuring required fields in state */
          updateCustomer({
              ...editingCustomer,
              name: customerForm.name,
              phone: customerForm.phone,
              nif: customerForm.nif || editingCustomer.nif || '999999999',
              balance: Number(customerForm.balance || 0),
              points: Number(customerForm.points || 0)
          } as Customer);
      } else {
          /* Fix: Added missing nif to addCustomer call */
          addCustomer({
              id: `cust-${Date.now()}`,
              name: customerForm.name,
              phone: customerForm.phone,
              nif: customerForm.nif || '999999999',
              points: Number(customerForm.points || 0),
              balance: Number(customerForm.balance || 0),
              visits: 0,
              lastVisit: new Date()
          });
      }
      setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomer = (id: string) => {
      if (window.confirm("Tem certeza que deseja remover este cliente?")) {
          removeCustomer(id);
      }
  };

  const handlePayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentModal && paymentAmount) {
      settleCustomerDebt(paymentModal.id, Number(paymentAmount));
      addNotification('success', 'Pagamento registrado com sucesso');
      
      // Perguntar se deseja imprimir recibo
      if (window.confirm("Deseja imprimir o recibo do pagamento?")) {
        handlePrintStatement({ 
            ...customers.find(c => c.id === paymentModal.id)!,
            balance: customers.find(c => c.id === paymentModal.id)!.balance - Number(paymentAmount) // Simulate new balance
        });
      }

      setPaymentModal(null);
      setPaymentAmount('');
    }
  };
  
  const handlePrintStatement = (customer: Customer) => {
    const printContent = `
      <html>
        <head>
          <title>Extrato - ${customer.name}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; font-size: 12px; color: #000; }
            .header { text-align: center; margin-bottom: 15px; }
            .restaurant-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
            .info { font-size: 10px; color: #333; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .title { text-align: center; font-weight: bold; margin: 10px 0; font-size: 14px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { font-weight: bold; }
            .total-row { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin-top: 10px; font-size: 14px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            @media print {
              body { width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">${settings.restaurantName}</div>
            <div class="info">${settings.address}</div>
            <div class="info">${settings.phone}</div>
          </div>
          
          <div class="divider"></div>
          <div class="title">EXTRATO DE CONTA CORRENTE</div>
          <div class="divider"></div>
          
          <div class="row"><span class="label">CLIENTE:</span> <span>${customer.name}</span></div>
          <div class="row"><span class="label">TELEFONE:</span> <span>${customer.phone}</span></div>
          <div class="row"><span class="label">EMISSÃO:</span> <span>${new Date().toLocaleString('pt-AO')}</span></div>
          
          <div class="divider"></div>
          
          <div class="row"><span class="label">Pontos Fidelidade:</span> <span>${customer.points}</span></div>
          <div class="row"><span class="label">Total Visitas:</span> <span>${customer.visits}</span></div>
          
          <div class="row total-row">
            <span>SALDO DEVEDOR:</span>
            <span>${formatKz(customer.balance)}</span>
          </div>
          
          <div class="footer">
            <p>Documento informativo sem valor fiscal.</p>
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `;
    
    printViaIframe(printContent);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
       <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Clientes</h2>
          <p className="text-gray-500">Gerencie contas correntes e histórico de fidelidade</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative">
                <input 
                    type="text"
                    placeholder="Buscar cliente..."
                    className="pl-4 pr-10 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Users className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <ExportButton {...getExportConfig()} />
            <button 
                onClick={() => handleOpenCustomerModal()}
                className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:bg-orange-800 transition-colors"
            >
                <Plus size={20} />
                Novo Cliente
            </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Visitas / Pontos</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Dívida (Conta Corrente)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-gray-800">{customer.name}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <Phone size={12} />
                                {customer.phone}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                             <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <span className="block font-bold text-gray-700">{customer.visits}</span>
                                    <span className="text-[10px] text-gray-400 uppercase">Visitas</span>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div className="text-center">
                                    <span className="block font-bold text-primary">{customer.points}</span>
                                    <span className="text-[10px] text-gray-400 uppercase">Pontos</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                <Calendar size={12} />
                                Última: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A'}
                             </div>
                        </td>
                        <td className="px-6 py-4">
                            {customer.balance > 0 ? (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg w-fit">
                                    <Wallet size={16} />
                                    <span className="font-bold">{formatKz(customer.balance)}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg w-fit">
                                    <CheckCircle size={16} />
                                    <span className="font-bold text-sm">Regularizado</span>
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                {customer.balance > 0 && (
                                    <button 
                                        onClick={() => setPaymentModal({ id: customer.id, name: customer.name, debt: customer.balance })}
                                        className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow hover:bg-orange-800 transition-colors"
                                    >
                                        Pagar
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleOpenCustomerModal(customer)}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                                    title="Editar Cliente"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button 
                                    onClick={() => handlePrintStatement(customer)}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                                    title="Imprimir Extrato"
                                >
                                    <Printer size={18} />
                                </button>
                                {currentUser?.role === 'ADMIN' && (
                                    <button 
                                        onClick={() => handleDeleteCustomer(customer.id)}
                                        className="p-2 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        title="Remover Cliente"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Create/Edit Customer Modal */}
      {isCustomerModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                    </h3>
                    <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSaveCustomer} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nome Completo</label>
                        <input 
                            required
                            type="text"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={customerForm.name}
                            onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Telefone</label>
                        <input 
                            required
                            type="tel"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={customerForm.phone}
                            onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                        />
                    </div>
                    {/* Fix: Added NIF input field to support mandatory property */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">NIF</label>
                        <input 
                            type="text"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={customerForm.nif}
                            onChange={(e) => setCustomerForm({...customerForm, nif: e.target.value})}
                            placeholder="999999999"
                        />
                    </div>
                    {currentUser?.role === 'ADMIN' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Saldo Inicial</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none text-sm"
                                    value={customerForm.balance}
                                    onChange={(e) => setCustomerForm({...customerForm, balance: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Pontos Iniciais</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none text-sm"
                                    value={customerForm.points}
                                    onChange={(e) => setCustomerForm({...customerForm, points: Number(e.target.value)})}
                                />
                            </div>
                            <p className="col-span-2 text-[10px] text-gray-400 text-center">Ajuste manual (Apenas Admin)</p>
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-orange-800 transition-colors mt-4"
                    >
                        {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                    </button>
                </form>
            </div>
          </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Receber Pagamento</h3>
                    <button onClick={() => setPaymentModal(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="mb-6 bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-bold text-gray-800">{paymentModal.name}</p>
                    <div className="mt-2 flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-500">Total em Dívida</span>
                        <span className="font-bold text-red-600">{formatKz(paymentModal.debt)}</span>
                    </div>
                </div>

                <form onSubmit={handlePayDebt}>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Valor a Pagar</label>
                    <input 
                        required
                        autoFocus
                        type="number"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-bold mb-6"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                    
                    <button 
                        type="submit"
                        className="w-full py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 transition-colors"
                    >
                        Confirmar Pagamento
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
