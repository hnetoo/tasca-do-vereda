-- Create Daily Analytics Table
CREATE TABLE IF NOT EXISTS daily_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_revenue NUMERIC(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_ticket NUMERIC(10,2) DEFAULT 0,
    top_selling_items JSONB DEFAULT '[]',
    payment_methods_breakdown JSONB DEFAULT '{}',
    hourly_traffic JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE daily_analytics;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
