import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitBill } from '../src/index.ts';

test('splitBill divides ten yuan among four people', () => {
  assert.deepEqual(splitBill(1000, 4), [250, 250, 250, 250]);
});

test('splitBill divides nine yuan among three people', () => {
  assert.deepEqual(splitBill(900, 3), [300, 300, 300]);
});
