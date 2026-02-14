import { FullApplicationState, MenuCategory, Dish, Order, Employee, StockItem, Expense, Revenue, CashShift, PayrollRecord, SystemSettings, User, AttendanceRecord, Customer, Fornecedor, Table } from "./types";

// Helper function to generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Function to generate a sample FullApplicationState
export const generateSampleFullApplicationState = (): FullApplicationState => {
    const timestamp = new Date().toISOString();

    const sampleCategory: MenuCategory = {
        id: generateId(),
        name: "Bebidas",
        description: "Bebidas diversas",
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        parent_id: null,
        is_available_on_digital_menu: true
    };

    const sampleDish: Dish = {
        id: generateId(),
        name: "Coca-Cola",
        description: "Lata de 33cl",
        price: 150,
        precoCusto: 50,
        categoryId: sampleCategory.id,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        stock_item_id: null,
        image_url: null,
        barcode: null,
        sku: null,
        unit_of_measure: 'UN',
        servings: 1,
        preparation_time: 1,
        is_available_on_digital_menu: true,
        tax_rate: 0.14,
        tax_code: 'NOR'
    };

    const sampleOrder: Order = {
        id: generateId(),
        tableId: 1,
        items: [{
            dishId: sampleDish.id,
            quantity: 2,
            unitPrice: sampleDish.price,
            taxAmount: sampleDish.price * sampleDish.tax_rate,
            taxPercentage: sampleDish.tax_rate * 100,
            taxCode: sampleDish.tax_code,
            notes: null,
            status: 'PENDENTE'
        }],
        status: 'ABERTO',
        timestamp: new Date(),
        total: sampleDish.price * 2 * (1 + sampleDish.tax_rate),
        taxTotal: sampleDish.price * 2 * sampleDish.tax_rate,
        shiftId: generateId(),
        userId: generateId(),
        userName: "Test User",
        customerName: null,
        paymentMethod: null,
        payments: [],
        paymentCorrectionHistory: [],
        customerId: null,
        hash: null,
        previous_hash: null,
        invoiceNumber: null,
        jws_payload: null,
        is_synced_agt: false,
        agt_submission_uuid: null,
        completed_at: null
    };

    const sampleEmployee: Employee = {
        id: generateId(),
        name: "João Silva",
        role: "GARCOM",
        salary: 50000,
        phone: "912345678",
        email: "joao.silva@example.com",
        admissionDate: timestamp,
        active: true,
        nif: "123456789",
        socialSecurityNumber: "987654321",
        bankAccount: "AO0600000000000000000000000",
        status: "ATIVO",
        color: "#FF5733",
        workDaysPerMonth: 22,
        dailyWorkHours: 8,
        externalBioId: "EMP001",
        bi: "123456789LA000"
    };

    const sampleStockItem: StockItem = {
        id: generateId(),
        name: "Arroz",
        quantity: 10,
        unit: "KG",
        min_stock_level: 2,
        supplier_id: generateId(),
        price: 500,
        last_restock: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        barcode: null,
        sku: null,
        category: "Mercearia",
        location: "Armazém",
        notes: null
    };

    const sampleExpense: Expense = {
        id: generateId(),
        description: "Renda do mês",
        amount: 100000,
        date: timestamp,
        category: "Despesas Fixas",
        paymentMethod: "Transferência",
        notes: null,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
    };

    const sampleRevenue: Revenue = {
        id: generateId(),
        description: "Venda de bebidas",
        amount: 3000,
        date: timestamp,
        category: "Vendas",
        paymentMethod: "Dinheiro",
        notes: null,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
    };

    const sampleShift: CashShift = {
        id: generateId(),
        start_time: timestamp,
        end_time: null,
        initial_cash: 5000,
        final_cash: null,
        user_id: sampleEmployee.id,
        user_name: sampleEmployee.name,
        status: "OPEN",
        notes: null,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
    };

    const samplePayrollRecord: PayrollRecord = {
        id: generateId(),
        employeeId: sampleEmployee.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        baseSalary: sampleEmployee.salary,
        bonus: 0,
        deductions: 0,
        netSalary: sampleEmployee.salary,
        paid: false,
        paymentDate: null,
        status: "PENDENTE",
        workDays: 22,
        totalWorkDays: 22,
        latenessHours: 0,
        latenessDeduction: 0,
        absenceDays: 0,
        absenceDeduction: 0,
        overtimeHours: 0,
        overtimeBonus: 0,
        lateMinutes: 0,
        paymentMethod: null,
        processedBy: null,
        notes: null,
        grossSalary: sampleEmployee.salary,
        irtAdjusted: 0,
        inss: 0
    };

    const sampleSettings: SystemSettings = {
        restaurantName: "Tasca do Vereda Teste",
        currency: "AOA",
        taxRate: 0.14,
        apiToken: "test_token",
        webhookEnabled: false,
        nif: "987654321",
        address: "Rua do Teste, 123",
        phone: "999888777",
        qrMenuUrl: "http://test.com/menu",
        qrMenuShortCode: "TESTMENU",
        printerConfig: {
            type: "EPSON",
            address: "192.168.1.100",
            port: 9100
        },
        fiscalConfig: {
            enabled: true,
            terminalId: "T1",
            softwareId: "S1",
            developerId: "D1"
        },
        sqlServerConfig: {
            enabled: false,
            connectionString: "",
            autoSync: false,
            syncInterval: 60,
            lastSync: null
        },
        theme: "dark",
        language: "pt",
        loyaltyProgramEnabled: true,
        inventoryTrackingEnabled: true,
        employeeManagementEnabled: true,
        customerManagementEnabled: true,
        tableManagementEnabled: true,
        shiftManagementEnabled: true,
        payrollManagementEnabled: true,
        digitalMenuEnabled: true,
        kdsEnabled: false,
        posMode: "FULL",
        lastBackup: timestamp,
        lastDataClear: null,
        security: {
            encryptionEnabled: true,
            dataRetentionDays: 365,
            auditLoggingEnabled: true
        },
        updates: {
            autoUpdateEnabled: true,
            lastCheck: timestamp,
            availableVersion: null
        },
        notifications: {
            emailEnabled: false,
            smsEnabled: false
        },
        integrations: {
            biometricEnabled: false,
            accountingSoftware: null
        },
        version: "1.0.0-test"
    };

    const sampleUser: User = {
        id: generateId(),
        name: "Admin Teste",
        pin: "1234",
        role: "ADMIN",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        last_login: timestamp,
        is_active: true
    };

    const sampleAttendance: AttendanceRecord = {
        id: generateId(),
        employeeId: sampleEmployee.id,
        timestamp: timestamp,
        type: "CLOCK_IN",
        totalHours: 8,
        isLate: false,
        lateMinutes: 0,
        overtimeHours: 0,
        isAbsence: false,
        status: "PRESENTE",
        justification: null,
        source: "MANUAL",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
    };

    const sampleCustomer: Customer = {
        id: generateId(),
        name: "Cliente Teste",
        phone: "911222333",
        email: "cliente.teste@example.com",
        address: "Rua do Cliente, 456",
        nif: "111222333",
        loyalty_points: 100,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
    };

    const sampleSupplier: Fornecedor = {
        id: generateId(),
        name: "Fornecedor Teste",
        contact_person: "Contacto Fornecedor",
        phone: "933444555",
        email: "fornecedor.teste@example.com",
        address: "Rua do Fornecedor, 789",
        nif: "444555666",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
    };

    const sampleTable: Table = {
        id: 1,
        name: "Mesa 1",
        capacity: 4,
        status: "AVAILABLE",
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
    };

    return {
        categories: [sampleCategory],
        menu: [sampleDish],
        orders: [sampleOrder],
        employees: [sampleEmployee],
        stock: [sampleStockItem],
        expenses: [sampleExpense],
        revenues: [sampleRevenue],
        shifts: [sampleShift],
        payrollRecords: [samplePayrollRecord],
        settings: sampleSettings,
        activeOrders: [sampleOrder],
        tables: [sampleTable],
        users: [sampleUser],
        attendance: [sampleAttendance],
        customers: [sampleCustomer],
        suppliers: [sampleSupplier],
        ideConfigs: {},
        assets: [],
        timestamp: timestamp
    };
};

const sampleState = generateSampleFullApplicationState();
console.log(JSON.stringify(sampleState, null, 2));
