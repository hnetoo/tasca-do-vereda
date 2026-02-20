import { createClient } from '@/lib/supabase/client';

export async function getTodayRevenue() {
  try {
  const supabase = await createClient();
    const { data, error } = await supabase
      .from('revenues')
      .select('amount')
      .eq('date', new Date().toISOString().split('T')[0]); // Assuming date is stored as 'YYYY-MM-DD'

    if (error) {
      throw error;
    }

    const total = data.reduce((sum, row) => sum + (row.amount || 0), 0);
    return Number(total);
  } catch (error) {
    console.error('Error fetching today revenue:', error);
    return 0;
  }
}

export async function getTodayExpenses() {
  try {
  const supabase = await createClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('date', new Date().toISOString().split('T')[0]); // Assuming date is stored as 'YYYY-MM-DD'

    if (error) {
      throw error;
    }

    const total = data.reduce((sum, row) => sum + (row.amount || 0), 0);
    return Number(total);
  } catch (error) {
    console.error('Error fetching today expenses:', error);
    return 0;
  }
}

export async function getLatestTransactions() {
  try {
  const supabase = await createClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, description, payment_method')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return data as any[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}
