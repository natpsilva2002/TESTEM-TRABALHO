import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LandingPage from "@/pages/LandingPage";

describe("LandingPage — Tela inicial pública", () => {
  it("renderiza headline e fórmula de Sabine", () => {
    render(<LandingPage onGetStarted={() => {}} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/Sabine/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/RT60/).length).toBeGreaterThan(0);
  });

  it("dispara onGetStarted ao clicar no CTA principal", () => {
    const onGetStarted = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} />);
    const ctas = screen.getAllByRole("button", { name: /Criar conta grátis/i });
    fireEvent.click(ctas[0]);
    expect(onGetStarted).toHaveBeenCalled();
  });
});