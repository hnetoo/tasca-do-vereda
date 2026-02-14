import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Order, Dish, AIMonthlyReport } from "../types";
import { logger } from "./logger";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!apiKey) return null;
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

const cleanJsonString = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const analyzeBusinessPerformance = async (
  orders: Order[], 
  menu: Dish[]
): Promise<AIAnalysisResult> => {
  const salesTotal = orders.reduce((acc, o) => acc + o.total, 0);
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
    // Correct usage of generateContent with gemini-3-flash-preview and property access for .text
    const client = getAI();
    if (!client) {
      throw new Error('API key ausente para IA');
    }
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJsonString(text)) as AIAnalysisResult;
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("Erro na IA: Business Performance", { error: error.message }, 'AI');
    return {
      summary: "Não foi possível analisar os dados no momento.",
      recommendation: "Tente novamente mais tarde.",
      trend: "stable"
    };
  }
};

export const getMenuSuggestion = async (ingredients: string): Promise<string> => {
  try {
    // Correct usage of generateContent with gemini-3-flash-preview and property access for .text
    const client = getAI();
    if (!client) {
      throw new Error('API key ausente para IA');
    }
    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Sugira um prato especial do dia usando estes ingredientes principais: ${ingredients}. Dê um nome criativo e uma descrição curta e apetitosa. Estilo: Culinária Angolana Fusion.`
    });
    return response.text || "Sem sugestão.";
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("Erro na IA: Menu Suggestion", { error: error.message }, 'AI');
    return "Erro ao gerar sugestão.";
  }
}

export const generateMonthlyReport = async (orders: Order[], menu: Dish[], monthName: string): Promise<AIMonthlyReport | null> => {
  const salesTotal = orders.reduce((acc, o) => acc + o.total, 0);
  // Simplification: In a real app, we would aggregate items here to find top sellers to pass to AI
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
    // Correct usage of generateContent with gemini-3-flash-preview, text property and responseSchema
    const client = getAI();
    if (!client) {
      throw new Error('API key ausente para IA');
    }
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.STRING },
            totalRevenue: { type: Type.NUMBER },
            topSellingItem: { type: Type.STRING },
            strategicAdvice: { type: Type.STRING },
            operationalEfficiency: { type: Type.STRING },
            customerSentiment: { type: Type.STRING },
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(cleanJsonString(response.text)) as AIMonthlyReport;
    }
    return null;
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("Erro na IA: Monthly Report", { error: error.message }, 'AI');
    return null;
  }
}
