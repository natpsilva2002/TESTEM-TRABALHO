export const SABINE_CONSTANT = 0.161;

export const FREQUENCY_BANDS = [125, 250, 500, 1000, 2000, 4000] as const;
export type FrequencyBand = (typeof FREQUENCY_BANDS)[number];

export interface RoomDimensions {
  length: number; // m
  width: number;  // m
  height: number; // m
}

export interface SurfaceAbsorption {
  /** Coefficient α per band (0..1) */
  coefficients: Record<FrequencyBand, number>;
  /** Surface area in m² */
  area: number;
}

/** Volume in m³ */
export function calculateVolume(d: RoomDimensions): number {
  if (d.length <= 0 || d.width <= 0 || d.height <= 0) return 0;
  return d.length * d.width * d.height;
}


export function calculateRT60Sabine(volumeM3: number, totalAbsorption: number): number {
  if (!Number.isFinite(volumeM3) || !Number.isFinite(totalAbsorption)) return 0;
  if (volumeM3 <= 0 || totalAbsorption <= 0) return 0;
  return (SABINE_CONSTANT * volumeM3) / totalAbsorption;
}

/** Σ(α × area) for a single band. */
export function totalAbsorptionForBand(surfaces: SurfaceAbsorption[], band: FrequencyBand): number {
  return surfaces.reduce((sum, s) => sum + (s.coefficients[band] ?? 0) * s.area, 0);
}

/** RT60 per band (125Hz..4kHz). */
export function calculateRT60PerBand(
  volumeM3: number,
  surfaces: SurfaceAbsorption[],
): Record<FrequencyBand, number> {
  const result = {} as Record<FrequencyBand, number>;
  for (const band of FREQUENCY_BANDS) {
    const a = totalAbsorptionForBand(surfaces, band);
    result[band] = calculateRT60Sabine(volumeM3, a);
  }
  return result;
}

/** Arithmetic mean of all bands. */
export function averageRT60(bands: Record<FrequencyBand, number>): number {
  const values = FREQUENCY_BANDS.map((b) => bands[b]).filter((v) => Number.isFinite(v));
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}