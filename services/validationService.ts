import { MenuCategory, Dish, Order, SystemSettings, Employee, FullApplicationState } from "../types";


export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export const validationService = {
    // Utility to yield execution to the main thread
    yield: () => new Promise(resolve => setTimeout(resolve, 0)),

    validateCategories: async (categories: MenuCategory[]): Promise<ValidationResult> => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!Array.isArray(categories)) {
            errors.push("Categorias não são um array");
            return { isValid: false, errors, warnings };
        }

        // Chunking large arrays
        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            if (!cat.id) errors.push(`Categoria no índice ${i} sem ID`);
            if (!cat.name) errors.push(`Categoria ${cat.id || i} sem nome`);
            
            // Yield every 100 items
            if (i > 0 && i % 100 === 0) await validationService.yield();
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    validateMenu: async (menu: Dish[]): Promise<ValidationResult> => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!Array.isArray(menu)) {
            errors.push("Menu não é um array");
            return { isValid: false, errors, warnings };
        }

        for (let i = 0; i < menu.length; i++) {
            const dish = menu[i];
            if (!dish.id) errors.push(`Produto no índice ${i} sem ID`);
            if (!dish.name) errors.push(`Produto ${dish.id || i} sem nome`);
            if (dish.price === undefined || dish.price < 0) errors.push(`Produto ${dish.name || dish.id} com preço inválido`);
            if (!dish.categoryId) warnings.push(`Produto ${dish.name || dish.id} sem categoria associada`);

            if (i > 0 && i % 100 === 0) await validationService.yield();
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    validateSettings: (settings: SystemSettings): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!settings) {
            errors.push("Configurações não encontradas");
            return { isValid: false, errors, warnings };
        }

        if (!settings.restaurantName) errors.push("Nome do restaurante não configurado");
        if (!settings.currency) warnings.push("Moeda não configurada");

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    validateOrders: async (orders: Order[]): Promise<ValidationResult> => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!Array.isArray(orders)) {
            errors.push("Pedidos não são um array");
            return { isValid: false, errors, warnings };
        }

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            if (!order.id) errors.push(`Pedido no índice ${i} sem ID`);
            if (order.tableId === undefined) errors.push(`Pedido ${order.id || i} sem mesa associada`);
            if (!Array.isArray(order.items) || order.items.length === 0) {
                warnings.push(`Pedido ${order.id || i} sem itens`);
            }

            if (i > 0 && i % 50 === 0) await validationService.yield();
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    validateEmployees: async (employees: Employee[]): Promise<ValidationResult> => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!Array.isArray(employees)) {
            errors.push("Funcionários não são um array");
            return { isValid: false, errors, warnings };
        }

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            if (!emp.id) errors.push(`Funcionário no índice ${i} sem ID`);
            if (!emp.name) errors.push(`Funcionário ${emp.id || i} sem nome`);

            if (i > 0 && i % 100 === 0) await validationService.yield();
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    validateGenericArray: (data: unknown[], name: string): ValidationResult => {
        const errors: string[] = [];
        if (!Array.isArray(data)) {
            errors.push(`${name} não é um array`);
        }
        return { isValid: errors.length === 0, errors, warnings: [] };
    },

    validateFullState: async (state: Partial<FullApplicationState>): Promise<ValidationResult> => {
        const catRes = await validationService.validateCategories(state.categories || []);
        await validationService.yield();
        
        const menuRes = await validationService.validateMenu(state.menu || []);
        await validationService.yield();
        
        const settingsRes = validationService.validateSettings(state.settings);
        await validationService.yield();
        
        const ordersRes = await validationService.validateOrders(state.orders || state.activeOrders || []);
        await validationService.yield();
        
        const employeesRes = await validationService.validateEmployees(state.employees || []);
        await validationService.yield();
        
        // Add generic validation for remaining entities
        const stockRes = validationService.validateGenericArray(state.stock || [], "Stock");
        const expensesRes = validationService.validateGenericArray(state.expenses || [], "Despesas");
        const revenuesRes = validationService.validateGenericArray(state.revenues || [], "Receitas");
        const tablesRes = validationService.validateGenericArray(state.tables || [], "Mesas");
        const usersRes = validationService.validateGenericArray(state.users || [], "Utilizadores");
        const attendanceRes = validationService.validateGenericArray(state.attendance || [], "Assiduidade");
        const customersRes = validationService.validateGenericArray(state.customers || [], "Clientes");

        const errors = [
            ...catRes.errors, 
            ...menuRes.errors, 
            ...settingsRes.errors,
            ...ordersRes.errors,
            ...employeesRes.errors,
            ...stockRes.errors,
            ...expensesRes.errors,
            ...revenuesRes.errors,
            ...tablesRes.errors,
            ...usersRes.errors,
            ...attendanceRes.errors,
            ...customersRes.errors
        ];
        const warnings = [
            ...catRes.warnings, 
            ...menuRes.warnings, 
            ...settingsRes.warnings,
            ...ordersRes.warnings,
            ...employeesRes.warnings
        ];

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
};
