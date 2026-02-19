CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid,
	"date" date NOT NULL,
	"clock_in" timestamp,
	"clock_out" timestamp,
	"clock_in_method" text,
	"clock_out_method" text,
	"total_hours" real,
	"is_late" boolean,
	"late_minutes" integer,
	"overtime_hours" real,
	"is_absence" boolean,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"user_id" uuid,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cash_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_name" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"opening_balance" real,
	"closing_balance" real,
	"expected_balance" real,
	"status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"pin" text,
	"phone" text,
	"email" text,
	"nif" text,
	"address" text,
	"salary" real,
	"is_active" boolean DEFAULT true,
	"admission_date" date,
	"social_security_number" text,
	"bank_account" text,
	"bi" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"date" date NOT NULL,
	"category" text,
	"payment_method" text,
	"supplier_id" uuid,
	"notes" text,
	"status" text DEFAULT 'PENDENTE',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"parent_id" uuid,
	"is_available_on_digital_menu" boolean DEFAULT true,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"product_id" uuid,
	"quantity" real NOT NULL,
	"unit_price" real NOT NULL,
	"tax_amount" real DEFAULT 0,
	"tax_percentage" real DEFAULT 14,
	"tax_code" text DEFAULT 'NOR',
	"notes" text,
	"status" text DEFAULT 'PENDENTE',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" text,
	"status" text DEFAULT 'ABERTO' NOT NULL,
	"total" real DEFAULT 0,
	"tax_total" real DEFAULT 0,
	"user_id" uuid,
	"user_name" text,
	"customer_nif" text,
	"customer_id" text,
	"shift_id" text,
	"sub_account_name" text,
	"invoice_number" text,
	"hash" text,
	"previous_hash" text,
	"signature" text,
	"jws_payload" jsonb,
	"is_synced_agt" integer DEFAULT 0,
	"agt_submission_uuid" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"closed_at" timestamp,
	"notes" text,
	"payment_method" text,
	"split_payments" jsonb,
	"customer_name" text
);
--> statement-breakpoint
CREATE TABLE "payroll_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid,
	"amount" real NOT NULL,
	"date" date NOT NULL,
	"month" integer,
	"year" integer,
	"status" text,
	"net_salary" real,
	"base_salary" real,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" real NOT NULL,
	"cost_price" real DEFAULT 0,
	"category_id" uuid,
	"image_url" text,
	"tax_code" text DEFAULT 'NOR',
	"tax_percentage" real DEFAULT 14,
	"preparation_time" integer,
	"is_active" boolean DEFAULT true,
	"available" boolean DEFAULT true,
	"is_available_on_digital_menu" boolean DEFAULT true,
	"track_stock" boolean DEFAULT false,
	"stock_quantity" real DEFAULT 0,
	"min_stock_quantity" real DEFAULT 0,
	"max_stock_quantity" real,
	"unit" text DEFAULT 'unidade',
	"supplier_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"name" text,
	"zone" text DEFAULT 'INTERIOR',
	"seats" integer DEFAULT 4,
	"status" text DEFAULT 'LIVRE',
	"x" real DEFAULT 0,
	"y" real DEFAULT 0,
	"width" integer DEFAULT 1,
	"height" integer DEFAULT 1,
	"shape" text,
	"rotation" integer DEFAULT 0,
	"group_id" text,
	"label" text,
	"color" text,
	"user_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "revenues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" real NOT NULL,
	"date" date NOT NULL,
	"category" text,
	"description" text,
	"payment_method" text,
	"order_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"quantity" real DEFAULT 0,
	"unit" text DEFAULT 'un',
	"min_threshold" real DEFAULT 5,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"nif" text,
	"contact" text,
	"email" text,
	"address" text,
	"category" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" real NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"category" text,
	"payment_method" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_dishes_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;