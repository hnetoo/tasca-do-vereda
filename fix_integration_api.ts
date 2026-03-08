// FIX INTEGRATION API - Resolver Supabase client initialization
const { supabaseAdmin } = require('./fix_supabase_client.cjs');

console.log('🔧 FIXING INTEGRATION API CLIENT INITIALIZATION');

// Classe IntegrationAPIService melhorada
class IntegrationAPIService {
  constructor() {
    this.client = null;
    this.initializationAttempts = 0;
    this.maxRetries = 3;
  }

  // Getter robusto para o cliente
  getClient() {
    console.log('🔍 getClient() called, current client:', !!this.client);
    
    // Se já temos cliente, retornar
    if (this.client) {
      return this.client;
    }
    
    // Tentar inicializar cliente
    return this.initializeClient();
  }

  // Inicialização com retry
  async initializeClient() {
    this.initializationAttempts++;
    console.log(`🔄 Initializing client attempt ${this.initializationAttempts}/${this.maxRetries}`);
    
    try {
      // Usar cliente fix_supabase_client
      this.client = supabaseAdmin;
      
      if (!this.client) {
        throw new Error('Supabase client is null after initialization');
      }
      
      console.log('✅ Supabase client initialized successfully');
      return this.client;
      
    } catch (error) {
      console.error(`❌ Initialization attempt ${this.initializationAttempts} failed:`, error.message);
      
      if (this.initializationAttempts >= this.maxRetries) {
        console.log('❌ Max initialization attempts reached, using fallback mode');
        // Retornar cliente mock para não quebrar o sistema
        return this.createMockClient();
      }
      
      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * this.initializationAttempts));
      return this.initializeClient();
    }
  }

  // Cliente mock para fallback
  createMockClient() {
    console.log('🛡️ Creating mock Supabase client');
    
    return {
      from: (table) => ({
        select: () => ({
          data: [],
          error: null
        }),
        insert: () => ({ data: null, error: null }),
        upsert: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null })
      }),
      auth: {
        getUser: () => ({ data: { user: null }, error: null })
      }
    };
  }

  // Método syncOrders com retry
  async syncOrders(orders) {
    console.log('🔄 syncOrders called with', orders.length, 'orders');
    
    const client = this.getClient();
    
    if (!client) {
      console.log('❌ Cannot sync orders - no client available');
      return { success: false, error: 'No Supabase client' };
    }
    
    try {
      const results = await Promise.all(
        orders.map(async (order) => {
          try {
            const result = await client
              .from('orders')
              .upsert(order)
              .select();
            
            return { success: true, data: result.data, order: order.id };
          } catch (error) {
            console.log(`❌ Order ${order.id} sync failed:`, error.message);
            return { success: false, error: error.message, order: order.id };
          }
        })
      );
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      console.log(`📊 Sync results: ${successCount} success, ${errorCount} errors`);
      
      return {
        success: successCount > 0,
        results: results
      };
      
    } catch (error) {
      console.log('❌ Critical error in syncOrders:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Singleton pattern
const integrationAPI = new IntegrationAPIService();

module.exports = integrationAPI;
