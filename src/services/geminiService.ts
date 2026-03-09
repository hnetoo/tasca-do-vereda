import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIAnalysisResult, Order, Product, AIMonthlyReport } from "../types";
import { logger } from "./logger";

// Define SchemaType locally if not exported, or use strings if supported.
// Based on Google Generative AI SDK, SchemaType is an enum.
// If it's not exported, we might be using a version that defines it differently.
// For now, we will use string literals which are often accepted or try to avoid using the enum if possible.
// However, the error says 'SchemaType' is not exported.
// Let's try using the string values directly if the SDK supports it, or define a compatible enum.

const SchemaType = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  OBJECT: "OBJECT"
} as const;

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
let ai: GoogleGenerativeAI | null = null;

const getAI = () => {
  if (!apiKey) return null;
  if (!ai) {
    ai = new GoogleGenerativeAI(apiKey);
  }
  return ai;
};

const cleanJsonString = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const analyzeBusinessPerformance = async (
  orders: Order[], 
  menu: Product[]
): Promise<AIAnalysisResult> => {
  const salesTotal = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const orderCount = orders.length;
  const prompt = `
    Atue como um gerente de restaurante experiente. Analise os seguintes dados:
    Vendas totais: ${salesTotal} Kz.
    Número de pedidos: ${orderCount}.
    Itens do menu: ${menu.map(d => d.name).join(', ')}.
    
    Forneça um resumo curto em Português (PT-AO) sobre o desempenho, uma recomendação para aumentar vendas (ex: sugerir promoções para itens menos vendidos) e a tendência geral (up, down, stable).
    Retorne APENAS um JSON com as chaves: "summary", "recommendation", "trend".
  `;

  try {
    const client = getAI();
    if (!client) {
      throw new Error('API key ausente para IA');
    }
    
    const model = client.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
            responseMimeType: 'application/json'
        }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJsonString(text)) as AIAnalysisResult;
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("Erro na IA: Business Performance", { error: error.message }, 'AI');
    return {
      insights: ["Não foi possível analisar os dados no momento."],
      recommendations: ["Tente novamente mais tarde."],
      performance: { totalRevenue: 0, totalOrders: 0, averageTicket: 0, topDishes: [] },
      trends: { revenue: "stable", orders: "stable", customers: "stable" }
    } as unknown as AIAnalysisResult;
  }
};

export const getMenuSuggestion = async (ingredients: string): Promise<string> => {
  try {
    const client = getAI();
    if (!client) {
      throw new Error('API key ausente para IA');
    }

    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(
        `Sugira um prato especial do dia usando estes ingredientes principais: ${ingredients}. Dê um nome criativo e uma descrição curta e apetitosa. Estilo: Culinária Angolana Fusion.`
    );
    const response = await result.response;
    return response.text() || "Sem sugestão.";
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("Erro na IA: Menu Suggestion", { error: error.message }, 'AI');
    return "Erro ao gerar sugestão.";
  }
}

export const generateMonthlyReport = async (orders: Order[], menu: Product[], monthName: string): Promise<AIMonthlyReport | null> => {
  const salesTotal = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const sampleItems = orders.flatMap(o => o.items).length;
  const menuItems = menu.map(m => m.name).join(', ');

  const prompt = `
    Gere um relatório gerencial mensal detalhado para um restaurante em Angola.
    Mês: ${monthName}
    Faturamento Total: ${salesTotal} Kz
    Total Itens Vendidos: ${sampleItems}
    Menu Disponível: ${menuItems}
    
    Analise os dados (simulados se necessário para complementar a análise estratégica) e retorne um JSON com:
    - "month": Nome do mês
    - "totalRevenue": valor numérico do faturamento
    - "topSellingItem": Nome do prato mais provável de ser o mais vendido baseado na culinária angolana
    - "strategicAdvice": Um parágrafo detalhado com conselhos estratégicos para o próximo mês.
    - "operationalEfficiency": "Baixa", "Média" ou "Alta"
    - "customerSentiment": Uma frase curta sobre a percepção dos clientes.
  `;

  try {
    const client = getAI();
    if (!client) {
      throw new Error('API key ausente para IA');
    }

    const model = client.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT as any,
              properties: {
                month: { type: SchemaType.STRING as any },
                totalRevenue: { type: SchemaType.NUMBER as any },
                topSellingItem: { type: SchemaType.STRING as any },
                strategicAdvice: { type: SchemaType.STRING as any },
                operationalEfficiency: { type: SchemaType.STRING as any },
                customerSentiment: { type: SchemaType.STRING as any },
              },
              required: ["month", "totalRevenue", "topSellingItem", "strategicAdvice", "operationalEfficiency", "customerSentiment"]
            } as any
        }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (text) {
      return JSON.parse(cleanJsonString(text)) as AIMonthlyReport;
    }
    return null;
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("Erro na IA: Monthly Report", { error: error.message }, 'AI');
    return null;
  }
}
