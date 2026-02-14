// Supabase Edge Function: owner-events
// Descrição: Stream de eventos SSE para o Owner Dashboard com Rate Limiting básico.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting em memória (simples para demonstração em uma única instância)
// Para produção global, recomenda-se Upstash Redis.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 50; // requisições por janela
const WINDOW_MS = 60 * 1000; // 1 minuto

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Rate Limiting Check
    const ip = req.headers.get("x-real-ip") || "anonymous";
    const now = Date.now();
    const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - rateData.lastReset > WINDOW_MS) {
      rateData.count = 0;
      rateData.lastReset = now;
    }

    rateData.count++;
    rateLimitMap.set(ip, rateData);

    if (rateData.count > LIMIT) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Autenticação e Role Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Auth Header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar role via custom claims ou tabela de usuários
    // Assume-se que o role está nas claims (ex: app_metadata)
    const role = user.app_metadata?.role || user.user_metadata?.role;
    if (role !== "owner") {
      return new Response(JSON.stringify({ error: "Forbidden: Owner access required" }), {
        status: 0,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. SSE Stream Setup
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Enviar mensagem de boas-vindas
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message: "Connected to Owner Events" })}\n\n`));

        // Exemplo: Ouvir mudanças em tempo real no banco e repassar via SSE
        const channel = supabaseClient
          .channel("owner-dashboard-changes")
          .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
            const msg = `data: ${JSON.stringify(payload)}\n\n`;
            controller.enqueue(encoder.encode(msg));
          })
          .subscribe();

        // Keep-alive a cada 15 segundos
        const keepAliveInterval = setInterval(() => {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        }, 15000);

        // Limpeza ao fechar conexão
        req.signal.addEventListener("abort", () => {
          clearInterval(keepAliveInterval);
          supabaseClient.removeChannel(channel);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
