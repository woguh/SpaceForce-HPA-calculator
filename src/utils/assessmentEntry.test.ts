import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentEntryCompletion, assessmentEntrySummary, assessmentInputsForEntry, EMPTY_PERFORMANCE, profileSettingsForEntry, type AssessmentEntry } from './assessmentEntry';
import { calculateAssessment } from './calculator';

const EMPTY: AssessmentEntry = {
  sex: 'male', ageBracket: '25-29', framework: 'ussf_hpa_60_20_20',
  installationId: 'peterson-sfb', altitudeGroup: 'group3', isManualAltitude: false,
  cardioEvent: 'run_2_0', strengthEvent: 'pushups', coreEvent: 'situps',
  cardioExempt: false, strengthExempt: false, coreExempt: false, whtrExempt: false,
  ...EMPTY_PERFORMANCE,
};
const FILLED: AssessmentEntry = { ...EMPTY, runMinutes: 15, runSeconds: 0, strengthReps: 48, coreReps: 49 };

test('blank results remain incomplete and an entered zero is distinct from blank', () => {
  assert.equal(assessmentEntryCompletion(EMPTY).all, false);
  assert.equal(assessmentEntryCompletion(EMPTY).strength, false);
  assert.equal(assessmentEntryCompletion({ ...EMPTY, strengthReps: 0 }).strength, true);
  assert.equal(assessmentEntryCompletion({ ...EMPTY, coreReps: 0 }).core, true);
});

test('both time fields are required, including explicitly entered zero seconds', () => {
  assert.equal(assessmentEntryCompletion({ ...FILLED, runSeconds: null }).cardio, false);
  assert.equal(assessmentEntryCompletion(FILLED).all, true);
  assert.equal(assessmentEntryCompletion({ ...FILLED, runSeconds: 60 }).cardio, false);
  assert.equal(assessmentEntryCompletion({ ...FILLED, strengthReps: -1 }).all, false);
});

test('completion follows the selected events and exemptions', () => {
  assert.equal(assessmentEntryCompletion({ ...FILLED, cardioEvent: 'hamr' }).all, false);
  assert.equal(assessmentEntryCompletion({ ...FILLED, cardioEvent: 'hamr', hamrShuttles: 64 }).all, true);
  assert.equal(assessmentEntryCompletion({ ...FILLED, coreEvent: 'plank' }).core, false);
  assert.equal(assessmentEntryCompletion({ ...FILLED, coreEvent: 'plank', plankMinutes: 0, plankSeconds: 0 }).core, true);
  assert.equal(assessmentEntryCompletion({ ...EMPTY, cardioExempt: true }).cardio, true);
});

test('optional four-pillar mode needs entered body measurements', () => {
  const fourPillar: AssessmentEntry = { ...FILLED, framework: 'daf_pfra_50_15_15_20' };
  assert.equal(assessmentEntryCompletion(fourPillar).all, false);
  assert.equal(assessmentEntryCompletion({ ...fourPillar, waistInches: 32, heightInches: 70 }).all, true);
  assert.equal(assessmentEntryCompletion({ ...fourPillar, waistInches: -1, heightInches: 70 }).all, false);
});

test('saved settings exclude measurements so the next load has no previous performance', () => {
  const settings = profileSettingsForEntry(FILLED);
  assert.equal(settings.installationId, 'peterson-sfb');
  assert.equal(settings.coreEvent, 'situps');
  for (const field of Object.keys(EMPTY_PERFORMANCE)) assert.equal(field in settings, false);
});

test('entry conversion preserves entered values without altering blank entry state', () => {
  assert.equal(assessmentInputsForEntry(FILLED).runSeconds, 0);
  assert.equal(assessmentInputsForEntry(FILLED).strengthReps, 48);
  assert.equal(assessmentInputsForEntry(EMPTY).strengthReps, 0);
  assert.equal(EMPTY.strengthReps, null);
});

function summary(entry: AssessmentEntry) {
  return assessmentEntrySummary(entry, calculateAssessment(assessmentInputsForEntry(entry)));
}

test('the initial summary displays 100 without filling any performance fields', () => {
  assert.deepEqual(summary(EMPTY), { initial: true, score: 100 });
  for (const key of Object.keys(EMPTY_PERFORMANCE)) assert.equal(EMPTY[key as keyof AssessmentEntry], null);
});

test('entered zero and partial times leave the initial display without scoring missing events', () => {
  assert.deepEqual(summary({ ...EMPTY, strengthReps: 0 }), { initial: false, score: 0 });
  assert.deepEqual(summary({ ...EMPTY, runMinutes: 15 }), { initial: false, score: 0 });
});

test('partial summaries count only entered events, including in four-pillar mode', () => {
  assert.deepEqual(summary({ ...EMPTY, strengthReps: 48 }), { initial: false, score: 17 });
  assert.deepEqual(summary({ ...EMPTY, framework: 'daf_pfra_50_15_15_20', strengthReps: 48 }), { initial: false, score: 12.8 });
});

test('complete results use the actual composite and clearing all fields restores the initial display', () => {
  const expected = calculateAssessment(assessmentInputsForEntry(FILLED)).compositeScore;
  assert.deepEqual(summary(FILLED), { initial: false, score: expected });
  assert.deepEqual(summary({ ...FILLED, ...EMPTY_PERFORMANCE }), { initial: true, score: 100 });
});
