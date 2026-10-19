import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHeading, groupLines } from '../src/main.ts';

test('formatHeading builds a slug heading', () => {
  assert.equal(formatHeading('Hello Suite'), '# hello-suite');
  assert.equal(formatHeading('   '), '# (untitled)');
});

test('groupLines joins buckets', () => {
  assert.deepEqual(groupLines(['a', 'b', 'c'], 2), ['a | b', 'c']);
});
