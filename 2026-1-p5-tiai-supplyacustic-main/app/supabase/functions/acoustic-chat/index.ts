import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurado");

    const systemPrompt = `Você é o AcustiAI, um assistente especialista em acústica arquitetônica. Responda sempre em português, de forma clara, técnica mas acessível.

CONTEXTO DO PROJETO:
- Projeto: ${context?.projectName || "N/A"}
- Tipo de ambiente: ${context?.roomFunction || "N/A"}
- Dimensões informadas: ${context?.dimensions?.length || "N/A"}m × ${context?.dimensions?.width || "N/A"}m × ${context?.dimensions?.height || "N/A"}m
- RT60 médio calculado: ${context?.rt60Average ? context.rt60Average.toFixed(2) + "s" : "N/A"}
- Análise realizada: ${context?.hasAnalysis ? "Sim" : "Não"}

MODELO 3D:
${context?.modelInfo?.loaded
  ? `- Arquivo carregado: ${context.modelInfo.fileName} (formato ${context.modelInfo.format})
${context.modelInfo.metrics
  ? `- Bounding box do modelo: ${context.modelInfo.metrics.bboxWidth}m (L) × ${context.modelInfo.metrics.bboxHeight}m (A) × ${context.modelInfo.metrics.bboxDepth}m (P)
- Volume estimado a partir do modelo: ${context.modelInfo.metrics.volume} m³
- Área de superfície estimada (caixa envolvente): ${context.modelInfo.metrics.surfaceArea} m²
- Use estas medidas do modelo 3D como referência geométrica adicional ao raciocinar sobre o ambiente.`
  : `- Métricas do modelo ainda não calculadas no cliente (o usuário pode não ter aberto a aba Ambiente). Baseie-se nas dimensões informadas.`}`
  : `- Nenhum modelo 3D carregado. Use apenas as dimensões informadas acima.`}

Você pode responder perguntas sobre:
- Tempo de reverberação (RT60, fórmula de Sabine)
- Materiais acústicos e coeficientes de absorção
- Tratamentos acústicos (painéis absorvedores, difusores, bass traps)
- Problemas comuns: flutter echo, ecos, reverberação excessiva
- Recomendações específicas para o tipo de ambiente
- Posicionamento de elementos acústicos

Seja conciso e use markdown para formatar respostas longas.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      throw new Error(`AI error: ${response.status} ${t}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("acoustic-chat error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});