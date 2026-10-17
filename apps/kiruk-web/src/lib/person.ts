import { PERSON_ORIGIN } from './site';

/** Cross-voice: studio → person. Used on about + writing pages. */
export function personLinks() {
  return {
    notebook: `${PERSON_ORIGIN}/blog`,
    about: `${PERSON_ORIGIN}/about`,
    home: PERSON_ORIGIN,
  };
}
