export function splitBill(totalCents: number, people: number): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new RangeError('totalCents must be a non-negative safe integer');
  }
  if (!Number.isSafeInteger(people) || people < 1 || people > 10000) {
    throw new RangeError('people must be an integer between 1 and 10000');
  }
  const base = Math.floor(totalCents / people);
  const remainder = totalCents - base * people;
  return Array.from({ length: people }, (_, index) => base + (index < remainder ? 1 : 0));
}
