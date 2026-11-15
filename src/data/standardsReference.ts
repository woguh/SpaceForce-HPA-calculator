import { HPA_SCORING_RELEASE, SCORING_EVENTS, WAIST_RATIO_FAIL_THRESHOLD } from './scoringRelease';
import { AGE_BRACKETS, ASSESSMENT_FRAMEWORKS, OFFICIAL_REGULATORY_SOURCES, RUN_ALTITUDE_CORRECTION_TABLE, WALK_ALTITUDE_CORRECTION_TABLE } from './scoringStandards';
import { ALTITUDE_GROUPS, SPACE_FORCE_INSTALLATIONS } from './installations';

export const STANDARDS_REFERENCE = {
  release: { id: HPA_SCORING_RELEASE.id, label: HPA_SCORING_RELEASE.label, date: HPA_SCORING_RELEASE.effectiveDate },
  framework: ASSESSMENT_FRAMEWORKS.ussf_hpa_60_20_20,
  rules: {
    eventMinimums: 'Every non-exempt event must meet its minimum, even when the composite exceeds 75.',
    composite: 'Round earned points / available point-scored points × 100 to one decimal. Exempt events are removed from available points.',
    run: 'Subtract the applicable altitude correction, then use the first ascending time row at or above the adjusted time.',
    hamr: 'For a positive raw shuttle count, add the selected altitude group’s shuttle bonus before looking up points. A zero count gets no bonus.',
    otherScoredEvents: 'Use the highest descending threshold met by repetitions, shuttles, or plank duration.',
    walk: 'Medical alternative, pass/fail only. Must meet the age/sex/altitude time limit; composite comes from remaining point-scored events.',
    goalPlanner: 'Uses these same discrete event rows for target recommendations.',
    incomplete: 'Initial 100 is a starting display. During entry only completed events contribute to the displayed tally; final pass/fail requires a complete assessment.',
  },
  ages: AGE_BRACKETS,
  events: SCORING_EVENTS,
  scoresheets: HPA_SCORING_RELEASE.tables,
  altitudeGroups: ALTITUDE_GROUPS,
  runAltitudeCorrections: RUN_ALTITUDE_CORRECTION_TABLE,
  walkTimeLimits: WALK_ALTITUDE_CORRECTION_TABLE,
  installations: SPACE_FORCE_INSTALLATIONS,
  waistRatio: { formula: 'waist inches / height inches', roundingDecimals: 2, failAtOrAbove: WAIST_RATIO_FAIL_THRESHOLD, contributesHpaPoints: false },
  sourceVersions: OFFICIAL_REGULATORY_SOURCES.filter((source) => source.id !== 'afpc-fitness-charts').map(({ url, ...source }) => source),
};
