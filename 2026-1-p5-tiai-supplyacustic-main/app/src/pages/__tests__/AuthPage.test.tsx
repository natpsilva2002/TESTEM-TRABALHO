import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
const signUp = vi.fn().mockResolvedValue({ error: null });
const signInWithOAuth = vi.fn().mockResolvedValue({ error: null, redirected: true });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signUp: (...args: unknown[]) => signUp(...args),
    },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import AuthPage from "@/pages/AuthPage";

beforeEach(() => {
  signInWithPassword.mockClear();
  signUp.mockClear();
  signInWithOAuth.mockClear();
});

describe("RF01 — Autenticação via e-mail e senha", () => {
  it("renderiza abas de Entrar e Criar conta", () => {
    render(<AuthPage />);
    expect(screen.getByRole("tab", { name: /Entrar/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Criar conta/i })).toBeInTheDocument();
  });

  it("submete login com e-mail e senha", async () => {
    render(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "u@test.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "u@test.com",
        password: "secret123",
      });
    });
  });
});

describe("RF02 — Login com Google (OAuth)", () => {
  it("chama lovable.auth.signInWithOAuth('google') ao clicar em 'Entrar com Google'", async () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole("button", { name: /Entrar com Google/i }));
    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith("google", expect.any(Object));
    });
  });
});