/**
 * Plate II — Desirable. The parametric table from the configurator, drawn as a
 * dimensional sheet in quill and rubric. Scrub W and the plate redraws from the
 * same formula; switch the top to glass and the validation rule shows its jump.
 *
 * spec-link: ideas/studio-dawn/folio.md — Plate II
 */
import { Eye } from '../ink/logogram';
import { KeyLetter, REGISTER, Register } from '../ink/rubric';
import { DESIRABLE } from '../truth';
import { drawTable, insetDetail, SHEETS } from './desirable-geom';

const REST = { W: DESIRABLE.width.value, material: 'oak' as const };

function Sheet({ wide }: { wide: boolean }) {
  const S = wide ? SHEETS.wide : SHEETS.phone;
  const id = wide ? 'pii-w' : 'pii-p';
  const t = drawTable(REST, wide, id);
  const inset = wide ? insetDetail() : null;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named by aria-labelledby
    <svg
      className={`sheet ${wide ? 'sheet-wide' : 'sheet-phone'}`}
      viewBox={`0 0 ${S.w} ${S.h}`}
      role="img"
      aria-labelledby="plate-ii-title plate-ii-claim"
      data-sheet={wide ? 'wide' : 'phone'}
    >
      <g data-layer="wash" />
      <g
        data-layer="construction"
        className="cons p-cons"
        data-dyn="cons"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: a constant authored in this repo, not user input
        dangerouslySetInnerHTML={{
          __html: t.cons + (inset ? `<g data-keep="">${inset.cons}</g>` : ''),
        }}
      />
      <g data-layer="ink">
        <g
          data-subject=""
          className="p-c"
          data-dyn="ink"
          data-part="A"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a constant authored in this repo, not user input
          dangerouslySetInnerHTML={{ __html: t.ink }}
        />
        {inset && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a constant authored in this repo, not user input
          <g className="p-sat" data-part="C" dangerouslySetInnerHTML={{ __html: inset.ink }} />
        )}
      </g>
      <g data-layer="letters" className="p-line">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant authored in this repo, not user input */}
        <g data-dyn="letters" dangerouslySetInnerHTML={{ __html: t.letters }} />
        {inset && <KeyLetter at={inset.keyAt}>C</KeyLetter>}
      </g>
      <g data-layer="line" transform={REGISTER} className="p-line">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant authored in this repo, not user input */}
        <g data-dyn="line" dangerouslySetInnerHTML={{ __html: t.line }} />
        {inset && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a constant authored in this repo, not user input
          <g dangerouslySetInnerHTML={{ __html: inset.line }} />
        )}
        {wide && <Register w={S.w} h={S.h} />}
      </g>
      <Eye cx={S.w - (wide ? 34 : 22)} cy={wide ? 34 : 22} size={wide ? 26 : 20} />
    </svg>
  );
}

export function PlateDesirable() {
  return (
    <section
      className="plate"
      id="plate-ii"
      data-plate="ii"
      aria-labelledby="plate-ii-title"
      data-desirable=""
    >
      <header className="plate-head">
        <p className="plate-no">Plate II</p>
        <h2 id="plate-ii-title" className="plate-title">
          Desirable — a table drawn by its numbers
        </h2>
        <p className="plate-kind">In-house · ideas phase</p>
      </header>
      <figure data-codex="" className="plate-fig" aria-labelledby="plate-ii-title plate-ii-claim">
        <div className="sheet-frame">
          <Sheet wide />
          <Sheet wide={false} />
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: a control group laid out on the plate; a fieldset would bring its own box */}
        <div className="plate-controls needs-js" role="group" aria-label="Configure the table">
          <label className="ctl">
            <span className="ctl-name">W</span>
            <input
              type="range"
              min={DESIRABLE.width.min}
              max={DESIRABLE.width.max}
              step={1}
              defaultValue={DESIRABLE.width.value}
              data-ctl="W"
              aria-valuetext={`width ${DESIRABLE.width.value} centimetres`}
            />
            <output data-out="W">{DESIRABLE.width.value} cm</output>
          </label>
          <div className="ctl ctl-toggle" role="radiogroup" aria-label="Top">
            {(['oak', 'glass'] as const).map((m) => (
              // biome-ignore lint/a11y/useSemanticElements: styled as a printed swatch; arrow keys handled by the plate script
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={m === 'oak'}
                data-material={m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <figcaption>
          <p className="claim" id="plate-ii-claim">
            Desirable lets a buyer draw a table by its numbers: the legs keep their inset while the
            top stretches.
          </p>
        </figcaption>
      </figure>
      <div data-layer="notes" className="notes">
        <ol className="key" aria-label="Key to Plate II">
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusing a key item highlights its part of the drawing */}
          <li data-key="A" tabIndex={0}>
            <b className="k">A</b>
            <span>
              <em>The table</em>, at the configurator’s defaults: W {DESIRABLE.width.value} × D{' '}
              {DESIRABLE.depth} × H {DESIRABLE.height} cm, a {DESIRABLE.top} cm top on{' '}
              {DESIRABLE.leg} cm legs. Width runs {DESIRABLE.width.min}–{DESIRABLE.width.max} cm;
              drag W and the drawing follows.
            </span>
          </li>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusing a key item highlights its part of the drawing */}
          <li data-key="B" tabIndex={0}>
            <b className="k">B</b>
            <span>
              <em>The rule under the drawing.</em> Every leg sits {DESIRABLE.insetFormula} from the
              edge, and stands H − T tall. Nothing is placed by eye; the configurator writes these
              same lines.
            </span>
          </li>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusing a key item highlights its part of the drawing */}
          <li data-key="C" className="wide-only" tabIndex={0}>
            <b className="k">C</b>
            <span>
              <em>The inset, from below</em>, at ten pixels to the centimetre: a 2 cm margin, then
              the leg, its centre at S.
            </span>
          </li>
          <li className="note-plain">
            <span>
              <em>What the buyer cannot break.</em> A glass top over {DESIRABLE.glassLimit} cm wide
              is refused until it is reinforced — one of the configurator’s validation rules, and
              the jump the margin plots.
            </span>
          </li>
          <li className="note-plain">
            <span>
              Desirable is kiruk’s in-house piece: people configure what they desire, craftsmen bid
              to make it, the buyer picks.{' '}
              <a href={DESIRABLE.url} rel="noreferrer" target="_blank">
                Read the case study on Behance
              </a>
              .
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}
