import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, chunk, sum } from '../src/index.ts';

test('slugify normalizes titles', () => {
  assert.equal(slugify('Hello, World!'), 'hello-world');
  assert.equal(slugify('  spaced   out  '), 'spaced-out');
  assert.equal(slugify('already-slug'), 'already-slug');
});

test('chunk splits arrays into buckets', () => {
  assert.deepEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
  assert.deepEqual(chunk([1, 2, 3], 5), [[1, 2, 3]]);
  assert.deepEqual(chunk([], 2), []);
});

test('chunk rejects non-positive size', () => {
  assert.throws(() => chunk([1], 0), RangeError);
});

test('sum adds all values', () => {
  assert.equal(sum([1, 2, 3]), 6);
  assert.equal(sum([]), 0);
});
