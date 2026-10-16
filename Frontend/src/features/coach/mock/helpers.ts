/**
 * Helpers for building realistic mock data. All dates are relative to the moment the
 * module loads so "today" on the dashboard always has content.
 */
const NOW = new Date();

export function atDay(offsetDays: number, hour = 9, minute = 0): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const daysAgo = (days: number, hour = 9, minute = 0) => atDay(-days, hour, minute);

export function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString();
}

export function isoDate(offsetDays: number): string {
  return atDay(offsetDays, 12).slice(0, 10);
}

/** Deterministic PRNG (mulberry32) so mocks look random but never change between reloads. */
export function createRng(seed: number) {
  let t = seed >>> 0;
  const next = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
  };
}

export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

let idCounter = 0;
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter}`;
}

export function avatar(index: number): string {
  return `https://i.pravatar.cc/160?img=${index}`;
}
