
import { RemoteDashboardData } from '../pages/MobileDashboard';

export const thesisData: RemoteDashboardData = {
  summary: {
    total_revenue: 5840250,
    total_orders: 312,
    active_orders_count: 15
  },
  analytics: {
    totalCustomers: 1245,
    retentionRate: 0.72,
    menu: [
      { dishName: 'Francesinha Especial', sold: 185 },
      { dishName: 'Bacalhau à Brás', sold: 124 },
      { dishName: 'Picanha na Chapa', sold: 110 },
      { dishName: 'Arroz de Marisco', sold: 95 },
      { dishName: 'Sopa do Mar', sold: 58 },
      { dishName: 'Mousse de Chocolate', sold: 145 },
      { dishName: 'Vinho da Casa', sold: 210 }
    ]
  },
  settings: {
    restaurantName: 'Tasca Do VEREDA - Master Thesis',
    currency: 'AOA',
    taxRate: 14,
    invoiceSeries: 'THESIS-2026',
    retencaoFonte: 6.5,
    regimeIVA: 'Normal',
    kdsEnabled: true,
    isSidebarCollapsed: false,
    apiToken: 'thesis-demo-token-12345',
    webhookEnabled: true,
    adminPin: '0000'
  },
  expenses: [
    { id: 't-exp-1', amount: 150000, description: 'Fornecedor de Bebidas', date: '2026-02-10', category: 'LOGÍSTICA' },
    { id: 't-exp-2', amount: 280000, description: 'Renda Mensal', date: '2026-02-01', category: 'OPERACIONAL' },
    { id: 't-exp-3', amount: 45000, description: 'Manutenção Equipamento', date: '2026-02-05', category: 'OPERACIONAL' },
    { id: 't-exp-4', amount: 12000, description: 'Limpeza Especializada', date: '2026-02-12', category: 'LIMPEZA' },
    { id: 't-exp-5', amount: 85000, description: 'Marketing Redes Sociais', date: '2026-02-13', category: 'MARKETING' },
    { id: 't-exp-6', amount: 250000, description: 'Salários Staff', date: '2026-02-14', category: 'OPERACIONAL' }
  ],
  revenues: [
    { id: 't-rev-1', amount: 850000, description: 'Vendas Semana 1', date: '2026-02-07', category: 'VENDAS' },
    { id: 't-rev-2', amount: 920000, description: 'Vendas Semana 2', date: '2026-02-14', category: 'VENDAS' },
    { id: 't-rev-3', amount: 450000, description: 'Eventos Corporativos', date: '2026-02-10', category: 'EVENTOS' },
    { id: 't-rev-4', amount: 125000, description: 'Takeaway App', date: '2026-02-13', category: 'VENDAS' },
    { id: 't-rev-5', amount: 310000, description: 'Serviço de Catering', date: '2026-02-12', category: 'EVENTOS' }
  ],
  menu: [
    { dishName: 'Francesinha Especial', sold: 142 },
    { dishName: 'Bacalhau à Brás', sold: 98 },
    { dishName: 'Picanha na Chapa', sold: 85 }
  ],
  users: [
    { id: 'thesis-owner', name: 'Owner Thesis', role: 'OWNER', pin: '0000' },
    { id: 'thesis-admin', name: 'Admin Thesis', role: 'ADMIN', pin: '1111' },
    { id: 'thesis-manager', name: 'Gerente Thesis', role: 'GERENTE', pin: '2222' }
  ]
};
