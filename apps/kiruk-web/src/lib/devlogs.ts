import { devlogs } from '../../.velite';

export type DevlogEntry = (typeof devlogs)[number];

function byDateDesc(a: DevlogEntry, b: DevlogEntry) {
  return b.date.localeCompare(a.date);
}

/** Process log minus archived entries. Drafts render with a state chip until published. */
export function listDevlogs(): DevlogEntry[] {
  return [...devlogs].filter((d) => d.state !== 'archived').sort(byDateDesc);
}

export function getDevlog(slug: string): DevlogEntry | undefined {
  return listDevlogs().find((d) => d.slug === slug);
}

export function syndicateDevlogs(): DevlogEntry[] {
  const rows = listDevlogs().filter((d) => d.state === 'published');
  if (import.meta.env.DEV && rows.length === 0) return listDevlogs();
  return rows;
}
