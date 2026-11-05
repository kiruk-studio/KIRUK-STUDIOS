'use client';
/**
 * Old paper or new: Dawn Light or Dawn Departs, as two paper samples tipped into
 * the title block. Printed into the paper with the rest of the type when
 * HTML-in-Canvas is on; on a phone it is the only way to change the sheet.
 * Toggle buttons in a fieldset: honest semantics, no arrow-key contract to keep.
 * spec-link: ideas/studio-dawn/eye.md — the dawn
 */
import { DAWN } from './dawn';
import { actions, useEye } from './store';

export function DawnToggle() {
  const target = useEye((s) => s.dawnTarget);
  return (
    <fieldset className="dawn-toggle">
      <legend className="vh">Paper</legend>
      {[DAWN.old, DAWN.new].map((d, i) => (
        <button
          key={d.key}
          type="button"
          aria-pressed={target === i}
          onClick={() => actions.setDawn(i as 0 | 1)}
          title={d.tagline}
        >
          <span className="dawn-dot" style={{ background: d.hex }} aria-hidden="true" />
          {d.key} · <i>{d.name}</i>
        </button>
      ))}
    </fieldset>
  );
}
