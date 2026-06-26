/**
 * Daily-credit business rules (RF13).
 * Pure functions for unit testing.
 */

export const DAILY_CREDIT_LIMIT = 5;
export const CREDIT_COST_PER_ACTION = 1;

export interface CreditState {
  daily_credits: number;
  last_refill_date: string; // ISO date YYYY-MM-DD
}

export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Returns a refilled state if last refill date is older than today. */
export function refillIfNewDay(state: CreditState, now: Date = new Date()): CreditState {
  const today = todayISO(now);
  if (state.last_refill_date < today) {
    return { daily_credits: DAILY_CREDIT_LIMIT, last_refill_date: today };
  }
  return state;
}

export function hasCredits(state: CreditState): boolean {
  return state.daily_credits >= CREDIT_COST_PER_ACTION;
}

/**
 * Deducts one credit. Throws if user has no credits left.
 */
export function deductCredit(state: CreditState): CreditState {
  if (!hasCredits(state)) {
    throw new Error("Sem créditos disponíveis");
  }
  return { ...state, daily_credits: state.daily_credits - CREDIT_COST_PER_ACTION };
}