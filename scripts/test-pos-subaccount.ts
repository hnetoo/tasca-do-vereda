import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubAccountCreation() {
  console.log('Testing POS Subaccount Creation...');

  // 1. Generate a valid UUID
  const validUuid = crypto.randomUUID();
  const subAccountName = 'Test SubAccount ' + Date.now();
  
  const validOrder = {
    id: validUuid,
    status: 'ABERTO', // Using 'ABERTO' as per frontend, though DB default is 'PENDING'
    sub_account_name: subAccountName,
    total: 0,
    created_at: new Date().toISOString()
  };

  console.log(`Attempting to insert order with UUID: ${validUuid}`);
  const { error: validError } = await supabase.from('orders').insert(validOrder);

  if (validError) {
    console.error('Failed to insert valid order:', validError);
  } else {
    console.log('Successfully inserted order with UUID.');
    
    // Verify it exists
    const { data: fetchedOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', validUuid)
      .single();
      
    if (fetchError) {
      console.error('Failed to fetch inserted order:', fetchError);
    } else {
      console.log('Fetched order:', fetchedOrder);
      if (fetchedOrder.sub_account_name === subAccountName) {
        console.log('Sub-account name matched!');
      } else {
        console.error('Sub-account name mismatch!');
      }
    }

    // Clean up
    await supabase.from('orders').delete().eq('id', validUuid);
    console.log('Cleaned up test order.');
  }

  // 2. Try with non-UUID (to confirm failure mode)
  const invalidId = `order-${Date.now()}`;
  const invalidOrder = {
    id: invalidId,
    status: 'ABERTO',
    sub_account_name: 'Invalid ID SubAccount',
    total: 0,
    created_at: new Date().toISOString()
  };

  console.log(`Attempting to insert order with non-UUID ID: ${invalidId}`);
  const { error: invalidError } = await supabase.from('orders').insert(invalidOrder);

  if (invalidError) {
    console.log('Expected failure with non-UUID ID:', invalidError.message);
  } else {
    console.error('Unexpected success with non-UUID ID! Schema might be too loose.');
    // Clean up if it somehow worked
    await supabase.from('orders').delete().eq('id', invalidId);
  }
}

testSubAccountCreation();
