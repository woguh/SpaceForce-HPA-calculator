import { USSF_HPA_DISCRETE_TABLES, type CohortDiscreteTables } from './ussfScoringTables';

// The reference viewer reads the same tables used by calculator.ts.
export const HPA_SCORING_RELEASE = {
  id: 'ussf-hpa-2026-02-04',
  label: 'USSF HPA scoring charts',
  effectiveDate: '4 February 2026',
  sourceUrl: 'https://www.ussfhpa.com/ussf-hpa-scoring.pdf',
  sourceLabel: 'Scoring chart PDF (hosted copy)',
  tables: USSF_HPA_DISCRETE_TABLES,
};

export const SCORING_EVENTS: { id: keyof CohortDiscreteTables; label: string; unit: 'time' | 'reps' | 'shuttles'; maximum: number }[] = [
  { id: 'run20', label: '2-mile run', unit: 'time', maximum: 60 },
  { id: 'hamr', label: '20m HAMR', unit: 'shuttles', maximum: 60 },
  { id: 'pushups', label: 'Push-ups (1 minute)', unit: 'reps', maximum: 20 },
  { id: 'hrPushups', label: 'Hand-release push-ups (2 minutes)', unit: 'reps', maximum: 20 },
  { id: 'situps', label: 'Sit-ups (1 minute)', unit: 'reps', maximum: 20 },
  { id: 'crunches', label: 'Cross-leg reverse crunches (2 minutes)', unit: 'reps', maximum: 20 },
  { id: 'plank', label: 'Forearm plank', unit: 'time', maximum: 20 },
];

export const WAIST_RATIO_FAIL_THRESHOLD = 0.55;
