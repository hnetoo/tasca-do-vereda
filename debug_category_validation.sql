-- Debug category validation issue
-- Check if the category actually exists and why validation is failing

-- Step 1: Check if the specific category exists
SELECT 
    'Checking specific category' as step,
    id,
    name,
    sort_order,
    is_active,
    is_available_on_digital_menu
FROM menu_categories 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 2: Check all categories to see what's available
SELECT 
    'All available categories' as step,
    id,
    name,
    sort_order,
    is_active,
    is_available_on_digital_menu
FROM menu_categories 
ORDER BY sort_order, name;

-- Step 3: Check if there are any dishes with this category
SELECT 
    'Dishes with this category' as step,
    id,
    name,
    price,
    category_id,
    available
FROM dishes 
WHERE category_id = '00000000-0000-0000-0000-000000000001';

-- Step 4: Check dishes with null category (problematic ones)
SELECT 
    'Dishes with null category' as step,
    id,
    name,
    price,
    category_id,
    available
FROM dishes 
WHERE category_id IS NULL
LIMIT 5;

-- Step 5: Test the exact validation logic
SELECT 
    'Testing validation logic' as step,
    '00000000-0000-0000-0000-000000000001' as input_category_id,
    '00000000-0000-0000-0000-000000000001' = id as direct_match,
    LOWER('00000000-0000-0000-0000-000000000001'::text) as normalized_input,
    LOWER(id::text) as normalized_id
FROM menu_categories 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 6: Create the category if it doesn't exist (backup)
INSERT INTO menu_categories (
    id,
    name,
    sort_order,
    is_active,
    is_available_on_digital_menu,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Geral',
    999,
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

-- Step 7: Final verification
SELECT 
    'Final verification' as step,
    id,
    name,
    sort_order,
    is_active
FROM menu_categories 
WHERE id = '00000000-0000-0000-0000-000000000001';
