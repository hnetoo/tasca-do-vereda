-- Fix frontend category synchronization
-- Force refresh of categories and update any problematic dishes

-- Step 1: Show all categories for frontend reference
SELECT 
    'All categories for frontend' as step,
    id,
    name,
    sort_order,
    is_active,
    is_available_on_digital_menu,
    -- Add normalized fields for frontend matching
    LOWER(id::text) as id_normalized,
    LOWER(name) as name_normalized
FROM menu_categories 
WHERE is_active = true
ORDER BY sort_order, name;

-- Step 2: Show dishes with category issues
SELECT 
    'Dishes with category issues' as step,
    id,
    name,
    price,
    category_id,
    available,
    -- Show if category exists
    EXISTS(
        SELECT 1 FROM menu_categories 
        WHERE menu_categories.id = dishes.category_id 
        AND menu_categories.is_active = true
    ) as category_exists
FROM dishes 
WHERE category_id IS NOT NULL
ORDER BY category_id, name;

-- Step 3: Update any dishes with null category to use 'Geral'
UPDATE dishes 
SET category_id = '00000000-0000-0000-0000-000000000001' 
WHERE category_id IS NULL;

-- Step 4: Force update timestamp to trigger frontend refresh
UPDATE menu_categories 
SET updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 5: Show final status
SELECT 
    'Final status' as step,
    (SELECT COUNT(*) FROM menu_categories WHERE is_active = true) as active_categories,
    (SELECT COUNT(*) FROM dishes WHERE category_id = '00000000-0000-0000-0000-000000000001') as dishes_in_geral,
    (SELECT COUNT(*) FROM dishes WHERE category_id IS NULL) as dishes_with_null_category;

-- Step 6: Test exact frontend validation scenario
SELECT 
    'Frontend validation test' as step,
    d.id as dish_id,
    d.name as dish_name,
    d.category_id as dish_category_id,
    c.id as category_id,
    c.name as category_name,
    c.is_active as category_active,
    -- Simulate frontend validation
    CASE 
        WHEN d.category_id = c.id AND c.is_active = true THEN 'VALID'
        ELSE 'INVALID'
    END as validation_result
FROM dishes d
LEFT JOIN menu_categories c ON d.category_id = c.id
WHERE d.id = '5ca45e9a-a3ab-4057-b209-5c15f7475802' -- The problematic dish
LIMIT 1;
