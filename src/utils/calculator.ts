import {
  ALTITUDE_GROUPS,
  AltitudeGroupId,
} from '../data/installations';
import {
  AGE_BRACKETS,
  AgeBracketId,
  ASSESSMENT_FRAMEWORKS,
  AssessmentFrameworkId,
  CardioEventId,
  CoreEventId,
  DEMOGRAPHIC_SCORING_THRESHOLDS,
  RUN_ALTITUDE_CORRECTION_TABLE,
  SexCategory,
  StrengthEventId,
  WALK_ALTITUDE_CORRECTION_TABLE,
  WHTR_SCORING_TABLE,
} from '../data/scoringStandards';
import {
  DiscreteScoreRow,
  USSF_HPA_DISCRETE_TABLES,
} from '../data/ussfScoringTables';

export interface AssessmentInputs {
  sex: SexCategory;
  ageBracket: AgeBracketId;
  framework: AssessmentFrameworkId;
  installationId: string;
  altitudeGroup: AltitudeGroupId;
  isManualAltitude: boolean;

  // Event selections
  cardioEvent: CardioEventId;
  strengthEvent: StrengthEventId;
  coreEvent: CoreEventId;

  // Medical exemptions
  cardioExempt: boolean;
  strengthExempt: boolean;
  coreExempt: boolean;
  whtrExempt: boolean;

  // Raw performance inputs
  runMinutes: number;
  runSeconds: number;
  hamrShuttles: number;
  walkMinutes: number;
  walkSeconds: number;

  strengthReps: number;
  coreReps: number;
  plankMinutes: number;
  plankSeconds: number;

  waistInches: number;
  heightInches: number;
}

export interface NextThresholdInfo {
  isMaxed: boolean;
  isBelowMinimum: boolean;
  targetPerformanceLabel: string;
  improvementNeededLabel: string;
  resultingPoints: number;
  pointsGain: number;
}

export interface ComponentScoreResult {
  componentKey: 'cardio' | 'strength' | 'core' | 'whtr';
  componentTitle: string;
  eventLabel: string;
  exempt: boolean;
  isPassFailOnly?: boolean;
  earnedPoints: number;
  maxPoints: number;
  minRequiredPoints: number;
  percentageOfMax: number;
  passedMinimum: boolean;
  rawPerformanceLabel: string;
  adjustedPerformanceLabel: string;
  altitudeApplied: boolean;
  altitudeAdjustmentNote: string;
  runTiming?: {
    rawSeconds: number;
    deductionSeconds: number;
    scoredSeconds: number;
  };
  minimumRequirementLabel: string;
  maximumRequirementLabel: string;
  nextThreshold: NextThresholdInfo;
}

export type ReadinessTier =
  | 'EXCELLENT'
  | 'SATISFACTORY'
  | 'HPA_BASELINE_PASS'
  | 'UNSATISFACTORY'
  | 'EXEMPT_ALL';

export interface AssessmentResult {
  compositeScore: number;
  totalEarnedPoints: number;
  totalPossiblePoints: number;
  passedOverall: boolean;
  passedDafStandard75: boolean;
  passedUssfHpa60: boolean;
  allComponentMinimumsMet: boolean;
  readinessTier: ReadinessTier;
  readinessLabel: string;
  testingFrequencyLabel: string;
  failureReasons: string[];
  cardio: ComponentScoreResult;
  strength: ComponentScoreResult;
  core: ComponentScoreResult;
  whtr: ComponentScoreResult & {
    ratio: number;
    riskCategory: string;
    scoredInComposite: boolean;
  };
}

export interface GoalComponentRecommendation {
  componentKey: 'cardio' | 'strength' | 'core' | 'whtr';
  componentTitle: string;
  eventLabel: string;
  currentPerformanceLabel: string;
  currentPoints: number;
  maxPoints: number;
  balancedTargetPoints: number;
  balancedTargetPerformanceLabel: string;
  balancedDeltaLabel: string;
  singlePathAchievable: boolean;
  singlePathTargetPoints: number;
  singlePathPerformanceLabel: string;
  singlePathDeltaLabel: string;
}

export interface TargetGoalPlan {
  targetCompositeScore: number;
  currentCompositeScore: number;
  pointsGap: number;
  alreadyAchieved: boolean;
  achievable: boolean;
  recommendations: GoalComponentRecommendation[];
}

export function formatSecondsToMmSs(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function parseMmSsToSeconds(minutes: number, seconds: number): number {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return m * 60 + s;
}

/**
 * Standard 20m HAMR shuttle-to-level conversion (Levels 1–20)
 */
const HAMR_SHUTTLES_PER_LEVEL = [
  7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16,
];

export function formatHamrLevelShuttle(totalShuttles: number): string {
  const clamped = Math.max(0, Math.round(totalShuttles));
  if (clamped === 0) return 'Lvl 0-0 (0 shuttles)';
  let remaining = clamped;
  for (let i = 0; i < HAMR_SHUTTLES_PER_LEVEL.length; i++) {
    const count = HAMR_SHUTTLES_PER_LEVEL[i];
    if (remaining <= count) {
      return `Lvl ${i + 1}-${remaining} (${clamped} shuttles)`;
    }
    remaining -= count;
  }
  return `Lvl 20+ (${clamped} shuttles)`;
}

/**
 * Calculates official DAFMAN 36-2905 Attachment 3 (Table A3.1) altitude deduction
 * for the 2.0-Mile Run (in seconds deducted from raw 2-mile run time).
 */
export function getRunAltitudeDeductionSeconds(
  rawRunSeconds: number,
  altitudeGroup: AltitudeGroupId
): number {
  if (altitudeGroup === 'normal' || rawRunSeconds <= 0) {
    return 0;
  }
  const bracket =
    RUN_ALTITUDE_CORRECTION_TABLE.find((b) => rawRunSeconds <= b.maxRawSec20Mile) ||
    RUN_ALTITUDE_CORRECTION_TABLE[RUN_ALTITUDE_CORRECTION_TABLE.length - 1];

  return bracket.deductionSec[altitudeGroup];
}

export function getRunAltitudeBracket(rawRunSeconds: number) {
  return (
    RUN_ALTITUDE_CORRECTION_TABLE.find((b) => rawRunSeconds <= b.maxRawSec20Mile) ||
    RUN_ALTITUDE_CORRECTION_TABLE[RUN_ALTITUDE_CORRECTION_TABLE.length - 1]
  );
}

/**
 * Calculates official DAFMAN 36-2905 Attachment 3 (Tables A3.2 & A3.3) maximum allowable
 * 2.0-Kilometer Walk time in seconds by Sex, Age Bracket, and Altitude Group.
 */
export function getWalkMaxPassSeconds(
  sex: SexCategory,
  ageBracket: AgeBracketId,
  altitudeGroup: AltitudeGroupId
): number {
  const rows = WALK_ALTITUDE_CORRECTION_TABLE[sex];
  const matched = rows.find((r) => r.ageBrackets.includes(ageBracket)) || rows[0];
  return matched.maxWalkSec[altitudeGroup];
}

/**
 * Calculates official HAMR shuttle bonus for high-altitude groups (Table A3.4)
 */
export function getHamrAltitudeBonusShuttles(
  rawShuttles: number,
  altitudeGroup: AltitudeGroupId
): number {
  if (altitudeGroup === 'normal' || rawShuttles <= 0) {
    return 0;
  }
  return ALTITUDE_GROUPS[altitudeGroup].hamrShuttleBonus;
}

function roundToTenth(val: number): number {
  return Math.round(val * 10) / 10;
}

function scaleTablePoints(tablePoints: number, componentMax: number, tableMax: number): number {
  if (componentMax === tableMax) return roundToTenth(tablePoints);
  return roundToTenth((tablePoints * componentMax) / tableMax);
}

interface DiscreteLookupResult {
  points: number;
  passedMin: boolean;
  matchedIndex: number;
}

function lookupHigherIsBetter(
  value: number,
  rows: readonly DiscreteScoreRow[],
  componentMax: number,
  tableMax: number
): DiscreteLookupResult {
  const cleanVal = Math.max(0, Math.floor(value));
  const idx = rows.findIndex(([threshold]) => cleanVal >= threshold);
  if (idx === -1) {
    return { points: 0, passedMin: false, matchedIndex: -1 };
  }
  return {
    points: scaleTablePoints(rows[idx][1], componentMax, tableMax),
    passedMin: true,
    matchedIndex: idx,
  };
}

function lookupLowerIsBetter(
  seconds: number,
  rows: readonly DiscreteScoreRow[],
  componentMax: number,
  tableMax: number
): DiscreteLookupResult {
  const cleanSec = Math.max(1, Math.round(seconds));
  const idx = rows.findIndex(([maxSec]) => cleanSec <= maxSec);
  if (idx === -1) {
    return { points: 0, passedMin: false, matchedIndex: -1 };
  }
  return {
    points: scaleTablePoints(rows[idx][1], componentMax, tableMax),
    passedMin: true,
    matchedIndex: idx,
  };
}

function findNextHigherRow(
  rows: readonly DiscreteScoreRow[],
  matchedIndex: number,
  currentPoints: number,
  componentMax: number,
  tableMax: number
): { targetValue: number; resultingPoints: number } | null {
  for (let i = matchedIndex - 1; i >= 0; i--) {
    const pts = scaleTablePoints(rows[i][1], componentMax, tableMax);
    if (pts > currentPoints) {
      return { targetValue: rows[i][0], resultingPoints: pts };
    }
  }
  return null;
}

function findRowForPointsFromBottom(
  rows: readonly DiscreteScoreRow[],
  desiredPoints: number,
  componentMax: number,
  tableMax: number
): { value: number; points: number } {
  for (let i = rows.length - 1; i >= 0; i--) {
    const pts = scaleTablePoints(rows[i][1], componentMax, tableMax);
    if (pts >= desiredPoints - 0.001) {
      return { value: rows[i][0], points: pts };
    }
  }
  return {
    value: rows[0][0],
    points: scaleTablePoints(rows[0][1], componentMax, tableMax),
  };
}

export function calculateAssessment(inputs: AssessmentInputs): AssessmentResult {
  const frameworkSpec = ASSESSMENT_FRAMEWORKS[inputs.framework];
  const cohortTables = USSF_HPA_DISCRETE_TABLES[inputs.sex][inputs.ageBracket];
  const altitudeSpec = ALTITUDE_GROUPS[inputs.altitudeGroup];

  // 1. CARDIORESPIRATORY COMPONENT
  const cardioMaxPts = frameworkSpec.weights.cardio; // 60 or 50

  let cardioResult: ComponentScoreResult;

  if (inputs.cardioExempt) {
    cardioResult = {
      componentKey: 'cardio',
      componentTitle: 'Cardiorespiratory Fitness',
      eventLabel: 'Exempt (Medical Profile)',
      exempt: true,
      earnedPoints: 0,
      maxPoints: 0,
      minRequiredPoints: 0,
      percentageOfMax: 100,
      passedMinimum: true,
      rawPerformanceLabel: 'EXEMPT',
      adjustedPerformanceLabel: 'EXEMPT',
      altitudeApplied: false,
      altitudeAdjustmentNote: 'Component medically exempt; composite points scaled across active pillars.',
      minimumRequirementLabel: 'N/A',
      maximumRequirementLabel: 'N/A',
      nextThreshold: {
        isMaxed: true,
        isBelowMinimum: false,
        targetPerformanceLabel: 'Exempt',
        improvementNeededLabel: 'No action required',
        resultingPoints: 0,
        pointsGain: 0,
      },
    };
  } else if (inputs.cardioEvent === 'walk_2km') {
    const rawWalkSec = parseMmSsToSeconds(inputs.walkMinutes, inputs.walkSeconds);
    const baseMaxWalkSec = getWalkMaxPassSeconds(inputs.sex, inputs.ageBracket, 'normal');
    const maxAllowedWalkSec = getWalkMaxPassSeconds(
      inputs.sex,
      inputs.ageBracket,
      inputs.altitudeGroup
    );
    const walkAltAllowanceSec = Math.max(0, maxAllowedWalkSec - baseMaxWalkSec);
    const passedWalk = rawWalkSec > 0 && rawWalkSec <= maxAllowedWalkSec;

    cardioResult = {
      componentKey: 'cardio',
      componentTitle: 'Cardiorespiratory Fitness',
      eventLabel: '2.0-Kilometer Walk (Medical Alternative)',
      exempt: false,
      isPassFailOnly: true,
      earnedPoints: 0,
      maxPoints: 0, // Walk is pass/fail; composite points are normalized from remaining components
      minRequiredPoints: 0,
      percentageOfMax: passedWalk ? 100 : 0,
      passedMinimum: passedWalk,
      rawPerformanceLabel: formatSecondsToMmSs(rawWalkSec),
      adjustedPerformanceLabel:
        walkAltAllowanceSec > 0
          ? `${formatSecondsToMmSs(rawWalkSec)} (Max ${formatSecondsToMmSs(maxAllowedWalkSec)} w/ +${walkAltAllowanceSec}s alt)`
          : formatSecondsToMmSs(rawWalkSec),
      altitudeApplied: walkAltAllowanceSec > 0,
      altitudeAdjustmentNote:
        walkAltAllowanceSec > 0
          ? `${altitudeSpec.shortLabel}: Max walk time extended by +${walkAltAllowanceSec}s to ${formatSecondsToMmSs(
              maxAllowedWalkSec
            )} per DAFMAN 36-2905 Table ${inputs.sex === 'male' ? 'A3.2' : 'A3.3'}.`
          : `Sea-level / standard max walk time: ${formatSecondsToMmSs(maxAllowedWalkSec)} per USSF HPA Walk Chart.`,
      minimumRequirementLabel: `≤ ${formatSecondsToMmSs(maxAllowedWalkSec)}`,
      maximumRequirementLabel: `Pass/Fail (≤ ${formatSecondsToMmSs(maxAllowedWalkSec)})`,
      nextThreshold: passedWalk
        ? {
            isMaxed: true,
            isBelowMinimum: false,
            targetPerformanceLabel: `≤ ${formatSecondsToMmSs(maxAllowedWalkSec)}`,
            improvementNeededLabel: 'Pass criteria met (Pass/Fail event)',
            resultingPoints: 0,
            pointsGain: 0,
          }
        : {
            isMaxed: false,
            isBelowMinimum: true,
            targetPerformanceLabel: formatSecondsToMmSs(maxAllowedWalkSec),
            improvementNeededLabel: `-${formatSecondsToMmSs(
              Math.max(1, rawWalkSec - maxAllowedWalkSec)
            )} faster to pass Walk`,
            resultingPoints: 0,
            pointsGain: 0,
          },
    };
  } else if (inputs.cardioEvent === 'hamr') {
    const rows = cohortTables.hamr;
    const minRow = rows[rows.length - 1];
    const maxRow = rows[0];
    const minPassPts = scaleTablePoints(minRow[1], cardioMaxPts, 60);

    const rawShuttles = Math.max(0, Math.floor(inputs.hamrShuttles));
    const bonusShuttles = getHamrAltitudeBonusShuttles(rawShuttles, inputs.altitudeGroup);
    const adjustedShuttles = rawShuttles + bonusShuttles;

    const { points, passedMin, matchedIndex } = lookupHigherIsBetter(
      adjustedShuttles,
      rows,
      cardioMaxPts,
      60
    );

    let nextThreshold: NextThresholdInfo;
    if (!passedMin) {
      const neededRaw = Math.max(1, minRow[0] - bonusShuttles);
      const delta = Math.max(1, neededRaw - rawShuttles);
      nextThreshold = {
        isMaxed: false,
        isBelowMinimum: true,
        targetPerformanceLabel: `${neededRaw} shuttles (${formatHamrLevelShuttle(neededRaw)})`,
        improvementNeededLabel: `+${delta} ${delta === 1 ? 'shuttle' : 'shuttles'} to reach minimum (${minPassPts.toFixed(1)} pts)`,
        resultingPoints: minPassPts,
        pointsGain: minPassPts,
      };
    } else if (matchedIndex === 0 || points >= cardioMaxPts) {
      nextThreshold = {
        isMaxed: true,
        isBelowMinimum: false,
        targetPerformanceLabel: `${maxRow[0]} shuttles`,
        improvementNeededLabel: 'Maximum component score achieved',
        resultingPoints: cardioMaxPts,
        pointsGain: 0,
      };
    } else {
      const nextStep = findNextHigherRow(rows, matchedIndex, points, cardioMaxPts, 60);
      if (nextStep) {
        const nextRaw = Math.max(1, nextStep.targetValue - bonusShuttles);
        const deltaShuttles = Math.max(1, nextRaw - rawShuttles);
        nextThreshold = {
          isMaxed: false,
          isBelowMinimum: false,
          targetPerformanceLabel: `${nextRaw} shuttles`,
          improvementNeededLabel: `+${deltaShuttles} ${
            deltaShuttles === 1 ? 'shuttle' : 'shuttles'
          } for +${(nextStep.resultingPoints - points).toFixed(1)} pts`,
          resultingPoints: nextStep.resultingPoints,
          pointsGain: roundToTenth(nextStep.resultingPoints - points),
        };
      } else {
        nextThreshold = {
          isMaxed: true,
          isBelowMinimum: false,
          targetPerformanceLabel: `${maxRow[0]} shuttles`,
          improvementNeededLabel: 'Maximum component score achieved',
          resultingPoints: cardioMaxPts,
          pointsGain: 0,
        };
      }
    }

    cardioResult = {
      componentKey: 'cardio',
      componentTitle: 'Cardiorespiratory Fitness',
      eventLabel: '20m HAMR Shuttle Run',
      exempt: false,
      earnedPoints: points,
      maxPoints: cardioMaxPts,
      minRequiredPoints: minPassPts,
      percentageOfMax: roundToTenth((points / cardioMaxPts) * 100),
      passedMinimum: passedMin,
      rawPerformanceLabel: formatHamrLevelShuttle(rawShuttles),
      adjustedPerformanceLabel:
        bonusShuttles > 0
          ? `${formatHamrLevelShuttle(adjustedShuttles)} (+${bonusShuttles} alt)`
          : formatHamrLevelShuttle(rawShuttles),
      altitudeApplied: bonusShuttles > 0,
      altitudeAdjustmentNote:
        bonusShuttles > 0
          ? `${altitudeSpec.shortLabel}: +${bonusShuttles} ${
              bonusShuttles === 1 ? 'shuttle' : 'shuttles'
            } added per DAFMAN 36-2905 Table A3.4.`
          : 'Standard elevation (< 5,250 ft MSL): 0 shuttle adjustment.',
      minimumRequirementLabel: `${minRow[0]} shuttles (${formatHamrLevelShuttle(minRow[0])})`,
      maximumRequirementLabel: `${maxRow[0]} shuttles (${formatHamrLevelShuttle(maxRow[0])})`,
      nextThreshold,
    };
  } else {
    // 2.0-Mile Run
    const rows = cohortTables.run20;
    const minRow = rows[rows.length - 1];
    const maxRow = rows[0];
    const minPassSec = minRow[0];
    const maxPtsSec = maxRow[0];
    const minPassPts = scaleTablePoints(minRow[1], cardioMaxPts, 60);

    const rawRunSec = parseMmSsToSeconds(inputs.runMinutes, inputs.runSeconds);
    const deductionSec = getRunAltitudeDeductionSeconds(rawRunSec, inputs.altitudeGroup);
    const matchedAltBracket = getRunAltitudeBracket(rawRunSec);
    const adjustedRunSec = Math.max(60, rawRunSec - deductionSec);

    const { points, passedMin, matchedIndex } =
      rawRunSec <= 0
        ? { points: 0, passedMin: false, matchedIndex: -1 }
        : lookupLowerIsBetter(adjustedRunSec, rows, cardioMaxPts, 60);

    let nextThreshold: NextThresholdInfo;
    if (!passedMin) {
      const targetRawSec = minPassSec + deductionSec;
      const fasterNeededSec = Math.max(1, adjustedRunSec - minPassSec);
      nextThreshold = {
        isMaxed: false,
        isBelowMinimum: true,
        targetPerformanceLabel: `${formatSecondsToMmSs(targetRawSec)} raw (${formatSecondsToMmSs(
          minPassSec
        )} adj)`,
        improvementNeededLabel: `-${fasterNeededSec}s faster to reach minimum (${minPassPts.toFixed(
          1
        )} pts)`,
        resultingPoints: minPassPts,
        pointsGain: minPassPts,
      };
    } else if (matchedIndex === 0 || points >= cardioMaxPts) {
      nextThreshold = {
        isMaxed: true,
        isBelowMinimum: false,
        targetPerformanceLabel: formatSecondsToMmSs(maxPtsSec + deductionSec),
        improvementNeededLabel: 'Maximum component score achieved',
        resultingPoints: cardioMaxPts,
        pointsGain: 0,
      };
    } else {
      const nextStep = findNextHigherRow(rows, matchedIndex, points, cardioMaxPts, 60);
      if (nextStep) {
        const fasterSec = Math.max(1, adjustedRunSec - nextStep.targetValue);
        const targetRawSec = nextStep.targetValue + deductionSec;
        nextThreshold = {
          isMaxed: false,
          isBelowMinimum: false,
          targetPerformanceLabel: `${formatSecondsToMmSs(targetRawSec)} raw`,
          improvementNeededLabel: `-${fasterSec}s faster for +${(
            nextStep.resultingPoints - points
          ).toFixed(1)} pts`,
          resultingPoints: nextStep.resultingPoints,
          pointsGain: roundToTenth(nextStep.resultingPoints - points),
        };
      } else {
        nextThreshold = {
          isMaxed: true,
          isBelowMinimum: false,
          targetPerformanceLabel: formatSecondsToMmSs(maxPtsSec + deductionSec),
          improvementNeededLabel: 'Maximum component score achieved',
          resultingPoints: cardioMaxPts,
          pointsGain: 0,
        };
      }
    }

    cardioResult = {
      componentKey: 'cardio',
      componentTitle: 'Cardiorespiratory Fitness',
      eventLabel: '2.0-Mile Run',
      runTiming: { rawSeconds: rawRunSec, deductionSeconds: deductionSec, scoredSeconds: adjustedRunSec },
      exempt: false,
      earnedPoints: points,
      maxPoints: cardioMaxPts,
      minRequiredPoints: minPassPts,
      percentageOfMax: roundToTenth((points / cardioMaxPts) * 100),
      passedMinimum: passedMin,
      rawPerformanceLabel: formatSecondsToMmSs(rawRunSec),
      adjustedPerformanceLabel:
        deductionSec > 0
          ? `${formatSecondsToMmSs(adjustedRunSec)} (-0:${String(deductionSec).padStart(
              2,
              '0'
            )} / -${deductionSec}s alt, Table A3.1 ${matchedAltBracket.label20Mile})`
          : formatSecondsToMmSs(rawRunSec),
      altitudeApplied: deductionSec > 0,
      altitudeAdjustmentNote:
        deductionSec > 0
          ? `${altitudeSpec.shortLabel}: -${deductionSec}s (0:${String(deductionSec).padStart(
              2,
              '0'
            )}) subtracted from raw 2.0-mile run time per Table A3.1 (${matchedAltBracket.label20Mile} row).`
          : 'Standard elevation (< 5,250 ft MSL): 0s time deduction.',
      minimumRequirementLabel: formatSecondsToMmSs(minPassSec),
      maximumRequirementLabel: formatSecondsToMmSs(maxPtsSec),
      nextThreshold,
    };
  }

  // 2. MUSCULAR STRENGTH COMPONENT
  const strengthMaxPts = frameworkSpec.weights.strength; // 20 or 15

  let strengthResult: ComponentScoreResult;
  if (inputs.strengthExempt) {
    strengthResult = {
      componentKey: 'strength',
      componentTitle: 'Muscular Strength',
      eventLabel: 'Exempt (Medical Profile)',
      exempt: true,
      earnedPoints: 0,
      maxPoints: 0,
      minRequiredPoints: 0,
      percentageOfMax: 100,
      passedMinimum: true,
      rawPerformanceLabel: 'EXEMPT',
      adjustedPerformanceLabel: 'EXEMPT',
      altitudeApplied: false,
      altitudeAdjustmentNote: 'Component medically exempt.',
      minimumRequirementLabel: 'N/A',
      maximumRequirementLabel: 'N/A',
      nextThreshold: {
        isMaxed: true,
        isBelowMinimum: false,
        targetPerformanceLabel: 'Exempt',
        improvementNeededLabel: 'No action required',
        resultingPoints: 0,
        pointsGain: 0,
      },
    };
  } else {
    const isHrp = inputs.strengthEvent === 'hr_pushups';
    const rows = isHrp ? cohortTables.hrPushups : cohortTables.pushups;
    const minRow = rows[rows.length - 1];
    const maxRow = rows[0];
    const minReps = minRow[0];
    const maxReps = maxRow[0];
    const minPassPts = scaleTablePoints(minRow[1], strengthMaxPts, 20);
    const reps = Math.max(0, Math.floor(inputs.strengthReps));

    const { points, passedMin, matchedIndex } = lookupHigherIsBetter(
      reps,
      rows,
      strengthMaxPts,
      20
    );

    let nextThreshold: NextThresholdInfo;
    if (!passedMin) {
      const delta = Math.max(1, minReps - reps);
      nextThreshold = {
        isMaxed: false,
        isBelowMinimum: true,
        targetPerformanceLabel: `${minReps} reps`,
        improvementNeededLabel: `+${delta} ${delta === 1 ? 'rep' : 'reps'} to reach minimum (${minPassPts.toFixed(1)} pts)`,
        resultingPoints: minPassPts,
        pointsGain: minPassPts,
      };
    } else if (matchedIndex === 0 || points >= strengthMaxPts) {
      nextThreshold = {
        isMaxed: true,
        isBelowMinimum: false,
        targetPerformanceLabel: `${maxReps} reps`,
        improvementNeededLabel: 'Maximum component score achieved',
        resultingPoints: strengthMaxPts,
        pointsGain: 0,
      };
    } else {
      const nextStep = findNextHigherRow(rows, matchedIndex, points, strengthMaxPts, 20);
      if (nextStep) {
        const delta = Math.max(1, nextStep.targetValue - reps);
        nextThreshold = {
          isMaxed: false,
          isBelowMinimum: false,
          targetPerformanceLabel: `${nextStep.targetValue} reps`,
          improvementNeededLabel: `+${delta} ${delta === 1 ? 'rep' : 'reps'} for +${(
            nextStep.resultingPoints - points
          ).toFixed(1)} pts`,
          resultingPoints: nextStep.resultingPoints,
          pointsGain: roundToTenth(nextStep.resultingPoints - points),
        };
      } else {
        nextThreshold = {
          isMaxed: true,
          isBelowMinimum: false,
          targetPerformanceLabel: `${maxReps} reps`,
          improvementNeededLabel: 'Maximum component score achieved',
          resultingPoints: strengthMaxPts,
          pointsGain: 0,
        };
      }
    }

    strengthResult = {
      componentKey: 'strength',
      componentTitle: 'Muscular Strength',
      eventLabel: isHrp ? '2-Min Hand-Release Push-ups' : '1-Min Push-ups',
      exempt: false,
      earnedPoints: points,
      maxPoints: strengthMaxPts,
      minRequiredPoints: minPassPts,
      percentageOfMax: roundToTenth((points / strengthMaxPts) * 100),
      passedMinimum: passedMin,
      rawPerformanceLabel: `${reps} reps`,
      adjustedPerformanceLabel: `${reps} reps`,
      altitudeApplied: false,
      altitudeAdjustmentNote:
        'Per DAFMAN 36-2905 Attachment 3, muscular strength events receive no altitude adjustment.',
      minimumRequirementLabel: `${minReps} reps (${minPassPts.toFixed(1)} pts)`,
      maximumRequirementLabel: `${maxReps} reps`,
      nextThreshold,
    };
  }

  // 3. CORE ENDURANCE COMPONENT
  const coreMaxPts = frameworkSpec.weights.core; // 20 or 15

  let coreResult: ComponentScoreResult;
  if (inputs.coreExempt) {
    coreResult = {
      componentKey: 'core',
      componentTitle: 'Core Endurance',
      eventLabel: 'Exempt (Medical Profile)',
      exempt: true,
      earnedPoints: 0,
      maxPoints: 0,
      minRequiredPoints: 0,
      percentageOfMax: 100,
      passedMinimum: true,
      rawPerformanceLabel: 'EXEMPT',
      adjustedPerformanceLabel: 'EXEMPT',
      altitudeApplied: false,
      altitudeAdjustmentNote: 'Component medically exempt.',
      minimumRequirementLabel: 'N/A',
      maximumRequirementLabel: 'N/A',
      nextThreshold: {
        isMaxed: true,
        isBelowMinimum: false,
        targetPerformanceLabel: 'Exempt',
        improvementNeededLabel: 'No action required',
        resultingPoints: 0,
        pointsGain: 0,
      },
    };
  } else if (inputs.coreEvent === 'plank') {
    const rows = cohortTables.plank;
    const minRow = rows[rows.length - 1];
    const maxRow = rows[0];
    const minSec = minRow[0];
    const maxSec = maxRow[0];
    const minPassPts = scaleTablePoints(minRow[1], coreMaxPts, 20);
    const plankSec = parseMmSsToSeconds(inputs.plankMinutes, inputs.plankSeconds);

    const { points, passedMin, matchedIndex } = lookupHigherIsBetter(
      plankSec,
      rows,
      coreMaxPts,
      20
    );

    let nextThreshold: NextThresholdInfo;
    if (!passedMin) {
      const deltaSec = Math.max(1, minSec - plankSec);
      nextThreshold = {
        isMaxed: false,
        isBelowMinimum: true,
        targetPerformanceLabel: formatSecondsToMmSs(minSec),
        improvementNeededLabel: `+${deltaSec}s hold to reach minimum (${minPassPts.toFixed(1)} pts)`,
        resultingPoints: minPassPts,
        pointsGain: minPassPts,
      };
    } else if (matchedIndex === 0 || points >= coreMaxPts) {
      nextThreshold = {
        isMaxed: true,
        isBelowMinimum: false,
        targetPerformanceLabel: formatSecondsToMmSs(maxSec),
        improvementNeededLabel: 'Maximum component score achieved',
        resultingPoints: coreMaxPts,
        pointsGain: 0,
      };
    } else {
      const nextStep = findNextHigherRow(rows, matchedIndex, points, coreMaxPts, 20);
      if (nextStep) {
        const deltaSec = Math.max(1, nextStep.targetValue - plankSec);
        nextThreshold = {
          isMaxed: false,
          isBelowMinimum: false,
          targetPerformanceLabel: formatSecondsToMmSs(nextStep.targetValue),
          improvementNeededLabel: `+${deltaSec}s hold for +${(
            nextStep.resultingPoints - points
          ).toFixed(1)} pts`,
          resultingPoints: nextStep.resultingPoints,
          pointsGain: roundToTenth(nextStep.resultingPoints - points),
        };
      } else {
        nextThreshold = {
          isMaxed: true,
          isBelowMinimum: false,
          targetPerformanceLabel: formatSecondsToMmSs(maxSec),
          improvementNeededLabel: 'Maximum component score achieved',
          resultingPoints: coreMaxPts,
          pointsGain: 0,
        };
      }
    }

    coreResult = {
      componentKey: 'core',
      componentTitle: 'Core Endurance',
      eventLabel: 'Timed Forearm Plank',
      exempt: false,
      earnedPoints: points,
      maxPoints: coreMaxPts,
      minRequiredPoints: minPassPts,
      percentageOfMax: roundToTenth((points / coreMaxPts) * 100),
      passedMinimum: passedMin,
      rawPerformanceLabel: formatSecondsToMmSs(plankSec),
      adjustedPerformanceLabel: formatSecondsToMmSs(plankSec),
      altitudeApplied: false,
      altitudeAdjustmentNote:
        'Per DAFMAN 36-2905 Attachment 3, core endurance events receive no altitude adjustment.',
      minimumRequirementLabel: `${formatSecondsToMmSs(minSec)} (${minPassPts.toFixed(1)} pts)`,
      maximumRequirementLabel: formatSecondsToMmSs(maxSec),
      nextThreshold,
    };
  } else {
    const isCrunch = inputs.coreEvent === 'crunches';
    const rows = isCrunch ? cohortTables.crunches : cohortTables.situps;
    const minRow = rows[rows.length - 1];
    const maxRow = rows[0];
    const minReps = minRow[0];
    const maxReps = maxRow[0];
    const minPassPts = scaleTablePoints(minRow[1], coreMaxPts, 20);
    const reps = Math.max(0, Math.floor(inputs.coreReps));

    const { points, passedMin, matchedIndex } = lookupHigherIsBetter(
      reps,
      rows,
      coreMaxPts,
      20
    );

    let nextThreshold: NextThresholdInfo;
    if (!passedMin) {
      const delta = Math.max(1, minReps - reps);
      nextThreshold = {
        isMaxed: false,
        isBelowMinimum: true,
        targetPerformanceLabel: `${minReps} reps`,
        improvementNeededLabel: `+${delta} ${delta === 1 ? 'rep' : 'reps'} to reach minimum (${minPassPts.toFixed(1)} pts)`,
        resultingPoints: minPassPts,
        pointsGain: minPassPts,
      };
    } else if (matchedIndex === 0 || points >= coreMaxPts) {
      nextThreshold = {
        isMaxed: true,
        isBelowMinimum: false,
        targetPerformanceLabel: `${maxReps} reps`,
        improvementNeededLabel: 'Maximum component score achieved',
        resultingPoints: coreMaxPts,
        pointsGain: 0,
      };
    } else {
      const nextStep = findNextHigherRow(rows, matchedIndex, points, coreMaxPts, 20);
      if (nextStep) {
        const delta = Math.max(1, nextStep.targetValue - reps);
        nextThreshold = {
          isMaxed: false,
          isBelowMinimum: false,
          targetPerformanceLabel: `${nextStep.targetValue} reps`,
          improvementNeededLabel: `+${delta} ${delta === 1 ? 'rep' : 'reps'} for +${(
            nextStep.resultingPoints - points
          ).toFixed(1)} pts`,
          resultingPoints: nextStep.resultingPoints,
          pointsGain: roundToTenth(nextStep.resultingPoints - points),
        };
      } else {
        nextThreshold = {
          isMaxed: true,
          isBelowMinimum: false,
          targetPerformanceLabel: `${maxReps} reps`,
          improvementNeededLabel: 'Maximum component score achieved',
          resultingPoints: coreMaxPts,
          pointsGain: 0,
        };
      }
    }

    coreResult = {
      componentKey: 'core',
      componentTitle: 'Core Endurance',
      eventLabel: isCrunch ? '2-Min Cross-Leg Reverse Crunches' : '1-Min Sit-ups',
      exempt: false,
      earnedPoints: points,
      maxPoints: coreMaxPts,
      minRequiredPoints: minPassPts,
      percentageOfMax: roundToTenth((points / coreMaxPts) * 100),
      passedMinimum: passedMin,
      rawPerformanceLabel: `${reps} reps`,
      adjustedPerformanceLabel: `${reps} reps`,
      altitudeApplied: false,
      altitudeAdjustmentNote:
        'Per DAFMAN 36-2905 Attachment 3, core endurance events receive no altitude adjustment.',
      minimumRequirementLabel: `${minReps} reps (${minPassPts.toFixed(1)} pts)`,
      maximumRequirementLabel: `${maxReps} reps`,
      nextThreshold,
    };
  }

  // 4. BODY COMPOSITION / WAIST-TO-HEIGHT RATIO (WHtR)
  const whtrScoredInComposite = frameworkSpec.weights.whtr > 0;
  const safeHeight = Math.max(36, inputs.heightInches || 68);
  const safeWaist = Math.max(15, inputs.waistInches || 32);
  const rawRatio = Math.round((safeWaist / safeHeight) * 100) / 100;
  const matchedTier =
    WHTR_SCORING_TABLE.find((t) => rawRatio <= t.maxRatio) ||
    WHTR_SCORING_TABLE[WHTR_SCORING_TABLE.length - 1];

  const whtrMaxPts = whtrScoredInComposite && !inputs.whtrExempt ? frameworkSpec.weights.whtr : 0;
  const whtrEarnedPts = whtrScoredInComposite && !inputs.whtrExempt ? matchedTier.points20Scale : 0;
  const whtrPassedMin = inputs.whtrExempt ? true : matchedTier.passesMinimum;

  let whtrNextThreshold: NextThresholdInfo;
  if (inputs.whtrExempt) {
    whtrNextThreshold = {
      isMaxed: true,
      isBelowMinimum: false,
      targetPerformanceLabel: 'Exempt',
      improvementNeededLabel: 'No action required',
      resultingPoints: 0,
      pointsGain: 0,
    };
  } else if (rawRatio <= 0.49) {
    whtrNextThreshold = {
      isMaxed: true,
      isBelowMinimum: false,
      targetPerformanceLabel: '≤ 0.49 WHtR',
      improvementNeededLabel: 'Optimal low-risk threshold achieved',
      resultingPoints: 20,
      pointsGain: 0,
    };
  } else {
    const nextRatioTarget = Math.max(0.49, Math.round((rawRatio - 0.01) * 100) / 100);
    const targetWaistInches = Math.floor(nextRatioTarget * safeHeight * 10) / 10;
    const waistReduction = Math.max(0.5, Math.round((safeWaist - targetWaistInches) * 10) / 10);
    const nextTier =
      WHTR_SCORING_TABLE.find((t) => nextRatioTarget <= t.maxRatio) || WHTR_SCORING_TABLE[0];
    whtrNextThreshold = {
      isMaxed: false,
      isBelowMinimum: !matchedTier.passesMinimum,
      targetPerformanceLabel: `${nextRatioTarget.toFixed(2)} WHtR (≤ ${targetWaistInches.toFixed(1)}" waist)`,
      improvementNeededLabel: whtrScoredInComposite
        ? `-${waistReduction.toFixed(1)}" waist for +${(
            nextTier.points20Scale - matchedTier.points20Scale
          ).toFixed(1)} pts`
        : `-${waistReduction.toFixed(1)}" waist to reach ${nextRatioTarget.toFixed(2)} WHtR`,
      resultingPoints: whtrScoredInComposite ? nextTier.points20Scale : 0,
      pointsGain: whtrScoredInComposite
        ? roundToTenth(nextTier.points20Scale - matchedTier.points20Scale)
        : 0,
    };
  }

  const whtrResult = {
    componentKey: 'whtr' as const,
    componentTitle: 'Body Composition (WHtR)',
    eventLabel: whtrScoredInComposite
      ? 'Waist-to-Height Ratio (20-Pt Pillar)'
      : 'Waist-to-Height Ratio (Semiannual Health Metric)',
    exempt: inputs.whtrExempt,
    earnedPoints: whtrEarnedPts,
    maxPoints: whtrMaxPts,
    minRequiredPoints: whtrScoredInComposite && !inputs.whtrExempt ? 2.5 : 0,
    percentageOfMax:
      whtrMaxPts > 0
        ? roundToTenth((whtrEarnedPts / whtrMaxPts) * 100)
        : rawRatio <= 0.49
        ? 100
        : rawRatio <= 0.54
        ? 75
        : 40,
    passedMinimum: whtrPassedMin,
    rawPerformanceLabel: `${rawRatio.toFixed(2)} (${safeWaist}" / ${safeHeight}")`,
    adjustedPerformanceLabel: `${rawRatio.toFixed(2)} WHtR`,
    altitudeApplied: false,
    altitudeAdjustmentNote: 'Anthropometric ratio; unaffected by installation altitude.',
    minimumRequirementLabel: '≤ 0.59 WHtR (≤ 0.49 Optimal)',
    maximumRequirementLabel: '≤ 0.49 WHtR',
    nextThreshold: whtrNextThreshold,
    ratio: rawRatio,
    riskCategory: matchedTier.riskCategory,
    scoredInComposite: whtrScoredInComposite,
  };

  // 5. COMPOSITE SCORE & OVERALL STATUS
  const totalEarnedPoints = roundToTenth(
    cardioResult.earnedPoints +
      strengthResult.earnedPoints +
      coreResult.earnedPoints +
      whtrResult.earnedPoints
  );
  const totalPossiblePoints =
    cardioResult.maxPoints +
    strengthResult.maxPoints +
    coreResult.maxPoints +
    whtrResult.maxPoints;

  const compositeScore =
    totalPossiblePoints > 0
      ? roundToTenth((totalEarnedPoints / totalPossiblePoints) * 100)
      : 100.0;

  const failureReasons: string[] = [];
  if (!cardioResult.passedMinimum) {
    failureReasons.push(
      `Cardiorespiratory (${cardioResult.eventLabel}) is below the minimum requirement (${cardioResult.minimumRequirementLabel}).`
    );
  }
  if (!strengthResult.passedMinimum) {
    failureReasons.push(
      `Muscular Strength (${strengthResult.eventLabel}) is below the minimum requirement (${strengthResult.minimumRequirementLabel}).`
    );
  }
  if (!coreResult.passedMinimum) {
    failureReasons.push(
      `Core Endurance (${coreResult.eventLabel}) is below the minimum requirement (${coreResult.minimumRequirementLabel}).`
    );
  }
  if (whtrScoredInComposite && !whtrResult.passedMinimum) {
    failureReasons.push(
      `Body Composition WHtR (${rawRatio.toFixed(2)}) exceeds the maximum passing threshold (0.59).`
    );
  }

  const allComponentMinimumsMet = failureReasons.length === 0;
  const minCompositeRequired = frameworkSpec.passingThresholds.satisfactory; // 75.0

  if (totalPossiblePoints > 0 && compositeScore < minCompositeRequired) {
    failureReasons.push(
      `Composite score (${compositeScore.toFixed(1)}) is below the required ${minCompositeRequired.toFixed(
        1
      )}-point passing threshold.`
    );
  }

  const passedDafStandard75 =
    allComponentMinimumsMet && (totalPossiblePoints === 0 || compositeScore >= 75.0);
  const passedUssfHpa60 = passedDafStandard75;
  const passedOverall = passedDafStandard75;

  const isPartialHpa =
    inputs.cardioExempt ||
    inputs.strengthExempt ||
    inputs.coreExempt ||
    inputs.cardioEvent === 'walk_2km';

  let readinessTier: ReadinessTier;
  let readinessLabel: string;
  let testingFrequencyLabel: string;

  if (totalPossiblePoints === 0 && allComponentMinimumsMet) {
    readinessTier = 'EXEMPT_ALL';
    readinessLabel = 'Passing (Walk / Composite Exempt)';
    testingFrequencyLabel = '3-Month Medical Re-evaluation / Exemption Window';
  } else if (!allComponentMinimumsMet || !passedOverall) {
    readinessTier = 'UNSATISFACTORY';
    readinessLabel = 'Health Concern (< 75.0 or Min)';
    testingFrequencyLabel = '3-Month Retest / Reconditioning Window';
  } else if (isPartialHpa) {
    readinessTier = 'SATISFACTORY';
    readinessLabel = 'Passing (Partial HPA · 75.0+)';
    testingFrequencyLabel = '3 Months or Post-Exemption Expiration';
  } else if (compositeScore >= 90.0) {
    readinessTier = 'EXCELLENT';
    readinessLabel = 'Fit to Fight (90.0+ Pass)';
    testingFrequencyLabel = 'Next HPA Generally Due in 6 Months';
  } else {
    readinessTier = 'SATISFACTORY';
    readinessLabel = 'Health Maintenance (75.0–89.9 Pass)';
    testingFrequencyLabel = 'Next HPA Generally Due in 6 Months';
  }

  return {
    compositeScore,
    totalEarnedPoints,
    totalPossiblePoints,
    passedOverall,
    passedDafStandard75,
    passedUssfHpa60,
    allComponentMinimumsMet,
    readinessTier,
    readinessLabel,
    testingFrequencyLabel,
    failureReasons,
    cardio: cardioResult,
    strength: strengthResult,
    core: coreResult,
    whtr: whtrResult,
  };
}

/**
 * Target Score Goal Calculator using exact USSF HPA discrete scoring rows.
 */
export function calculateTargetGoalPlan(
  inputs: AssessmentInputs,
  targetCompositeScore: number
): TargetGoalPlan {
  const clampedTarget = Math.min(100, Math.max(75, roundToTenth(targetCompositeScore)));
  const currentResult = calculateAssessment(inputs);
  const totalPossible = currentResult.totalPossiblePoints;

  if (totalPossible === 0) {
    return {
      targetCompositeScore: clampedTarget,
      currentCompositeScore: currentResult.compositeScore,
      pointsGap: 0,
      alreadyAchieved: false,
      achievable: false,
      recommendations: [],
    };
  }

  const targetRawPointsNeeded = roundToTenth((clampedTarget / 100) * totalPossible);
  const rawPointsGap = Math.max(
    0,
    roundToTenth(targetRawPointsNeeded - currentResult.totalEarnedPoints)
  );
  const alreadyAchieved =
    currentResult.allComponentMinimumsMet && currentResult.compositeScore >= clampedTarget;

  const cohortTables = USSF_HPA_DISCRETE_TABLES[inputs.sex][inputs.ageBracket];
  const targetRatio = clampedTarget / 100;

  const recommendations: GoalComponentRecommendation[] = [];

  // A single-event path must satisfy the whole assessment, not just its point gap.
  const singlePathMeetsTarget = (component: 'cardio' | 'strength' | 'core', value: number) => {
    const candidate = { ...inputs };
    if (component === 'cardio') {
      if (inputs.cardioEvent === 'hamr') candidate.hamrShuttles = value;
      else {
        candidate.runMinutes = Math.floor(value / 60);
        candidate.runSeconds = value % 60;
      }
    } else if (component === 'strength') candidate.strengthReps = value;
    else if (inputs.coreEvent === 'plank') {
      candidate.plankMinutes = Math.floor(value / 60);
      candidate.plankSeconds = value % 60;
    } else candidate.coreReps = value;
    const result = calculateAssessment(candidate);
    return result.allComponentMinimumsMet && result.compositeScore >= clampedTarget;
  };
  const otherMinimumFailed = (component: 'cardio' | 'strength' | 'core') =>
    (['cardio', 'strength', 'core', 'whtr'] as const).some((key) =>
      key !== component && (key !== 'whtr' || currentResult.whtr.scoredInComposite) && !currentResult[key].passedMinimum);

  // 1. Cardio recommendation
  if (!inputs.cardioExempt && inputs.cardioEvent !== 'walk_2km') {
    const cMax = currentResult.cardio.maxPoints;
    const cMin = currentResult.cardio.minRequiredPoints;
    const balancedPts = Math.min(
      cMax,
      Math.max(cMin, currentResult.cardio.earnedPoints, roundToTenth(cMax * targetRatio))
    );
    const singleNeededPts = Math.max(cMin, roundToTenth(currentResult.cardio.earnedPoints + rawPointsGap));
    const singleAchievable = singleNeededPts <= cMax && singleNeededPts >= cMin;
    const clampedSinglePts = Math.min(cMax, Math.max(cMin, singleNeededPts));

    if (inputs.cardioEvent === 'hamr') {
      const rows = cohortTables.hamr;
      const bonus = getHamrAltitudeBonusShuttles(
        Math.max(1, inputs.hamrShuttles),
        inputs.altitudeGroup
      );
      const balMatch = findRowForPointsFromBottom(rows, balancedPts, cMax, 60);
      const balRawShuttles = Math.max(1, balMatch.value - bonus);
      const balDelta = Math.max(0, balRawShuttles - inputs.hamrShuttles);

      const sinMatch = findRowForPointsFromBottom(rows, clampedSinglePts, cMax, 60);
      const sinRawShuttles = Math.max(1, sinMatch.value - bonus);
      const sinDelta = Math.max(0, sinRawShuttles - inputs.hamrShuttles);
      const verifiedSingle = singleAchievable && singlePathMeetsTarget('cardio', sinRawShuttles);

      recommendations.push({
        componentKey: 'cardio',
        componentTitle: 'Cardiorespiratory',
        eventLabel: currentResult.cardio.eventLabel,
        currentPerformanceLabel: `${inputs.hamrShuttles} shuttles`,
        currentPoints: currentResult.cardio.earnedPoints,
        maxPoints: cMax,
        balancedTargetPoints: balMatch.points,
        balancedTargetPerformanceLabel: `${balRawShuttles} shuttles`,
        balancedDeltaLabel: balDelta > 0 ? `+${balDelta} shuttles` : 'On target',
        singlePathAchievable: verifiedSingle,
        singlePathTargetPoints: sinMatch.points,
        singlePathPerformanceLabel: `${sinRawShuttles} shuttles`,
        singlePathDeltaLabel: verifiedSingle
          ? sinDelta > 0
            ? `+${sinDelta} shuttles alone`
            : 'Already met'
          : otherMinimumFailed('cardio') ? 'Other event minimum not met' : `Max ${cMax} pts (${sinRawShuttles} shuttles)`,
      });
    } else {
      const rows = cohortTables.run20;
      const currentRawSec = parseMmSsToSeconds(inputs.runMinutes, inputs.runSeconds);
      const deduction = getRunAltitudeDeductionSeconds(currentRawSec, inputs.altitudeGroup);

      const balMatch = findRowForPointsFromBottom(rows, balancedPts, cMax, 60);
      const balRawSec = balMatch.value + deduction;
      const balDeltaSec = Math.max(0, currentRawSec - balRawSec);

      const sinMatch = findRowForPointsFromBottom(rows, clampedSinglePts, cMax, 60);
      const sinRawSec = sinMatch.value + deduction;
      const sinDeltaSec = Math.max(0, currentRawSec - sinRawSec);
      const verifiedSingle = singleAchievable && singlePathMeetsTarget('cardio', sinRawSec);

      recommendations.push({
        componentKey: 'cardio',
        componentTitle: 'Cardiorespiratory',
        eventLabel: currentResult.cardio.eventLabel,
        currentPerformanceLabel: formatSecondsToMmSs(currentRawSec),
        currentPoints: currentResult.cardio.earnedPoints,
        maxPoints: cMax,
        balancedTargetPoints: balMatch.points,
        balancedTargetPerformanceLabel: formatSecondsToMmSs(balRawSec),
        balancedDeltaLabel: balDeltaSec > 0 ? `-${balDeltaSec}s faster` : 'On target',
        singlePathAchievable: verifiedSingle,
        singlePathTargetPoints: sinMatch.points,
        singlePathPerformanceLabel: formatSecondsToMmSs(sinRawSec),
        singlePathDeltaLabel: verifiedSingle
          ? sinDeltaSec > 0
            ? `-${sinDeltaSec}s faster alone`
            : 'Already met'
          : otherMinimumFailed('cardio') ? 'Other event minimum not met' : `Max ${cMax} pts (${formatSecondsToMmSs(sinRawSec)})`,
      });
    }
  }

  // 2. Strength recommendation
  if (!inputs.strengthExempt) {
    const isHrp = inputs.strengthEvent === 'hr_pushups';
    const rows = isHrp ? cohortTables.hrPushups : cohortTables.pushups;
    const sMax = currentResult.strength.maxPoints;
    const sMin = currentResult.strength.minRequiredPoints;
    const balancedPts = Math.min(
      sMax,
      Math.max(sMin, currentResult.strength.earnedPoints, roundToTenth(sMax * targetRatio))
    );
    const singleNeededPts = Math.max(sMin, roundToTenth(currentResult.strength.earnedPoints + rawPointsGap));
    const singleAchievable = singleNeededPts <= sMax && singleNeededPts >= sMin;
    const clampedSinglePts = Math.min(sMax, Math.max(sMin, singleNeededPts));

    const balMatch = findRowForPointsFromBottom(rows, balancedPts, sMax, 20);
    const balDelta = Math.max(0, balMatch.value - inputs.strengthReps);

    const sinMatch = findRowForPointsFromBottom(rows, clampedSinglePts, sMax, 20);
    const sinDelta = Math.max(0, sinMatch.value - inputs.strengthReps);
    const verifiedSingle = singleAchievable && singlePathMeetsTarget('strength', sinMatch.value);

    recommendations.push({
      componentKey: 'strength',
      componentTitle: 'Muscular Strength',
      eventLabel: currentResult.strength.eventLabel,
      currentPerformanceLabel: `${inputs.strengthReps} reps`,
      currentPoints: currentResult.strength.earnedPoints,
      maxPoints: sMax,
      balancedTargetPoints: balMatch.points,
      balancedTargetPerformanceLabel: `${balMatch.value} reps`,
      balancedDeltaLabel: balDelta > 0 ? `+${balDelta} reps` : 'On target',
      singlePathAchievable: verifiedSingle,
      singlePathTargetPoints: sinMatch.points,
      singlePathPerformanceLabel: `${sinMatch.value} reps`,
      singlePathDeltaLabel: verifiedSingle
        ? sinDelta > 0
          ? `+${sinDelta} ${sinDelta === 1 ? 'rep' : 'reps'} alone`
          : 'Already met'
        : otherMinimumFailed('strength') ? 'Other event minimum not met' : `Max ${sMax} pts (${rows[0][0]} reps)`,
    });
  }

  // 3. Core recommendation
  if (!inputs.coreExempt) {
    const kMax = currentResult.core.maxPoints;
    const kMin = currentResult.core.minRequiredPoints;
    const balancedPts = Math.min(
      kMax,
      Math.max(kMin, currentResult.core.earnedPoints, roundToTenth(kMax * targetRatio))
    );
    const singleNeededPts = Math.max(kMin, roundToTenth(currentResult.core.earnedPoints + rawPointsGap));
    const singleAchievable = singleNeededPts <= kMax && singleNeededPts >= kMin;
    const clampedSinglePts = Math.min(kMax, Math.max(kMin, singleNeededPts));

    if (inputs.coreEvent === 'plank') {
      const rows = cohortTables.plank;
      const currentSec = parseMmSsToSeconds(inputs.plankMinutes, inputs.plankSeconds);
      const balMatch = findRowForPointsFromBottom(rows, balancedPts, kMax, 20);
      const balDelta = Math.max(0, balMatch.value - currentSec);

      const sinMatch = findRowForPointsFromBottom(rows, clampedSinglePts, kMax, 20);
      const sinDelta = Math.max(0, sinMatch.value - currentSec);
      const verifiedSingle = singleAchievable && singlePathMeetsTarget('core', sinMatch.value);

      recommendations.push({
        componentKey: 'core',
        componentTitle: 'Core Endurance',
        eventLabel: currentResult.core.eventLabel,
        currentPerformanceLabel: formatSecondsToMmSs(currentSec),
        currentPoints: currentResult.core.earnedPoints,
        maxPoints: kMax,
        balancedTargetPoints: balMatch.points,
        balancedTargetPerformanceLabel: formatSecondsToMmSs(balMatch.value),
        balancedDeltaLabel: balDelta > 0 ? `+${balDelta}s hold` : 'On target',
        singlePathAchievable: verifiedSingle,
        singlePathTargetPoints: sinMatch.points,
        singlePathPerformanceLabel: formatSecondsToMmSs(sinMatch.value),
        singlePathDeltaLabel: verifiedSingle
          ? sinDelta > 0
            ? `+${sinDelta}s hold alone`
            : 'Already met'
          : otherMinimumFailed('core') ? 'Other event minimum not met' : `Max ${kMax} pts (${formatSecondsToMmSs(rows[0][0])})`,
      });
    } else {
      const isCrunch = inputs.coreEvent === 'crunches';
      const rows = isCrunch ? cohortTables.crunches : cohortTables.situps;

      const balMatch = findRowForPointsFromBottom(rows, balancedPts, kMax, 20);
      const balDelta = Math.max(0, balMatch.value - inputs.coreReps);

      const sinMatch = findRowForPointsFromBottom(rows, clampedSinglePts, kMax, 20);
      const sinDelta = Math.max(0, sinMatch.value - inputs.coreReps);
      const verifiedSingle = singleAchievable && singlePathMeetsTarget('core', sinMatch.value);

      recommendations.push({
        componentKey: 'core',
        componentTitle: 'Core Endurance',
        eventLabel: currentResult.core.eventLabel,
        currentPerformanceLabel: `${inputs.coreReps} reps`,
        currentPoints: currentResult.core.earnedPoints,
        maxPoints: kMax,
        balancedTargetPoints: balMatch.points,
        balancedTargetPerformanceLabel: `${balMatch.value} reps`,
        balancedDeltaLabel: balDelta > 0 ? `+${balDelta} reps` : 'On target',
        singlePathAchievable: verifiedSingle,
        singlePathTargetPoints: sinMatch.points,
        singlePathPerformanceLabel: `${sinMatch.value} reps`,
        singlePathDeltaLabel: verifiedSingle
          ? sinDelta > 0
            ? `+${sinDelta} ${sinDelta === 1 ? 'rep' : 'reps'} alone`
            : 'Already met'
          : otherMinimumFailed('core') ? 'Other event minimum not met' : `Max ${kMax} pts (${rows[0][0]} reps)`,
      });
    }
  }

  return {
    targetCompositeScore: clampedTarget,
    currentCompositeScore: currentResult.compositeScore,
    pointsGap: roundToTenth(Math.max(0, clampedTarget - currentResult.compositeScore)),
    alreadyAchieved,
    achievable: clampedTarget <= 100,
    recommendations,
  };
}

export interface ScoringTableSummaryRow {
  ageBracketId: AgeBracketId;
  ageLabel: string;
  run20MinMax: string;
  hamrMinMax: string;
  pushupsMinMax: string;
  hrPushupsMinMax: string;
  situpsMinMax: string;
  crunchesMinMax: string;
  plankMinMax: string;
}

export function getFullScoringTableRows(sex: SexCategory): ScoringTableSummaryRow[] {
  return AGE_BRACKETS.map((bracket) => {
    const t = DEMOGRAPHIC_SCORING_THRESHOLDS[sex][bracket.id];
    return {
      ageBracketId: bracket.id,
      ageLabel: bracket.label,
      run20MinMax: `${formatSecondsToMmSs(t.run20MinPassSec)} / ${formatSecondsToMmSs(t.run20MaxPtsSec)}`,
      hamrMinMax: `${t.hamrMinPassShuttles} / ${t.hamrMaxPtsShuttles} shuttles`,
      pushupsMinMax: `${t.pushupsMinReps} / ${t.pushupsMaxReps} reps`,
      hrPushupsMinMax: `${t.hrPushupsMinReps} / ${t.hrPushupsMaxReps} reps`,
      situpsMinMax: `${t.situpsMinReps} / ${t.situpsMaxReps} reps`,
      crunchesMinMax: `${t.crunchesMinReps} / ${t.crunchesMaxReps} reps`,
      plankMinMax: `${formatSecondsToMmSs(t.plankMinSec)} / ${formatSecondsToMmSs(t.plankMaxSec)}`,
    };
  });
}
