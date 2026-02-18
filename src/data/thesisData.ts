
import { RemoteDashboardData } from '../types';

export const thesisData: RemoteDashboardData = {
  summary: {
    total_revenue: 5840250,
    total_orders: 312,
    active_orders_count: 15,
    total_expenses: 822000
  },
  analytics: {
    totalCustomers: 1245,
    retentionRate: 0.72,
    menu: [
      { productName: 'Francesinha Especial', sold: 185 },
      { productName: 'Bacalhau à Brás', sold: 124 },
      { productName: 'Picanha na Chapa', sold: 110 },
      { productName: 'Arroz de Marisco', sold: 95 },
      { productName: 'Sopa do Mar', sold: 58 },
      { productName: 'Mousse de Chocolate', sold: 145 },
      { productName: 'Vinho da Casa', sold: 210 }
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
    { id: 'thesis-prod-1', name: 'Francesinha Especial', description: 'A nossa especialidade da casa.', price: 1500, category_id: 'cat-thesis-1', image_url: '', is_active: true, tax_percentage: 14, tax_code: 'NOR', is_available_on_digital_menu: true },
    { id: 'thesis-prod-2', name: 'Bacalhau à Brás', description: 'Um clássico da cozinha portuguesa.', price: 1200, category_id: 'cat-thesis-1', image_url: '', is_active: true, tax_percentage: 14, tax_code: 'NOR', is_available_on_digital_menu: true },
    { id: 'thesis-prod-3', name: 'Picanha na Chapa', description: 'Picanha suculenta servida na chapa.', price: 1800, category_id: 'cat-thesis-1', image_url: '', is_active: true, tax_percentage: 14, tax_code: 'NOR', is_available_on_digital_menu: true },
    { id: 'thesis-prod-4', name: 'Mousse de Chocolate', description: 'Deliciosa mousse de chocolate caseira.', price: 500, category_id: 'cat-thesis-2', image_url: '', is_active: true, tax_percentage: 14, tax_code: 'NOR', is_available_on_digital_menu: true }
  ],
  users: [
    { id: 'thesis-owner', name: 'Owner Thesis', role: 'OWNER', pin: '0000', active: true },
    { id: 'thesis-admin', name: 'Admin Thesis', role: 'ADMIN', pin: '1111', active: true },
    { id: 'thesis-manager', name: 'Gerente Thesis', role: 'GERENTE', pin: '2222', active: true }
  ],
  categories: [
    { id: 'cat-thesis-1', name: 'Pratos Principais (Thesis)', sort_order: 1, is_active: true, is_available_on_digital_menu: true },
    { id: 'cat-thesis-2', name: 'Sobremesas (Thesis)', sort_order: 2, is_active: true, is_available_on_digital_menu: true }
  ]
};
