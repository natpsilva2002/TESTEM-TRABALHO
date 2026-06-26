import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Zap, Plus, Clock } from "lucide-react";

interface NoCreditsModalProps {
  open: boolean;
  onClose: () => void;
  onRecharge?: () => void;
}

export function NoCreditsModal({ open, onClose, onRecharge }: NoCreditsModalProps) {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hoursUntilMidnight = Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-warning/10 flex items-center justify-center">
            <Zap className="w-7 h-7 text-warning" />
          </div>
          <DialogTitle className="font-display text-center text-xl">Créditos esgotados</DialogTitle>
          <DialogDescription className="text-center">
            Você não possui créditos disponíveis no momento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <Plus className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Recarregar créditos</p>
              <p className="text-xs text-muted-foreground">
                Pacotes a partir de R$ 50 com aplicação imediata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <Clock className="w-4 h-4" />
            <span>Renovação dos créditos diários gratuitos em ~{hoursUntilMidnight}h</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Fechar</Button>
          {onRecharge && (
            <Button className="flex-1 gap-2" onClick={onRecharge}>
              <Plus className="w-4 h-4" />
              Recarregar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
