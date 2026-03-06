import { Database } from '../types/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Exemplo: buscar funcionários (usando tabela correta)
async function getEmployees() {
  const { data, error } = await supabase
    .from('employees') // tabela correta do Supabase
    .select('*');  // colunas exatamente como definidas

  if (error) throw error;
  return data;
}

// Exemplo: buscar categorias (usando tabela correta)
async function getMenuCategories() {
  const { data, error } = await supabase
    .from('menu_categories') // tabela correta do Supabase
    .select('*');  // colunas exatamente como definidas

  if (error) throw error;
  return data;
}

// Exemplo: buscar pratos com categorias
async function getDishesWithCategories() {
  const { data, error } = await supabase
    .from('dishes')
    .select(`
      *,
      menu_categories (
        id,
        name,
        icon
      )
    `);

  if (error) throw error;
  return data;
}

// Exemplo: buscar pedidos com funcionários
async function getOrdersWithEmployees() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      employees (
        id,
        name,
        role
      )
    `);

  if (error) throw error;
  return data;
}

// Exemplo: buscar folha salarial
async function getPayrollRecords() {
  const { data, error } = await supabase
    .from('payroll_records') // tabela correta do Supabase
    .select(`
      *,
      employees (
        id,
        name,
        role
      )
    `);

  if (error) throw error;
  return data;
}

// Exemplo: criar novo funcionário
async function createEmployee(employee: Database['public']['Tables']['employees']['Insert']) {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Exemplo: atualizar categoria
async function updateCategory(
  id: string, 
  updates: Database['public']['Tables']['menu_categories']['Update']
) {
  const { data, error } = await supabase
    .from('menu_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Exemplo: buscar pedidos do dia
async function getTodayOrders() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      employees (
        id,
        name,
        role
      ),
      order_items (
        *,
        dishes (
          id,
          name,
          price
        )
      )
    `)
    .gte('created_at', today)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export { 
  supabase, 
  getEmployees, 
  getMenuCategories, 
  getDishesWithCategories, 
  getOrdersWithEmployees, 
  getPayrollRecords,
  createEmployee,
  updateCategory,
  getTodayOrders
};
