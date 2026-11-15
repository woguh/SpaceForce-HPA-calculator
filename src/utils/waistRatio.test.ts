import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWaistRatio, formatHeightFeetInches } from './waistRatio';

test('empty and partial measurements remain unassessed', () => {
  assert.equal(calculateWaistRatio({ waist: '', height: '' }).status, 'empty');
  assert.equal(calculateWaistRatio({ waist: '32', height: '' }).status, 'incomplete');
  assert.equal(calculateWaistRatio({ waist: ' ', height: '70' }).ratio, null);
});

test('green and yellow chart cells pass the standalone check', () => {
  for (const [waist, height, ratio] of [['28', '58', 0.48], ['35', '70', 0.50], ['38', '70', 0.54], ['31.5', '58', 0.54]] as const) {
    const result = calculateWaistRatio({ waist, height });
    assert.equal(result.status, 'pass');
    assert.equal(result.ratio, ratio);
  }
});

test('red chart cells at 0.55 and above fail', () => {
  for (const [waist, height, ratio] of [['38.5', '70', 0.55], ['32', '58.5', 0.55], ['33', '60.5', 0.55], ['39', '58', 0.67]] as const) {
    const result = calculateWaistRatio({ waist, height });
    assert.equal(result.status, 'fail');
    assert.equal(result.ratio, ratio);
  }
});

test('classification uses the same two-decimal rounding as the supplied chart', () => {
  assert.equal(calculateWaistRatio({ waist: '54.49', height: '100' }).status, 'pass');
  assert.equal(calculateWaistRatio({ waist: '54.5', height: '100' }).ratio, 0.55);
  assert.equal(calculateWaistRatio({ waist: '54.5', height: '100' }).status, 'fail');
});

test('invalid measurements produce validation errors rather than a pass or fail', () => {
  for (const value of ['0', '-1', 'Infinity', 'NaN', 'abc', '1e2', '0x10']) {
    const waist = calculateWaistRatio({ waist: value, height: '70' });
    const height = calculateWaistRatio({ waist: '32', height: value });
    assert.equal(waist.status, 'invalid');
    assert.equal(height.status, 'invalid');
    assert.ok(waist.errors.waist);
    assert.ok(height.errors.height);
    assert.equal(waist.ratio, null);
    assert.equal(height.ratio, null);
  }
});


test('combined height labels preserve fractional inches and values outside the picker range', () => {
  assert.equal(formatHeightFeetInches(70), '5 ft 10 in');
  assert.equal(formatHeightFeetInches(70.5), '5 ft 10.5 in');
  assert.equal(formatHeightFeetInches(70.25), '5 ft 10.25 in');
  assert.equal(formatHeightFeetInches(72), '6 ft 0 in');
  assert.equal(formatHeightFeetInches(100), '8 ft 4 in');
});
