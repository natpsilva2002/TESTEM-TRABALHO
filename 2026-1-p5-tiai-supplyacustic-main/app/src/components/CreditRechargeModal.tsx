import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Zap, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreditRechargeModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentCredits: number;
  onCreditsAdded: (newTotal: number) => void;
}

const PACKAGES = [
  { credits: 5, price: 50, label: "Inicial" },
  { credits: 10, price: 80, label: "Recomendado", highlight: true },
  { credits: 100, price: 450, label: "Profissional" },
];

export function CreditRechargeModal({ open, onClose, userId, currentCredits, onCreditsAdded }: CreditRechargeModalProps) {
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const handlePurchase = async (credits: number, price: number) => {
    setPurchasing(credits);
    try {
      // NOTE: Integração de pagamento real ainda não configurada.
      // Por ora aplicamos os créditos diretamente para fluxo de testes.
      const newTotal = currentCredits + credits;
      const { error } = await supabase
        .from("profiles")
        .update({ daily_credits: newTotal })
        .eq("user_id", userId);
      if (error) throw error;
      onCreditsAdded(newTotal);
      toast.success(`+${credits} créditos adicionados (R$ ${price})`);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro na recarga");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Recarga de créditos</DialogTitle>
          <DialogDescription>
            Selecione um pacote para continuar realizando análises técnicas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2">
          {PACKAGES.map(pkg => (
            <button
              key={pkg.credits}
              onClick={() => handlePurchase(pkg.credits, pkg.price)}
              disabled={purchasing !== null}
              className={`relative text-left p-4 rounded-xl border transition-all hover:border-primary hover:shadow-card ${
                pkg.highlight ? "border-primary bg-primary/5" : "border-border bg-card"
              } disabled:opacity-50`}
            >
              {pkg.highlight && (
                <span className="absolute -top-2 right-3 text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  {pkg.label}
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-warning" />
                <span className="font-display text-2xl font-bold">{pkg.credits}</span>
                <span className="text-xs text-muted-foreground">créditos</span>
              </div>
              <div className="font-display text-lg font-bold text-foreground">R$ {pkg.price}</div>
              <div className="text-xs text-muted-foreground mt-1">
                R$ {(pkg.price / pkg.credits).toFixed(2)} por crédito
              </div>
              {purchasing === pkg.credits ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" /> Processando...
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="w-3 h-3" /> Aplicação imediata
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Os créditos não expiram. Pagamento será integrado em breve.
        </p>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
