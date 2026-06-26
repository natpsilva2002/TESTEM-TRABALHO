import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { Activity, FileDown, Play, Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface Analysis {
  id: string;
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
  problems_identified: Array<{ title: string; severity: string; description: string }> | null;
  suggestions: Array<{ title: string; priority: string; description: string }> | null;
  created_at: string;
}

interface Project {
  name: string;
  room_function: string;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
}

interface AnalysisTabProps {
  analysis: Analysis | null;
  project: Project;
  analyzing: boolean;
  onAnalyze: () => void;
}

const RT60_TARGETS: Record<string, { min: number; max: number; label: string }> = {
  "auditório": { min: 1.2, max: 1.8, label: "Recomendado: 1.2–1.8s" },
  "sala de aula": { min: 0.6, max: 1.0, label: "Recomendado: 0.6–1.0s" },
  "escritório": { min: 0.4, max: 0.7, label: "Recomendado: 0.4–0.7s" },
  "estúdio": { min: 0.2, max: 0.5, label: "Recomendado: 0.2–0.5s" },
  "teatro": { min: 1.0, max: 1.5, label: "Recomendado: 1.0–1.5s" },
  "sala de concertos": { min: 1.8, max: 2.2, label: "Recomendado: 1.8–2.2s" },
  "sala de reuniões": { min: 0.4, max: 0.7, label: "Recomendado: 0.4–0.7s" },
  "home theater": { min: 0.3, max: 0.5, label: "Recomendado: 0.3–0.5s" },
  "restaurante": { min: 0.6, max: 1.0, label: "Recomendado: 0.6–1.0s" },
};

export function AnalysisTab({ analysis, project, analyzing, onAnalyze }: AnalysisTabProps) {
  const rt60Data = analysis ? [
    { freq: "125 Hz", rt60: analysis.rt60_125hz ?? 0, fill: "#3b82f6" },
    { freq: "250 Hz", rt60: analysis.rt60_250hz ?? 0, fill: "#0ea5e9" },
    { freq: "500 Hz", rt60: analysis.rt60_500hz ?? 0, fill: "#06b6d4" },
    { freq: "1 kHz", rt60: analysis.rt60_1000hz ?? 0, fill: "#10b981" },
    { freq: "2 kHz", rt60: analysis.rt60_2000hz ?? 0, fill: "#6366f1" },
    { freq: "4 kHz", rt60: analysis.rt60_4000hz ?? 0, fill: "#8b5cf6" },
  ] : [];

  const target = RT60_TARGETS[project.room_function] ?? { min: 0.5, max: 1.5, label: "" };
  const rt60Avg = analysis?.rt60_average ?? 0;
  const rt60Status = !analysis ? "unknown"
    : rt60Avg < target.min ? "low"
    : rt60Avg > target.max ? "high"
    : "good";

  const handleExportPDF = () => {
    if (!analysis || !analysis.ai_report) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("AcustiAI — Relatório de Análise Acústica", 20, 20);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Projeto: ${project.name}`, 20, 35);
      doc.text(`Ambiente: ${project.room_function}`, 20, 43);
      doc.text(`Volume: ${analysis.volume_m3?.toFixed(1) ?? "N/A"} m³`, 20, 51);
      doc.text(`RT60 Médio: ${rt60Avg.toFixed(2)}s`, 20, 59);
      doc.text(`Data: ${new Date(analysis.created_at).toLocaleDateString("pt-BR")}`, 20, 67);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RT60 por Frequência", 20, 82);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      rt60Data.forEach((d, i) => {
        doc.text(`${d.freq}: ${d.rt60.toFixed(2)}s`, 20, 92 + i * 8);
      });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório da IA", 20, 152);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const reportLines = doc.splitTextToSize(analysis.ai_report.replace(/[#*`]/g, ""), 170);
      let y = 162;
      reportLines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 6;
      });

      doc.save(`acustiai-${project.name.replace(/\s/g, "_")}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar PDF");
    }
  };

  if (!analysis && !analyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 animate-float">
          <Activity className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-lg font-bold mb-2">Nenhuma análise ainda</h3>
        <p className="text-muted-foreground max-w-sm mb-6 text-sm">
          Preencha as dimensões e materiais do ambiente, depois clique em "Analisar" para gerar o relatório acústico com IA
        </p>
        <Button onClick={onAnalyze} className="gap-2">
          <Play className="w-4 h-4" />
          Iniciar análise (1 crédito)
        </Button>
      </div>
    );
  }

  if (analyzing && (!analysis || analysis.status === "processing")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex items-end gap-1 h-12 mb-6">
          {[1,2,3,4,5,4,3,2,1].map((h, i) => (
            <div key={i} className="w-2 bg-primary rounded-full wave-bar" style={{ height: `${h * 8}px`, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
        <h3 className="font-display text-lg font-bold mb-2">Analisando acústica...</h3>
        <p className="text-muted-foreground text-sm mb-4">Calculando RT60, consultando IA e gerando relatório</p>
        <div className="w-48">
          <Progress value={undefined} className="h-1.5 animate-pulse" />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center opacity-50">
          {["Fórmula Sabine", "Análise IA", "Gerando relatório"].map((step, i) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin text-primary" style={{ animationDelay: `${i * 0.3}s` }} />
              <span className="text-xs text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "RT60 Médio",
            value: `${rt60Avg.toFixed(2)}s`,
            sub: target.label,
            icon: rt60Status === "good" ? Minus : rt60Status === "high" ? TrendingUp : TrendingDown,
            color: rt60Status === "good" ? "text-success" : rt60Status === "high" ? "text-destructive" : "text-warning",
          },
          {
            label: "Volume",
            value: `${analysis.volume_m3?.toFixed(1) ?? "—"} m³`,
            sub: project.room_function,
            icon: Activity,
            color: "text-primary",
          },
          {
            label: "Absorção Total",
            value: `${analysis.total_absorption?.toFixed(1) ?? "—"} m²s`,
            sub: "Sabins",
            icon: Activity,
            color: "text-accent",
          },
          {
            label: "Problemas",
            value: analysis.problems_identified?.length ?? 0,
            sub: "identificados",
            icon: Activity,
            color: (analysis.problems_identified?.length ?? 0) > 0 ? "text-warning" : "text-success",
          },
        ].map(stat => (
          <Card key={stat.label} className="shadow-card">
            <CardContent className="pt-4 pb-4">
              <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RT60 Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <CardTitle className="font-display text-base">Tempo de Reverberação RT60</CardTitle>
              <CardDescription>Calculado pela Fórmula de Sabine: T = 0,161 × V / A</CardDescription>
            </div>
            <Badge
              className={`flex-shrink-0 ${
                rt60Status === "good" ? "bg-success/10 text-success border-success/20"
                : rt60Status === "high" ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-warning/10 text-warning border-warning/20"
              }`}
            >
              {rt60Status === "good" ? "Dentro do ideal"
                : rt60Status === "high" ? "Reverberação alta"
                : "Reverberação baixa"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rt60Data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="freq" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="s" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${v.toFixed(2)}s`, "RT60"]}
                />
                <ReferenceLine y={target.min} stroke="hsl(var(--success))" strokeDasharray="4 4" label={{ value: "Mín", position: "right", fontSize: 10 }} />
                <ReferenceLine y={target.max} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Máx", position: "right", fontSize: 10 }} />
                <Bar dataKey="rt60" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">{target.label}</p>
        </CardContent>
      </Card>

      {/* AI Report */}
      {analysis.ai_report && (
        <Card className="shadow-card overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-display text-base">Relatório da Inteligência Artificial</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2 flex-shrink-0">
                <FileDown className="w-3.5 h-3.5" />
                Exportar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="prose prose-sm max-w-none text-foreground break-words [&_h1]:font-display [&_h2]:font-display [&_h3]:font-display [&_strong]:text-foreground [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_li]:text-muted-foreground [&_pre]:overflow-x-auto [&_pre]:max-w-full">
              <ReactMarkdown>{analysis.ai_report}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
