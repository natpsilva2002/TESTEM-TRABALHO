import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Waves, Plus, LogOut, FolderOpen, Clock, TrendingUp,
  Building2, Mic2, GraduationCap, Music, Theater, Briefcase,
  Trash2, ChevronRight, Loader2, Zap
} from "lucide-react";
import { CreditRechargeModal } from "@/components/CreditRechargeModal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  daily_credits: number;
  last_refill_date: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  room_function: string;
  status: string;
  created_at: string;
  updated_at: string;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
}

const ROOM_ICONS: Record<string, React.ElementType> = {
  auditório: Theater,
  "sala de aula": GraduationCap,
  escritório: Briefcase,
  estúdio: Mic2,
  teatro: Theater,
  "sala de concertos": Music,
  "sala de reuniões": Building2,
  "home theater": Music,
  restaurante: Building2,
  "outro": Building2,
};

const ROOM_COLORS: Record<string, string> = {
  auditório: "bg-purple-500/10 text-purple-600",
  "sala de aula": "bg-green-500/10 text-green-600",
  escritório: "bg-blue-500/10 text-blue-600",
  estúdio: "bg-red-500/10 text-red-600",
  teatro: "bg-amber-500/10 text-amber-600",
  "sala de concertos": "bg-pink-500/10 text-pink-600",
  "sala de reuniões": "bg-cyan-500/10 text-cyan-600",
  "home theater": "bg-indigo-500/10 text-indigo-600",
  restaurante: "bg-orange-500/10 text-orange-600",
  outro: "bg-gray-500/10 text-gray-600",
};

interface HomePageProps {
  user: User;
  onOpenProject: (id: string) => void;
}

export default function HomePage({ user, onOpenProject }: HomePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    room_function: "escritório",
  });

  useEffect(() => {
    loadData();
    // Realtime subscription for profile
    const channel = supabase
      .channel("profile-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, () => {
        loadProfile();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  const loadData = async () => {
    await Promise.all([loadProfile(), loadProjects()]);
    setLoading(false);
  };

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setProfile(data as Profile);
  };

  const loadProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setProjects(data as Project[]);
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: newProject.name.trim(),
          description: newProject.description || null,
          room_function: newProject.room_function,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Projeto criado com sucesso!");
      setCreateOpen(false);
      setNewProject({ name: "", description: "", room_function: "escritório" });
      await loadProjects();
      if (data) onOpenProject(data.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar projeto");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deletar este projeto permanentemente?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar projeto");
    } else {
      toast.success("Projeto deletado");
      setProjects(p => p.filter(proj => proj.id !== id));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.info("Sessão encerrada");
  };

  const creditsPercent = profile ? Math.min((profile.daily_credits / 10) * 100, 100) : 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-hero rounded-xl flex items-center justify-center">
              <Waves className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">SupplyAcustic</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Credits display */}
            {profile && (
              <div className="hidden sm:flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs font-medium text-foreground">
                    Créditos: <span className="font-bold text-primary">{profile.daily_credits}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRechargeOpen(true)}
                    className="h-6 w-6 p-0 ml-1 border-primary/40 text-primary hover:bg-primary/10"
                    title="Recarregar créditos"
                    aria-label="Recarregar créditos"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Progress value={creditsPercent} className="w-24 h-1.5" />
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Olá, {profile?.display_name || user.email?.split("@")[0]}
              </h1>
              <p className="text-muted-foreground mt-1">
                {projects.length === 0
                  ? "Crie seu primeiro projeto de análise acústica"
                  : `Você tem ${projects.length} projeto${projects.length > 1 ? "s" : ""} de análise acústica`}
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-card">
              <Plus className="w-4 h-4" />
              Novo projeto
            </Button>
          </div>

          {/* Credits mobile */}
          {profile && (
            <div className="sm:hidden mt-4 p-3 bg-card rounded-xl border border-border shadow-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">Créditos disponíveis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-primary">{profile.daily_credits}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRechargeOpen(true)}
                    className="h-6 w-6 p-0 border-primary/40 text-primary"
                    aria-label="Recarregar créditos"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <Progress value={creditsPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1.5">+5 créditos diários gratuitos renovados à meia-noite</p>
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in">
            {[
              { icon: FolderOpen, label: "Projetos", value: projects.length, color: "text-primary" },
              { icon: TrendingUp, label: "Análises", value: projects.filter(p => p.status === "analyzed").length, color: "text-accent" },
              { icon: Clock, label: "Este mês", value: projects.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth()).length, color: "text-success" },
              { icon: Zap, label: "Créditos", value: profile?.daily_credits ?? 0, color: "text-warning" },
            ].map(stat => (
              <div key={stat.label} className="bg-card rounded-xl p-4 border border-border shadow-card">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-xl shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="w-20 h-20 gradient-hero rounded-2xl flex items-center justify-center mb-6 animate-float">
              <Waves className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Nenhum projeto ainda</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              Crie seu primeiro projeto para analisar a acústica de um ambiente com IA
            </p>
            <Button onClick={() => setCreateOpen(true)} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Criar primeiro projeto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => {
              const Icon = ROOM_ICONS[project.room_function] ?? Building2;
              const colorClass = ROOM_COLORS[project.room_function] ?? ROOM_COLORS["outro"];
              const hasVolume = project.length_m && project.width_m && project.height_m;
              return (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir projeto ${project.name}`}
                  className="group bg-card rounded-xl border border-border shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer hover:-translate-y-0.5 animate-fade-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => onOpenProject(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenProject(project.id);
                    }
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`} aria-hidden="true">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={project.status === "analyzed" ? "default" : "secondary"} className="text-xs">
                          {project.status === "analyzed" ? "Analisado" : project.status === "draft" ? "Rascunho" : project.status}
                        </Badge>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          aria-label={`Deletar projeto ${project.name}`}
                          className="opacity-100 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 hover:text-destructive rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground capitalize">{project.room_function}</p>
                        {hasVolume && (
                          <p className="text-xs text-muted-foreground">
                            {project.length_m}×{project.width_m}×{project.height_m}m
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Novo Projeto Acústico</DialogTitle>
            <DialogDescription>
              Configure as informações básicas do ambiente a ser analisado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Nome do projeto *</Label>
              <Input
                id="proj-name"
                placeholder="Ex: Auditório Principal - Bloco A"
                value={newProject.name}
                onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-func">Função do ambiente</Label>
              <Select
                value={newProject.room_function}
                onValueChange={v => setNewProject(p => ({ ...p, room_function: v }))}
              >
                <SelectTrigger id="proj-func">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["auditório", "sala de aula", "escritório", "estúdio", "teatro", "sala de concertos", "sala de reuniões", "home theater", "restaurante", "outro"].map(f => (
                    <SelectItem key={f} value={f} className="capitalize">{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-desc">Descrição (opcional)</Label>
              <Textarea
                id="proj-desc"
                placeholder="Descreva o ambiente, localização, uso principal..."
                value={newProject.description}
                onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProject} disabled={creating || !newProject.name.trim()} className="gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
