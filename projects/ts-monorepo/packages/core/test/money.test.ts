import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitBill } from '../src/index.ts';

test('splitBill assigns remainder in stable participant order', () => {
  assert.deepEqual(splitBill(1000, 3), [334, 333, 333]);
  assert.deepEqual(splitBill(1, 3), [1, 0, 0]);
});

test('splitBill handles divisible and zero amounts', () => {
  assert.deepEqual(splitBill(1000, 4), [250, 250, 250, 250]);
  assert.deepEqual(splitBill(0, 3), [0, 0, 0]);
});

test('splitBill conserves total, count and maximum difference', () => {
  for (const total of [0, 1, 2, 10, 999, 1000, 1001, Number.MAX_SAFE_INTEGER]) {
    for (const count of [1, 2, 3, 7, 9]) {
      const parts = splitBill(total, count);
      assert.equal(parts.length, count);
      assert.equal(parts.reduce((sum, value) => sum + value, 0), total);
      assert.ok(Math.max(...parts) - Math.min(...parts) <= 1);
      assert.ok(parts.every(Number.isSafeInteger));
    }
  }
});

test('splitBill rejects invalid totals', () => {
  for (const total of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => splitBill(total, 3), RangeError);
  }
});

test('splitBill rejects invalid or excessive participant counts', () => {
  for (const count of [0, -1, 1.5, NaN, Infinity, 10001]) {
    assert.throws(() => splitBill(1000, count), RangeError);
  }
});
