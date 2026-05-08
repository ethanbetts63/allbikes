import fs from 'node:fs';
import path from 'node:path';

export function getFileModifiedIso(relativePath: string): string | undefined {
  try {
    const stats = fs.statSync(path.join(process.cwd(), relativePath));
    return stats.mtime.toISOString();
  } catch {
    return undefined;
  }
}

export function getLatestIsoDate(...values: Array<string | Date | null | undefined>): string | undefined {
  const timestamps = values
    .filter((value): value is string | Date => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (!timestamps.length) {
    return undefined;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}
