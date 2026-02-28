-- ========================================
-- FUNÇÕES E TRIGGERS PARA TEMPO REAL
-- ========================================

-- Função para notificar mudanças em tempo real
CREATE OR REPLACE FUNCTION notify_realtime_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar mudança via PostgreSQL NOTIFY
    PERFORM pg_notify(
        'realtime_change',
        json_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'id', COALESCE(NEW.id, OLD.id),
            'data', row_to_json(COALESCE(NEW, OLD))
        )::text
    );
    
    -- Retornar o valor apropriado baseado na operação
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para tabelas críticas (serão criados depois)
-- Todos os triggers serão criados nas migrations específicas das tabelas

-- Função para calcular métricas em tempo real
CREATE OR REPLACE FUNCTION calculate_realtime_metrics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    today_date DATE := CURRENT_DATE;
    current_hour INTEGER := EXTRACT(HOUR FROM NOW());
BEGIN
    SELECT json_build_object(
        'today_sales', (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM orders 
            WHERE DATE(created_at) = today_date 
            AND status = 'paid'
        ),
        'today_orders', (
            SELECT COUNT(*)
            FROM orders 
            WHERE DATE(created_at) = today_date
        ),
        'active_tables', (
            SELECT COUNT(*)
            FROM restaurant_tables 
            WHERE status = 'occupied'
        ),
        'pending_orders', (
            SELECT COUNT(*)
            FROM orders 
            WHERE status IN ('pending', 'confirmed', 'preparing')
        ),
        'hourly_sales', (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM orders 
            WHERE DATE(created_at) = today_date 
            AND EXTRACT(HOUR FROM created_at) = current_hour
            AND status = 'paid'
        ),
        'average_ticket', (
            SELECT COALESCE(AVG(total_amount), 0)
            FROM orders 
            WHERE DATE(created_at) = today_date 
            AND status = 'paid'
        ),
        'top_products', (
            SELECT json_agg(
                json_build_object(
                    'name', p.name,
                    'quantity', COALESCE(SUM(oi.quantity), 0),
                    'revenue', COALESCE(SUM(oi.total_price), 0)
                )
            )
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE DATE(o.created_at) = today_date 
            AND o.status = 'paid'
            GROUP BY p.id, p.name
            ORDER BY COALESCE(SUM(oi.quantity), 0) DESC
            LIMIT 5
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status de mesas automaticamente
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se um pedido foi pago, liberar a mesa
    IF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
        UPDATE restaurant_tables 
        SET status = 'available' 
        WHERE id = NEW.table_id;
    END IF;
    
    -- Se um novo pedido foi criado, ocupar a mesa
    IF TG_OP = 'INSERT' AND NEW.table_id IS NOT NULL THEN
        UPDATE restaurant_tables 
        SET status = 'occupied' 
        WHERE id = NEW.table_id AND status = 'available';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualização automática de status de mesas (será criado depois)
-- CREATE TRIGGER trigger_auto_table_status
--     AFTER INSERT OR UPDATE ON orders
--     FOR EACH ROW EXECUTE FUNCTION update_table_status();

-- Função para auditoria automática
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir log de auditoria para mudanças importantes
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values
        ) VALUES (
            COALESCE(current_setting('app.current_user_id', true)::UUID, NULL),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE TG_OP WHEN 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
            CASE TG_OP WHEN 'DELETE' THEN NULL ELSE row_to_json(NEW) END
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers de auditoria para tabelas críticas (serão criados depois)
-- CREATE TRIGGER trigger_orders_audit
--     AFTER INSERT OR UPDATE OR DELETE ON orders
--     FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- CREATE TRIGGER trigger_transactions_audit
--     AFTER INSERT OR UPDATE OR DELETE ON transactions
--     FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- CREATE TRIGGER trigger_products_audit
--     AFTER INSERT OR UPDATE OR DELETE ON products
--     FOR EACH ROW EXECUTE FUNCTION audit_changes();
