import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, Activity, Loader2, MapPin } from "lucide-react";

interface Problem {
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location?: string;
  frequency?: string;
}

interface Analysis {
  status: string;
  problems_identified: Problem[] | null;
  rt60_average: number | null;
}

interface ProblemsTabProps {
  analysis: Analysis | null;
  analyzing: boolean;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/8",
    border: "border-destructive/20",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Crítico",
  },
  high: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/8",
    border: "border-warning/20",
    badge: "bg-warning/10 text-warning border-warning/20",
    label: "Alto",
  },
  medium: {
    icon: Info,
    color: "text-accent",
    bg: "bg-accent/8",
    border: "border-accent/20",
    badge: "bg-accent/10 text-accent border-accent/20",
    label: "Médio",
  },
  low: {
    icon: Info,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
    badge: "bg-muted text-muted-foreground border-border",
    label: "Baixo",
  },
};

export function ProblemsTab({ analysis, analyzing }: ProblemsTabProps) {
  if (analyzing && (!analysis || analysis.status === "processing")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Identificando problemas acústicos...</p>
      </div>
    );
  }

  if (!analysis || !analysis.problems_identified || analysis.problems_identified.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-success" />
        </div>
        <h3 className="font-display text-lg font-bold mb-2">
          {!analysis ? "Aguardando análise" : "Nenhum problema identificado!"}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          {!analysis
            ? "Execute a análise acústica para identificar problemas no ambiente"
            : "O ambiente apresenta boas condições acústicas conforme analisado pela IA"}
        </p>
      </div>
    );
  }

  const problems = analysis.problems_identified;
  const counts = {
    critical: problems.filter(p => p.severity === "critical").length,
    high: problems.filter(p => p.severity === "high").length,
    medium: problems.filter(p => p.severity === "medium").length,
    low: problems.filter(p => p.severity === "low").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["critical", "high", "medium", "low"] as const).map(sev => {
          const cfg = SEVERITY_CONFIG[sev];
          return (
            <div key={sev} className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}>
              <cfg.icon className={`w-4 h-4 ${cfg.color} mb-1.5`} />
              <p className={`font-display text-2xl font-bold ${cfg.color}`}>{counts[sev]}</p>
              <p className="text-xs text-muted-foreground">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Problems list */}
      <div className="space-y-3">
        {problems
          .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
          })
          .map((problem, i) => {
            const cfg = SEVERITY_CONFIG[problem.severity] ?? SEVERITY_CONFIG.medium;
            return (
              <Card key={i} className={`shadow-card border ${cfg.border} animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CardTitle className="font-display text-sm font-semibold">{problem.title}</CardTitle>
                        <Badge variant="outline" className={`text-xs ${cfg.badge}`}>{cfg.label}</Badge>
                        {problem.frequency && (
                          <Badge variant="secondary" className="text-xs">{problem.frequency}</Badge>
                        )}
                      </div>
                      {problem.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 break-words">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="min-w-0">{problem.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed sm:pl-11 break-words">{problem.description}</p>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
