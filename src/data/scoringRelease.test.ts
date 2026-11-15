import test from 'node:test';
import assert from 'node:assert/strict';
import { HPA_SCORING_RELEASE, SCORING_EVENTS } from './scoringRelease';
import { AGE_BRACKETS } from './scoringStandards';
import { USSF_HPA_DISCRETE_TABLES } from './ussfScoringTables';
import { STANDARDS_REFERENCE } from './standardsReference';

test('standards and calculator share the same scoring tables', () => {
  assert.equal(HPA_SCORING_RELEASE.tables, USSF_HPA_DISCRETE_TABLES);
  assert.equal(STANDARDS_REFERENCE.scoresheets, USSF_HPA_DISCRETE_TABLES);
});

test('each scoresheet has ordered thresholds, valid points and a maximum row', () => {
  for (const sex of ['male', 'female'] as const) {
    for (const age of AGE_BRACKETS) {
      for (const event of SCORING_EVENTS) {
        const rows = HPA_SCORING_RELEASE.tables[sex][age.id][event.id];
        const name = `${sex}/${age.id}/${event.id}`;
        assert.ok(rows.length > 1, name);
        assert.equal(rows[0][1], event.maximum, name);
        rows.forEach(([value, points], index) => {
          assert.ok(Number.isFinite(value) && value >= 0 && points > 0 && points <= event.maximum, name);
          if (index > 0) {
            assert.ok(event.id === 'run20' ? value > rows[index - 1][0] : value < rows[index - 1][0], name);
            assert.ok(points <= rows[index - 1][1], name);
          }
        });
      }
    }
  }
});
