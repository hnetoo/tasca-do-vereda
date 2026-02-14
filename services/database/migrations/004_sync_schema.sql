create table if not exists categories (
  id text primary key,
  name text not null,
  icon text,
  sort_order integer default 0,
  parent_id text,
  deleted_at timestamp null
);

create table if not exists menu_items (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  category_id text references categories(id) on delete set null,
  image_url text,
  available boolean default true,
  tax_rate numeric default 14,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_menu_items_category on menu_items(category_id);
create index if not exists idx_menu_items_available on menu_items(available);

create table if not exists restaurant_settings (
  id text primary key,
  name text not null,
  logo_url text,
  currency text,
  phone text,
  address text,
  wifi_name text,
  wifi_password text,
  qr_code_title text,
  qr_code_subtitle text,
  qr_code_short_code text,
  qr_menu_url text,
  qr_menu_cloud_url text
);

create table if not exists users (
  id text primary key,
  name text not null,
  role text not null,
  pin text not null,
  active boolean default true
);

create table if not exists employees (
  id text primary key,
  name text not null,
  role text,
  phone text,
  salary numeric,
  status text,
  color text,
  work_days_per_month integer,
  daily_work_hours integer,
  external_bio_id text,
  bi text,
  nif text
);

create table if not exists attendance_records (
  id text primary key,
  employee_id text references employees(id) on delete cascade,
  date date not null,
  clock_in timestamp not null,
  clock_out timestamp null,
  status text,
  clock_in_method text,
  clock_out_method text
);

create table if not exists payroll_records (
  id text primary key,
  employee_id text references employees(id) on delete cascade,
  amount numeric,
  date date,
  month integer,
  year integer,
  status text,
  net_salary numeric,
  base_salary numeric,
  notes text
);

create table if not exists stock_items (
  id text primary key,
  name text not null,
  quantity numeric not null,
  unit text,
  min_threshold numeric default 0
);

create table if not exists suppliers (
  id text primary key,
  nome text not null,
  nif text,
  telefone text,
  email text,
  endereco text,
  ativo boolean default true,
  categoria text
);

create table if not exists revenues (
  id text primary key,
  amount numeric not null,
  date date not null,
  category text,
  description text,
  payment_method text
);

create table if not exists expenses (
  id text primary key,
  amount numeric not null,
  date date not null,
  category text,
  description text,
  status text
);

create table if not exists dashboard_summary (
  id text primary key,
  total_revenue numeric default 0,
  total_orders integer default 0,
  active_orders_count integer default 0,
  last_updated timestamp default now()
);

create table if not exists active_orders_snapshot (
  id text primary key,
  table_id text,
  status text,
  total numeric,
  items_count integer,
  created_at timestamp
);

create table if not exists audit_logs (
  id bigserial primary key,
  timestamp timestamp not null,
  level text,
  message text,
  context text,
  details text
);

create table if not exists restaurant_tables (
  id text primary key,
  name text,
  seats integer,
  status text,
  current_order_id text,
  x numeric,
  y numeric,
  width numeric,
  height numeric,
  zone text,
  shape text,
  rotation numeric,
  groupId text,
  label text,
  color text,
  userId text
);

create index if not exists idx_categories_name on categories(name);
create index if not exists idx_dishes_name on menu_items(name);
create index if not exists idx_audit_logs_timestamp on audit_logs(timestamp);

