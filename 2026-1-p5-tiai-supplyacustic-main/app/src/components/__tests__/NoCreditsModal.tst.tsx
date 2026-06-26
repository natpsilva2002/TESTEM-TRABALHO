import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoCreditsModal } from "@/components/NoCreditsModal";

describe("RF13 — NoCreditsModal", () => {
  it("não renderiza quando open=false", () => {
    render(<NoCreditsModal open={false} onClose={() => {}} />);
    expect(screen.queryByText(/Créditos esgotados/i)).not.toBeInTheDocument();
  });

  it("exibe título e mensagem quando open=true", () => {
    render(<NoCreditsModal open={true} onClose={() => {}} />);
    expect(screen.getByText(/Créditos esgotados/i)).toBeInTheDocument();
    expect(screen.getByText(/não possui créditos/i)).toBeInTheDocument();
  });

  it("dispara onClose ao clicar em Fechar", () => {
    const onClose = vi.fn();
    render(<NoCreditsModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Fechar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("exibe botão de recarregar quando onRecharge é fornecido", () => {
    const onRecharge = vi.fn();
    render(<NoCreditsModal open={true} onClose={() => {}} onRecharge={onRecharge} />);
    const btn = screen.getByRole("button", { name: /Recarregar/i });
    fireEvent.click(btn);
    expect(onRecharge).toHaveBeenCalled();
  });
});