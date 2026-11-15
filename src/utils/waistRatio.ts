import { WAIST_RATIO_FAIL_THRESHOLD } from '../data/scoringRelease';

export interface WaistMeasurements {
  waist: string;
  height: string;
}

export interface WaistRatioResult {
  status: 'empty' | 'incomplete' | 'invalid' | 'pass' | 'fail';
  ratio: number | null;
  errors: Partial<Record<keyof WaistMeasurements, string>>;
}

/** Standalone pass/fail check using the supplied chart's two-decimal ratios. */
export function calculateWaistRatio(measurements: WaistMeasurements): WaistRatioResult {
  const errors: WaistRatioResult['errors'] = {};
  const values: Partial<Record<keyof WaistMeasurements, number>> = {};

  for (const key of ['waist', 'height'] as const) {
    const text = measurements[key].trim();
    if (!text) continue;
    const value = Number(text);
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || !Number.isFinite(value) || value <= 0) {
      errors[key] = `Enter a ${key === 'waist' ? 'waist measurement' : 'height'} greater than 0 inches.`;
    } else {
      values[key] = value;
    }
  }

  if (Object.keys(errors).length) return { status: 'invalid', ratio: null, errors };
  if (values.waist === undefined && values.height === undefined) {
    return { status: 'empty', ratio: null, errors };
  }
  if (values.waist === undefined || values.height === undefined) {
    return { status: 'incomplete', ratio: null, errors };
  }

  const ratio = Math.round((values.waist / values.height + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(ratio)) {
    return { status: 'invalid', ratio: null, errors: { height: 'Check both measurements are entered in inches.' } };
  }
  return { status: ratio < WAIST_RATIO_FAIL_THRESHOLD ? 'pass' : 'fail', ratio, errors };
}

/** Display any entered height without snapping it to a picker increment. */
export function formatHeightFeetInches(totalInches: number): string {
  const feet = Math.floor(totalInches / 12);
  const inches = Number((totalInches - feet * 12).toFixed(8));
  return `${feet} ft ${inches} in`;
}
