import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and DATABASE_URL must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const sql = postgres(databaseUrl, { ssl: 'require' });

async function setupPolicies() {
  console.log('Temporarily enabling public write access for testing...');
  try {
    // Drop existing policies if they conflict (or just create new ones)
    // Grant permissions to anon and authenticated roles
    await sql`GRANT ALL ON menu_categories TO anon, authenticated, service_role`;
    await sql`GRANT ALL ON dishes TO anon, authenticated, service_role`;

    // We create permissive policies for public role
    await sql`CREATE POLICY "Allow public insert menu_categories" ON menu_categories FOR INSERT TO public WITH CHECK (true)`;
    await sql`CREATE POLICY "Allow public update menu_categories" ON menu_categories FOR UPDATE TO public USING (true)`;
    await sql`CREATE POLICY "Allow public delete menu_categories" ON menu_categories FOR DELETE TO public USING (true)`;
    
    await sql`CREATE POLICY "Allow public insert dishes" ON dishes FOR INSERT TO public WITH CHECK (true)`;
    await sql`CREATE POLICY "Allow public update dishes" ON dishes FOR UPDATE TO public USING (true)`;
    await sql`CREATE POLICY "Allow public delete dishes" ON dishes FOR DELETE TO public USING (true)`;
    
    console.log('Temporary policies created.');
  } catch (error: any) {
    // Ignore if they already exist (e.g. from previous failed run)
    console.log('Note: Policies might already exist or error occurred:', error.message);
  }
}

async function teardownPolicies() {
  console.log('Cleaning up temporary policies...');
  try {
    await sql`DROP POLICY IF EXISTS "Allow public insert menu_categories" ON menu_categories`;
    await sql`DROP POLICY IF EXISTS "Allow public update menu_categories" ON menu_categories`;
    await sql`DROP POLICY IF EXISTS "Allow public delete menu_categories" ON menu_categories`;
    
    await sql`DROP POLICY IF EXISTS "Allow public insert dishes" ON dishes`;
    await sql`DROP POLICY IF EXISTS "Allow public update dishes" ON dishes`;
    await sql`DROP POLICY IF EXISTS "Allow public delete dishes" ON dishes`;
    
    // Revoke permissions
    await sql`REVOKE INSERT, UPDATE, DELETE ON menu_categories FROM anon, authenticated, service_role`;
    await sql`REVOKE INSERT, UPDATE, DELETE ON dishes FROM anon, authenticated, service_role`;
    
    console.log('Temporary policies removed.');
  } catch (error: any) {
    console.error('Error removing policies:', error.message);
  }
}

async function testCrud() {
  console.log('Starting CRUD tests...');
  console.log(`Connecting to Supabase: ${supabaseUrl}`);

  // Setup permissions
  await setupPolicies();

  try {
    // 1. Create Category
    const categoryId = crypto.randomUUID();
    console.log(`\nTesting Category creation (ID: ${categoryId})...`);
    const { error: createCatError } = await supabase
      .from('menu_categories')
      .insert({
        id: categoryId,
        name: 'Test Category CLI',
        sort_order: 999,
        is_active: true
      });

    if (createCatError) {
      console.error('FAILED to create category:', createCatError);
      throw createCatError;
    }
    console.log('Category created successfully.');

    // 2. Read Category
    console.log('\nTesting Category read...');
    const { data: catData, error: readCatError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (readCatError || !catData) {
      console.error('FAILED to read category:', readCatError);
      throw readCatError;
    }
    console.log('Category read successfully:', catData.name);

    // 3. Create Dish
    const dishId = crypto.randomUUID();
    console.log(`\nTesting Dish creation (ID: ${dishId})...`);
    const { error: createDishError } = await supabase
      .from('dishes')
      .insert({
        id: dishId,
        name: 'Test Dish CLI',
        price: 10.50,
        category_id: categoryId,
        is_active: true,
        available: true
      });

    if (createDishError) {
      console.error('FAILED to create dish:', createDishError);
      throw createDishError;
    }
    console.log('Dish created successfully.');

    // 4. Read Dish
    console.log('\nTesting Dish read...');
    const { data: dishData, error: readDishError } = await supabase
      .from('dishes')
      .select('*')
      .eq('id', dishId)
      .single();

    if (readDishError || !dishData) {
      console.error('FAILED to read dish:', readDishError);
      throw readDishError;
    }
    console.log('Dish read successfully:', dishData.name);

    // 5. Delete Dish
    console.log('\nTesting Dish deletion...');
    const { error: deleteDishError } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dishId);

    if (deleteDishError) {
      console.error('FAILED to delete dish:', deleteDishError);
      throw deleteDishError;
    }
    console.log('Dish deleted successfully.');

    // 6. Delete Category
    console.log('\nTesting Category deletion...');
    const { error: deleteCatError } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', categoryId);

    if (deleteCatError) {
      console.error('FAILED to delete category:', deleteCatError);
      throw deleteCatError;
    }
    console.log('Category deleted successfully.');

    console.log('\nCRUD tests completed successfully!');

  } catch (err) {
    console.error('\nTest failed with error:', err);
  } finally {
    // Cleanup permissions
    await teardownPolicies();
    await sql.end();
  }
}

testCrud().catch(console.error);
