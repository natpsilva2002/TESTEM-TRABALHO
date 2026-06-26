import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Waves, ArrowLeft, Zap, Save, Play, Loader2, AlertTriangle, Plus
} from "lucide-react";
import { EnvironmentTab } from "@/components/project/EnvironmentTab";
import { AnalysisTab } from "@/components/project/AnalysisTab";
import { ProblemsTab } from "@/components/project/ProblemsTab";
import { SuggestionsTab } from "@/components/project/SuggestionsTab";
import { ChatTab } from "@/components/project/ChatTab";
import { NoCreditsModal } from "@/components/NoCreditsModal";
import { CreditRechargeModal } from "@/components/CreditRechargeModal";
import type { ModelMetrics } from "@/components/Scene3D";

interface Profile {
  daily_credits: number;
  last_refill_date: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  room_function: string;
  status: string;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
  interior_description: string | null;
  furniture_elements: string[] | null;
  wall_material_id: string | null;
  floor_material_id: string | null;
  ceiling_material_id: string | null;
  wall_thickness_mm: number | null;
  floor_thickness_mm: number | null;
  ceiling_thickness_mm: number | null;
  model_file_path: string | null;
  model_file_name: string | null;
}

interface Analysis {
  id: string;
  project_id: string;
  status: string;
  rt60_average: number | null;
  rt60_125hz: number | null;
  rt60_250hz: number | null;
  rt60_500hz: number | null;
  rt60_1000hz: number | null;
  rt60_2000hz: number | null;
  rt60_4000hz: number | null;
  volume_m3: number | null;
  total_absorption: number | null;
  ai_report: string | null;
  problems_identified: Array<Record<string, unknown>> | null;
  suggestions: Array<Record<string, unknown>> | null;
  created_at: string;
}

interface ProjectPageProps {
  projectId: string;
  user: User;
  onBack: () => void;
}

export default function ProjectPage({ projectId, user, onBack }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("environment");
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);

  const loadData = useCallback(async () => {
    const [{ data: proj }, { data: analyses }, { data: prof }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1),
      supabase.from("profiles").select("daily_credits, last_refill_date").eq("user_id", user.id).single(),
    ]);
    if (proj) setProject(proj as unknown as Project);
    if (analyses && analyses.length > 0) setAnalysis(analyses[0] as unknown as Analysis);
    if (prof) setProfile(prof as Profile);
    setLoading(false);
  }, [projectId, user.id]);

  useEffect(() => {
    loadData();

    // Realtime for analysis updates
    const channel = supabase
      .channel(`analysis-${projectId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "analyses",
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        if (payload.new) {
          setAnalysis(payload.new as unknown as Analysis);
          if ((payload.new as Analysis).status === "completed") {
            setAnalyzing(false);
            toast.success("Análise acústica concluída!");
          }
          if ((payload.new as Analysis).status === "error") {
            setAnalyzing(false);
            toast.error("Erro na análise: " + (payload.new as Analysis).status);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, user.id, loadData]);

  const handleSaveProject = async (updates: Partial<Project>) => {
    if (!project) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update(updates as Record<string, unknown>)
        .eq("id", projectId);
      if (error) throw error;
      setProject(p => p ? { ...p, ...updates } : p);
      toast.success("Projeto salvo!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!project) return;
    if (!profile || profile.daily_credits <= 0) {
      setNoCreditsOpen(true);
      return;
    }
    if (!project.length_m || !project.width_m || !project.height_m) {
      toast.error("Preencha as dimensões do ambiente antes de analisar");
      setActiveTab("environment");
      return;
    }

    setAnalyzing(true);
    toast.info("Iniciando análise acústica com IA...", { duration: 3000 });

    try {
      // Deduct 1 credit
      const { error: creditError } = await supabase
        .from("profiles")
        .update({ daily_credits: profile.daily_credits - 1 })
        .eq("user_id", user.id);
      if (creditError) throw creditError;
      setProfile(p => p ? { ...p, daily_credits: p.daily_credits - 1 } : p);

      // Create analysis record
      const { data: newAnalysis, error: insertError } = await supabase
        .from("analyses")
        .insert({
          project_id: projectId,
          user_id: user.id,
          status: "processing",
          analysis_type: "full",
        })
        .select()
        .single();
      if (insertError) throw insertError;
      setAnalysis(newAnalysis as unknown as Analysis);

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke("analyze-acoustics", {
        body: {
          projectId,
          analysisId: newAnalysis.id,
          project: {
            ...project,
            wall_material_id: project.wall_material_id,
            floor_material_id: project.floor_material_id,
            ceiling_material_id: project.ceiling_material_id,
            wall_thickness_mm: project.wall_thickness_mm,
            floor_thickness_mm: project.floor_thickness_mm,
            ceiling_thickness_mm: project.ceiling_thickness_mm,
          },
        },
      });

      if (fnError) throw fnError;
      if (data?.analysis) {
        setAnalysis(data.analysis as Analysis);
        setActiveTab("analysis");
      }
    } catch (err: unknown) {
      setAnalyzing(false);
      toast.error(err instanceof Error ? err.message : "Erro ao iniciar análise");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-end gap-1 h-10">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-2 bg-primary rounded-full wave-bar" style={{ height: `${14 + i * 5}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-muted-foreground text-sm">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
          <p className="font-display text-lg font-bold">Projeto não encontrado</p>
          <Button onClick={onBack} className="mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  const creditsPercent = profile ? Math.min((profile.daily_credits / 10) * 100, 100) : 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 sm:gap-2 -ml-2 px-2 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Projetos</span>
          </Button>

          <div className="hidden sm:block w-px h-6 bg-border" />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 gradient-hero rounded-lg flex items-center justify-center flex-shrink-0">
              <Waves className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-sm sm:text-base truncate min-w-0">{project.name}</h1>
            <Badge variant="secondary" className="capitalize hidden md:inline-flex text-xs flex-shrink-0">{project.room_function}</Badge>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Credits pill (always visible) */}
            {profile && (
              <button
                type="button"
                onClick={() => setRechargeOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                aria-label="Recarregar créditos"
                title={`${profile.daily_credits} créditos disponíveis · clique para recarregar`}
              >
                <Zap className="w-3 h-3 text-warning flex-shrink-0" />
                <span className="text-xs font-semibold text-foreground">{profile.daily_credits}</span>
                <Plus className="w-3 h-3 text-primary" />
              </button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveProject({})}
              disabled={saving}
              className="gap-2 hidden sm:flex"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar
            </Button>

            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="gap-1.5 sm:gap-2 px-2.5 sm:px-3"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Analisando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Analisar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Analyzing banner */}
      {analyzing && (
        <div className="bg-primary text-primary-foreground px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center gap-2 sm:gap-3 text-center">
          <div className="hidden sm:flex items-end gap-0.5 flex-shrink-0">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-1 bg-primary-foreground/70 rounded-full wave-bar" style={{ height: `${8 + i * 3}px` }} />
            ))}
          </div>
          <Loader2 className="w-4 h-4 animate-spin sm:hidden flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium leading-snug">
            <span className="hidden sm:inline">IA processando análise acústica... Isso pode levar até 30 segundos</span>
            <span className="sm:hidden">Processando análise... até 30s</span>
          </span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="environment" className="text-[11px] sm:text-sm px-1 sm:px-3 py-1.5">Ambiente</TabsTrigger>
            <TabsTrigger value="analysis" className="text-[11px] sm:text-sm px-1 sm:px-3 py-1.5">Análise</TabsTrigger>
            <TabsTrigger value="problems" className="text-[11px] sm:text-sm px-1 sm:px-3 py-1.5">Problemas</TabsTrigger>
            <TabsTrigger value="suggestions" className="text-[11px] sm:text-sm px-1 sm:px-3 py-1.5">Sugestões</TabsTrigger>
            <TabsTrigger value="chat" className="text-[11px] sm:text-sm px-1 sm:px-3 py-1.5">Chat IA</TabsTrigger>
          </TabsList>

          <TabsContent value="environment" className="animate-fade-in">
            <EnvironmentTab project={project as never} onSave={handleSaveProject} onModelMetrics={setModelMetrics} />
          </TabsContent>

          <TabsContent value="analysis" className="animate-fade-in">
            <AnalysisTab analysis={analysis as never} project={project} analyzing={analyzing} onAnalyze={handleAnalyze} />
          </TabsContent>

          <TabsContent value="problems" className="animate-fade-in">
            <ProblemsTab analysis={analysis as never} analyzing={analyzing} />
          </TabsContent>

          <TabsContent value="suggestions" className="animate-fade-in">
            <SuggestionsTab analysis={analysis as never} analyzing={analyzing} />
          </TabsContent>

          <TabsContent value="chat" className="animate-fade-in">
            <ChatTab projectId={projectId} user={user} project={project} analysis={analysis} profile={profile} modelMetrics={modelMetrics} onDeductCredit={() => setProfile(p => p ? { ...p, daily_credits: p.daily_credits - 1 } : p)} onNoCredits={() => setNoCreditsOpen(true)} />
          </TabsContent>
        </Tabs>
      </main>

      <NoCreditsModal open={noCreditsOpen} onClose={() => setNoCreditsOpen(false)} onRecharge={() => { setNoCreditsOpen(false); setRechargeOpen(true); }} />
      {profile && (
        <CreditRechargeModal
          open={rechargeOpen}
          onClose={() => setRechargeOpen(false)}
          userId={user.id}
          currentCredits={profile.daily_credits}
          onCreditsAdded={(total) => setProfile(p => p ? { ...p, daily_credits: total } : p)}
        />
      )}
    </div>
  );
}