-- Fix Default Category - Create 'Geral' category for dishes
-- This resolves the error: Categoria inválida para o prato

-- Step 1: Check current categories
SELECT 
    id, 
    name, 
    sort_order, 
    is_active
FROM menu_categories 
ORDER BY sort_order, name;

-- Step 2: Create default 'Geral' category if it doesn't exist
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

-- Step 3: Verify the category was created
SELECT 
    id, 
    name, 
    sort_order, 
    is_active,
    is_available_on_digital_menu
FROM menu_categories 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 4: Update dishes with null category_id to use 'Geral'
UPDATE dishes 
SET category_id = '00000000-0000-0000-0000-000000000001' 
WHERE category_id IS NULL;

-- Step 5: Show updated dishes count
SELECT 
    'Dishes updated with default category' as status,
    COUNT(*) as updated_dishes
FROM dishes 
WHERE category_id = '00000000-0000-0000-0000-000000000001';

-- Step 6: Show all categories after fix
SELECT 
    id, 
    name, 
    sort_order, 
    is_active,
    is_available_on_digital_menu,
    (SELECT COUNT(*) FROM dishes WHERE dishes.category_id = menu_categories.id) as dish_count
FROM menu_categories 
ORDER BY sort_order, name;

-- Step 7: Show sample dishes with their categories
SELECT 
    id,
    name,
    price,
    category_id,
    available
FROM dishes 
LIMIT 3;
