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

export { supabase, getEmployees, getMenuCategories, getDishesWithCategories, getOrdersWithEmployees, getPayrollRecords };
