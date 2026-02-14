/**
 * 💰 CÁLCULO DE SALÁRIOS - SISTEMA ANGOLANO
 * 
 * Baseado na legislação laboral angolana:
 * - IRT (Imposto sobre o Rendimento do Trabalho)
 * - INSS (Instituto Nacional de Segurança Social)
 * - Deduções permitidas
 * 
 * Data de Atualização: 2024
 */

export interface SalaryBreakdown {
  salarioBase: number;
  irt: number;
  inss: number;
  deducoes: number;
  salarioLiquido: number;
  salarioDiario: number;
  salarioHorario: number;
}

export interface EmployeeSalaryData {
  name: string;
  role: string;
  salarioBase: number;
  breakdown: SalaryBreakdown;
}

/**
 * TABELA IRT 2024 - ANGOLA
 * Escalões de imposto sobre rendimento do trabalho
 */
const IRT_BRACKETS_2024 = [
  { min: 0, max: 39_999, rate: 0 },           // Até 40k - Isento
  { min: 40_000, max: 99_999, rate: 0.08 },   // 40k a 100k - 8%
  { min: 100_000, max: 199_999, rate: 0.10 }, // 100k a 200k - 10%
  { min: 200_000, max: 299_999, rate: 0.12 }, // 200k a 300k - 12%
  { min: 300_000, max: 999_999, rate: 0.15 }, // 300k+ - 15%
];

/**
 * Calcular IRT (Imposto sobre o Rendimento do Trabalho)
 * Angola 2024
 */
export const calculateIRT = (salarioBase: number): number => {
  // Dedução de Independência Pessoal (valor fixo)
  const deducaoIP = 50_000; // 50.000 Kz por mês
  
  // Salário tributável = Base - Dedução IP
  const salarioTributavel = Math.max(0, salarioBase - deducaoIP);

  // Se abaixo de 40k, isento
  if (salarioTributavel <= 40_000) {
    return 0;
  }

  // Aplicar escalão correto
  let irt = 0;
  for (const bracket of IRT_BRACKETS_2024) {
    if (salarioTributavel >= bracket.min && salarioTributavel <= bracket.max) {
      const excesso = salarioTributavel - bracket.min;
      irt = excesso * bracket.rate;
      break;
    }
    // Se passar do máximo deste escalão, calcula até ao máximo
    if (salarioTributavel > bracket.max && bracket.max >= bracket.min) {
      const excesso = bracket.max - bracket.min;
      irt += excesso * bracket.rate;
    }
  }

  return Math.round(irt);
};

/**
 * Calcular INSS (Contribuição do Trabalhador)
 * Angola 2024: 3.6% sobre o salário base
 */
export const calculateINSS = (salarioBase: number): number => {
  const INSS_RATE = 0.036; // 3.6%
  return Math.round(salarioBase * INSS_RATE);
};

/**
 * Calcular Deduções Adicionais
 * (refeições, transporte, etc.)
 */
export const calculateDeductions = (_salarioBase: number, role: string): number => {
  let deducoes = 0;

  // Subsídio de Refeição (se não fornecido)
  // ~15.000-20.000 Kz por mês em Luanda
  if (role === 'GARCOM' || role === 'COZINHA') {
    deducoes += 0; // Já pode estar incluído no salário
  }

  // Outros descontos adicionais
  // (uniforme, etc. - normalmente deduzido mensalmente)
  // deducoes += 5_000;

  return deducoes;
};

/**
 * Calcular Salário Líquido Completo
 */
export const calculateSalaryBreakdown = (
  salarioBase: number,
  role: string,
  workDaysPerMonth: number = 22,
  dailyWorkHours: number = 8
): SalaryBreakdown => {
  const irt = calculateIRT(salarioBase);
  const inss = calculateINSS(salarioBase);
  const deducoes = calculateDeductions(salarioBase, role);

  const salarioLiquido = salarioBase - irt - inss - deducoes;
  
  // Cálculos auxiliares
  const salarioDiario = Math.round(salarioBase / workDaysPerMonth);
  const salarioHorario = Math.round(salarioDiario / dailyWorkHours);

  return {
    salarioBase,
    irt,
    inss,
    deducoes,
    salarioLiquido: Math.max(0, salarioLiquido), // Nunca negativo
    salarioDiario,
    salarioHorario,
  };
};

/**
 * DADOS DE FUNCIONÁRIOS EXEMPLO - RESTAURANTE EM LUANDA
 * Com salários realistas para Angola
 */
export const MOCK_EMPLOYEES_ANGOLA = [
  {
    name: 'António Luanda',
    role: 'GARCOM',
    phone: '923000001',
    salarioBase: 150_000, // 150k Kz/mês
    color: '#06b6d4',
    workDaysPerMonth: 22,
    dailyWorkHours: 8,
    externalBioId: 'BIO-001',
    bi: '002345678LA078',
    nif: '123456789001',
  },
  {
    name: 'Maria Benguela',
    role: 'COZINHA',
    phone: '923000002',
    salarioBase: 180_000, // 180k Kz/mês (Chef)
    color: '#f59e0b',
    workDaysPerMonth: 22,
    dailyWorkHours: 8,
    externalBioId: 'BIO-002',
    bi: '002567890BG089',
    nif: '123456789002',
  },
  {
    name: 'João Huíla',
    role: 'GARCOM',
    phone: '923000003',
    salarioBase: 120_000, // 120k Kz/mês
    color: '#ec4899',
    workDaysPerMonth: 22,
    dailyWorkHours: 8,
    externalBioId: 'BIO-003',
    bi: '002789012HU090',
    nif: '123456789003',
  },
  {
    name: 'Francisca Moçâmedes',
    role: 'CAIXA',
    phone: '923000004',
    salarioBase: 160_000, // 160k Kz/mês
    color: '#10b981',
    workDaysPerMonth: 22,
    dailyWorkHours: 8,
    externalBioId: 'BIO-004',
    bi: '002901234MO091',
    nif: '123456789004',
  },
  {
    name: 'Geraldo Cabinda',
    role: 'ADMIN',
    phone: '923000005',
    salarioBase: 350_000, // 350k Kz/mês (Gerente)
    color: '#8b5cf6',
    workDaysPerMonth: 22,
    dailyWorkHours: 8,
    externalBioId: 'BIO-005',
    bi: '002123456CB092',
    nif: '123456789005',
  },
  {
    name: 'Célia Zaire',
    role: 'GARCOM',
    phone: '923000006',
    salarioBase: 130_000, // 130k Kz/mês
    color: '#f97316',
    workDaysPerMonth: 22,
    dailyWorkHours: 8,
    externalBioId: 'BIO-006',
    bi: '002345678ZA093',
    nif: '123456789006',
  },
];

/**
 * Formatador de Moeda Angolana
 */
export const formatKzDetailed = (value: number): string => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Gerar Relatório de Salário Completo
 */
export const generateSalaryReport = (
  name: string,
  salarioBase: number,
  role: string,
  workDaysPerMonth: number = 22,
  dailyWorkHours: number = 8
): EmployeeSalaryData => {
  return {
    name,
    role,
    salarioBase,
    breakdown: calculateSalaryBreakdown(salarioBase, role, workDaysPerMonth, dailyWorkHours),
  };
};

/**
 * Calcular Hora Extra (50% sobre o salário horário)
 */
export const calculateOvertimeHour = (salarioBase: number, hoursWorked: number, dailyWorkHours: number = 8): number => {
  const salarioHorario = Math.round(salarioBase / (22 * dailyWorkHours));
  const overtimeMultiplier = 1.5; // 150%
  return Math.round(salarioHorario * overtimeMultiplier * hoursWorked);
};

/**
 * Calcular Dias de Férias (Máximo 30 dias de férias remuneradas)
 * Lei do Trabalho Angolana
 */
export const calculateVacationBonus = (salarioBase: number, daysOfVacation: number = 30): number => {
  const salarioDiario = Math.round(salarioBase / 22);
  const vacationDaysLimited = Math.min(daysOfVacation, 30);
  return salarioDiario * vacationDaysLimited;
};

/**
 * Calcular Bónus de Fim de Ano (Gratificação)
 * Angola: Típico 1/12 do salário anual por cada ano trabalhado
 */
export const calculateYearEndBonus = (salarioBase: number, yearsWorked: number = 1): number => {
  return Math.round((salarioBase * 12 * yearsWorked) / 12);
};

/**
 * Tabela de Referência de Salários Mínimos Angola
 * Por Categoria Profissional
 */
export const MINIMUM_WAGES_ANGOLA = {
  GARCOM: 120_000,        // 120k Kz (atendimento)
  COZINHA: 140_000,       // 140k Kz (chefs)
  CAIXA: 130_000,         // 130k Kz (operadores)
  ADMIN: 200_000,         // 200k Kz (gestão/admin)
  LIMPEZA: 100_000,       // 100k Kz (serviços gerais)
} as const;

/**
 * Validar se salário está acima do mínimo legal
 */
export const validateMinimumWage = (role: string, salary: number): boolean => {
  const minimumWage = MINIMUM_WAGES_ANGOLA[role as keyof typeof MINIMUM_WAGES_ANGOLA];
  return salary >= minimumWage;
};
