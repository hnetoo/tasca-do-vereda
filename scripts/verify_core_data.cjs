const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function verifyCoreData() {
  console.log('Verifying Core Data Access (Orders, Dishes, Customers)...');
  
  try {
    // 1. Dishes (Products) - Read Only check (don't want to mess with menu unless needed)
    // But we need to ensure we can write too.
    // Let's create a temporary hidden dish.
    const dish = {
      name: 'Test Dish Verify',
      price: 1000,
      is_active: false,
      available: false
    };
    
    // Note: Some columns might be required. Let's check schema or try/catch.
    // Based on types/supabase.ts: name, price are main ones.
    
    const insertedDish = await sql`
      INSERT INTO dishes ${sql(dish)} RETURNING id
    `;
    console.log('PASS: Insert Dish');
    
    await sql`DELETE FROM dishes WHERE id = ${insertedDish[0].id}`;
    console.log('PASS: Delete Dish');

    // 2. Customers
    const customer = {
      name: 'Test Customer Verify'
    };
    
    const insertedCustomer = await sql`
      INSERT INTO customers ${sql(customer)} RETURNING id
    `;
    console.log('PASS: Insert Customer');
    
    await sql`DELETE FROM customers WHERE id = ${insertedCustomer[0].id}`;
    console.log('PASS: Delete Customer');
    
    // 3. Orders
    // Orders usually need a lot of FKs (customer_id, table_id, etc.)
    // We'll just try to read orders to confirm RLS allows it.
    await sql`SELECT count(*) FROM orders`;
    console.log('PASS: Read Orders');

  } catch (error) {
    console.error('Verification Failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyCoreData();
