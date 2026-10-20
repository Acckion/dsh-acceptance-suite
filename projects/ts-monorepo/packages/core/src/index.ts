export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new RangeError('size must be positive');
  const result: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    result.push(items.slice(start, start + size));
  }
  return result;
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
