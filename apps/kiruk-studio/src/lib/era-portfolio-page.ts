/**
 * What the eye is looking at: the studio, as one manuscript page.
 * Personal portfolio copy stays in the private repo.
 */

export type PageBlock =
  | { t: 'title'; text: string }
  | { t: 'sub'; text: string }
  | { t: 'nav'; items: string[] }
  | { t: 'rule' }
  | { t: 'body'; text: string }
  | { t: 'item'; text: string }
  | { t: 'card'; title: string; meta: string }
  | { t: 'stat'; value: string; label: string }
  | { t: 'gap' };

export interface EraPage {
  file: string;
  face: 'mono' | 'serif' | 'sans' | 'grotesk';
  blocks: PageBlock[];
}

function manuscript(): EraPage {
  return {
    file: 'kiruk',
    face: 'serif',
    blocks: [
      { t: 'title', text: 'kiruk' },
      { t: 'sub', text: 'an art + code studio' },
      { t: 'rule' },
      { t: 'body', text: 'The site is being rebuilt from scratch, in the open.' },
      { t: 'gap' },
      { t: 'item', text: 'GitHub' },
      { t: 'item', text: 'Instagram' },
      { t: 'item', text: 'arunkumaar.srinivasan@gmail.com' },
    ],
  };
}

export function getEraPage(eraId: string): EraPage {
  void eraId;
  return manuscript();
}
