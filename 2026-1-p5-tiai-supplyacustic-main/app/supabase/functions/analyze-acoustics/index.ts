import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Fator de correção de espessura ──
// Materiais porosos mais espessos absorvem mais em baixas frequências.
// Modelamos uma correção simples: se a espessura especificada pelo usuário diferir da
// espessura do catálogo do material, escalamos a absorção em baixa frequência para cima/baixo.
function thicknessCorrection(
  baseAlpha: number,
  freq: number,
  catalogThicknessMm: number | null,
  overrideThicknessMm: number | null,
): number {
  if (!overrideThicknessMm || !catalogThicknessMm || catalogThicknessMm <= 0) return baseAlpha;
  const ratio = overrideThicknessMm / catalogThicknessMm;
  if (ratio === 1) return baseAlpha;
  // Frequências baixas se beneficiam mais do aumento de espessura
  // O fator de escala é mais forte em baixas frequências, negligível acima de 2 kHz
  let freqWeight = 0;
  if (freq <= 125) freqWeight = 0.6;
  else if (freq <= 250) freqWeight = 0.45;
  else if (freq <= 500) freqWeight = 0.3;
  else if (freq <= 1000) freqWeight = 0.15;
  else freqWeight = 0.05;

  const corrected = baseAlpha * (1 + freqWeight * (ratio - 1));
  return Math.max(0, Math.min(1, corrected));
}

// - Coeficiente de absorção do ar (ISO 9613-1 simplificado) 
// Em altas frequências e grandes volumes, a absorção pelo ar é relevante.
function airAbsorption(freq: number, tempC = 20, relHumidity = 50): number {
// Modelo simplificado: retorna absorção por metro (Nepers/m → convertido)
// Para condições internas típicas:
  const m: Record<number, number> = {
    125: 0.0,
    250: 0.0,
    500: 0.003,
    1000: 0.005,
    2000: 0.010,
    4000: 0.025,
  };
  return m[freq] ?? 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, analysisId, project } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

// ─Buscar dados completos dos materiais ─
    const materialIds = [project.wall_material_id, project.floor_material_id, project.ceiling_material_id].filter(Boolean);
    const { data: materials } = materialIds.length > 0
      ? await supabase.from("materials").select("*").in("id", materialIds)
      : { data: [] };

    const wallMat = materials?.find((m: any) => m.id === project.wall_material_id);
    const floorMat = materials?.find((m: any) => m.id === project.floor_material_id);
    const ceilingMat = materials?.find((m: any) => m.id === project.ceiling_material_id);

// ─ Buscar itens do inventário de mobiliário ─
    const inventory: Array<{ item_id: string; quantity: number }> = Array.isArray(project.furniture_inventory)
      ? project.furniture_inventory
      : [];
    const inventoryIds = inventory.map(e => e.item_id).filter(Boolean);
    const { data: furnitureCatalog } = inventoryIds.length > 0
      ? await supabase.from("furniture_items").select("*").in("id", inventoryIds)
      : { data: [] };

// ─ Dimensões ─
    const L = parseFloat(project.length_m) || 0;
    const W = parseFloat(project.width_m) || 0;
    const H = parseFloat(project.height_m) || 0;
    const volume = L * W * H;

    if (volume <= 0) throw new Error("Volume inválido. Verifique as dimensões.");

    const areaFloor = L * W;
    const areaCeiling = L * W;
    const areaWalls = 2 * (L * H) + 2 * (W * H);
    const totalSurfaceArea = areaFloor + areaCeiling + areaWalls;

// ─ Absorção do mobiliário por frequência (Sabins) ─
// Dois caminhos:
//  1. Inventário detalhado — soma sabins_<freq> × quantidade por item
//  2. Preset (occupancy_preset) — aplica fração do volume como Sabins adicionais
    const freqKeysRaw = ["125hz", "250hz", "500hz", "1000hz", "2000hz", "4000hz"] as const;

    const furnitureAbsorption: Record<string, number> = {
      "125hz": 0, "250hz": 0, "500hz": 0, "1000hz": 0, "2000hz": 0, "4000hz": 0,
    };
    let furnitureSource: "inventory" | "preset" | "none" = "none";

    if (inventory.length > 0 && furnitureCatalog && furnitureCatalog.length > 0) {
      furnitureSource = "inventory";
      for (const entry of inventory) {
        const item = furnitureCatalog.find((f: any) => f.id === entry.item_id);
        if (!item || !entry.quantity) continue;
        for (const fk of freqKeysRaw) {
          furnitureAbsorption[fk] += (item[`sabins_${fk}`] ?? 0) * entry.quantity;
        }
      }
    } else if (project.occupancy_preset && project.occupancy_preset !== "empty") {
      furnitureSource = "preset";
  // Multiplicadores empíricos — Sabins adicionados por m³ de volume do ambiente, por banda.
  // Mais plano em baixa frequência, maior absorção em média/alta (comportamento típico de tecido/pessoas).
      const presetFactors: Record<string, Record<string, number>> = {
        lightly:   { "125hz": 0.005, "250hz": 0.010, "500hz": 0.015, "1000hz": 0.018, "2000hz": 0.020, "4000hz": 0.020 },
        furnished: { "125hz": 0.012, "250hz": 0.022, "500hz": 0.035, "1000hz": 0.042, "2000hz": 0.045, "4000hz": 0.045 },
        crowded:   { "125hz": 0.020, "250hz": 0.038, "500hz": 0.060, "1000hz": 0.072, "2000hz": 0.078, "4000hz": 0.078 },
      };
      const factors = presetFactors[project.occupancy_preset] ?? presetFactors.lightly;
      for (const fk of freqKeysRaw) {
        furnitureAbsorption[fk] = factors[fk] * volume;
      }
    }

    // Entradas de mobiliário personalizadas (definidas pelo usuário, sabins @500Hz aplicados de forma uniforme em todas as bandas)
    const customFurniture: Array<{ name: string; quantity: number; sabins: number; description?: string }> =
      Array.isArray(project.custom_furniture) ? project.custom_furniture : [];
    let customTotalSabins = 0;
    for (const c of customFurniture) {
      const q = Number(c.quantity) || 0;
      const s = Number(c.sabins) || 0;
      if (q <= 0 || s < 0) continue;
      const contrib = q * s;
      customTotalSabins += contrib;
      for (const fk of freqKeysRaw) furnitureAbsorption[fk] += contrib;
    }
    if (customTotalSabins > 0 && furnitureSource === "none") furnitureSource = "preset";

    // ─ Cálculo Sabine por frequência com correções ─
    const freqs = [125, 250, 500, 1000, 2000, 4000] as const;
    const freqKeys = ["125hz", "250hz", "500hz", "1000hz", "2000hz", "4000hz"] as const;

    const rt60: Record<string, number> = {};
    const absorptionPerFreq: Record<string, number> = {};
    const alphaPerSurface: Record<string, Record<string, number>> = {
      wall: {}, floor: {}, ceiling: {},
    };

    for (let i = 0; i < freqs.length; i++) {
      const freq = freqs[i];
      const key = `absorption_${freqKeys[i]}`;

      // Obter coeficientes de absorção base
      let wallAlpha = (wallMat?.[key] ?? 0.02) as number;
      let floorAlpha = (floorMat?.[key] ?? 0.02) as number;
      let ceilingAlpha = (ceilingMat?.[key] ?? 0.03) as number;

      // Aplicar correção de espessura
      wallAlpha = thicknessCorrection(wallAlpha, freq, wallMat?.thickness_mm, project.wall_thickness_mm);
      floorAlpha = thicknessCorrection(floorAlpha, freq, floorMat?.thickness_mm, project.floor_thickness_mm);
      ceilingAlpha = thicknessCorrection(ceilingAlpha, freq, ceilingMat?.thickness_mm, project.ceiling_thickness_mm);

      alphaPerSurface.wall[freqKeys[i]] = wallAlpha;
      alphaPerSurface.floor[freqKeys[i]] = floorAlpha;
      alphaPerSurface.ceiling[freqKeys[i]] = ceilingAlpha;

      // Absorção total (Sabine) = Σ(α_i × S_i) + Σ(N_j × a_j) + 4mV
      const surfaceAbsorption = wallAlpha * areaWalls + floorAlpha * areaFloor + ceilingAlpha * areaCeiling;
      const airAbs = airAbsorption(freq) * 4 * volume;
      const furnAbs = furnitureAbsorption[freqKeys[i]] ?? 0;
      const totalAbsorption = surfaceAbsorption + furnAbs + airAbs;

      absorptionPerFreq[freqKeys[i]] = totalAbsorption;

      // Sabine: RT60 = 0,161 × V / A
      rt60[freqKeys[i]] = totalAbsorption > 0 ? (0.161 * volume) / totalAbsorption : 0;
    }

    const rt60Values = Object.values(rt60);
    const rt60Average = rt60Values.reduce((a, b) => a + b, 0) / rt60Values.length;

    // ─ NRC por superfície ─
    const calcNRC = (mat: any) => {
      if (!mat) return 0;
      return (
        (mat.absorption_250hz + mat.absorption_500hz + mat.absorption_1000hz + mat.absorption_2000hz) / 4
      );
    };
    const wallNRC = calcNRC(wallMat);
    const floorNRC = calcNRC(floorMat);
    const ceilingNRC = calcNRC(ceilingMat);

    // ─ Valores STC ─
    const wallSTC = wallMat?.stc ?? null;
    const floorSTC = floorMat?.stc ?? null;
    const ceilingSTC = ceilingMat?.stc ?? null;

    // ─ Tipos de material ─
    const wallType = wallMat?.material_type ?? "desconhecido";
    const floorType = floorMat?.material_type ?? "desconhecido";
    const ceilingType = ceilingMat?.material_type ?? "desconhecido";

    // ─ Absorção total a 500Hz para armazenamento ─
    const totalAbsorption500 = absorptionPerFreq["500hz"] ?? 0;

    // ─ Análise por IA ─
    const prompt = `Você é um especialista em acústica arquitetônica. Analise este ambiente e forneça um relatório técnico detalhado em português.

DADOS DO AMBIENTE:
- Projeto: ${project.name || "Sem nome"}
- Função: ${project.room_function}
- Dimensões: ${L}m (C) × ${W}m (L) × ${H}m (A)
- Volume: ${volume.toFixed(1)} m³
- Área total de superfícies: ${totalSurfaceArea.toFixed(1)} m²
  - Paredes: ${areaWalls.toFixed(1)} m²
  - Piso: ${areaFloor.toFixed(1)} m²
  - Teto: ${areaCeiling.toFixed(1)} m²

MATERIAIS:
- Parede: ${wallMat?.name || "Não especificado"} (NRC: ${wallNRC.toFixed(2)}, STC: ${wallSTC ?? "N/A"}, Tipo: ${wallType}, Espessura: ${project.wall_thickness_mm ?? wallMat?.thickness_mm ?? "N/A"}mm, Densidade: ${wallMat?.density_kg_m3 ?? "N/A"} kg/m³)
- Piso: ${floorMat?.name || "Não especificado"} (NRC: ${floorNRC.toFixed(2)}, STC: ${floorSTC ?? "N/A"}, Tipo: ${floorType}, Espessura: ${project.floor_thickness_mm ?? floorMat?.thickness_mm ?? "N/A"}mm, Densidade: ${floorMat?.density_kg_m3 ?? "N/A"} kg/m³)
- Teto: ${ceilingMat?.name || "Não especificado"} (NRC: ${ceilingNRC.toFixed(2)}, STC: ${ceilingSTC ?? "N/A"}, Tipo: ${ceilingType}, Espessura: ${project.ceiling_thickness_mm ?? ceilingMat?.thickness_mm ?? "N/A"}mm, Densidade: ${ceilingMat?.density_kg_m3 ?? "N/A"} kg/m³)

COEFICIENTES DE ABSORÇÃO CORRIGIDOS POR FREQUÊNCIA:
Parede: 125Hz=${alphaPerSurface.wall["125hz"]?.toFixed(3)} | 250Hz=${alphaPerSurface.wall["250hz"]?.toFixed(3)} | 500Hz=${alphaPerSurface.wall["500hz"]?.toFixed(3)} | 1kHz=${alphaPerSurface.wall["1000hz"]?.toFixed(3)} | 2kHz=${alphaPerSurface.wall["2000hz"]?.toFixed(3)} | 4kHz=${alphaPerSurface.wall["4000hz"]?.toFixed(3)}
Piso: 125Hz=${alphaPerSurface.floor["125hz"]?.toFixed(3)} | 250Hz=${alphaPerSurface.floor["250hz"]?.toFixed(3)} | 500Hz=${alphaPerSurface.floor["500hz"]?.toFixed(3)} | 1kHz=${alphaPerSurface.floor["1000hz"]?.toFixed(3)} | 2kHz=${alphaPerSurface.floor["2000hz"]?.toFixed(3)} | 4kHz=${alphaPerSurface.floor["4000hz"]?.toFixed(3)}
Teto: 125Hz=${alphaPerSurface.ceiling["125hz"]?.toFixed(3)} | 250Hz=${alphaPerSurface.ceiling["250hz"]?.toFixed(3)} | 500Hz=${alphaPerSurface.ceiling["500hz"]?.toFixed(3)} | 1kHz=${alphaPerSurface.ceiling["1000hz"]?.toFixed(3)} | 2kHz=${alphaPerSurface.ceiling["2000hz"]?.toFixed(3)} | 4kHz=${alphaPerSurface.ceiling["4000hz"]?.toFixed(3)}

CÁLCULOS RT60 (Sabine com correção de ar):
- RT60 médio: ${rt60Average.toFixed(3)}s
- 125Hz: ${rt60["125hz"]?.toFixed(3)}s | 250Hz: ${rt60["250hz"]?.toFixed(3)}s | 500Hz: ${rt60["500hz"]?.toFixed(3)}s
- 1kHz: ${rt60["1000hz"]?.toFixed(3)}s | 2kHz: ${rt60["2000hz"]?.toFixed(3)}s | 4kHz: ${rt60["4000hz"]?.toFixed(3)}s

ABSORÇÃO TOTAL POR FREQUÊNCIA (m² Sabins, inclui mobiliário e ar):
${freqKeys.map(f => `${f}: ${absorptionPerFreq[f]?.toFixed(2)}`).join(" | ")}

CONTRIBUIÇÃO DE MOBILIÁRIO/OCUPAÇÃO (Sabins) — fonte: ${furnitureSource}:
${freqKeys.map(f => `${f}: ${furnitureAbsorption[f]?.toFixed(2)}`).join(" | ")}
${furnitureSource === "inventory" ? `Inventário detalhado: ${inventory.map(e => {
  const it = furnitureCatalog?.find((f: any) => f.id === e.item_id);
  return it ? `${e.quantity}× ${it.name}` : "";
}).filter(Boolean).join(", ")}` : furnitureSource === "preset" ? `Preset de ocupação aplicado: ${project.occupancy_preset}` : "Sem mobiliário considerado (ambiente vazio)"}

ELEMENTOS INTERNOS (tags): ${project.furniture_elements?.join(", ") || "Não especificado"}
DESCRIÇÃO: ${project.interior_description || "Não informada"}

Com base nos CÁLCULOS DETERMINÍSTICOS acima (não recalcule, use os valores fornecidos), forneça:
1. Um relatório técnico interpretando os resultados
2. Problemas acústicos identificados (baseados nos valores de RT60 e nas características dos materiais)
3. Sugestões de melhoria com materiais específicos

RETORNE UM JSON com exatamente este formato (sem markdown, apenas JSON puro):
{
  "report": "Relatório completo em markdown com análise detalhada, pelo menos 4 parágrafos. Inclua referência aos valores calculados de RT60, NRC e STC.",
  "problems": [
    {
      "title": "Nome do problema",
      "severity": "critical|high|medium|low",
      "description": "Descrição detalhada técnica",
      "location": "Superfície ou região afetada",
      "frequency": "Faixa de frequência afetada"
    }
  ],
  "suggestions": [
    {
      "title": "Nome da sugestão",
      "priority": "critical|high|medium|low",
      "description": "Descrição detalhada da melhoria",
      "before": "Situação atual com valor RT60",
      "after": "Resultado esperado após melhoria",
      "material": "Material recomendado com NRC/STC",
      "estimated_rt60_reduction": 0.3,
      "cost_estimate": "Estimativa de custo em R$"
    }
  ]
}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
	  "model": "gpt-5-mini",
    "messages": [{ "role": "user", "content": prompt }]
     }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI error: ${aiResp.status} ${t}`);
    }

    const aiData = await aiResp.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "{}";

    let parsed: { report?: string; problems?: unknown[]; suggestions?: unknown[] } = {};
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { report: rawContent, problems: [], suggestions: [] };
    }

    // ─ Atualizar registro de análise ─
    const { data: updatedAnalysis, error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        volume_m3: volume,
        total_absorption: totalAbsorption500,
        rt60_125hz: parseFloat(rt60["125hz"].toFixed(4)),
        rt60_250hz: parseFloat(rt60["250hz"].toFixed(4)),
        rt60_500hz: parseFloat(rt60["500hz"].toFixed(4)),
        rt60_1000hz: parseFloat(rt60["1000hz"].toFixed(4)),
        rt60_2000hz: parseFloat(rt60["2000hz"].toFixed(4)),
        rt60_4000hz: parseFloat(rt60["4000hz"].toFixed(4)),
        rt60_average: parseFloat(rt60Average.toFixed(4)),
        ai_report: parsed.report ?? "",
        problems_identified: parsed.problems ?? [],
        suggestions: parsed.suggestions ?? [],
      })
      .eq("id", analysisId)
      .select()
      .single();

    if (updateError) throw updateError;

    await supabase.from("projects").update({ status: "analyzed" }).eq("id", projectId);

    return new Response(JSON.stringify({ analysis: updatedAnalysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-acoustics error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
