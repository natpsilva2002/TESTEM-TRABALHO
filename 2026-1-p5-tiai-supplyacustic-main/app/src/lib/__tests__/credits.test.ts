import { describe, it, expect } from "vitest";
import {
  DAILY_CREDIT_LIMIT,
  refillIfNewDay,
  hasCredits,
  deductCredit,
  todayISO,
} from "@/lib/credits";

describe("RF13 — Limite de créditos diários", () => {
  it("usuário inicia com 5 créditos diários", () => {
    expect(DAILY_CREDIT_LIMIT).toBe(5);
  });

  it("hasCredits é true quando há ≥1 crédito", () => {
    expect(hasCredits({ daily_credits: 1, last_refill_date: todayISO() })).toBe(true);
    expect(hasCredits({ daily_credits: 0, last_refill_date: todayISO() })).toBe(false);
  });

  it("deductCredit subtrai 1 do saldo", () => {
    const next = deductCredit({ daily_credits: 3, last_refill_date: todayISO() });
    expect(next.daily_credits).toBe(2);
  });

  it("deductCredit lança erro quando saldo é 0", () => {
    expect(() =>
      deductCredit({ daily_credits: 0, last_refill_date: todayISO() }),
    ).toThrowError(/Sem créditos/);
  });

  it("refillIfNewDay restaura 5 créditos quando vira o dia", () => {
    const ontem = "2020-01-01";
    const hoje = new Date("2026-05-29T10:00:00Z");
    const refilled = refillIfNewDay({ daily_credits: 0, last_refill_date: ontem }, hoje);
    expect(refilled.daily_credits).toBe(5);
    expect(refilled.last_refill_date).toBe("2026-05-29");
  });

  it("refillIfNewDay não altera estado quando ainda é o mesmo dia", () => {
    const hoje = new Date("2026-05-29T10:00:00Z");
    const state = { daily_credits: 2, last_refill_date: "2026-05-29" };
    expect(refillIfNewDay(state, hoje)).toEqual(state);
  });
});