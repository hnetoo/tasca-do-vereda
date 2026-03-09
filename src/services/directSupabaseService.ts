// SERVIÇO DIRETO DO SUPABASE - SEM ABSTRAÇÕES
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export const directSupabaseService = {
  // =====================================================
  // 🍽️ CATEGORIAS - ACESSO DIRETO
  // =====================================================
  
  async listCategories() {
    console.log('🔍 LISTANDO CATEGORIAS DO SUPABASE...');
    
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ ERRO AO LISTAR CATEGORIAS:', error);
        return { success: false, error: error.message, data: [] };
      }

      console.log('✅ CATEGORIAS LISTADAS:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO LISTAR CATEGORIAS:', error);
      return { success: false, error: (error as Error).message, data: [] };
    }
  },

  async createCategory(category: any) {
    console.log('--- CLIQUE DETETADO CREATE CATEGORY ---', category);
    
    try {
      console.log('🔧 ENVIANDO PARA SUPABASE:', category);
      
      const { data, error } = await supabase
        .from('menu_categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        console.error('❌ ERRO AO CRIAR CATEGORIA:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ CATEGORIA CRIADA COM SUCESSO:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO CRIAR CATEGORIA:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // =====================================================
  // 🪑 MESAS - ACESSO DIRETO
  // =====================================================
  
  async listTables() {
    console.log('🔍 LISTANDO MESAS DO SUPABASE...');
    
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('number', { ascending: true });

      if (error) {
        console.error('❌ ERRO AO LISTAR MESAS:', error);
        return { success: false, error: error.message, data: [] };
      }

      console.log('✅ MESAS LISTADAS:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO LISTAR MESAS:', error);
      return { success: false, error: (error as Error).message, data: [] };
    }
  },

  async createTable(table: any) {
    console.log('--- CLIQUE DETETADO CREATE TABLE ---', table);
    
    try {
      console.log('🔧 ENVIANDO MESA PARA SUPABASE:', table);
      
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert(table)
        .select()
        .single();

      if (error) {
        console.error('❌ ERRO AO CRIAR MESA:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ MESA CRIADA COM SUCESSO:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO CRIAR MESA:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // =====================================================
  // 🍽️ PRATOS - ACESSO DIRETO
  // =====================================================
  
  async listDishes() {
    console.log('🔍 LISTANDO PRATOS DO SUPABASE...');
    
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ ERRO AO LISTAR PRATOS:', error);
        return { success: false, error: error.message, data: [] };
      }

      console.log('✅ PRATOS LISTADOS:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO LISTAR PRATOS:', error);
      return { success: false, error: (error as Error).message, data: [] };
    }
  },

  // =====================================================
  // 📋 PEDIDOS - ACESSO DIRETO
  // =====================================================
  
  async listOrders() {
    console.log('🔍 LISTANDO PEDIDOS DO SUPABASE...');
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ ERRO AO LISTAR PEDIDOS:', error);
        return { success: false, error: error.message, data: [] };
      }

      console.log('✅ PEDIDOS LISTADOS:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO LISTAR PEDIDOS:', error);
      return { success: false, error: (error as Error).message, data: [] };
    }
  }
};
