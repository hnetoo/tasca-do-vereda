import { Database } from '../types/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// EXEMPLOS BASEADOS NA ESTRUTURA REAL DO SUPABASE (project-id: myppylcyupoirizyxhpo)

// 1. Funcionários - Tabela: employees
async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*');

  if (error) throw error;
  return data;
}

// 2. Categorias - Tabela: menu_categories (NÃO existe tabela 'categories')
async function getMenuCategories() {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*');

  if (error) throw error;
  return data;
}

// 3. Pratos - Tabela: dishes
async function getDishes() {
  const { data, error } = await supabase
    .from('dishes')
    .select('*');

  if (error) throw error;
  return data;
}

// 4. Pratos com Categorias - Join real usando foreign key
async function getDishesWithCategories() {
  const { data, error } = await supabase
    .from('dishes')
    .select(`
      *,
      suppliers (id, name)
    `);

  if (error) throw error;
  return data;
}

// 5. Pedidos - Tabela: orders (usa campo 'total' NÃO 'total_amount')
async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*');

  if (error) throw error;
  return data;
}

// 6. Pedidos com Funcionários - Join real
async function getOrdersWithEmployees() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      employees (id, name, role)
    `);

  if (error) throw error;
  return data;
}

// 7. Itens do Pedido - Tabela: order_items (NÃO existe tabela 'order_items')
// Nota: Esta tabela não existe no schema real, os itens estão em orders.items (JSON)
async function getOrderItems() {
  // Como não existe tabela order_items, pegamos os itens do JSON em orders
  const { data, error } = await supabase
    .from('orders')
    .select('id, items');

  if (error) throw error;
  return data;
}

// 8. Despesas - Tabela: expenses
async function getExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*');

  if (error) throw error;
  return data;
}

// 9. Receitas - Tabela: revenues
async function getRevenues() {
  const { data, error } = await supabase
    .from('revenues')
    .select('*');

  if (error) throw error;
  return data;
}

// 10. Folha Salarial - Tabela: payroll_records
async function getPayrollRecords() {
  const { data, error } = await supabase
    .from('payroll_records')
    .select(`
      *,
      employees (id, name, role)
    `);

  if (error) throw error;
  return data;
}

// 11. Menu Items - Tabela: menu_items (diferente de dishes)
async function getMenuItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*');

  if (error) throw error;
  return data;
}

// 12. Criar Funcionário - Tipado corretamente
async function createEmployee(employee: Database['public']['Tables']['employees']['Insert']) {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 13. Atualizar Pedido - Usando campo 'total' correto
async function updateOrder(
  id: string, 
  updates: Database['public']['Tables']['orders']['Update']
) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 14. Buscar Pedidos do Dia - Com dados reais
async function getTodayOrders() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      employees (id, name, role)
    `)
    .gte('created_at', today)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// 15. Soma de Vendas do Dia - Usando campo 'total' correto
async function getTodaySalesTotal() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', today)
    .eq('status', 'PAID');

  if (error) throw error;
  
  const total = data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  return total;
}

export { 
  supabase, 
  getEmployees, 
  getMenuCategories, 
  getDishes, 
  getDishesWithCategories, 
  getOrders, 
  getOrdersWithEmployees, 
  getOrderItems,
  getExpenses,
  getRevenues,
  getPayrollRecords,
  getMenuItems,
  createEmployee,
  updateOrder,
  getTodayOrders,
  getTodaySalesTotal
};
