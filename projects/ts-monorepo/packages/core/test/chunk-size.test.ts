import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunk } from '../src/index.ts';

test('chunk rejects non-finite, fractional and unsafe sizes', () => {
  for (const size of [NaN, Infinity, -Infinity, 1.5, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => chunk([1, 2, 3], size), RangeError);
  }
});

test('chunk preserves every item for valid group sizes', () => {
  const input = [1, 2, 3, 4, 5];
  for (const size of [1, 2, 3, 10]) {
    const groups = chunk(input, size);
    assert.deepEqual(groups.flat(), input);
    assert.ok(groups.every(group => group.length <= size));
  }
  assert.deepEqual(chunk([], 2), []);
});
