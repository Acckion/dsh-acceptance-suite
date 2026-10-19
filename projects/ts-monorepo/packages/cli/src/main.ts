import { slugify, chunk } from '../../core/src/index.ts';

export function formatHeading(title: string): string {
  const slug = slugify(title);
  return slug.length > 0 ? `# ${slug}` : '# (untitled)';
}

export function groupLines(lines: string[], perRow: number): string[] {
  return chunk(lines, perRow).map((group) => group.join(' | '));
}
