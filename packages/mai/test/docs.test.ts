/**
 * The reference pages keep their promises (ledger MA-29, MA-30): every check id a page names
 * is a check the critic runs, and every check the critic runs is on docs/checks.md.
 *
 * Ids are read from `id: '…'` and `id: \`…:${…}\`` in src/critic/critic.ts; a parametrised id
 * (`measure.true:<id>`, `light.follows:<form>`) is compared on the part before the colon.
 * Only backticked tokens with a prefix the critic uses (light., measure., …) count, so file
 * names such as `plate.svg` and API names such as `p.fact()` are not taken for checks.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const criticIds = new Set(
  [...read('src/critic/critic.ts').matchAll(/\bid: ['`]([a-z]+\.[a-z-]+)[:'`]/g)].map(
    (m) => m[1] as string,
  ),
);
const prefixes = new Set([...criticIds].map((id) => id.split('.')[0] as string));
const FILE = /\.(ts|js|md|json|svg|png|html)$/;

/** The check ids a page names: backticked `prefix.name` or `prefix.name:<param>`. */
function named(rel: string): Set<string> {
  const out = new Set<string>();
  for (const m of read(rel).matchAll(/`([a-z]+)\.([a-z-]+)(?::[^`]*)?`/g)) {
    const [, prefix, name] = m as unknown as [string, string, string];
    const id = `${prefix}.${name}`;
    if (prefixes.has(prefix) && !FILE.test(id)) out.add(id);
  }
  return out;
}

describe('reference pages name only real checks', () => {
  it('the critic has checks to compare against', () => {
    expect(criticIds.size).toBeGreaterThan(50);
  });

  for (const page of ['docs/checks.md', 'docs/anomalies.md'])
    it(`every check id in ${page} exists in critic.ts`, () => {
      const missing = [...named(page)].filter((id) => !criticIds.has(id));
      expect(missing, `${page} names checks the critic does not run`).toEqual([]);
    });

  it('every check id in critic.ts is on docs/checks.md', () => {
    const listed = named('docs/checks.md');
    const unlisted = [...criticIds].filter((id) => !listed.has(id));
    expect(unlisted, 'checks missing from docs/checks.md').toEqual([]);
  });
});
