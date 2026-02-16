
-- Create orders table
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES public.customers(id),
    table_id uuid REFERENCES public.restaurant_tables(id),
    total_amount numeric(10, 2) NOT NULL,
    status text NOT NULL DEFAULT 'PENDING',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    payment_method text,
    discount numeric(10, 2) DEFAULT 0,
    notes text
);

-- Create order_items table
CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    dish_id uuid REFERENCES public.dishes(id),
    quantity integer NOT NULL,
    price_at_order numeric(10, 2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create order_status_history table
CREATE TABLE public.order_status_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    status text NOT NULL,
    changed_at timestamp with time zone DEFAULT now(),
    changed_by uuid REFERENCES public.users(id),
    notes text
);

-- Enable Row Level Security (RLS) for new tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table (example policies, adjust as needed)
CREATE POLICY "Enable read access for all users" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for order_items table
CREATE POLICY "Enable read access for all users" ON public.order_items
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.order_items
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for order_status_history table
CREATE POLICY "Enable read access for all users" ON public.order_status_history
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.order_status_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add trigger to update `updated_at` column automatically
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
