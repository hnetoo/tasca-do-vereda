export const DATABASE_SCHEMA = `
-- Tabela de Usuários do Sistema
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pin TEXT NOT NULL,
    isActive BOOLEAN DEFAULT TRUE
);

-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    salary REAL DEFAULT 0,
    status TEXT DEFAULT 'ATIVO',
    color TEXT,
    work_days_per_month INTEGER DEFAULT 22,
    daily_work_hours INTEGER DEFAULT 8,
    external_bio_id TEXT,
    bi TEXT,
    nif TEXT
);

-- Tabela de Categorias do Menu
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de Pratos (Dishes)
CREATE TABLE IF NOT EXISTS dishes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    preco_custo REAL DEFAULT 0,
    category_id TEXT,
    image TEXT,
    tax_code TEXT,
    tax_percentage DECIMAL(5,2),
    tempo_preparo INTEGER,
    is_available BOOLEAN DEFAULT TRUE,
    is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
    controla_estoque BOOLEAN DEFAULT FALSE,
    quantidade_estoque REAL DEFAULT 0,
    quantidade_minima REAL DEFAULT 0,
    quantidade_maxima REAL,
    unidade_medida TEXT DEFAULT 'unidade',
    fornecedor_padrao_id TEXT,
    FOREIGN KEY(category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
    FOREIGN KEY(fornecedor_padrao_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Tabela de Mesas
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    seats INTEGER DEFAULT 4,
    status TEXT DEFAULT 'LIVRE',
    current_order_id TEXT,
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    zone TEXT DEFAULT 'INTERIOR',
    shape TEXT DEFAULT 'SQUARE',
    rotation INTEGER DEFAULT 0,
    groupId TEXT,
    label TEXT,
    color TEXT,
    userId TEXT
);

-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    nif TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    categoria TEXT
);

-- Tabela de Despesas
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT,
    amount REAL,
    date TEXT,
    category TEXT
);

-- Tabela de Receitas
CREATE TABLE IF NOT EXISTS revenues (
    id TEXT PRIMARY KEY,
    description TEXT,
    amount REAL,
    date TEXT,
    category TEXT
);

-- Tabela de Processamentos Salariais
CREATE TABLE IF NOT EXISTS payroll_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    amount REAL,
    date TEXT,
    month INTEGER,
    year INTEGER,
    status TEXT,
    net_salary REAL,
    base_salary REAL,
    notes TEXT,
    FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Tabela de Turnos de Caixa
CREATE TABLE IF NOT EXISTS cash_shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    start_time TEXT,
    end_time TEXT,
    opening_balance REAL,
    closing_balance REAL,
    expected_balance REAL,
    status TEXT
);

-- Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    table_id INTEGER,
    status TEXT DEFAULT 'ABERTO',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL DEFAULT 0,
    tax_total REAL DEFAULT 0,
    payment_method TEXT,
    customer_id TEXT,
    shift_id TEXT,
    sub_account_name TEXT,
    invoice_number TEXT,
    hash TEXT,
    previous_hash TEXT,
    signature TEXT,
    jws_payload TEXT,
    is_synced_agt INTEGER DEFAULT 0,
    agt_submission_uuid TEXT,
    user_id TEXT,
    user_name TEXT
);

-- Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    dish_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    tax_amount REAL DEFAULT 0,
    tax_percentage REAL DEFAULT 14.0,
    tax_code TEXT DEFAULT 'NOR',
    notes TEXT,
    status TEXT DEFAULT 'PENDENTE',
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(dish_id) REFERENCES dishes(id)
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    nif TEXT,
    points INTEGER DEFAULT 0,
    visits INTEGER DEFAULT 0,
    last_visit DATETIME,
    balance REAL DEFAULT 0
);

-- Estoque
CREATE TABLE IF NOT EXISTS stock_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'un',
    min_threshold REAL DEFAULT 5
);

-- Registos de Presença (Biometria/Ponto)
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    clock_in DATETIME,
    clock_out DATETIME,
    total_hours REAL DEFAULT 0,
    is_late BOOLEAN DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    is_absence BOOLEAN DEFAULT 0,
    status TEXT,
    justification TEXT,
    source TEXT DEFAULT 'MANUAL',
    FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Configurações do Sistema (Single Row)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL -- JSON String
);
`;
