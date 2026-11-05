/**
 * The landing: one engraved eye and what holds it up — the platemark, the
 * construction guides, the figure's letters and key, the strip of the engine's
 * passes, and the instrument. Nothing else.
 *
 * Layers, bottom to top: the GPU plate (paper + engraving + construction), the type and
 * the notes (printed into the paper with HTML-in-Canvas where available), the live
 * measures (the code's line, not printed: its numbers move), the instrument.
 * Before the GPU is ready — or without JS — a printed poster of the same plate shows.
 *
 * spec-link: ideas/studio-dawn/eye.md
 */
import { EyeEngine } from './EyeEngine';
import { EyeOverlay } from './EyeOverlay';
import { Instrument } from './Instrument';
import { Measures } from './Measures';

export function EyeLanding() {
  return (
    <div className="eye-page">
      <div className="platemark" aria-hidden="true" />
      <div className="eye-box" aria-hidden="true">
        <div className="eye-poster" />
      </div>
      <div className="studies" aria-hidden="true" />
      <EyeEngine overlay={<EyeOverlay />} />
      <Measures />
      <Instrument />
    </div>
  );
}
