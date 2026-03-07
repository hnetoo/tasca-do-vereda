-- Fix table labels - use the label column instead of name
UPDATE restaurant_tables SET label = 'Mesa 1' WHERE id = 'db27f45e-1c2d-42e4-aa4e-3c2b8be1b3ff';
UPDATE restaurant_tables SET label = 'Mesa 2' WHERE id = 'd96e1852-7fe3-4456-98dc-7408654b4877';
UPDATE restaurant_tables SET label = 'Mesa 3' WHERE id = '856650a9-3a45-47e5-b095-8077dae502c3';
UPDATE restaurant_tables SET label = 'Mesa 4' WHERE id = 'ee18dcb4-2da3-4f3c-b812-1e1c981d2778';
UPDATE restaurant_tables SET label = 'Mesa 5' WHERE id = '50c38ce4-37f9-4649-902a-a0494b269053';
UPDATE restaurant_tables SET label = 'Mesa 6' WHERE id = '9448b910-b31b-46fb-88c2-6579bb2c5834';
UPDATE restaurant_tables SET label = 'Mesa 7' WHERE id = 'b57d0783-3934-4ba6-a1f5-ff4ac1e06f79';
UPDATE restaurant_tables SET label = 'Mesa 8' WHERE id = '503d80dd-6052-4307-89d9-63aea5d0c970';
UPDATE restaurant_tables SET label = 'Balcão' WHERE id = 'e4dd0eee-548a-41db-a168-7f117c0d6ddc';

-- Also fix the zone formatting for consistency
UPDATE restaurant_tables SET zone = 'INTERIOR' WHERE zone = 'Interior';
UPDATE restaurant_tables SET category = 'INTERIOR' WHERE category = 'INTERIOR';

-- Set some tables to available for testing
UPDATE restaurant_tables SET status = 'disponivel' WHERE id IN (
  'db27f45e-1c2d-42e4-aa4e-3c2b8be1b3ff',
  'd96e1852-7fe3-4456-98dc-7408654b4877',
  '856650a9-3a45-47e5-b095-8077dae502c3'
);
