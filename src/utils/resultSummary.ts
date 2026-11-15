import { AGE_BRACKETS } from '../data/scoringStandards';
import { ALTITUDE_GROUPS } from '../data/installations';
import type { AssessmentInputs, AssessmentResult } from './calculator';

export function formatResultSummary(inputs: AssessmentInputs, result: AssessmentResult): string {
  const age = AGE_BRACKETS.find(item => item.id === inputs.ageBracket)?.label.replace(' Years', '') ?? inputs.ageBracket;
  const points = (component: AssessmentResult['cardio']) => component.exempt ? 'Exempt' : component.isPassFailOnly ? (component.passedMinimum ? 'PASS' : 'FAIL') : `${component.earnedPoints.toFixed(1)} / ${component.maxPoints} pts`;
  return [
    `${inputs.sex === 'male' ? 'Male' : 'Female'} · Age ${age}`,
    `Altitude: ${ALTITUDE_GROUPS[inputs.altitudeGroup].shortLabel.split(' (')[0]}`,
    `Cardio: ${points(result.cardio)}`,
    `Strength: ${points(result.strength)}`,
    `Core: ${points(result.core)}`,
    `Total: ${result.compositeScore.toFixed(1)} / 100 pts`,
  ].join('\n');
}
