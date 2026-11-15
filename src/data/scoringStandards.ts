import { AltitudeGroupId } from './installations';
import { USSF_HPA_DISCRETE_TABLES } from './ussfScoringTables';

export type SexCategory = 'male' | 'female';

export type AgeBracketId =
  | 'under25'
  | '25-29'
  | '30-34'
  | '35-39'
  | '40-44'
  | '45-49'
  | '50-54'
  | '55-59'
  | '60plus';

export type AssessmentFrameworkId = 'ussf_hpa_60_20_20' | 'daf_pfra_50_15_15_20';

export type CardioEventId = 'run_2_0' | 'hamr' | 'walk_2km';
export type StrengthEventId = 'pushups' | 'hr_pushups';
export type CoreEventId = 'situps' | 'crunches' | 'plank';

export interface AgeBracketOption {
  id: AgeBracketId;
  label: string;
  minAge: number;
  maxAge: number;
}

export const AGE_BRACKETS: AgeBracketOption[] = [
  { id: 'under25', label: '< 25 Years', minAge: 17, maxAge: 24 },
  { id: '25-29', label: '25 – 29 Years', minAge: 25, maxAge: 29 },
  { id: '30-34', label: '30 – 34 Years', minAge: 30, maxAge: 34 },
  { id: '35-39', label: '35 – 39 Years', minAge: 35, maxAge: 39 },
  { id: '40-44', label: '40 – 44 Years', minAge: 40, maxAge: 44 },
  { id: '45-49', label: '45 – 49 Years', minAge: 45, maxAge: 49 },
  { id: '50-54', label: '50 – 54 Years', minAge: 50, maxAge: 54 },
  { id: '55-59', label: '55 – 59 Years', minAge: 55, maxAge: 59 },
  { id: '60plus', label: '60+ Years', minAge: 60, maxAge: 99 },
];

export interface AssessmentFrameworkSpec {
  id: AssessmentFrameworkId;
  name: string;
  shortName: string;
  regulation: string;
  effectiveDate: string;
  weights: {
    cardio: number;
    strength: number;
    core: number;
    whtr: number;
  };
  passingThresholds: {
    excellent: number;
    satisfactory: number;
  };
  summary: string;
}

export const ASSESSMENT_FRAMEWORKS: Record<AssessmentFrameworkId, AssessmentFrameworkSpec> = {
  ussf_hpa_60_20_20: {
    id: 'ussf_hpa_60_20_20',
    name: 'USSF HPA Official Standard (60 / 20 / 20)',
    shortName: 'USSF HPA (60/20/20)',
    regulation: 'SPFMAN 36-2905 & USSF HPA Official Scoring Chart',
    effectiveDate: 'As of 4 February 2026',
    weights: {
      cardio: 60,
      strength: 20,
      core: 20,
      whtr: 0,
    },
    passingThresholds: {
      excellent: 90.0,
      satisfactory: 75.0,
    },
    summary:
      'Evaluates Cardiorespiratory (60 pts: 2.0-Mile Run or 20m HAMR), Muscular Strength (20 pts), and Core Endurance (20 pts). Passing requires ≥ 75.0 composite points AND meeting minimum component values (Fit to Fight: ≥ 90.0, Health Maintenance: 75.0–89.9).',
  },
  daf_pfra_50_15_15_20: {
    id: 'daf_pfra_50_15_15_20',
    name: '4-Pillar Composite w/ WHtR (50 / 15 / 15 / 20)',
    shortName: '4-Pillar w/ WHtR (50/15/15/20)',
    regulation: 'DAFMAN 36-2905 Composite Matrix w/ 20-Pt WHtR',
    effectiveDate: '24 March 2026 Edition',
    weights: {
      cardio: 50,
      strength: 15,
      core: 15,
      whtr: 20,
    },
    passingThresholds: {
      excellent: 90.0,
      satisfactory: 75.0,
    },
    summary:
      'Integrates Waist-to-Height Ratio (WHtR, 20 pts) directly into the 100-point composite score alongside scaled Cardiorespiratory (50 pts), Muscular Strength (15 pts), and Core Endurance (15 pts).',
  },
};

export interface DemographicThresholds {
  run20MaxPtsSec: number;
  run20MinPassSec: number;
  hamrMaxPtsShuttles: number;
  hamrMinPassShuttles: number;
  walk2kmMaxPassSec: number;
  pushupsMaxReps: number;
  pushupsMinReps: number;
  hrPushupsMaxReps: number;
  hrPushupsMinReps: number;
  situpsMaxReps: number;
  situpsMinReps: number;
  crunchesMaxReps: number;
  crunchesMinReps: number;
  plankMaxSec: number;
  plankMinSec: number;
}

/**
 * DAFMAN 36-2905, Attachment 3, Table A3.1:
 * Official Altitude Time Correction for 2.0 Mile Run
 *
 * Group 1: Test altitude between 5250 ft - 5499 ft
 * Group 2: Test altitude between 5500 ft - 5999 ft
 * Group 3: Test altitude between 6000 ft - 6599 ft
 * Group 4: Test altitude at or greater than 6600 ft
 */
export interface RunAltitudeBracket {
  maxRawSec20Mile: number;
  label20Mile: string;
  deductionSec: Record<Exclude<AltitudeGroupId, 'normal'>, number>;
  formattedDeduction: Record<Exclude<AltitudeGroupId, 'normal'>, string>;
}

export const RUN_ALTITUDE_CORRECTION_TABLE: RunAltitudeBracket[] = [
  { maxRawSec20Mile: 13 * 60 + 25, label20Mile: '≤13:25', deductionSec: { group1: 2, group2: 6, group3: 11, group4: 18 }, formattedDeduction: { group1: '0:02', group2: '0:06', group3: '0:11', group4: '0:18' } },
  { maxRawSec20Mile: 13 * 60 + 55, label20Mile: '13:55', deductionSec: { group1: 2, group2: 6, group3: 11, group4: 19 }, formattedDeduction: { group1: '0:02', group2: '0:06', group3: '0:11', group4: '0:19' } },
  { maxRawSec20Mile: 14 * 60 + 12, label20Mile: '14:12', deductionSec: { group1: 2, group2: 7, group3: 12, group4: 20 }, formattedDeduction: { group1: '0:02', group2: '0:07', group3: '0:12', group4: '0:20' } },
  { maxRawSec20Mile: 14 * 60 + 27, label20Mile: '14:27', deductionSec: { group1: 2, group2: 7, group3: 12, group4: 20 }, formattedDeduction: { group1: '0:02', group2: '0:07', group3: '0:12', group4: '0:20' } },
  { maxRawSec20Mile: 14 * 60 + 41, label20Mile: '14:41', deductionSec: { group1: 2, group2: 7, group3: 12, group4: 20 }, formattedDeduction: { group1: '0:02', group2: '0:07', group3: '0:12', group4: '0:20' } },
  { maxRawSec20Mile: 15 * 60 + 5, label20Mile: '15:05', deductionSec: { group1: 2, group2: 7, group3: 12, group4: 21 }, formattedDeduction: { group1: '0:02', group2: '0:07', group3: '0:12', group4: '0:21' } },
  { maxRawSec20Mile: 15 * 60 + 17, label20Mile: '15:17', deductionSec: { group1: 2, group2: 7, group3: 12, group4: 21 }, formattedDeduction: { group1: '0:02', group2: '0:07', group3: '0:12', group4: '0:21' } },
  { maxRawSec20Mile: 15 * 60 + 28, label20Mile: '15:28', deductionSec: { group1: 2, group2: 8, group3: 13, group4: 22 }, formattedDeduction: { group1: '0:02', group2: '0:08', group3: '0:13', group4: '0:22' } },
  { maxRawSec20Mile: 15 * 60 + 38, label20Mile: '15:38', deductionSec: { group1: 2, group2: 8, group3: 13, group4: 22 }, formattedDeduction: { group1: '0:02', group2: '0:08', group3: '0:13', group4: '0:22' } },
  { maxRawSec20Mile: 16 * 60 + 9, label20Mile: '16:09', deductionSec: { group1: 2, group2: 8, group3: 13, group4: 22 }, formattedDeduction: { group1: '0:02', group2: '0:08', group3: '0:13', group4: '0:22' } },
  { maxRawSec20Mile: 16 * 60 + 29, label20Mile: '16:29', deductionSec: { group1: 3, group2: 8, group3: 14, group4: 23 }, formattedDeduction: { group1: '0:03', group2: '0:08', group3: '0:14', group4: '0:23' } },
  { maxRawSec20Mile: 16 * 60 + 49, label20Mile: '16:49', deductionSec: { group1: 3, group2: 9, group3: 15, group4: 24 }, formattedDeduction: { group1: '0:03', group2: '0:09', group3: '0:15', group4: '0:24' } },
  { maxRawSec20Mile: 17 * 60 + 8, label20Mile: '17:08', deductionSec: { group1: 3, group2: 9, group3: 15, group4: 25 }, formattedDeduction: { group1: '0:03', group2: '0:09', group3: '0:15', group4: '0:25' } },
  { maxRawSec20Mile: 17 * 60 + 18, label20Mile: '17:18', deductionSec: { group1: 3, group2: 9, group3: 15, group4: 26 }, formattedDeduction: { group1: '0:03', group2: '0:09', group3: '0:15', group4: '0:26' } },
  { maxRawSec20Mile: 17 * 60 + 37, label20Mile: '17:37', deductionSec: { group1: 3, group2: 9, group3: 16, group4: 26 }, formattedDeduction: { group1: '0:03', group2: '0:09', group3: '0:16', group4: '0:26' } },
  { maxRawSec20Mile: 17 * 60 + 55, label20Mile: '17:55', deductionSec: { group1: 3, group2: 9, group3: 16, group4: 27 }, formattedDeduction: { group1: '0:03', group2: '0:09', group3: '0:16', group4: '0:27' } },
  { maxRawSec20Mile: 18 * 60 + 23, label20Mile: '18:23', deductionSec: { group1: 3, group2: 10, group3: 16, group4: 28 }, formattedDeduction: { group1: '0:03', group2: '0:10', group3: '0:16', group4: '0:28' } },
  { maxRawSec20Mile: 18 * 60 + 39, label20Mile: '18:39', deductionSec: { group1: 3, group2: 10, group3: 17, group4: 28 }, formattedDeduction: { group1: '0:03', group2: '0:10', group3: '0:17', group4: '0:28' } },
  { maxRawSec20Mile: 19 * 60 + 7, label20Mile: '19:07', deductionSec: { group1: 3, group2: 10, group3: 17, group4: 29 }, formattedDeduction: { group1: '0:03', group2: '0:10', group3: '0:17', group4: '0:29' } },
  { maxRawSec20Mile: 19 * 60 + 36, label20Mile: '19:36', deductionSec: { group1: 3, group2: 11, group3: 18, group4: 31 }, formattedDeduction: { group1: '0:03', group2: '0:11', group3: '0:18', group4: '0:31' } },
  { maxRawSec20Mile: 19 * 60 + 45, label20Mile: '19:45', deductionSec: { group1: 3, group2: 11, group3: 18, group4: 31 }, formattedDeduction: { group1: '0:03', group2: '0:11', group3: '0:18', group4: '0:31' } },
  { maxRawSec20Mile: 20 * 60 + 6, label20Mile: '20:06', deductionSec: { group1: 4, group2: 11, group3: 19, group4: 32 }, formattedDeduction: { group1: '0:04', group2: '0:11', group3: '0:19', group4: '0:32' } },
  { maxRawSec20Mile: 20 * 60 + 44, label20Mile: '20:44', deductionSec: { group1: 4, group2: 12, group3: 20, group4: 34 }, formattedDeduction: { group1: '0:04', group2: '0:12', group3: '0:20', group4: '0:34' } },
  { maxRawSec20Mile: 21 * 60 + 9, label20Mile: '21:09', deductionSec: { group1: 5, group2: 13, group3: 21, group4: 36 }, formattedDeduction: { group1: '0:05', group2: '0:13', group3: '0:21', group4: '0:36' } },
  { maxRawSec20Mile: 22 * 60 + 4, label20Mile: '22:04', deductionSec: { group1: 5, group2: 13, group3: 22, group4: 37 }, formattedDeduction: { group1: '0:05', group2: '0:13', group3: '0:22', group4: '0:37' } },
  { maxRawSec20Mile: 22 * 60 + 28, label20Mile: '22:28', deductionSec: { group1: 5, group2: 14, group3: 23, group4: 38 }, formattedDeduction: { group1: '0:05', group2: '0:14', group3: '0:23', group4: '0:38' } },
  { maxRawSec20Mile: 22 * 60 + 45, label20Mile: '22:45', deductionSec: { group1: 5, group2: 14, group3: 24, group4: 40 }, formattedDeduction: { group1: '0:05', group2: '0:14', group3: '0:24', group4: '0:40' } },
  { maxRawSec20Mile: 22 * 60 + 50, label20Mile: '22:50', deductionSec: { group1: 5, group2: 15, group3: 25, group4: 42 }, formattedDeduction: { group1: '0:05', group2: '0:15', group3: '0:25', group4: '0:42' } },
  { maxRawSec20Mile: 22 * 60 + 58, label20Mile: '22:58', deductionSec: { group1: 5, group2: 15, group3: 26, group4: 43 }, formattedDeduction: { group1: '0:05', group2: '0:15', group3: '0:26', group4: '0:43' } },
  { maxRawSec20Mile: 23 * 60 + 15, label20Mile: '23:15', deductionSec: { group1: 6, group2: 17, group3: 28, group4: 46 }, formattedDeduction: { group1: '0:06', group2: '0:17', group3: '0:28', group4: '0:46' } },
  { maxRawSec20Mile: 23 * 60 + 30, label20Mile: '23:30', deductionSec: { group1: 6, group2: 18, group3: 29, group4: 49 }, formattedDeduction: { group1: '0:06', group2: '0:18', group3: '0:29', group4: '0:49' } },
  { maxRawSec20Mile: 23 * 60 + 36, label20Mile: '23:36', deductionSec: { group1: 6, group2: 18, group3: 31, group4: 51 }, formattedDeduction: { group1: '0:06', group2: '0:18', group3: '0:31', group4: '0:51' } },
  { maxRawSec20Mile: 24 * 60 + 0, label20Mile: '24:00:00', deductionSec: { group1: 6, group2: 19, group3: 32, group4: 54 }, formattedDeduction: { group1: '0:06', group2: '0:19', group3: '0:32', group4: '0:54' } },
  { maxRawSec20Mile: 24 * 60 + 48, label20Mile: '24:48:00', deductionSec: { group1: 7, group2: 20, group3: 34, group4: 57 }, formattedDeduction: { group1: '0:07', group2: '0:20', group3: '0:34', group4: '0:57' } },
  { maxRawSec20Mile: 99 * 60, label20Mile: '25:00:00', deductionSec: { group1: 8, group2: 22, group3: 37, group4: 62 }, formattedDeduction: { group1: '0:08', group2: '0:22', group3: '0:37', group4: '1:02' } },
];

/**
 * USSF HPA Scoring 2.0 km Walk & DAFMAN 36-2905 Attachment 3 (Tables A3.2 & A3.3):
 * Maximum Allowable 2.0-Kilometer Walk Times by Age & Altitude Group
 */
export interface WalkAltitudeRow {
  ageLabel: string;
  ageBrackets: AgeBracketId[];
  maxWalkSec: Record<AltitudeGroupId, number>;
  formattedMaxWalk: Record<AltitudeGroupId, string>;
}

export const WALK_ALTITUDE_CORRECTION_TABLE: Record<SexCategory, WalkAltitudeRow[]> = {
  male: [
    {
      ageLabel: '< 30',
      ageBrackets: ['under25', '25-29'],
      maxWalkSec: { normal: 16 * 60 + 16, group1: 16 * 60 + 18, group2: 16 * 60 + 22, group3: 16 * 60 + 25, group4: 16 * 60 + 31 },
      formattedMaxWalk: { normal: '16:16', group1: '16:18', group2: '16:22', group3: '16:25', group4: '16:31' },
    },
    {
      ageLabel: '30 – 39',
      ageBrackets: ['30-34', '35-39'],
      maxWalkSec: { normal: 16 * 60 + 18, group1: 16 * 60 + 20, group2: 16 * 60 + 24, group3: 16 * 60 + 27, group4: 16 * 60 + 33 },
      formattedMaxWalk: { normal: '16:18', group1: '16:20', group2: '16:24', group3: '16:27', group4: '16:33' },
    },
    {
      ageLabel: '40 – 49',
      ageBrackets: ['40-44', '45-49'],
      maxWalkSec: { normal: 16 * 60 + 23, group1: 16 * 60 + 25, group2: 16 * 60 + 28, group3: 16 * 60 + 31, group4: 16 * 60 + 37 },
      formattedMaxWalk: { normal: '16:23', group1: '16:25', group2: '16:28', group3: '16:31', group4: '16:37' },
    },
    {
      ageLabel: '50 – 59',
      ageBrackets: ['50-54', '55-59'],
      maxWalkSec: { normal: 16 * 60 + 40, group1: 16 * 60 + 42, group2: 16 * 60 + 45, group3: 16 * 60 + 48, group4: 16 * 60 + 53 },
      formattedMaxWalk: { normal: '16:40', group1: '16:42', group2: '16:45', group3: '16:48', group4: '16:53' },
    },
    {
      ageLabel: '60 +',
      ageBrackets: ['60plus'],
      maxWalkSec: { normal: 16 * 60 + 58, group1: 16 * 60 + 59, group2: 17 * 60 + 2, group3: 17 * 60 + 5, group4: 17 * 60 + 10 },
      formattedMaxWalk: { normal: '16:58', group1: '16:59', group2: '17:02', group3: '17:05', group4: '17:10' },
    },
  ],
  female: [
    {
      ageLabel: '< 30',
      ageBrackets: ['under25', '25-29'],
      maxWalkSec: { normal: 17 * 60 + 22, group1: 17 * 60 + 25, group2: 17 * 60 + 30, group3: 17 * 60 + 34, group4: 17 * 60 + 42 },
      formattedMaxWalk: { normal: '17:22', group1: '17:25', group2: '17:30', group3: '17:34', group4: '17:42' },
    },
    {
      ageLabel: '30 – 39',
      ageBrackets: ['30-34', '35-39'],
      maxWalkSec: { normal: 17 * 60 + 28, group1: 17 * 60 + 30, group2: 17 * 60 + 35, group3: 17 * 60 + 40, group4: 17 * 60 + 47 },
      formattedMaxWalk: { normal: '17:28', group1: '17:30', group2: '17:35', group3: '17:40', group4: '17:47' },
    },
    {
      ageLabel: '40 – 49',
      ageBrackets: ['40-44', '45-49'],
      maxWalkSec: { normal: 17 * 60 + 49, group1: 17 * 60 + 52, group2: 17 * 60 + 56, group3: 18 * 60 + 0, group4: 18 * 60 + 7 },
      formattedMaxWalk: { normal: '17:49', group1: '17:52', group2: '17:56', group3: '18:00', group4: '18:07' },
    },
    {
      ageLabel: '50 – 59',
      ageBrackets: ['50-54', '55-59'],
      maxWalkSec: { normal: 18 * 60 + 11, group1: 18 * 60 + 13, group2: 18 * 60 + 17, group3: 18 * 60 + 21, group4: 18 * 60 + 28 },
      formattedMaxWalk: { normal: '18:11', group1: '18:13', group2: '18:17', group3: '18:21', group4: '18:28' },
    },
    {
      ageLabel: '60 +',
      ageBrackets: ['60plus'],
      maxWalkSec: { normal: 18 * 60 + 53, group1: 18 * 60 + 54, group2: 18 * 60 + 58, group3: 19 * 60 + 2, group4: 19 * 60 + 8 },
      formattedMaxWalk: { normal: '18:53', group1: '18:54', group2: '18:58', group3: '19:02', group4: '19:08' },
    },
  ],
};

function buildThresholdsForCohort(sex: SexCategory, age: AgeBracketId): DemographicThresholds {
  const t = USSF_HPA_DISCRETE_TABLES[sex][age];
  const walkRow =
    WALK_ALTITUDE_CORRECTION_TABLE[sex].find((r) => r.ageBrackets.includes(age)) ||
    WALK_ALTITUDE_CORRECTION_TABLE[sex][0];
  return {
    run20MaxPtsSec: t.run20[0][0],
    run20MinPassSec: t.run20[t.run20.length - 1][0],
    hamrMaxPtsShuttles: t.hamr[0][0],
    hamrMinPassShuttles: t.hamr[t.hamr.length - 1][0],
    walk2kmMaxPassSec: walkRow.maxWalkSec.normal,
    pushupsMaxReps: t.pushups[0][0],
    pushupsMinReps: t.pushups[t.pushups.length - 1][0],
    hrPushupsMaxReps: t.hrPushups[0][0],
    hrPushupsMinReps: t.hrPushups[t.hrPushups.length - 1][0],
    situpsMaxReps: t.situps[0][0],
    situpsMinReps: t.situps[t.situps.length - 1][0],
    crunchesMaxReps: t.crunches[0][0],
    crunchesMinReps: t.crunches[t.crunches.length - 1][0],
    plankMaxSec: t.plank[0][0],
    plankMinSec: t.plank[t.plank.length - 1][0],
  };
}

function buildDemographicThresholds(): Record<SexCategory, Record<AgeBracketId, DemographicThresholds>> {
  const result = {
    male: {} as Record<AgeBracketId, DemographicThresholds>,
    female: {} as Record<AgeBracketId, DemographicThresholds>,
  };
  for (const b of AGE_BRACKETS) {
    result.male[b.id] = buildThresholdsForCohort('male', b.id);
    result.female[b.id] = buildThresholdsForCohort('female', b.id);
  }
  return result;
}

export const DEMOGRAPHIC_SCORING_THRESHOLDS: Record<
  SexCategory,
  Record<AgeBracketId, DemographicThresholds>
> = buildDemographicThresholds();

export interface WhtrTier {
  maxRatio: number;
  points20Scale: number;
  riskCategory: 'Low Risk (Optimal)' | 'Moderate Risk' | 'High Risk';
  passesMinimum: boolean;
}

export const WHTR_SCORING_TABLE: WhtrTier[] = [
  { maxRatio: 0.49, points20Scale: 20.0, riskCategory: 'Low Risk (Optimal)', passesMinimum: true },
  { maxRatio: 0.50, points20Scale: 19.0, riskCategory: 'Moderate Risk', passesMinimum: true },
  { maxRatio: 0.51, points20Scale: 18.0, riskCategory: 'Moderate Risk', passesMinimum: true },
  { maxRatio: 0.52, points20Scale: 17.0, riskCategory: 'Moderate Risk', passesMinimum: true },
  { maxRatio: 0.53, points20Scale: 16.0, riskCategory: 'Moderate Risk', passesMinimum: true },
  { maxRatio: 0.54, points20Scale: 15.0, riskCategory: 'Moderate Risk', passesMinimum: true },
  { maxRatio: 0.55, points20Scale: 12.5, riskCategory: 'High Risk', passesMinimum: true },
  { maxRatio: 0.56, points20Scale: 10.0, riskCategory: 'High Risk', passesMinimum: true },
  { maxRatio: 0.57, points20Scale: 7.5, riskCategory: 'High Risk', passesMinimum: true },
  { maxRatio: 0.58, points20Scale: 5.0, riskCategory: 'High Risk', passesMinimum: true },
  { maxRatio: 0.59, points20Scale: 2.5, riskCategory: 'High Risk', passesMinimum: true },
  { maxRatio: 9.99, points20Scale: 0.0, riskCategory: 'High Risk', passesMinimum: false },
];

export interface OfficialRegulatorySource {
  id: string;
  code: string;
  title: string;
  effectiveDate: string;
  authority: string;
  url: string;
  description: string;
}

export const OFFICIAL_REGULATORY_SOURCES: OfficialRegulatorySource[] = [
  {
    id: 'ussf-hpa-scoring-pdf',
    code: 'USSF HPA SCORING CHART',
    title: 'USSF Human Performance Assessment (HPA) Official Scoring Tables',
    effectiveDate: 'As of 4 February 2026',
    authority: 'United States Space Force (USSF)',
    url: 'https://ussfhpa.com/ussf-hpa-scoring.pdf',
    description:
      'Official discrete point-lookup tables for all 9 age cohorts (Under 25 through 60+), Male & Female: 2-Mile Run, 20m HAMR, Push-ups, Hand Release Push-ups, Sit-ups, Cross Leg Reverse Crunch, Forearm Plank, and 2.0 km Walk.',
  },
  {
    id: 'spfman-36-2905',
    code: 'SPFMAN 36-2905',
    title: 'Space Force Manual 36-2905: Human Performance and Readiness',
    effectiveDate: 'Current Active Issuance',
    authority: 'HQ United States Space Force (USSF/S1)',
    url: 'https://static.e-publishing.af.mil/production/1/sf_s1/publication/spfman36-2905/spfman36-2905.pdf',
    description:
      'Establishes U.S. Space Force Holistic Health Approach (HHA), Human Performance Assessment (HPA) execution, 75.0-point passing composite standard (Fit to Fight ≥ 90, Health Maintenance 75–89.9, Health Concern < 75), and Guardian readiness governance.',
  },
  {
    id: 'dafman-36-2905',
    code: 'DAFMAN 36-2905',
    title: 'DAF Physical Fitness Readiness Program & Attachment 3 Altitude Corrections',
    effectiveDate: '24 March 2026 Edition',
    authority: 'Department of the Air Force (AF/A1P)',
    url: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/afman36-2905/dafman36-2905.pdf',
    description:
      'Governs Attachment 3 Altitude Time Corrections for 2.0-Mile Run (Table A3.1), 2.0-Kilometer Walk (Tables A3.2 & A3.3), and 20-Meter HAMR (Table A3.4) across Groups 1–4 (5,250 ft to ≥ 6,600 ft MSL).',
  },
  {
    id: 'afpc-fitness-charts',
    code: 'AFPC / myFSS Fitness Charts',
    title: 'Official Component Standards & Body Composition (WHtR) Guidance',
    effectiveDate: 'Active 5-Year Cohort Charts',
    authority: 'Air Force Personnel Center (AFPC) / myFitness',
    url: 'https://www.afpc.af.mil/Career-Management/Fitness-Program/',
    description:
      'Official repository for 5-year age bracket scoring charts, Waist-to-Height Ratio (WHtR) Body Composition guidance, and Unit Fitness Cell administration.',
  },
];
