import { describe, it, expect } from "vitest";
import {
  calculateVolume,
  calculateRT60Sabine,
  calculateRT60PerBand,
  averageRT60,
  totalAbsorptionForBand,
  FREQUENCY_BANDS,
  type SurfaceAbsorption,
} from "@/lib/acoustics";

describe("RF06 — Cálculo de RT60 (Fórmula de Sabine)", () => {
  describe("calculateVolume", () => {
    it("retorna volume do ambiente em m³", () => {
      expect(calculateVolume({ length: 5, width: 4, height: 3 })).toBe(60);
    });

    it("retorna 0 para dimensão inválida", () => {
      expect(calculateVolume({ length: 0, width: 4, height: 3 })).toBe(0);
      expect(calculateVolume({ length: -1, width: 4, height: 3 })).toBe(0);
    });
  });

  describe("calculateRT60Sabine", () => {
    it("aplica a fórmula RT60 = 0.161 · V / A", () => {
      // V = 100, A = 16.1  =>  RT60 = 1.0
      expect(calculateRT60Sabine(100, 16.1)).toBeCloseTo(1.0, 5);
    });

    it("retorna 0 quando absorção é zero (proteção contra divisão por zero)", () => {
      expect(calculateRT60Sabine(100, 0)).toBe(0);
    });

    it("retorna 0 quando volume é zero", () => {
      expect(calculateRT60Sabine(0, 10)).toBe(0);
    });

    it("ignora valores não finitos", () => {
      expect(calculateRT60Sabine(NaN, 10)).toBe(0);
      expect(calculateRT60Sabine(100, Infinity)).toBe(0);
    });
  });

  describe("totalAbsorptionForBand e calculateRT60PerBand", () => {
    const surfaces: SurfaceAbsorption[] = [
      {
        area: 50,
        coefficients: { 125: 0.1, 250: 0.2, 500: 0.3, 1000: 0.4, 2000: 0.5, 4000: 0.6 },
      },
      {
        area: 30,
        coefficients: { 125: 0.05, 250: 0.1, 500: 0.15, 1000: 0.2, 2000: 0.25, 4000: 0.3 },
      },
    ];

    it("calcula Σ(α × área) por banda", () => {
      // 0.3 * 50 + 0.15 * 30 = 15 + 4.5 = 19.5
      expect(totalAbsorptionForBand(surfaces, 500)).toBeCloseTo(19.5, 5);
    });

    it("calcula RT60 para todas as 6 bandas (125Hz–4kHz)", () => {
      const result = calculateRT60PerBand(100, surfaces);
      for (const band of FREQUENCY_BANDS) {
        expect(result[band]).toBeGreaterThan(0);
        expect(Number.isFinite(result[band])).toBe(true);
      }
    });

    it("RT60 diminui em frequências mais altas (maior absorção)", () => {
      const result = calculateRT60PerBand(100, surfaces);
      expect(result[125]).toBeGreaterThan(result[4000]);
    });
  });

  describe("averageRT60", () => {
    it("calcula a média aritmética das bandas", () => {
      const bands = { 125: 1, 250: 1, 500: 1, 1000: 1, 2000: 1, 4000: 1 } as Record<
        (typeof FREQUENCY_BANDS)[number],
        number
      >;
      expect(averageRT60(bands)).toBe(1);
    });
  });
});