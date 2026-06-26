import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User as UserIcon, Sparkles, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ModelMetricsInfo {
  bboxWidth: number;
  bboxHeight: number;
  bboxDepth: number;
  volume: number;
  surfaceArea: number;
}

interface ChatTabProps {
  projectId: string;
  user: User;
  project: { name: string; room_function: string; length_m: number | null; width_m: number | null; height_m: number | null; model_file_name?: string | null; model_file_path?: string | null };
  analysis: { rt60_average: number | null; ai_report: string | null } | null;
  profile: { daily_credits: number } | null;
  modelMetrics?: ModelMetricsInfo | null;
  onDeductCredit: () => void;
  onNoCredits: () => void;
}

const SUGGESTED_QUESTIONS = [
  "Como reduzir a reverberação no ambiente?",
  "Quais materiais absorventes você recomenda?",
  "Como eliminar ecos no palco?",
  "Qual é o RT60 ideal para este tipo de sala?",
  "Como posicionar painéis acústicos?",
];

export function ChatTab({ projectId, user, project, analysis, profile, modelMetrics, onDeductCredit, onNoCredits }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    if (!profile || profile.daily_credits <= 0) {
      onNoCredits();
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreaming(true);

    // Save user message to DB
    await supabase.from("chat_messages").insert({
      project_id: projectId,
      user_id: user.id,
      role: "user",
      content,
    });

    // Deduct credit
    await supabase.from("profiles").update({ daily_credits: profile.daily_credits - 1 }).eq("user_id", user.id);
    onDeductCredit();

    // Add placeholder for assistant
    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", created_at: new Date().toISOString() }]);

    try {
      const contextMessages = [
        ...messages.slice(-6),
        userMsg,
      ].map(m => ({ role: m.role, content: m.content }));

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/acoustic-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: contextMessages,
          context: {
            projectName: project.name,
            roomFunction: project.room_function,
            dimensions: {
              length: project.length_m,
              width: project.width_m,
              height: project.height_m,
            },
            rt60Average: analysis?.rt60_average,
            hasAnalysis: !!analysis?.ai_report,
            modelInfo: project.model_file_name
              ? {
                  loaded: true,
                  fileName: project.model_file_name,
                  format: project.model_file_name.split(".").pop()?.toUpperCase() ?? null,
                  metrics: modelMetrics
                    ? {
                        bboxWidth: Number(modelMetrics.bboxWidth.toFixed(2)),
                        bboxHeight: Number(modelMetrics.bboxHeight.toFixed(2)),
                        bboxDepth: Number(modelMetrics.bboxDepth.toFixed(2)),
                        volume: Number(modelMetrics.volume.toFixed(2)),
                        surfaceArea: Number(modelMetrics.surfaceArea.toFixed(2)),
                      }
                    : null,
                }
              : { loaded: false },
          },
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao conectar com IA");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message to DB
      await supabase.from("chat_messages").insert({
        project_id: projectId,
        user_id: user.id,
        role: "assistant",
        content: fullContent,
      });

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Erro ao processar resposta";
      toast.error(errMsg);
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      // Refund credit on error
      await supabase.from("profiles").update({ daily_credits: (profile?.daily_credits ?? 1) }).eq("user_id", user.id);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-220px)] sm:h-[calc(100vh-260px)] min-h-[400px]">
      {/* Context banner */}
      <div className="flex items-start sm:items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10 mb-3 sm:mb-4 flex-shrink-0">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-xs text-muted-foreground leading-snug min-w-0 flex-1">
          <span className="font-medium text-foreground">Assistente AcustiAI</span>
          <span className="hidden sm:inline"> — especialista em acústica arquitetônica</span>
          {project.room_function && <span> · {project.room_function}</span>}
          {analysis?.rt60_average && <span> · RT60: {analysis.rt60_average.toFixed(2)}s</span>}
          {project.model_file_name && <span> · 📦 {project.model_file_name}</span>}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full bg-background border border-border">
          <Zap className="w-3 h-3 text-warning" />
          <span className="text-xs font-semibold">{profile?.daily_credits ?? 0}</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 mb-4">
        <div
          className="space-y-4 pr-2"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Histórico de mensagens do assistente"
        >
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center mx-auto mb-3 animate-float" aria-hidden="true">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="font-display font-semibold mb-1">Pergunte ao AcustiAI</p>
              <p className="text-sm text-muted-foreground mb-4">Especialista em acústica arquitetônica</p>
              <div className="flex flex-wrap gap-2 justify-center" role="list" aria-label="Perguntas sugeridas">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary border border-border transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              aria-label={msg.role === "assistant" ? "Mensagem do assistente" : "Sua mensagem"}
            >
              <div
                aria-hidden="true"
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "assistant" ? "gradient-hero" : "bg-secondary border border-border"
                }`}
              >
                {msg.role === "assistant"
                  ? <Bot className="w-4 h-4 text-primary-foreground" />
                  : <UserIcon className="w-3.5 h-3.5 text-foreground" />
                }
              </div>
              <div className={`min-w-0 max-w-[85%] ${msg.role === "user" ? "flex justify-end" : ""}`}>
                <div className={`rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm break-words overflow-hidden ${
                  msg.role === "user"
                    ? "gradient-hero text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm shadow-card"
                }`}>
                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <div className="prose prose-sm max-w-none [&_p]:text-foreground [&_p]:my-1 [&_ul]:text-foreground [&_li]:text-foreground [&_strong]:text-foreground [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" role="status" aria-label="Assistente está respondendo">
                        <div className="flex items-end gap-0.5" aria-hidden="true">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-1 h-3 bg-primary rounded-full wave-bar" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">Pensando...</span>
                      </div>
                    )
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form
        className="flex gap-2 flex-shrink-0"
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        aria-label="Enviar pergunta ao assistente"
      >
        <label htmlFor="chat-input" className="sr-only">Sua pergunta ao assistente</label>
        <Input
          id="chat-input"
          placeholder="Pergunte sobre acústica, materiais, tratamentos..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          disabled={loading}
          className="flex-1"
          aria-label="Sua pergunta ao assistente"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          size="icon"
          aria-label={loading ? "Enviando mensagem" : "Enviar mensagem"}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
        </Button>
      </form>
    </div>
  );
}