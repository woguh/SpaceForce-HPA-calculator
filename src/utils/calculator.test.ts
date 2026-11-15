import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AssessmentInputs,
  calculateAssessment,
  calculateTargetGoalPlan,
  formatHamrLevelShuttle,
  formatSecondsToMmSs,
  getHamrAltitudeBonusShuttles,
  getRunAltitudeDeductionSeconds,
  getWalkMaxPassSeconds,
} from './calculator';

const BASE_INPUTS: AssessmentInputs = {
  sex: 'male',
  ageBracket: '25-29',
  framework: 'ussf_hpa_60_20_20',
  installationId: 'vandenberg-sfb',
  altitudeGroup: 'normal',
  isManualAltitude: false,
  cardioEvent: 'run_2_0',
  strengthEvent: 'pushups',
  coreEvent: 'situps',
  cardioExempt: false,
  strengthExempt: false,
  coreExempt: false,
  whtrExempt: false,
  runMinutes: 13,
  runSeconds: 35,
  hamrShuttles: 85,
  walkMinutes: 14,
  walkSeconds: 30,
  strengthReps: 62,
  coreReps: 56,
  plankMinutes: 3,
  plankSeconds: 30,
  waistInches: 31,
  heightInches: 70,
};

test('calculates perfect 100.0 Fit to Fight score when max official PDF thresholds are met', () => {
  const result = calculateAssessment(BASE_INPUTS);
  assert.equal(result.cardio.earnedPoints, 60);
  assert.equal(result.strength.earnedPoints, 20);
  assert.equal(result.core.earnedPoints, 20);
  assert.equal(result.compositeScore, 100);
  assert.equal(result.passedOverall, true);
  assert.equal(result.readinessTier, 'EXCELLENT');
  assert.equal(result.failureReasons.length, 0);
});

test('verifies exact discrete PDF scoring rows for Male Under 25 across all events', () => {
  // Push-ups non-linear drop: 33 -> 10.0, 32 -> 7.0, 31 -> 4.0, 30 -> 1.0, 29 -> 0 (FAIL)
  assert.equal(
    calculateAssessment({ ...BASE_INPUTS, ageBracket: 'under25', strengthReps: 33 }).strength.earnedPoints,
    10.0
  );
  assert.equal(
    calculateAssessment({ ...BASE_INPUTS, ageBracket: 'under25', strengthReps: 32 }).strength.earnedPoints,
    7.0
  );
  assert.equal(
    calculateAssessment({ ...BASE_INPUTS, ageBracket: 'under25', strengthReps: 30 }).strength.earnedPoints,
    1.0
  );
  const puFail = calculateAssessment({ ...BASE_INPUTS, ageBracket: 'under25', strengthReps: 29 });
  assert.equal(puFail.strength.earnedPoints, 0);
  assert.equal(puFail.strength.passedMinimum, false);
  assert.equal(puFail.passedOverall, false);

  // Hand Release Push-ups Male <25: 40 -> 20.0, 15 -> 10.0, 14 -> 0 (FAIL)
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      strengthEvent: 'hr_pushups',
      strengthReps: 40,
    }).strength.earnedPoints,
    20.0
  );
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      strengthEvent: 'hr_pushups',
      strengthReps: 15,
    }).strength.earnedPoints,
    10.0
  );
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      strengthEvent: 'hr_pushups',
      strengthReps: 14,
    }).strength.passedMinimum,
    false
  );

  // Sit-ups Male <25: 42 -> 12.0, 41 -> 9.0, 40 -> 6.0, 39 -> 3.0, 38 -> 0 (FAIL)
  assert.equal(
    calculateAssessment({ ...BASE_INPUTS, ageBracket: 'under25', coreReps: 41 }).core.earnedPoints,
    9.0
  );
  assert.equal(
    calculateAssessment({ ...BASE_INPUTS, ageBracket: 'under25', coreReps: 39 }).core.earnedPoints,
    3.0
  );
  assert.equal(
    calculateAssessment({ ...BASE_INPUTS, ageBracket: 'under25', coreReps: 38 }).core.passedMinimum,
    false
  );

  // Cross Leg Reverse Crunch Male <25: 49 -> 20.0, 21 -> 10.0, 20 -> FAIL
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      coreEvent: 'crunches',
      coreReps: 49,
    }).core.earnedPoints,
    20.0
  );
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      coreEvent: 'crunches',
      coreReps: 21,
    }).core.earnedPoints,
    10.0
  );

  // Forearm Plank Male <25: 3:35 -> 20.0, 1:05 -> 10.0, 1:04 -> FAIL
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      coreEvent: 'plank',
      plankMinutes: 3,
      plankSeconds: 35,
    }).core.earnedPoints,
    20.0
  );
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      coreEvent: 'plank',
      plankMinutes: 1,
      plankSeconds: 5,
    }).core.earnedPoints,
    10.0
  );
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      coreEvent: 'plank',
      plankMinutes: 1,
      plankSeconds: 4,
    }).core.passedMinimum,
    false
  );

  // 20m HAMR Male <25: >= 87 -> 60.0, 84 -> 59.0, 42 -> 35.0, 41 -> FAIL
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      cardioEvent: 'hamr',
      hamrShuttles: 87,
    }).cardio.earnedPoints,
    60.0
  );
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      cardioEvent: 'hamr',
      hamrShuttles: 84,
    }).cardio.earnedPoints,
    59.0
  );
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      cardioEvent: 'hamr',
      hamrShuttles: 42,
    }).cardio.earnedPoints,
    35.0
  );
  assert.equal(
    calculateAssessment({
      ...BASE_INPUTS,
      ageBracket: 'under25',
      cardioEvent: 'hamr',
      hamrShuttles: 41,
    }).cardio.passedMinimum,
    false
  );
});

test('verifies Female Under 25 and Female 35-39 exact PDF thresholds', () => {
  const fU25 = calculateAssessment({
    ...BASE_INPUTS,
    sex: 'female',
    ageBracket: 'under25',
    runMinutes: 15,
    runSeconds: 30,
    strengthReps: 47,
    coreReps: 54,
  });
  assert.equal(fU25.compositeScore, 100.0);
  assert.equal(fU25.cardio.minimumRequirementLabel, '25:23');

  // Female 35-39 Plank min is 0:45 (10.3 pts) per official Feb 2026 PDF
  const f35PlankMin = calculateAssessment({
    ...BASE_INPUTS,
    sex: 'female',
    ageBracket: '35-39',
    coreEvent: 'plank',
    plankMinutes: 0,
    plankSeconds: 45,
  });
  assert.equal(f35PlankMin.core.passedMinimum, true);
  assert.equal(f35PlankMin.core.earnedPoints, 10.3);
});

test('applies exact DAFMAN 36-2905 Attachment 3 Table A3.1-A3.4 altitude corrections', () => {
  assert.equal(getRunAltitudeDeductionSeconds(13 * 60 + 25, 'group1'), 2);
  assert.equal(getRunAltitudeDeductionSeconds(13 * 60 + 25, 'group2'), 6);
  assert.equal(getRunAltitudeDeductionSeconds(13 * 60 + 25, 'group3'), 11);
  assert.equal(getRunAltitudeDeductionSeconds(13 * 60 + 25, 'group4'), 18);

  assert.equal(getRunAltitudeDeductionSeconds(15 * 60 + 10, 'group3'), 12);
  assert.equal(getRunAltitudeDeductionSeconds(19 * 60 + 45, 'group4'), 31);
  assert.equal(getRunAltitudeDeductionSeconds(25 * 60, 'group4'), 62);

  assert.equal(getHamrAltitudeBonusShuttles(45, 'group1'), 1);
  assert.equal(getHamrAltitudeBonusShuttles(45, 'group2'), 2);
  assert.equal(getHamrAltitudeBonusShuttles(45, 'group3'), 3);
  assert.equal(getHamrAltitudeBonusShuttles(45, 'group4'), 4);

  // Male 25-29 HAMR min is 42; raw 39 + 3 (Group 3) = 42 -> PASS (35.0 pts)
  const hamrAlt = calculateAssessment({
    ...BASE_INPUTS,
    cardioEvent: 'hamr',
    hamrShuttles: 39,
    altitudeGroup: 'group3',
  });
  assert.equal(hamrAlt.cardio.passedMinimum, true);
  assert.equal(hamrAlt.cardio.earnedPoints, 35.0);

  // Walk max times: baseline vs Groups 1-4
  assert.equal(getWalkMaxPassSeconds('male', 'under25', 'normal'), 16 * 60 + 16);
  assert.equal(getWalkMaxPassSeconds('male', 'under25', 'group1'), 16 * 60 + 18);
  assert.equal(getWalkMaxPassSeconds('male', 'under25', 'group2'), 16 * 60 + 22);
  assert.equal(getWalkMaxPassSeconds('male', 'under25', 'group3'), 16 * 60 + 25);
  assert.equal(getWalkMaxPassSeconds('male', 'under25', 'group4'), 16 * 60 + 31);
});

test('verifies <25 Male 2.0-mile run 75.0 composite pass and Group 3 altitude threshold', () => {
  const passAtMinRun = calculateAssessment({
    ...BASE_INPUTS,
    ageBracket: 'under25',
    cardioEvent: 'run_2_0',
    runMinutes: 19,
    runSeconds: 45, // 35.0 pts
    strengthReps: 67, // 20.0 pts
    coreReps: 58, // 20.0 pts -> 75.0 total
  });
  assert.equal(passAtMinRun.cardio.passedMinimum, true);
  assert.equal(passAtMinRun.compositeScore, 75.0);
  assert.equal(passAtMinRun.passedOverall, true);

  const failSlightlyOverMinRun = calculateAssessment({
    ...BASE_INPUTS,
    ageBracket: 'under25',
    cardioEvent: 'run_2_0',
    runMinutes: 19,
    runSeconds: 46,
  });
  assert.equal(failSlightlyOverMinRun.cardio.passedMinimum, false);
  assert.equal(failSlightlyOverMinRun.passedOverall, false);

  // Group 3: 19:55 raw gets -19s (20:06 bracket) -> 19:36 adjusted (PASS for <25)
  const passWithGroup3Altitude = calculateAssessment({
    ...BASE_INPUTS,
    ageBracket: 'under25',
    altitudeGroup: 'group3',
    cardioEvent: 'run_2_0',
    runMinutes: 19,
    runSeconds: 55,
    strengthReps: 67,
    coreReps: 58,
  });
  assert.equal(passWithGroup3Altitude.cardio.passedMinimum, true);
  assert.equal(passWithGroup3Altitude.cardio.earnedPoints, 38.0);
  assert.equal(passWithGroup3Altitude.passedOverall, true);
});

test('supports 4-pillar WHtR mode and component exemptions', () => {
  const pfraResult = calculateAssessment({
    ...BASE_INPUTS,
    framework: 'daf_pfra_50_15_15_20',
    waistInches: 37, // 37/70 = 0.53 WHtR -> 16.0 pts
    heightInches: 70,
  });
  assert.equal(pfraResult.cardio.maxPoints, 50);
  assert.equal(pfraResult.strength.maxPoints, 15);
  assert.equal(pfraResult.core.maxPoints, 15);
  assert.equal(pfraResult.whtr.maxPoints, 20);
  assert.equal(pfraResult.whtr.earnedPoints, 16.0);
  assert.equal(pfraResult.compositeScore, 96.0);

  const exemptCardio = calculateAssessment({
    ...BASE_INPUTS,
    cardioExempt: true,
    strengthReps: 45, // Male 25-29: 16.2 pts
    coreReps: 56, // 20.0 pts -> 36.2 / 40 = 90.5%
  });
  assert.equal(exemptCardio.totalPossiblePoints, 40);
  assert.equal(exemptCardio.compositeScore, 90.5);
});

test('calculates discrete target goal plan and formats HAMR levels up to 20', () => {
  const moderateInputs: AssessmentInputs = {
    ...BASE_INPUTS,
    runMinutes: 17,
    runSeconds: 10,
    strengthReps: 38,
    coreReps: 44,
  };
  const plan = calculateTargetGoalPlan(moderateInputs, 90.0);
  assert.equal(plan.alreadyAchieved, false);
  assert.ok(plan.pointsGap > 0);
  assert.equal(plan.recommendations.length, 3);
  for (const rec of plan.recommendations) {
    assert.ok(rec.balancedTargetPoints >= rec.currentPoints);
  }

  assert.equal(formatSecondsToMmSs(574), '09:34');
  assert.equal(formatHamrLevelShuttle(8), 'Lvl 2-1 (8 shuttles)');
});

test('an above-target total with a failed minimum only permits a path that repairs that event', () => {
  const inputs: AssessmentInputs = { ...BASE_INPUTS, ageBracket: 'under25', runMinutes: 13, runSeconds: 25, strengthReps: 29, coreReps: 58 };
  const plan = calculateTargetGoalPlan(inputs, 75);
  assert.equal(plan.currentCompositeScore, 80);
  assert.equal(plan.pointsGap, 0);
  assert.equal(plan.alreadyAchieved, false);
  const strength = plan.recommendations.find((rec) => rec.componentKey === 'strength')!;
  assert.equal(strength.singlePathAchievable, true);
  assert.equal(strength.singlePathPerformanceLabel, '30 reps');
  assert.equal(strength.singlePathDeltaLabel, '+1 rep alone');
  assert.equal(calculateAssessment({ ...inputs, strengthReps: 30 }).passedOverall, true);
  for (const rec of plan.recommendations.filter((rec) => rec.componentKey !== 'strength')) {
    assert.equal(rec.singlePathAchievable, false);
    assert.equal(rec.singlePathDeltaLabel, 'Other event minimum not met');
  }
});

test('multiple failing events and a failed medical walk cannot be repaired through an unrelated event', () => {
  const multiple = calculateTargetGoalPlan({ ...BASE_INPUTS, ageBracket: 'under25', strengthReps: 29, coreReps: 38 }, 75);
  assert.equal(multiple.alreadyAchieved, false);
  assert.ok(multiple.recommendations.every((rec) => !rec.singlePathAchievable));
  const walk = calculateTargetGoalPlan({ ...BASE_INPUTS, cardioEvent: 'walk_2km', walkMinutes: 99, walkSeconds: 0 }, 75);
  assert.equal(walk.currentCompositeScore, 100);
  assert.equal(walk.alreadyAchieved, false);
  assert.ok(walk.recommendations.every((rec) => !rec.singlePathAchievable));
});

test('passing totals meet the goal, but an assessment with no scored events does not', () => {
  assert.equal(calculateTargetGoalPlan(BASE_INPUTS, 90).alreadyAchieved, true);
  const exempt = calculateTargetGoalPlan({ ...BASE_INPUTS, cardioExempt: true, strengthExempt: true, coreExempt: true }, 75);
  assert.equal(exempt.alreadyAchieved, false);
  assert.equal(exempt.achievable, false);
});
