


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."audit_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."audit_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_daily_product_cost"("target_date" "date") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    cost DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(mi.preco_custo * oi.quantity), 0)
    INTO cost
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN menu_items mi ON oi.dish_id = mi.id
    WHERE DATE(o.created_at) = target_date
    AND o.status = 'FECHADO'; -- Only count cost for closed orders? Or all? Usually cost is incurred when made.
    -- Assuming cost is incurred when order is made/delivered. But revenue is when closed.
    -- To match Revenue (which is usually FECHADO), let's use FECHADO for now to align Profit.
    
    RETURN cost;
EXCEPTION WHEN OTHERS THEN
    RETURN 0; -- Fallback if tables don't exist or other error
END;
$$;


ALTER FUNCTION "public"."calculate_daily_product_cost"("target_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_realtime_metrics"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_realtime_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_all_production_data"() RETURNS TABLE("orders_cleared" integer, "expenses_cleared" integer, "success" boolean, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  orders_count integer;
  expenses_count integer;
BEGIN
  -- Contar registros antes de limpar
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO expenses_count FROM expenses;
  
  -- Limpar TUDO com CASCADE para remover dependências
  EXECUTE 'TRUNCATE TABLE orders, expenses CASCADE';
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    orders_count,
    expenses_count,
    true,
    'All production data cleared successfully'::text;
END;
$$;


ALTER FUNCTION "public"."clear_all_production_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_order_closed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the order status changed to 'FECHADO'
  IF NEW.status = 'FECHADO' AND (OLD.status IS NULL OR OLD.status != 'FECHADO') THEN
    -- Make an HTTP POST request to the webhook URL
    -- Replace 'YOUR_WEBHOOK_URL' with your actual endpoint
    PERFORM net.http_post(
      url := 'https://tasca-do-vereda.vercel.app/api/webhooks/order-closed',
      body := jsonb_build_object(
        'order_id', NEW.id,
        'total', NEW.total,
        'closed_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_order_closed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_realtime_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_realtime_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truncate_table"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Execute TRUNCATE with CASCADE to handle dependencies
    EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
END;
$$;


ALTER FUNCTION "public"."truncate_table"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_daily_analytics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_date DATE;
    daily_revenue DECIMAL(12,2);
    daily_expenses DECIMAL(12,2);
    daily_cost DECIMAL(12,2);
    daily_orders INTEGER;
BEGIN
    -- Determine the date to update using Africa/Luanda timezone
    -- We assume inputs are in UTC (standard for Supabase timestamps)
    -- Converting to Africa/Luanda ensures the 'day' boundary is correct for Angola
    IF TG_TABLE_NAME = 'orders' THEN
        target_date := DATE(COALESCE(NEW.created_at, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda');
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        target_date := DATE(COALESCE(NEW.date, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda');
    ELSIF TG_TABLE_NAME = 'revenues' THEN
        target_date := DATE(COALESCE(NEW.date, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda');
    ELSE
        target_date := DATE(NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda');
    END IF;

    -- Calculate Totals for that Date (using Africa/Luanda timezone for queries too)
    
    -- 1. Revenue (Orders + Revenues table)
    SELECT 
        (
            SELECT COALESCE(SUM(total), 0) 
            FROM orders 
            WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date 
            AND status = 'FECHADO'
        ) + (
            SELECT COALESCE(SUM(amount), 0) 
            FROM revenues 
            WHERE DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date
        )
    INTO daily_revenue;

    -- 2. Expenses
    SELECT COALESCE(SUM(amount), 0)
    INTO daily_expenses
    FROM expenses
    WHERE DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date;

    -- 3. Product Cost
    -- We'll use the existing function but we should check if it needs timezone adjustment.
    -- For now, let's assume we can just pass the target_date and it works if it compares dates.
    -- However, calculate_daily_product_cost uses DATE(o.created_at) which might default to UTC date.
    -- We should probably update that function too or inline the logic.
    -- Let's inline a simple cost calculation here to be safe and consistent.
    SELECT COALESCE(SUM(mi.preco_custo * oi.quantity), 0)
    INTO daily_cost
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN menu_items mi ON oi.dish_id = mi.id
    WHERE DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date
    AND o.status = 'FECHADO';

    -- 4. Order Count
    SELECT COUNT(*)
    INTO daily_orders
    FROM orders
    WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date;

    -- Update or Insert
    INSERT INTO daily_analytics (date, total_revenue, total_expenses, total_product_cost, total_orders, net_profit, last_updated)
    VALUES (
        target_date, 
        daily_revenue, 
        daily_expenses, 
        daily_cost, 
        daily_orders, 
        (daily_revenue - daily_expenses - daily_cost),
        NOW()
    )
    ON CONFLICT (date) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        total_product_cost = EXCLUDED.total_product_cost,
        total_orders = EXCLUDED.total_orders,
        net_profit = EXCLUDED.net_profit,
        last_updated = NOW();
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_daily_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_dashboard_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update total revenue, expenses and order counts
    UPDATE dashboard_summary
    SET 
        total_revenue = (
            SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'FECHADO'
        ) + (
            SELECT COALESCE(SUM(amount), 0) FROM revenues
        ),
        total_expenses = (
            SELECT COALESCE(SUM(amount), 0) FROM expenses
        ),
        total_orders = (SELECT COUNT(*) FROM orders),
        active_orders_count = (SELECT COUNT(*) FROM orders WHERE status = 'ABERTO'),
        last_updated = NOW()
    WHERE id = 'current';
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_dashboard_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_table_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_table_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "prefix" "text" NOT NULL,
    "scopes" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "last_used_at" timestamp with time zone,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "date" "date" NOT NULL,
    "clock_in" timestamp with time zone,
    "clock_out" timestamp with time zone,
    "clock_in_method" "text",
    "clock_out_method" "text",
    "total_hours" numeric,
    "is_late" boolean,
    "late_minutes" integer,
    "overtime_hours" numeric,
    "is_absence" boolean,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "user_id" "uuid",
    "details" "text",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    "hash" character varying(64) NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_size" bigint,
    "status" character varying(20) DEFAULT 'completed'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."backups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."biometric_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "ip_address" "text" NOT NULL,
    "port" integer DEFAULT 4370,
    "status" "text" DEFAULT 'DISCONNECTED'::"text",
    "last_sync" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."biometric_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cash_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_name" "text",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "opening_balance" numeric(15,2),
    "closing_balance" numeric(15,2),
    "expected_balance" numeric(15,2),
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cash_shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "nif" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "points" integer DEFAULT 0,
    "balance" numeric(12,2) DEFAULT 0,
    "visits" integer DEFAULT 0
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_analytics" (
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "total_revenue" numeric(12,2) DEFAULT 0,
    "total_expenses" numeric(12,2) DEFAULT 0,
    "total_product_cost" numeric(12,2) DEFAULT 0,
    "total_orders" integer DEFAULT 0,
    "net_profit" numeric(12,2) DEFAULT 0,
    "average_ticket" numeric(12,2) DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_id" "uuid",
    "funcionario" "text" NOT NULL,
    "base_salary" numeric DEFAULT 0,
    "subsidios" numeric DEFAULT 0,
    "descontos" numeric DEFAULT 0,
    "net_total" numeric GENERATED ALWAYS AS ((("base_salary" + "subsidios") - "descontos")) STORED,
    "reference_month" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "salario_base" numeric DEFAULT 0,
    "mes_referencia" "text",
    "status_pagamento" "text" DEFAULT 'pendente'::"text",
    "nome_funcionario" "text"
);


ALTER TABLE "public"."payroll" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurant_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "number" integer NOT NULL,
    "status" "text" DEFAULT 'disponível'::"text",
    "x" double precision DEFAULT 100,
    "y" double precision DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "zone" "text" DEFAULT 'Interior'::"text",
    "category" "text" DEFAULT 'INTERIOR'::"text"
);


ALTER TABLE "public"."restaurant_tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text",
    "cargo" "text",
    "telefone" "text",
    "salario_base" numeric DEFAULT 0,
    "name" "text",
    "role" "text",
    "phone" "text",
    "base_salary" numeric DEFAULT 0,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "position" "text",
    "status" "text" DEFAULT 'active'::"text"
);


ALTER TABLE "public"."staff" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_summary" AS
 SELECT COALESCE(( SELECT "sum"("payroll"."net_total") AS "sum"
           FROM "public"."payroll"
          WHERE ("payroll"."mes_referencia" = "to_char"((CURRENT_DATE)::timestamp with time zone, 'YYYY-MM'::"text"))), (0)::numeric) AS "total_payroll_mes",
    ( SELECT "count"(*) AS "count"
           FROM "public"."restaurant_tables"
          WHERE ("restaurant_tables"."status" = 'ocupada'::"text")) AS "mesas_ativas",
    ( SELECT "count"(*) AS "count"
           FROM "public"."staff"
          WHERE ("staff"."status" = 'active'::"text")) AS "total_staff",
    COALESCE(( SELECT "sum"("staff"."base_salary") AS "sum"
           FROM "public"."staff"
          WHERE ("staff"."status" = 'active'::"text")), (0)::numeric) AS "custo_fixo_mensal";


ALTER VIEW "public"."dashboard_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "driver_name" "text",
    "customer_name" "text",
    "customer_phone" "text",
    "address" "text",
    "status" "text",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dishes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(15,2) NOT NULL,
    "description" "text",
    "category_id" "uuid",
    "image_url" "text",
    "available" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "is_available_on_digital_menu" boolean DEFAULT true,
    "tax_percentage" numeric,
    "tax_code" "text",
    "preparation_time" integer,
    "track_stock" boolean DEFAULT false,
    "stock_quantity" numeric,
    "min_stock_quantity" numeric,
    "max_stock_quantity" numeric,
    "supplier_id" "uuid",
    "unit" "text",
    "cost_price" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "status" "text" DEFAULT 'active'::"text"
);


ALTER TABLE "public"."dishes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "pin" "text",
    "phone" "text",
    "email" "text",
    "nif" "text",
    "address" "text",
    "salary" numeric(15,2),
    "is_active" boolean DEFAULT true,
    "admission_date" timestamp with time zone,
    "social_security_number" "text",
    "bank_account" "text",
    "bi" "text",
    "work_days_per_month" integer,
    "daily_work_hours" numeric,
    "external_bio_id" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "permissions" "text"[],
    "position" "text",
    "department" "text",
    "hire_date" "date",
    "base_salary" numeric(10,2),
    "net_salary" numeric(10,2),
    "status" "text" DEFAULT 'active'::"text",
    "pin_code" "text"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "date" "date" NOT NULL,
    "category" "text",
    "payment_method" "text",
    "supplier_id" "uuid",
    "notes" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_finance" (
    "id" "uuid" NOT NULL,
    "type" "text",
    "amount" numeric(15,2) NOT NULL,
    "description" "text",
    "period_start" "date",
    "period_end" "date",
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "created_by" "text",
    "metadata" "jsonb",
    CONSTRAINT "external_finance_type_check" CHECK (("type" = ANY (ARRAY['previous_sales'::"text", 'accumulated_profits'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."external_finance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revenues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text",
    "amount" numeric(15,2) NOT NULL,
    "date" "date" NOT NULL,
    "category" "text",
    "payment_method" "text",
    "order_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."revenues" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."financial_transactions" AS
 SELECT ("r"."id")::"text" AS "id",
    "r"."created_at" AS "date",
    ("r"."amount")::numeric AS "amount",
    "r"."description",
    COALESCE("r"."category", 'REVENUE'::"text") AS "category",
    'REVENUE'::"text" AS "type",
    'COMPLETED'::"text" AS "status"
   FROM "public"."revenues" "r"
UNION ALL
 SELECT ("e"."id")::"text" AS "id",
    "e"."created_at" AS "date",
    ("e"."amount")::numeric AS "amount",
    "e"."description",
    COALESCE("e"."category", 'EXPENSE'::"text") AS "category",
    'EXPENSE'::"text" AS "type",
    'COMPLETED'::"text" AS "status"
   FROM "public"."expenses" "e";


ALTER VIEW "public"."financial_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service" "text" NOT NULL,
    "event" "text" NOT NULL,
    "status" "text" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "is_active" boolean DEFAULT true,
    "sort_order" integer,
    "is_available_on_digital_menu" boolean DEFAULT true,
    "icon" "text",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."menu_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "preco_custo" numeric(10,2) DEFAULT 0,
    "category" character varying(100),
    "available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menu_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'INFO'::"text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "dish_id" "uuid",
    "quantity" numeric NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "tax_percentage" numeric,
    "tax_amount" numeric(15,2),
    "tax_code" "text",
    "notes" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text",
    "status" "text" NOT NULL,
    "total" numeric(15,2),
    "tax_total" numeric(15,2),
    "table_id" "uuid",
    "customer_id" "uuid",
    "user_id" "uuid",
    "user_name" "text",
    "customer_name" "text",
    "customer_nif" "text",
    "shift_id" "uuid",
    "notes" "text",
    "payment_method" "text",
    "split_payments" "jsonb",
    "invoice_number" "text",
    "sub_account_name" "text",
    "is_synced_agt" integer DEFAULT 0,
    "agt_submission_uuid" "text",
    "hash" "text",
    "previous_hash" "text",
    "signature" "text",
    "jws_payload" "jsonb",
    "closed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "month" integer,
    "year" integer,
    "date" "date" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "base_salary" numeric(15,2),
    "net_salary" numeric(15,2),
    "status" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payment_date" "date",
    "employee_name" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."payroll_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'staff'::"text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_id" "uuid",
    "customer_name" "text" NOT NULL,
    "customer_phone" "text" NOT NULL,
    "date" "date" NOT NULL,
    "time" "text" NOT NULL,
    "guests" integer NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "color" character varying(50) DEFAULT 'blue'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_name" "text",
    "nif" "text",
    "address" "text",
    "phone" "text",
    "email" "text",
    "tax_percentage" numeric,
    "currency" "text" DEFAULT 'AKZ'::"text",
    "timezone" "text" DEFAULT 'Africa/Luanda'::"text",
    "language" "text" DEFAULT 'pt'::"text",
    "logo_url" "text",
    "app_logo_url" "text",
    "wifi_name" "text",
    "wifi_password" "text",
    "qr_code_title" "text",
    "qr_code_subtitle" "text",
    "qr_code_short_code" "text",
    "qr_menu_url" "text",
    "qr_menu_cloud_url" "text",
    "admin_pin" "text",
    "open_drawer_code" "text",
    "api_token" "text",
    "agt_certificate" "text",
    "printer_config" "jsonb",
    "backup_config" "jsonb",
    "supabase_config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_id" "uuid",
    "day_of_week" integer,
    "shift_start" time without time zone,
    "shift_end" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."staff_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "quantity" numeric,
    "unit" "text",
    "min_threshold" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stock_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contact" "text",
    "email" "text",
    "nif" "text",
    "address" "text",
    "category" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_health_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "component" "text" NOT NULL,
    "status" "text" NOT NULL,
    "details" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_health_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "category" "text",
    "payment_method" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "pin" "text" NOT NULL,
    "role" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'caixa'::"text", 'cozinha'::"text", 'garcom'::"text", 'cliente'::"text"]))),
    CONSTRAINT "users_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_payroll_integration" AS
 SELECT "s"."id" AS "staff_id",
    "s"."name" AS "funcionario",
    "s"."base_salary",
    "p"."subsidios",
    "p"."descontos",
    (("s"."base_salary" + COALESCE("p"."subsidios", (0)::numeric)) - COALESCE("p"."descontos", (0)::numeric)) AS "total_liquido"
   FROM ("public"."staff" "s"
     LEFT JOIN "public"."payroll" "p" ON (("s"."id" = "p"."staff_id")));


ALTER VIEW "public"."v_payroll_integration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "secret" "text" NOT NULL,
    "events" "text"[] NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "failure_count" integer DEFAULT 0
);


ALTER TABLE "public"."webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "status" "text" DEFAULT 'OPEN'::"text",
    "opening_balance" numeric(15,2) DEFAULT 0,
    "closing_balance" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."work_shifts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."backups"
    ADD CONSTRAINT "backups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."biometric_devices"
    ADD CONSTRAINT "biometric_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cash_shifts"
    ADD CONSTRAINT "cash_shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_analytics"
    ADD CONSTRAINT "daily_analytics_pkey" PRIMARY KEY ("date");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_finance"
    ADD CONSTRAINT "external_finance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_logs"
    ADD CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_records"
    ADD CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_number_key" UNIQUE ("number");



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."revenues"
    ADD CONSTRAINT "revenues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_schedule"
    ADD CONSTRAINT "staff_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_items"
    ADD CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_health_logs"
    ADD CONSTRAINT "system_health_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhooks"
    ADD CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_shifts"
    ADD CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_attendance_records_clock_in" ON "public"."attendance_records" USING "btree" ("clock_in");



CREATE INDEX "idx_attendance_records_date" ON "public"."attendance_records" USING "btree" ("date");



CREATE INDEX "idx_attendance_records_employee_id" ON "public"."attendance_records" USING "btree" ("employee_id");



CREATE INDEX "idx_audit_logs_timestamp" ON "public"."audit_logs" USING "btree" ("timestamp");



CREATE INDEX "idx_cash_shifts_user_id" ON "public"."cash_shifts" USING "btree" ("user_id");



CREATE INDEX "idx_customers_nif" ON "public"."customers" USING "btree" ("nif");



CREATE INDEX "idx_customers_phone" ON "public"."customers" USING "btree" ("phone");



CREATE INDEX "idx_customers_points" ON "public"."customers" USING "btree" ("points");



CREATE INDEX "idx_daily_analytics_date" ON "public"."daily_analytics" USING "btree" ("date");



CREATE INDEX "idx_daily_analytics_total_orders" ON "public"."daily_analytics" USING "btree" ("total_orders");



CREATE INDEX "idx_deliveries_order_id" ON "public"."deliveries" USING "btree" ("order_id");



CREATE INDEX "idx_dishes_category_id" ON "public"."dishes" USING "btree" ("category_id");



CREATE INDEX "idx_dishes_is_active" ON "public"."dishes" USING "btree" ("is_active");



CREATE INDEX "idx_dishes_supplier_id" ON "public"."dishes" USING "btree" ("supplier_id");



CREATE INDEX "idx_employees_email" ON "public"."employees" USING "btree" ("email");



CREATE INDEX "idx_employees_is_active" ON "public"."employees" USING "btree" ("is_active");



CREATE INDEX "idx_employees_pin_code" ON "public"."employees" USING "btree" ("pin_code");



CREATE INDEX "idx_employees_role" ON "public"."employees" USING "btree" ("role");



CREATE INDEX "idx_employees_status" ON "public"."employees" USING "btree" ("status");



CREATE INDEX "idx_expenses_category" ON "public"."expenses" USING "btree" ("category");



CREATE INDEX "idx_expenses_date" ON "public"."expenses" USING "btree" ("date");



CREATE INDEX "idx_expenses_supplier_id" ON "public"."expenses" USING "btree" ("supplier_id");



CREATE INDEX "idx_menu_categories_is_active" ON "public"."menu_categories" USING "btree" ("is_active");



CREATE INDEX "idx_menu_categories_parent_id" ON "public"."menu_categories" USING "btree" ("parent_id");



CREATE INDEX "idx_menu_categories_sort_order" ON "public"."menu_categories" USING "btree" ("sort_order");



CREATE INDEX "idx_order_items_created_at" ON "public"."order_items" USING "btree" ("created_at");



CREATE INDEX "idx_order_items_dish_id" ON "public"."order_items" USING "btree" ("dish_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_status" ON "public"."order_items" USING "btree" ("status");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_date" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_number" ON "public"."orders" USING "btree" ("order_number");



CREATE INDEX "idx_orders_shift_id" ON "public"."orders" USING "btree" ("shift_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_table_id" ON "public"."orders" USING "btree" ("table_id");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_payroll_records_employee_id" ON "public"."payroll_records" USING "btree" ("employee_id");



CREATE INDEX "idx_payroll_records_month" ON "public"."payroll_records" USING "btree" ("month");



CREATE INDEX "idx_payroll_records_month_year" ON "public"."payroll_records" USING "btree" ("month", "year");



CREATE INDEX "idx_payroll_records_payment_date" ON "public"."payroll_records" USING "btree" ("payment_date");



CREATE INDEX "idx_payroll_records_status" ON "public"."payroll_records" USING "btree" ("status");



CREATE INDEX "idx_reservations_customer_phone" ON "public"."reservations" USING "btree" ("customer_phone");



CREATE INDEX "idx_reservations_date" ON "public"."reservations" USING "btree" ("date");



CREATE INDEX "idx_reservations_status" ON "public"."reservations" USING "btree" ("status");



CREATE INDEX "idx_reservations_table_id" ON "public"."reservations" USING "btree" ("table_id");



CREATE INDEX "idx_revenues_date" ON "public"."revenues" USING "btree" ("date");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_pin" ON "public"."users" USING "btree" ("pin");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_status" ON "public"."users" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "on_order_closed_webhook" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."notify_order_closed"();



CREATE OR REPLACE TRIGGER "set_dishes_updated_at" BEFORE UPDATE ON "public"."dishes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_menu_categories_updated_at" BEFORE UPDATE ON "public"."menu_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_attendance_records_updated_at" BEFORE UPDATE ON "public"."attendance_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_backups_updated_at" BEFORE UPDATE ON "public"."backups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cash_shifts_updated_at" BEFORE UPDATE ON "public"."cash_shifts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_daily_analytics_expenses" AFTER INSERT OR DELETE OR UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_daily_analytics"();



CREATE OR REPLACE TRIGGER "update_daily_analytics_orders" AFTER INSERT OR DELETE OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_daily_analytics"();



CREATE OR REPLACE TRIGGER "update_daily_analytics_revenues" AFTER INSERT OR DELETE OR UPDATE ON "public"."revenues" FOR EACH ROW EXECUTE FUNCTION "public"."update_daily_analytics"();



CREATE OR REPLACE TRIGGER "update_daily_analytics_updated_at" BEFORE UPDATE ON "public"."daily_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dishes_updated_at" BEFORE UPDATE ON "public"."dishes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_expenses_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_menu_categories_updated_at" BEFORE UPDATE ON "public"."menu_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_order_items_updated_at" BEFORE UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payroll_records_updated_at" BEFORE UPDATE ON "public"."payroll_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_revenues_updated_at" BEFORE UPDATE ON "public"."revenues" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_settings_updated_at" BEFORE UPDATE ON "public"."settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stock_items_updated_at" BEFORE UPDATE ON "public"."stock_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_summary_on_expense" AFTER INSERT OR DELETE OR UPDATE ON "public"."expenses" FOR EACH STATEMENT EXECUTE FUNCTION "public"."update_dashboard_summary"();



CREATE OR REPLACE TRIGGER "update_summary_on_order" AFTER INSERT OR DELETE OR UPDATE ON "public"."orders" FOR EACH STATEMENT EXECUTE FUNCTION "public"."update_dashboard_summary"();



CREATE OR REPLACE TRIGGER "update_summary_on_revenue" AFTER INSERT OR DELETE OR UPDATE ON "public"."revenues" FOR EACH STATEMENT EXECUTE FUNCTION "public"."update_dashboard_summary"();



CREATE OR REPLACE TRIGGER "update_suppliers_updated_at" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."cash_shifts"
    ADD CONSTRAINT "cash_shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_categories"("id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."cash_shifts"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."payroll_records"
    ADD CONSTRAINT "payroll_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."revenues"
    ADD CONSTRAINT "revenues_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."staff_schedule"
    ADD CONSTRAINT "staff_schedule_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."work_shifts"
    ADD CONSTRAINT "work_shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



CREATE POLICY "Allow all" ON "public"."staff" USING (true);



CREATE POLICY "Anon Insert" ON "public"."attendance_records" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."cash_shifts" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."customers" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."deliveries" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."dishes" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."employees" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."expenses" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."menu_categories" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."order_items" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."orders" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."payroll_records" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."reservations" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."revenues" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Insert" ON "public"."settings" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon Select" ON "public"."attendance_records" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."cash_shifts" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."customers" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."deliveries" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."dishes" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."employees" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."expenses" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."menu_categories" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."order_items" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."orders" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."payroll_records" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."reservations" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."revenues" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon Select" ON "public"."settings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."daily_analytics" FOR SELECT USING (true);



CREATE POLICY "Permitir leitura pública de mesas" ON "public"."restaurant_tables" FOR SELECT USING (true);



CREATE POLICY "Permitir tudo" ON "public"."expenses" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir tudo" ON "public"."payroll" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir tudo" ON "public"."restaurant_tables" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir tudo" ON "public"."staff" USING (true) WITH CHECK (true);



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."api_keys";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."attendance_records";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."audit_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."backups";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."biometric_devices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."cash_shifts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."daily_analytics";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."deliveries";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."dishes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."employees";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."expenses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."integration_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."menu_categories";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."order_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."payroll_records";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."reservations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."revenues";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."settings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."staff";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."stock_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."suppliers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."system_health_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."system_settings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."transactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."webhooks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."work_shifts";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































GRANT ALL ON FUNCTION "public"."audit_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_daily_product_cost"("target_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_daily_product_cost"("target_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_daily_product_cost"("target_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_realtime_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_realtime_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_realtime_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_all_production_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_all_production_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_all_production_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_order_closed"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_order_closed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_order_closed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_realtime_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_realtime_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_realtime_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."truncate_table"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."truncate_table"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."truncate_table"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_daily_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_daily_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_daily_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_dashboard_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_dashboard_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_dashboard_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_table_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_table_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_table_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_records" TO "anon";
GRANT ALL ON TABLE "public"."attendance_records" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_records" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."backups" TO "anon";
GRANT ALL ON TABLE "public"."backups" TO "authenticated";
GRANT ALL ON TABLE "public"."backups" TO "service_role";



GRANT ALL ON TABLE "public"."biometric_devices" TO "anon";
GRANT ALL ON TABLE "public"."biometric_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."biometric_devices" TO "service_role";



GRANT ALL ON TABLE "public"."cash_shifts" TO "anon";
GRANT ALL ON TABLE "public"."cash_shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_shifts" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."daily_analytics" TO "anon";
GRANT ALL ON TABLE "public"."daily_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."payroll" TO "anon";
GRANT ALL ON TABLE "public"."payroll" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_tables" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_tables" TO "service_role";



GRANT ALL ON TABLE "public"."staff" TO "anon";
GRANT ALL ON TABLE "public"."staff" TO "authenticated";
GRANT ALL ON TABLE "public"."staff" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_summary" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_summary" TO "service_role";



GRANT ALL ON TABLE "public"."deliveries" TO "anon";
GRANT ALL ON TABLE "public"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."dishes" TO "anon";
GRANT ALL ON TABLE "public"."dishes" TO "authenticated";
GRANT ALL ON TABLE "public"."dishes" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."external_finance" TO "anon";
GRANT ALL ON TABLE "public"."external_finance" TO "authenticated";
GRANT ALL ON TABLE "public"."external_finance" TO "service_role";



GRANT ALL ON TABLE "public"."revenues" TO "anon";
GRANT ALL ON TABLE "public"."revenues" TO "authenticated";
GRANT ALL ON TABLE "public"."revenues" TO "service_role";



GRANT ALL ON TABLE "public"."financial_transactions" TO "anon";
GRANT ALL ON TABLE "public"."financial_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."integration_logs" TO "anon";
GRANT ALL ON TABLE "public"."integration_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_logs" TO "service_role";



GRANT ALL ON TABLE "public"."menu_categories" TO "anon";
GRANT ALL ON TABLE "public"."menu_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_categories" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items" TO "anon";
GRANT ALL ON TABLE "public"."menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_records" TO "anon";
GRANT ALL ON TABLE "public"."payroll_records" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_records" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."staff_schedule" TO "anon";
GRANT ALL ON TABLE "public"."staff_schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_schedule" TO "service_role";



GRANT ALL ON TABLE "public"."stock_items" TO "anon";
GRANT ALL ON TABLE "public"."stock_items" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_items" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."system_health_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_health_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health_logs" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_payroll_integration" TO "anon";
GRANT ALL ON TABLE "public"."v_payroll_integration" TO "authenticated";
GRANT ALL ON TABLE "public"."v_payroll_integration" TO "service_role";



GRANT ALL ON TABLE "public"."webhooks" TO "anon";
GRANT ALL ON TABLE "public"."webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."work_shifts" TO "anon";
GRANT ALL ON TABLE "public"."work_shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."work_shifts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";


