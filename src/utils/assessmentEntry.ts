import type { AssessmentInputs, AssessmentResult } from './calculator';

export const EMPTY_PERFORMANCE = {
  runMinutes: null,
  runSeconds: null,
  hamrShuttles: null,
  walkMinutes: null,
  walkSeconds: null,
  strengthReps: null,
  coreReps: null,
  plankMinutes: null,
  plankSeconds: null,
  waistInches: null,
  heightInches: null,
};

type PerformanceField = keyof typeof EMPTY_PERFORMANCE;
export type AssessmentEntry = Omit<AssessmentInputs, PerformanceField> & Record<PerformanceField, number | null>;

export function assessmentInputsForEntry(entry: AssessmentEntry): AssessmentInputs {
  const numeric = Object.fromEntries(
    Object.keys(EMPTY_PERFORMANCE).map((key) => [key, entry[key as PerformanceField] ?? 0])
  ) as Pick<AssessmentInputs, PerformanceField>;
  return { ...entry, ...numeric };
}

export function profileSettingsForEntry(entry: AssessmentEntry) {
  return Object.fromEntries(Object.entries(entry).filter(([key]) => !(key in EMPTY_PERFORMANCE)));
}

function countEntered(value: number | null, maximum: number) {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= maximum;
}

function durationEntered(minutes: number | null, seconds: number | null, minimum: number, maximum: number) {
  if (minutes === null || seconds === null || !Number.isInteger(minutes) || !Number.isInteger(seconds)) return false;
  const total = minutes * 60 + seconds;
  return minutes >= 0 && seconds >= 0 && seconds <= 59 && total >= minimum && total <= maximum;
}

export function assessmentEntryCompletion(entry: AssessmentEntry) {
  const cardio = entry.cardioExempt || (entry.cardioEvent === 'hamr'
    ? countEntered(entry.hamrShuttles, 130)
    : entry.cardioEvent === 'walk_2km'
      ? durationEntered(entry.walkMinutes, entry.walkSeconds, 15, 3600)
      : durationEntered(entry.runMinutes, entry.runSeconds, 15, 3600));
  const strength = entry.strengthExempt || countEntered(entry.strengthReps, 100);
  const core = entry.coreExempt || (entry.coreEvent === 'plank'
    ? durationEntered(entry.plankMinutes, entry.plankSeconds, 0, 600)
    : countEntered(entry.coreReps, 100));
  const whtr = entry.framework !== 'daf_pfra_50_15_15_20' || entry.whtrExempt ||
    (entry.waistInches !== null && entry.heightInches !== null &&
      Number.isFinite(entry.waistInches) && Number.isFinite(entry.heightInches) &&
      entry.waistInches > 0 && entry.heightInches > 0);
  return { cardio, strength, core, whtr, all: cardio && strength && core && whtr };
}

export function assessmentEntrySummary(entry: AssessmentEntry, result: AssessmentResult) {
  const initial = Object.keys(EMPTY_PERFORMANCE).every((key) => entry[key as PerformanceField] === null);
  if (initial) return { initial: true, score: 100 };
  if (result.totalPossiblePoints <= 0) return { initial: false, score: null };

  const completion = assessmentEntryCompletion(entry);
  if (completion.all) return { initial: false, score: result.compositeScore };

  // During entry, show earned points so far without scoring missing events.
  const earned = (['cardio', 'strength', 'core', 'whtr'] as const)
    .reduce((total, key) => total + (completion[key] ? result[key].earnedPoints : 0), 0);
  return { initial: false, score: Math.round((earned / result.totalPossiblePoints) * 1000) / 10 };
}
