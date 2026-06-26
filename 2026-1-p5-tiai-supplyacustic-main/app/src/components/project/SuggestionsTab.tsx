import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight, Loader2, Sparkles, TrendingDown, Wallet } from "lucide-react";

interface Suggestion {
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  description: string;
  before?: string;
  after?: string;
  estimated_rt60_reduction?: number;
  material?: string;
  cost_estimate?: string;
}

interface Analysis {
  status: string;
  suggestions: Suggestion[] | null;
}

interface SuggestionsTabProps {
  analysis: Analysis | null;
  analyzing: boolean;
}

const PRIORITY_CONFIG = {
  critical: { label: "Urgente", class: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
  high: { label: "Alta", class: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  medium: { label: "Média", class: "bg-accent/10 text-accent border-accent/20", dot: "bg-accent" },
  low: { label: "Opcional", class: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

export function SuggestionsTab({ analysis, analyzing }: SuggestionsTabProps) {
  if (analyzing && (!analysis || analysis.status === "processing")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Gerando sugestões de melhoria...</p>
      </div>
    );
  }

  if (!analysis || !analysis.suggestions || analysis.suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 animate-float">
          <Lightbulb className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-lg font-bold mb-2">Sugestões de melhoria</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Execute a análise acústica para receber sugestões personalizadas de tratamento e materiais
        </p>
      </div>
    );
  }

  const suggestions = analysis.suggestions;
  const sorted = [...suggestions].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {suggestions.length} sugestão{suggestions.length > 1 ? "ões" : ""} de melhoria identificadas pela IA
          </p>
          <p className="text-xs text-muted-foreground">
            {suggestions.filter(s => s.priority === "critical" || s.priority === "high").length} de alta prioridade
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        {sorted.map((sug, i) => {
          const cfg = PRIORITY_CONFIG[sug.priority] ?? PRIORITY_CONFIG.medium;
          return (
            <Card
              key={i}
              className="shadow-card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CardTitle className="font-display text-sm font-semibold">{sug.title}</CardTitle>
                      <Badge variant="outline" className={`text-xs ${cfg.class}`}>{cfg.label}</Badge>
                      {sug.material && (
                        <Badge variant="secondary" className="text-xs">{sug.material}</Badge>
                      )}
                    </div>
                    {sug.estimated_rt60_reduction && (
                      <p className="text-xs text-success font-medium flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Redução RT60 estimada: ~{sug.estimated_rt60_reduction.toFixed(2)}s
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{sug.description}</p>

                {/* Before/After */}
                {(sug.before || sug.after) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {sug.before && (
                      <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                        <p className="text-xs font-medium text-destructive mb-1">Situação atual</p>
                        <p className="text-xs text-muted-foreground">{sug.before}</p>
                      </div>
                    )}
                    {sug.after && (
                      <div className="p-3 bg-success/5 border border-success/10 rounded-lg">
                        <p className="text-xs font-medium text-success mb-1 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> Com a melhoria
                        </p>
                        <p className="text-xs text-muted-foreground">{sug.after}</p>
                      </div>
                    )}
                  </div>
                )}

                {sug.cost_estimate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Wallet className="w-3 h-3 flex-shrink-0" /> Custo estimado: {sug.cost_estimate}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
