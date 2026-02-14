import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Trash2, X, 
  CalendarClock, 
  Receipt, Briefcase, LayoutDashboard, History, PiggyBank, Edit2,
  FileText, UserCircle, CheckCircle, Calculator, CheckCircle2
} from 'lucide-react';
import ExportButton from '../components/ExportButton';
import { PaymentMethod, Expense, PayrollRecord, Employee } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { exportChartToPDF } from '../services/exportService';

type FinanceTab = 'OVERVIEW' | 'SHIFTS' | 'EXPENSES' | 'FIXED' | 'SALARIES' | 'PAYROLL' | 'PAYMENT_CORRECTION';

interface SalaryData {
  employee: Employee;
  stats: {
    totalWorkDays: number;
    totalHours: number;
    totalOvertime: number;
    totalLateMinutes: number;
    absences: number;
  };
  calc: {
    overtimeBonus: number;
    latenessDeduction: number;
    absenceDeduction: number;
    netSalary: number;
  };
  salary: number;
  isPaid: boolean;
}

const Finance = () => {
  const { 
    activeOrders, shifts, expenses, fixedExpenses, employees, attendance, payroll, revenues,
    addExpense, updateExpense, removeExpense,
    removeFixedExpense,
    addNotification, processPayroll, markPayrollAsPaid,
    getDailySalesAnalytics
  } = useStore();

  const dailyAnalytics = getDailySalesAnalytics(1);
  const todayProfit = dailyAnalytics.length > 0 ? dailyAnalytics[0].totalProfit : 0;

  const [activeTab, setActiveTab] = useState<FinanceTab>('OVERVIEW');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    description: '', amount: 0, category: 'OUTROS', date: new Date()
  });

  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedEmpSalary, setSelectedEmpSalary] = useState<SalaryData | null>(null);

  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<PayrollRecord | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [paymentPeriod, setPaymentPeriod] = useState<'DIA' | 'SEMANA' | 'MES' | 'ANO'>('SEMANA');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentMetric, setPaymentMetric] = useState<'VENDAS' | 'LUCRO'>('VENDAS');
  const paymentChartRef = useRef<HTMLDivElement | null>(null);

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  const paymentMethods: PaymentMethod[] = ['NUMERARIO', 'TPA', 'TRANSFERENCIA', 'QR_CODE', 'CONTA_CORRENTE'];
  const paymentLabels: Record<PaymentMethod, string> = {
    NUMERARIO: 'Numerário',
    TPA: 'Cartão',
    TRANSFERENCIA: 'Transferência',
    QR_CODE: 'QR Code',
    CONTA_CORRENTE: 'Conta Corrente',
    MBWAY: 'MBWay',
    OUTROS: 'Outros',
    Cash: 'Dinheiro',
    Card: 'Cartão',
    MBWay: 'MBWay',
    Other: 'Outros'
  };

  const getOrderDate = (timestamp?: string | number | Date) => {
    const d = timestamp ? new Date(timestamp) : new Date(0);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const buildDateRange = (start: Date, end: Date) => {
    const dates: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const extractPayments = (order: typeof activeOrders[number]) => {
    if (order.splitPayments && order.splitPayments.length > 0) {
      return order.splitPayments.map(p => ({ method: p.method, amount: p.amount }));
    }
    if (order.payments && order.payments.length > 0) {
      return order.payments.map(p => ({ method: p.method, amount: p.amount }));
    }
    if (order.paymentMethod) {
      return [{ method: order.paymentMethod, amount: order.total }];
    }
    return [];
  };

  const paymentDateRange = useMemo(() => {
    const today = normalizeDate(new Date());
    if (paymentPeriod === 'DIA') {
      return { start: today, end: today };
    }
    if (paymentPeriod === 'SEMANA') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start, end: today };
    }
    if (paymentPeriod === 'MES') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start, end };
    }
    const start = new Date(paymentYear, 0, 1);
    const end = new Date(paymentYear, 11, 31);
    return { start, end };
  }, [paymentPeriod, paymentYear]);

  const paymentDailyData = useMemo(() => {
    const closedOrders = activeOrders.filter(o => o.status === 'FECHADO' || o.status === 'PAGO');
    const { start, end } = paymentDateRange;
    const days = buildDateRange(start, end);
    const profitByDay = new Map<number, number>();
    days.forEach(date => {
      const dayKey = normalizeDate(date).getTime();
      const daySales = closedOrders.reduce((acc, order) => {
        const d = normalizeDate(getOrderDate(order.timestamp || order.createdAt || order.updatedAt));
        return d.getTime() === dayKey ? acc + order.total : acc;
      }, 0);
      const dayExpenses = (expenses || []).reduce((acc, exp) => {
        const d = normalizeDate(getOrderDate(exp.date));
        return d.getTime() === dayKey ? acc + exp.amount : acc;
      }, 0);
      const dayRevenues = (revenues || []).reduce((acc, rev) => {
        const d = normalizeDate(getOrderDate(rev.date));
        return d.getTime() === dayKey ? acc + rev.amount : acc;
      }, 0);
      profitByDay.set(dayKey, (daySales + dayRevenues) - dayExpenses);
    });

    return days.map(date => {
      const dayKey = normalizeDate(date).getTime();
      const salesByMethod: Record<PaymentMethod, number> = {
        NUMERARIO: 0,
        TPA: 0,
        TRANSFERENCIA: 0,
        QR_CODE: 0,
        CONTA_CORRENTE: 0,
        MBWAY: 0,
        OUTROS: 0,
        Cash: 0,
        Card: 0,
        MBWay: 0,
        Other: 0
      };
      closedOrders.forEach(order => {
        const orderDate = normalizeDate(getOrderDate(order.timestamp || order.createdAt || order.updatedAt));
        if (orderDate.getTime() !== dayKey) return;
        extractPayments(order).forEach(payment => {
          if (salesByMethod[payment.method] !== undefined) {
            salesByMethod[payment.method] += payment.amount;
          }
        });
      });
      const totalSales = paymentMethods.reduce((acc, method) => acc + salesByMethod[method], 0);
      const totalProfit = profitByDay.get(dayKey) || 0;
      const profitByMethod = paymentMethods.reduce((acc, method) => {
        const methodSales = salesByMethod[method];
        const allocated = totalSales > 0 ? (totalProfit * methodSales) / totalSales : 0;
        acc[method] = allocated;
        return acc;
      }, {} as Record<PaymentMethod, number>);
      const label = date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
      return {
        date,
        label,
        totalSales,
        totalProfit,
        salesByMethod,
        profitByMethod
      };
    });
  }, [activeOrders, expenses, revenues, paymentDateRange, paymentMethods]);

  const paymentChartData = useMemo(() => {
    return paymentDailyData.map(row => {
      const base: Record<string, number | string> = { name: row.label };
      paymentMethods.forEach(method => {
        base[method] = paymentMetric === 'VENDAS' ? row.salesByMethod[method] : row.profitByMethod[method];
      });
      return base;
    });
  }, [paymentDailyData, paymentMethods, paymentMetric]);

  const handleExportPayments = async () => {
    const periodLabel = paymentPeriod === 'ANO'
      ? `Ano ${paymentYear}`
      : paymentPeriod === 'MES'
      ? new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })
      : paymentPeriod === 'SEMANA'
      ? 'Últimos 7 dias'
      : 'Hoje';

    const data = paymentDailyData.map(row => {
      const entry: Record<string, unknown> = {
        data: row.date.toLocaleDateString('pt-AO'),
        total: formatKz(row.totalSales),
        lucro: formatKz(row.totalProfit)
      };
      paymentMethods.forEach(method => {
        entry[paymentLabels[method]] = formatKz(paymentMetric === 'VENDAS' ? row.salesByMethod[method] : row.profitByMethod[method]);
      });
      return entry;
    });

    const columns = [
      { header: 'Data', dataKey: 'data' },
      { header: 'Total', dataKey: 'total' },
      { header: 'Lucro', dataKey: 'lucro' },
      ...paymentMethods.map(method => ({ header: paymentLabels[method], dataKey: paymentLabels[method] }))
    ];

    await exportChartToPDF({
      fileName: `pagamentos_diarios_${new Date().toISOString().split('T')[0]}`,
      title: 'Pagamentos por Dia',
      subtitle: paymentMetric === 'VENDAS' ? 'Vendas por método' : 'Lucro bruto por método',
      periodLabel,
      columns,
      data,
      chartElement: paymentChartRef.current
    });
  };

  const salaryData = useMemo<SalaryData[]>(() => {
    if (!employees) return [];
    return employees.map(emp => {
      const monthAttendance = (attendance || []).filter(a => 
        a.employeeId === emp.id && 
        new Date(a.date).getMonth() === selectedMonth && 
        new Date(a.date).getFullYear() === selectedYear
      );

      const totalWorkDays = monthAttendance.length;
      const totalHours = monthAttendance.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
      const totalOvertime = monthAttendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
      const totalLateMinutes = monthAttendance.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);
      const absences = (emp.workDaysPerMonth || 22) - totalWorkDays;

      const dailyRate = (emp.salary || 0) / (emp.workDaysPerMonth || 22);
      const hourlyRate = dailyRate / (emp.dailyWorkHours || 8);

      const overtimeBonus = totalOvertime * hourlyRate * 1.5;
      const latenessDeduction = (totalLateMinutes / 60) * hourlyRate;
      const absenceDeduction = Math.max(0, absences) * dailyRate;

      const netSalary = (emp.salary || 0) + overtimeBonus - latenessDeduction - absenceDeduction;

      const isPaid = (expenses || []).some(exp => 
        exp.category === 'SALARIOS' && 
        exp.description.includes(emp.name) &&
        new Date(exp.date).getMonth() === selectedMonth &&
        new Date(exp.date).getFullYear() === selectedYear
      );

      return {
        employee: emp,
        stats: { totalWorkDays, totalHours, totalOvertime, totalLateMinutes, absences },
        calc: { overtimeBonus, latenessDeduction, absenceDeduction, netSalary },
        salary: emp.salary || 0,
        isPaid
      };
    });
  }, [employees, attendance, selectedMonth, selectedYear, expenses]);

  const totalSalariesPending = salaryData.reduce((acc, p) => acc + (p.isPaid ? 0 : (p.calc?.netSalary || 0)), 0);

  const filteredPayroll = useMemo(() => {
    if (!payroll) return [];
    return payroll.filter(p => {
      const matchMonth = p.month === selectedMonth && p.year === selectedYear;
      const matchPayment = paymentMethodFilter === 'ALL' || p.paymentMethod === paymentMethodFilter;
      return matchMonth && matchPayment;
    });
  }, [payroll, selectedMonth, selectedYear, paymentMethodFilter]);

  const totalPayrollAmount = filteredPayroll.reduce((sum, p) => sum + p.netSalary, 0);
  const pendingPayroll = filteredPayroll.filter(p => p.status !== 'PAID').length;

  const getExportConfig = () => {
    switch (activeTab) {
      case 'PAYROLL': {
        const data = filteredPayroll.map(p => ({
          ...p,
          employeeName: employees.find(e => e.id === p.employeeId)?.name || 'N/A',
          baseSalary: formatKz(p.baseSalary),
          netSalary: formatKz(p.netSalary),
          workRatio: `${p.workDays}/${p.totalWorkDays}`,
          overtime: `${p.overtimeHours}h`,
          status: p.status === 'PAID' ? 'Pago' : 'Pendente'
        }));
        return {
          data,
          columns: [
            { header: 'Funcionário', dataKey: 'employeeName' },
            { header: 'Base', dataKey: 'baseSalary' },
            { header: 'Dias', dataKey: 'workRatio' },
            { header: 'Extras', dataKey: 'overtime' },
            { header: 'Líquido', dataKey: 'netSalary' },
            { header: 'Status', dataKey: 'status' }
          ],
          fileName: `folha_pagamento_${selectedMonth+1}_${selectedYear}`,
          title: `Folha de Pagamento - ${selectedMonth+1}/${selectedYear}`
        };
      }
      case 'SALARIES': {
         const data = salaryData.map(s => ({
           name: s.employee.name,
           role: s.employee.role,
           baseSalary: formatKz(s.employee.salary),
           workedDays: s.stats.totalWorkDays,
           overtime: formatKz(s.calc.overtimeBonus),
           deductions: formatKz(s.calc.latenessDeduction + s.calc.absenceDeduction),
           netSalary: formatKz(s.calc.netSalary),
           status: s.isPaid ? 'Pago' : 'Pendente'
         }));
         return {
           data,
           columns: [
             { header: 'Nome', dataKey: 'name' },
             { header: 'Cargo', dataKey: 'role' },
             { header: 'Base', dataKey: 'baseSalary' },
             { header: 'Dias Trab.', dataKey: 'workedDays' },
             { header: 'Bônus Extra', dataKey: 'overtime' },
             { header: 'Deduções', dataKey: 'deductions' },
             { header: 'Líquido Est.', dataKey: 'netSalary' },
             { header: 'Status', dataKey: 'status' }
           ],
           fileName: `previsao_salarios_${selectedMonth+1}_${selectedYear}`,
           title: `Previsão de Salários - ${selectedMonth+1}/${selectedYear}`
         };
      }
      case 'EXPENSES': {
         const filteredExpenses = expenses.filter(e => 
           new Date(e.date).getMonth() === selectedMonth && 
           new Date(e.date).getFullYear() === selectedYear
         );
         const data = filteredExpenses.map(e => ({
           ...e,
           date: new Date(e.date).toLocaleDateString('pt-AO'),
           amount: formatKz(e.amount)
         }));
         return {
           data,
           columns: [
             { header: 'Data', dataKey: 'date' },
             { header: 'Descrição', dataKey: 'description' },
             { header: 'Categoria', dataKey: 'category' },
             { header: 'Valor', dataKey: 'amount' },
             { header: 'Responsável', dataKey: 'registeredBy' }
           ],
           fileName: `despesas_${selectedMonth+1}_${selectedYear}`,
           title: `Relatório de Despesas - ${selectedMonth+1}/${selectedYear}`
         };
      }
      case 'FIXED': {
         const data = fixedExpenses.map(f => ({
           ...f,
           amount: formatKz(f.amount),
           active: f.active ? 'Sim' : 'Não',
           day: f.dayOfMonth
         }));
         return {
           data,
           columns: [
             { header: 'Descrição', dataKey: 'description' },
             { header: 'Valor', dataKey: 'amount' },
             { header: 'Dia Venc.', dataKey: 'day' },
             { header: 'Categoria', dataKey: 'category' },
             { header: 'Ativo', dataKey: 'active' }
           ],
           fileName: 'despesas_fixas',
           title: 'Despesas Fixas'
         };
      }
      case 'SHIFTS': {
          const filteredShifts = shifts.filter(s => 
            new Date(s.startTime).getMonth() === selectedMonth &&
            new Date(s.startTime).getFullYear() === selectedYear
          );
          const data = filteredShifts.map(s => ({
            id: s.id,
            employee: s.userName,
            start: new Date(s.startTime).toLocaleString('pt-AO'),
            end: s.endTime ? new Date(s.endTime).toLocaleString('pt-AO') : 'Em aberto',
            initial: formatKz(s.openingBalance),
            final: s.closingBalance ? formatKz(s.closingBalance) : '-',
            diff: (s.closingBalance !== undefined && s.expectedBalance !== undefined) ? formatKz(s.closingBalance - s.expectedBalance) : '-'
          }));
          return {
            data,
            columns: [
              { header: 'Funcionário', dataKey: 'employee' },
              { header: 'Início', dataKey: 'start' },
              { header: 'Fim', dataKey: 'end' },
              { header: 'Fundo Caixa', dataKey: 'initial' },
              { header: 'Fecho', dataKey: 'final' },
              { header: 'Quebra/Sobra', dataKey: 'diff' }
            ],
            fileName: `caixas_${selectedMonth+1}_${selectedYear}`,
            title: `Relatório de Caixas - ${selectedMonth+1}/${selectedYear}`
          };
      }
      default:
        return { data: [], columns: [], fileName: 'financeiro', title: 'Relatório Financeiro' };
    }
  };

  const exportConfig = getExportConfig();

  const handleProcessSalary = (data: SalaryData) => {
    processPayroll(data.employee.id, selectedMonth, selectedYear, 'NUMERARIO');
    addNotification('success', `Salário de ${data.employee.name} processado com sucesso!`);
    setIsSalaryModalOpen(false);
  };

  const handleProcessAll = () => {
    const pending = salaryData.filter(p => !p.isPaid);
    if (pending.length === 0) return;
    
    if (window.confirm(`Deseja processar os salários de ${pending.length} funcionários pendentes? Total: ${formatKz(totalSalariesPending)}`)) {
      pending.forEach(p => {
        processPayroll(p.employee.id, selectedMonth, selectedYear, 'NUMERARIO');
      });
      addNotification('success', 'Toda a folha de salários foi processada!');
    }
  };

  const handleMarkAsPaid = (recordId: string) => {
    const record = payroll.find(p => p.id === recordId);
    if (!record) return;

    const employee = employees.find(e => e.id === record.employeeId);
    if (window.confirm(`Marcar salário de ${employee?.name} como pago?`)) {
      markPayrollAsPaid(recordId, new Date().toISOString());
      addNotification('success', `Pagamento de ${employee?.name} registado.`);
    }
  };

  const handleOpenExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm(expense);
    } else {
      setEditingExpense(null);
      setExpenseForm({ description: '', amount: 0, category: 'OUTROS', date: new Date() });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateExpense({ ...editingExpense, ...expenseForm } as Expense);
      addNotification('success', 'Gasto atualizado.');
    } else {
      addExpense({
        ...expenseForm,
        id: `exp-${Date.now()}`,
        date: new Date()
      } as Expense);
      addNotification('success', 'Gasto registado.');
    }
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-background text-slate-200 no-scrollbar">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 italic uppercase">
            <PiggyBank className="text-primary" /> Comando Financeiro
          </h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Gestão de Salários, Folha de Pagamento & Assiduidade Biométrica</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">

          <ExportButton {...exportConfig} />
          
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
             {[
               { id: 'OVERVIEW', label: 'Resumo', icon: LayoutDashboard },
               { id: 'PAYROLL', label: 'Folha de Pag.', icon: FileText },
               { id: 'SALARIES', label: 'Salários', icon: Briefcase },
               { id: 'EXPENSES', label: 'Gastos', icon: Receipt },
               { id: 'FIXED', label: 'Fixos', icon: CalendarClock },
               { id: 'SHIFTS', label: 'Caixas', icon: History },
               { id: 'PAYMENT_CORRECTION', label: 'Correção Pag.', icon: Edit2 }
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as FinanceTab)}
                 className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap
                   ${activeTab === tab.id ? 'bg-primary text-black shadow-glow' : 'text-slate-500 hover:text-slate-300'}
                 `}
               >
                 {(() => {
                  const Icon = tab.icon;
                  return <Icon size={16} />;
                })()} {tab.label}
               </button>
             ))}
          </div>
        </div>
      </header>

      {/* PAYROLL TAB */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-wrap justify-between items-center gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Período</p>
                <div className="flex gap-2">
                  <select className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:border-primary font-bold text-sm appearance-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                    {Array.from({length: 12}).map((_, i) => <option key={i} value={i} className="bg-slate-900">{new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(new Date(2025, i))}</option>)}
                  </select>
                  <select className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:border-primary font-bold text-sm appearance-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                    <option value={2025} className="bg-slate-900">2025</option>
                    <option value={2024} className="bg-slate-900">2024</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Método Pagamento</p>
                <select className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:border-primary font-bold text-sm appearance-none" value={paymentMethodFilter} onChange={e => setPaymentMethodFilter(e.target.value as PaymentMethod | 'ALL')}>
                  <option value="ALL" className="bg-slate-900">Todos</option>
                  <option value="NUMERARIO" className="bg-slate-900">Numerário</option>
                  <option value="TPA" className="bg-slate-900">TPA</option>
                  <option value="TRANSFERENCIA" className="bg-slate-900">Transferência</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Processado</p>
                <p className="text-2xl font-mono font-bold text-white">{formatKz(totalPayrollAmount)}</p>
                <p className="text-[10px] text-slate-500 mt-1">{pendingPayroll} registos pendentes</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[3rem] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-white/5">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Funcionário</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Base</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Dias</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Extras</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Líquido</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPayroll.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Sem registos de folha para este período</td>
                    </tr>
                  ) : (
                    filteredPayroll.map(record => {
                      const employee = employees.find(e => e.id === record.employeeId);
                      return (
                        <tr key={record.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: employee?.color || '#6366f1' }}>
                                {(employee?.name || '??').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{employee?.name || 'Funcionário Removido'}</p>
                                <p className="text-[10px] text-slate-500">{employee?.role || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-white font-bold">{formatKz(record.baseSalary)}</td>
                          <td className="px-6 py-4 text-white font-bold">{record.workDays}/{record.totalWorkDays}</td>
                          <td className="px-6 py-4 text-primary font-bold">{record.overtimeHours}h</td>
                          <td className="px-6 py-4 font-mono font-bold text-white text-lg">{formatKz(record.netSalary)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${record.status === 'PAID' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                              {record.status === 'PAID' ? '✓ Pago' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <button onClick={() => { setSelectedPayrollRecord(record); setIsPayrollModalOpen(true); }} className="px-3 py-1 bg-white/10 hover:bg-primary hover:text-black text-[10px] font-black rounded-lg transition-all">Ver</button>
                            {record.status !== 'PAID' && (
                              <button onClick={() => handleMarkAsPaid(record.id)} className="px-3 py-1 bg-green-500/20 hover:bg-green-500 hover:text-black text-green-500 text-[10px] font-black rounded-lg transition-all">Pagar</button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-blue-500/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Processado</p>
              <p className="text-3xl font-mono font-bold text-white">{formatKz(filteredPayroll.filter(p => p.status !== 'PENDING').reduce((sum, p) => sum + p.netSalary, 0))}</p>
            </div>
            <div className="glass-panel p-8 rounded-[2.5rem] border border-yellow-500/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pendente Pagamento</p>
              <p className="text-3xl font-mono font-bold text-yellow-500">{formatKz(filteredPayroll.filter(p => p.status !== 'PAID').reduce((sum, p) => sum + p.netSalary, 0))}</p>
            </div>
            <div className="glass-panel p-8 rounded-[2.5rem] border border-green-500/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Já Pago</p>
              <p className="text-3xl font-mono font-bold text-green-500">{formatKz(filteredPayroll.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.netSalary, 0))}</p>
            </div>
          </div>
        </div>
      )}

      {/* SALARIES TAB */}
      {activeTab === 'SALARIES' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="flex flex-wrap justify-between items-center gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
              <div className="flex items-center gap-6">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mês de Referência</p>
                    <div className="flex gap-2">
                        <select className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:border-primary font-bold text-sm appearance-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                           {Array.from({length: 12}).map((_, i) => <option key={i} value={i} className="bg-slate-900">{new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(new Date(2025, i))}</option>)}
                        </select>
                        <select className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:border-primary font-bold text-sm appearance-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                           <option value={2025} className="bg-slate-900">2025</option>
                           <option value={2024} className="bg-slate-900">2024</option>
                        </select>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-8">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Pendente (Este Mês)</p>
                    <p className="text-2xl font-mono font-bold text-white">{formatKz(totalSalariesPending)}</p>
                 </div>
                 <button onClick={handleProcessAll} className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow flex items-center gap-3 hover:scale-105 transition-transform">
                    <Calculator size={18} /> Processar Folha
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {salaryData.map(data => (
                <div key={data.employee.id} className={`glass-panel p-8 rounded-[3rem] border transition-all relative overflow-hidden group ${data.isPaid ? 'border-green-500/20' : 'border-white/5 hover:border-primary/30'}`}>
                   {data.isPaid && <div className="absolute top-4 right-4 text-green-500 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full"><CheckCircle2 size={14} /> Liquidado</div>}
                   
                   <div className="flex items-start gap-6 mb-8">
                      <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-lg" style={{ backgroundColor: data.employee.color }}>
                         {data.employee.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white tracking-tight">{data.employee.name}</h3>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{data.employee.role}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Presenças</p>
                         <p className="text-sm font-bold text-white">{data.stats.totalWorkDays} / {data.employee.workDaysPerMonth} Dias</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Extras</p>
                         <p className="text-sm font-bold text-primary">{data.stats.totalOvertime}h</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Atrasos</p>
                         <p className="text-sm font-bold text-red-400">{data.stats.totalLateMinutes}min</p>
                      </div>
                   </div>

                   <div className="flex justify-between items-end border-t border-white/5 pt-8">
                      <div>
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor Líquido</p>
                         <p className={`text-2xl font-mono font-bold ${data.isPaid ? 'text-slate-500' : 'text-primary'}`}>{formatKz(data.calc.netSalary)}</p>
                      </div>
                      {!data.isPaid && (
                        <button onClick={() => { setSelectedEmpSalary(data); setIsSalaryModalOpen(true); }} className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-black transition-all">
                           Detalhes do Recibo
                        </button>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-8 rounded-[2.5rem] border border-green-500/20 relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 text-green-500/10 group-hover:scale-110 transition-transform"><TrendingUp size={100} /></div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Faturamento Bruto</p>
                 <p className="text-3xl font-mono font-bold text-white">{(new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(activeOrders.filter(o => o.status === 'FECHADO').reduce((acc, o) => acc + o.total, 0)))}</p>
              </div>
              <div className="glass-panel p-8 rounded-[2.5rem] border border-red-500/20 relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 text-red-500/10 group-hover:scale-110 transition-transform"><TrendingDown size={100} /></div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Despesas</p>
                 <p className="text-3xl font-mono font-bold text-white">{(new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(expenses.reduce((acc, e) => acc + e.amount, 0) + fixedExpenses.reduce((acc, e) => acc + e.amount, 0)))}</p>
              </div>
              <div className="glass-panel p-8 rounded-[2.5rem] border border-emerald-500/40 relative overflow-hidden group shadow-glow">
                 <div className="absolute -right-4 -top-4 text-emerald-500/10 group-hover:scale-110 transition-transform"><TrendingUp size={100} /></div>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Lucro do Dia</p>
                 <p className="text-3xl font-mono font-bold text-white text-glow">{formatKz(todayProfit)}</p>
              </div>
              <div className="glass-panel p-8 rounded-[2.5rem] border border-primary/40 relative overflow-hidden group shadow-glow">
                 <div className="absolute -right-4 -top-4 text-primary/10 group-hover:scale-110 transition-transform"><DollarSign size={100} /></div>
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Lucro Operacional Total</p>
                 <p className="text-3xl font-mono font-bold text-white text-glow">{(new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(activeOrders.filter(o => o.status === 'FECHADO').reduce((acc, o) => acc + o.total, 0) - (expenses.reduce((acc, e) => acc + e.amount, 0) + fixedExpenses.reduce((acc, e) => acc + e.amount, 0))))}</p>
              </div>
           </div>
           <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6" ref={paymentChartRef}>
             <div className="flex flex-wrap items-center justify-between gap-4">
               <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pagamentos por Dia</p>
                 <p className="text-xl font-bold text-white">Receita e lucro por tipo de pagamento</p>
               </div>
               <div className="flex flex-wrap items-center gap-3">
                 <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                   {(['DIA', 'SEMANA', 'MES', 'ANO'] as const).map(period => (
                     <button
                       key={period}
                       onClick={() => setPaymentPeriod(period)}
                       className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                         paymentPeriod === period ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                       }`}
                     >
                       {period === 'DIA' ? 'Dia' : period === 'SEMANA' ? 'Semana' : period === 'MES' ? 'Mês' : 'Ano'}
                     </button>
                   ))}
                 </div>
                 {paymentPeriod === 'ANO' && (
                   <select
                     value={paymentYear}
                     onChange={(e) => setPaymentYear(Number(e.target.value))}
                     className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
                   >
                     {[0, 1, 2, 3, 4].map(offset => {
                       const year = new Date().getFullYear() - offset;
                       return (
                         <option key={year} value={year}>{year}</option>
                       );
                     })}
                   </select>
                 )}
                 <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                   <button
                     onClick={() => setPaymentMetric('VENDAS')}
                     className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       paymentMetric === 'VENDAS' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                     }`}
                   >
                     Vendas
                   </button>
                   <button
                     onClick={() => setPaymentMetric('LUCRO')}
                     className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       paymentMetric === 'LUCRO' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                     }`}
                   >
                     Lucro
                   </button>
                 </div>
                 <button
                   onClick={handleExportPayments}
                   className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white flex items-center gap-2"
                 >
                   <FileText size={14} /> Exportar PDF
                 </button>
               </div>
             </div>
             <div className="h-[260px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={paymentChartData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                   <XAxis
                     dataKey="name"
                     axisLine={false}
                     tickLine={false}
                     tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}}
                     dy={10}
                   />
                   <YAxis hide />
                   <Tooltip
                     contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                     formatter={(value: number, name: string) => [formatKz(value), paymentLabels[name as PaymentMethod] || name]}
                     labelStyle={{display: 'none'}}
                   />
                   {paymentMethods.map((method, index) => (
                     <Bar key={method} dataKey={method} stackId="a" fill={['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][index % 5]} radius={[6, 6, 0, 0]} />
                   ))}
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <button onClick={() => handleOpenExpenseModal()} className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow flex items-center gap-3 hover:scale-105 transition-transform">
            <Plus size={18} /> Novo Gasto
          </button>
          <div className="grid gap-6">
            {expenses.map(exp => (
              <div key={exp.id} className="glass-panel p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white mb-1">{exp.description}</h4>
                  <p className="text-sm text-slate-400">{new Date(exp.date).toLocaleDateString('pt-PT')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-mono font-bold text-lg text-red-400">{formatKz(exp.amount)}</p>
                  <button onClick={() => handleOpenExpenseModal(exp)} className="text-yellow-500 hover:text-yellow-400"><Edit2 size={18} /></button>
                  <button onClick={() => { removeExpense(exp.id); addNotification('info', 'Gasto removido.'); }} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FIXED EXPENSES TAB */}
      {activeTab === 'FIXED' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <button onClick={() => setIsExpenseModalOpen(true)} className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow flex items-center gap-3 hover:scale-105 transition-transform">
            <Plus size={18} /> Nova Despesa Fixa
          </button>
          <div className="grid gap-6">
            {fixedExpenses.map(exp => (
              <div key={exp.id} className="glass-panel p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white mb-1">{exp.description}</h4>
                  <p className="text-sm text-slate-400">Recorrência: {exp.frequency}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-mono font-bold text-lg text-orange-400">{formatKz(exp.amount)}</p>
                  <button onClick={() => removeFixedExpense(exp.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHIFTS TAB */}
      {activeTab === 'SHIFTS' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid gap-6">
            {shifts.map(shift => (
              <div key={shift.id} className="glass-panel p-8 rounded-3xl border border-white/5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{shift.userName}</h3>
                    <p className="text-slate-400 text-sm">{new Date(shift.startTime).toLocaleString('pt-PT')}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-black text-[10px] uppercase ${shift.status === 'OPEN' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {shift.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-black mb-1 uppercase">Abertura</p>
                    <p className="font-mono font-bold text-white">{formatKz(shift.openingBalance)}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-black mb-1 uppercase">Esperado</p>
                    <p className="font-mono font-bold text-white">{formatKz(shift.expectedBalance || 0)}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-black mb-1 uppercase">Real</p>
                    <p className="font-mono font-bold text-white">{formatKz(shift.closingBalance || 0)}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-black mb-1 uppercase">Diferença</p>
                    <p className={`font-mono font-bold ${(shift.closingBalance || 0) === (shift.expectedBalance || 0) ? 'text-green-500' : 'text-red-500'}`}>
                      {formatKz((shift.closingBalance || 0) - (shift.expectedBalance || 0))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SALARY MODAL */}
      {isSalaryModalOpen && selectedEmpSalary && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in">
           <div className="glass-panel rounded-[4rem] w-full max-w-2xl p-12 border border-white/10 shadow-2xl relative">
              <button onClick={() => setIsSalaryModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white"><X size={32} /></button>
              
              <div className="flex items-center gap-8 mb-12">
                 <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl shadow-xl" style={{ backgroundColor: selectedEmpSalary.employee.color }}>
                    {selectedEmpSalary.employee.name.substring(0, 2).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-1">Recibo de Vencimento</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                       <UserCircle size={18} /> {selectedEmpSalary.employee.name} • {selectedEmpSalary.employee.role}
                    </p>
                 </div>
              </div>

              <div className="space-y-6 mb-12">
                 <div className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/5">
                    <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Salário Base Mensal</span>
                    <span className="font-mono font-bold text-xl text-white">{formatKz(selectedEmpSalary.salary)}</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-green-500/5 rounded-3xl border border-green-500/20">
                       <p className="text-green-500 font-black uppercase text-[10px] tracking-widest mb-4">Ganhos de Horas Extras (+)</p>
                       <div className="flex justify-between items-end">
                          <span className="text-xs text-slate-400">{selectedEmpSalary.stats.totalOvertime}h à taxa 1.5x</span>
                          <span className="font-mono font-bold text-green-500">{formatKz(selectedEmpSalary.calc.overtimeBonus)}</span>
                       </div>
                    </div>
                    <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20">
                       <p className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-4">Descontos (Faltas/Atrasos) (-)</p>
                       <div className="flex justify-between items-end">
                          <span className="text-xs text-slate-400">Total penalizações</span>
                          <span className="font-mono font-bold text-red-500">-{formatKz(selectedEmpSalary.calc.latenessDeduction + selectedEmpSalary.calc.absenceDeduction)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-primary/10 rounded-[2.5rem] border border-primary/20 flex justify-between items-center mt-8">
                    <div>
                       <p className="text-primary font-black uppercase text-xs tracking-widest mb-1">Líquido Final a Receber</p>
                       <p className="text-4xl font-mono font-bold text-primary text-glow">{formatKz(selectedEmpSalary.calc.netSalary)}</p>
                    </div>
                    <button onClick={() => handleProcessSalary(selectedEmpSalary)} className="px-10 py-5 bg-primary text-black rounded-3xl font-black uppercase tracking-widest shadow-glow hover:scale-105 transition-transform">
                       Processar Salário
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* PAYROLL RECORD MODAL */}
      {isPayrollModalOpen && selectedPayrollRecord && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in">
          <div className="glass-panel rounded-[4rem] w-full max-w-2xl p-12 border border-white/10 shadow-2xl relative">
            <button onClick={() => setIsPayrollModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white"><X size={32} /></button>
            
            <div className="mb-12">
              <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Registo de Folha</h3>
              <p className="text-slate-400 font-bold uppercase text-sm">
                {new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(new Date(selectedPayrollRecord.year, selectedPayrollRecord.month))}
              </p>
            </div>

            <div className="space-y-6 mb-12">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest block mb-2">Salário Base</span>
                  <span className="font-mono font-bold text-xl text-white">{formatKz(selectedPayrollRecord.baseSalary)}</span>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest block mb-2">Dias Trabalhados</span>
                  <span className="font-mono font-bold text-xl text-white">{selectedPayrollRecord.workDays}/{selectedPayrollRecord.totalWorkDays}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-green-500/5 rounded-3xl border border-green-500/20">
                  <p className="text-green-500 font-black uppercase text-[10px] tracking-widest mb-3">Ganhos</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Horas Extras: {selectedPayrollRecord.overtimeHours}h</span>
                      <span className="text-green-500 font-bold">{formatKz(selectedPayrollRecord.overtimeBonus)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20">
                  <p className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-3">Descontos</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Atrasos: {selectedPayrollRecord.lateMinutes}min</span>
                      <span className="text-red-500 font-bold">-{formatKz(selectedPayrollRecord.latenessDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Faltas: {selectedPayrollRecord.absenceDays}</span>
                      <span className="text-red-500 font-bold">-{formatKz(selectedPayrollRecord.absenceDeduction)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-primary/10 rounded-[2.5rem] border border-primary/20 flex justify-between items-center">
                <div>
                  <p className="text-primary font-black uppercase text-xs tracking-widest mb-1">Líquido Final</p>
                  <p className="text-4xl font-mono font-bold text-primary text-glow">{formatKz(selectedPayrollRecord.netSalary)}</p>
                </div>
                {selectedPayrollRecord.status !== 'PAID' && (
                  <button onClick={() => { handleMarkAsPaid(selectedPayrollRecord.id); setIsPayrollModalOpen(false); }} className="px-10 py-5 bg-green-600 text-white rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
                    ✓ Marcar como Pago
                  </button>
                )}
              </div>

              {selectedPayrollRecord.status === 'PAID' && (
                <div className="p-6 bg-green-500/10 rounded-3xl border border-green-500/20 flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <div>
                    <p className="font-black text-green-500 uppercase text-[10px] tracking-widest">Pagamento Confirmado</p>
                    <p className="text-slate-300 text-sm">{selectedPayrollRecord.paymentDate ? new Intl.DateTimeFormat('pt-PT').format(new Date(selectedPayrollRecord.paymentDate)) : 'Data não registada'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in">
          <div className="glass-panel rounded-[4rem] w-full max-w-lg p-12 border border-white/10 shadow-2xl relative">
            <button onClick={() => setIsExpenseModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white"><X size={32} /></button>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8">Novo Gasto</h3>
            <form onSubmit={handleSaveExpense} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Descrição</label>
                <input type="text" value={expenseForm.description || ''} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-primary font-bold" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Valor</label>
                <input type="number" value={expenseForm.amount || 0} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-primary font-bold" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Categoria</label>
                <select value={expenseForm.category || 'OUTROS'} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-primary font-bold appearance-none">
                  <option className="bg-slate-900" value="OUTROS">Outros</option>
                  <option className="bg-slate-900" value="MANUTENCAO">Manutenção</option>
                  <option className="bg-slate-900" value="TRANSPORTE">Transporte</option>
                </select>
              </div>
              <button type="submit" className="w-full px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow hover:scale-105 transition-transform">
                {editingExpense ? 'Atualizar' : 'Registar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
