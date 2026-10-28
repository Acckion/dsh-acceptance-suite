import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPayment, type ShopState } from '../src/index.ts';

const initial = (): ShopState => ({ stock: 10, orders: {
  'order-1': { quantity: 2, status: 'pending' },
  'order-2': { quantity: 3, status: 'pending' },
} });

test('successful payment marks the order paid and deducts its quantity', () => {
  const result = applyPayment(initial(), { orderId: 'order-1', transactionId: 'tx-1' });
  assert.equal(result.stock, 8);
  assert.equal(result.orders['order-1'].status, 'paid');
  assert.equal(result.orders['order-1'].transactionId, 'tx-1');
});

test('two different orders deduct their own quantities', () => {
  const first = applyPayment(initial(), { orderId: 'order-1', transactionId: 'tx-1' });
  const result = applyPayment(first, { orderId: 'order-2', transactionId: 'tx-2' });
  assert.equal(result.stock, 5);
});

test('unknown orders and empty transaction IDs are rejected', () => {
  assert.throws(() => applyPayment(initial(), { orderId: 'missing', transactionId: 'tx-1' }), /Order not found/);
  assert.throws(() => applyPayment(initial(), { orderId: 'order-1', transactionId: ' ' }), /Transaction ID is required/);
});

test('insufficient stock is rejected', () => {
  assert.throws(() => applyPayment({ ...initial(), stock: 1 }, { orderId: 'order-1', transactionId: 'tx-1' }), /Insufficient stock/);
});

test('processing does not mutate the input state or other orders', () => {
  const source = initial();
  const before = structuredClone(source);
  const result = applyPayment(source, { orderId: 'order-1', transactionId: 'tx-1' });
  assert.deepEqual(source, before);
  assert.deepEqual(result.orders['order-2'], source.orders['order-2']);
});
