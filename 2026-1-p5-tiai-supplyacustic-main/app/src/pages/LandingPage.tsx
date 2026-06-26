import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Waves, ArrowRight, BarChart3, Box, Shield, Zap,
  Building2, GraduationCap, Mic2, ChevronRight, CheckCircle2
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const FEATURES = [
  {
    icon: BarChart3,
    title: "Cálculo RT60 por Frequência",
    desc: "Fórmula de Sabine aplicada em 6 bandas (125Hz–4kHz) com coeficientes reais de absorção, considerando espessura e densidade dos materiais.",
  },
  {
    icon: Shield,
    title: "STC & Isolamento Acústico",
    desc: "Sound Transmission Class integrado à análise para avaliar bloqueio sonoro entre ambientes — paredes, pisos e tetos.",
  },
  {
    icon: Box,
    title: "Visualização 3D Interativa",
    desc: "Importe modelos GLB, OBJ ou STL e visualize o ambiente em 3D com orbit controls para validação dimensional.",
  },
  {
    icon: Zap,
    title: "Relatórios com IA",
    desc: "Após o cálculo determinístico, a IA gera relatórios técnicos com problemas identificados e sugestões de tratamento acústico.",
  },
];

const AUDIENCES = [
  { icon: Building2, label: "Engenheiros Acústicos", desc: "Análise profissional com dados técnicos precisos por frequência" },
  { icon: GraduationCap, label: "Estudantes de Engenharia", desc: "Ferramenta educacional para projetos e extensão universitária" },
  { icon: Mic2, label: "Arquitetos & Projetistas", desc: "Pré-dimensionamento acústico integrado ao fluxo de projeto" },
];

const PARAMETERS = [
  "Coeficiente de absorção (α) por frequência",
  "NRC (Noise Reduction Coefficient)",
  "STC (Sound Transmission Class)",
  "Densidade e massa do material",
  "Espessura do material (impacto em graves)",
  "Tipo: reflexivo, absorvente ou difusor",
  "Área de cada superfície (m²)",
  "Volume do ambiente (m³)",
];

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <a href="#landing-main" className="skip-link">Pular para o conteúdo principal</a>
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-hero rounded-xl flex items-center justify-center" aria-hidden="true">
              <Waves className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">SupplyAcustic</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onGetStarted}>Entrar</Button>
            <Button size="sm" onClick={onGetStarted} className="gap-2">
              Começar grátis <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <main id="landing-main">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center relative">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
            Plataforma de Análise Acústica Profissional
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Acústica Arquitetônica
            <br />
            <span className="text-gradient">com Precisão Técnica</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Calcule RT60 por frequência com a Fórmula de Sabine, analise STC, coeficientes de absorção,
            espessura e tipo de materiais — tudo em uma plataforma projetada para profissionais.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={onGetStarted} className="gap-2 text-base px-8">
              Criar conta grátis <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 text-base">
              Ver funcionalidades
            </Button>
          </div>

          {/* Formula highlight */}
          <div className="mt-16 max-w-lg mx-auto bg-card border border-border rounded-2xl p-6 shadow-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Fórmula Base — Sabine</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              RT60 = <span className="text-primary">0.161 · V</span> / <span className="text-accent">A</span>
            </p>
            <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
              <span><strong className="text-foreground">V</strong> = volume (m³)</span>
              <span><strong className="text-foreground">A</strong> = Σ(α × área)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Análise Completa, Não Aproximada</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Cálculos determinísticos por código — não por IA — garantindo precisão técnica em cada resultado.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Parameters considered */}
      <section className="bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold mb-4">Parâmetros Técnicos Considerados</h2>
              <p className="text-muted-foreground mb-8">
                Todos os dados que realmente importam para um cálculo acústico confiável — projetado para gente técnica, não para dar qualquer resultado.
              </p>
              <Button onClick={onGetStarted} className="gap-2">
                Começar análise <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {PARAMETERS.map((p) => (
                <div key={p} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/50">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Para Quem é o SupplyAcustic</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Projetado para profissionais e estudantes que precisam de resultados precisos.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {AUDIENCES.map((a) => (
            <div key={a.label} className="text-center bg-card border border-border rounded-xl p-8 shadow-card">
              <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5">
                <a.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{a.label}</h3>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center text-primary-foreground">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Comece sua Análise Acústica Agora
          </h2>
          <p className="text-primary-foreground/75 text-lg mb-8 max-w-xl mx-auto">
            Crie uma conta gratuita com 5 créditos diários. Sem cartão de crédito, sem compromisso.
          </p>
          <Button size="lg" variant="secondary" onClick={onGetStarted} className="gap-2 text-base px-8">
            Criar conta grátis <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-primary" />
            <span className="font-display text-sm font-semibold">SupplyAcustic</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 SupplyAcustic — Análise acústica profissional
          </p>
        </div>
      </footer>
    </div>
  );
}
