/**
 * Plate I — kiruk. The five letters of the name are the five passes of a kiruk
 * sheet: A scribble, B rule, C ink, D rubric, E live. Server-rendered: the rest
 * state is the finished plate, with or without script.
 *
 * spec-link: ideas/studio-dawn/folio.md — Plate I
 * spec-link: .claude/skills/kiruk-codex/references/verify.md — the figure contract
 */

import { Eye } from '../ink/logogram';
import { n } from '../ink/pen';
import {
  Arrow,
  Dim,
  Dot,
  KeyLetter,
  Label,
  REGISTER,
  Register,
  Seg,
  Selection,
} from '../ink/rubric';
import { PASSES } from '../truth';
import { GEOM_PHONE, GEOM_WIDE, METRICS, PHONE, type Sheet, WIDE } from './kiruk-geom';

const em = (v: number) => `${v.toFixed(3).replace(/^0/, '0')} em`;

function Drawing({ S, G, wide, id }: { S: Sheet; G: typeof GEOM_WIDE; wide: boolean; id: string }) {
  const sat = G.sat;
  const eyeSize = G.tittle.r * (wide ? 2.5 : 2.6);
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named by aria-labelledby
    <svg
      className={`sheet ${wide ? 'sheet-wide' : 'sheet-phone'}`}
      viewBox={`0 0 ${S.w} ${S.h}`}
      role="img"
      aria-labelledby="plate-i-title plate-i-claim"
      data-sheet={wide ? 'wide' : 'phone'}
    >
      <defs>
        <clipPath id={`${id}-r`}>
          <path d={G.rCs} />
        </clipPath>
        {sat && (
          <>
            <clipPath id={`${id}-sphere`}>
              <circle cx={sat.sphere.c[0]} cy={sat.sphere.c[1]} r={sat.sphere.r - 0.6} />
            </clipPath>
            <clipPath id={`${id}-cast`}>
              <path d={sat.sphere.cast} />
            </clipPath>
            <clipPath id={`${id}-barrel`}>
              <path d={sat.quill.shadeClip} />
            </clipPath>
          </>
        )}
      </defs>

      <g data-layer="wash" />

      {/* Construction: the ruling every letter stands on, the stem axes, a fitted shoulder. */}
      <g data-layer="construction" className="cons p-cons">
        {G.ruling.map((r) => (
          <path key={r.name} d={`M${n(G.left)} ${n(r.y)}H${n(G.right)}`} />
        ))}
        {G.axes.map((x, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static drawing paths built once from geometry, never reordered
          <path key={i} d={`M${n(x)} ${n(G.ascY - 12)}V${n(S.yb + 12)}`} />
        ))}
        <circle cx={n(G.shoulder.c[0])} cy={n(G.shoulder.c[1])} r={n(G.shoulder.r)} fill="none" />
        <path
          d={`M${n(G.shoulder.c[0] - 5)} ${n(G.shoulder.c[1])}h10M${n(G.shoulder.c[0])} ${n(G.shoulder.c[1] - 5)}v10`}
        />
        <circle cx={n(G.tittle.c[0])} cy={n(G.tittle.c[1])} r={n(G.tittle.r + 4)} fill="none" />
      </g>

      <g data-layer="ink">
        <g data-subject="">
          {/* A · scribble — the founder's tablet stroke replaces this underdrawing. */}
          <g className="p-a scrib" data-part="A" data-sketch-slot="plate-1-k">
            {G.kTrace.map((d, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static drawing paths built once from geometry, never reordered
              <path key={i} d={d} className="trace" />
            ))}
            {G.scribble.map((d, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static drawing paths built once from geometry, never reordered
              <path key={i} d={d} />
            ))}
          </g>

          {/* B · rule — ruler and compass, no wobble; the eye dots the i. */}
          <g className="p-b ruled" data-part="B">
            {G.ruled.map(([a, b], i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static drawing paths built once from geometry, never reordered
              <path key={i} d={`M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`} />
            ))}
            {G.brackets.map((pts, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static drawing paths built once from geometry, never reordered
              <path key={i} d={`M${pts.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}`} />
            ))}
            <circle cx={n(G.tittle.c[0])} cy={n(G.tittle.c[1])} r={n(G.tittle.r)} fill="none" />
            <Eye cx={G.tittle.c[0]} cy={G.tittle.c[1]} size={eyeSize} />
          </g>

          {/* C · ink — one quill around the r, hatched inside with the left hand's slope. */}
          <g className="p-c" data-part="C">
            <g clipPath={`url(#${id}-r)`} className="hatch">
              <path d={G.rHatch} />
              <path d={G.rHatch2} />
            </g>
            <path d={G.rQuill} data-quill={wide ? '2.4' : '1.4'} />
          </g>

          {/* D · rubric — the u inked solid; the red pass measures it. */}
          <g className="p-d" data-part="D">
            <path d={G.uSolid} />
            <path d={G.uQuill} data-quill={wide ? '2.2' : '1.3'} />
          </g>

          {/* E · live — the last k, inked and selected; it answers the pointer. */}
          <g className="p-e live-k" data-part="E" data-live="">
            <path d={G.k2Solid} />
            <path d={G.k2Quill} data-quill={wide ? '2.4' : '1.4'} />
          </g>
        </g>

        {sat && (
          <g className="p-sat">
            {/* F · the quill */}
            <g data-part="F">
              <g clipPath={`url(#${id}-barrel)`} className="hatch">
                <path d={sat.quill.shade} />
              </g>
              {sat.quill.contour.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static drawing paths built once from geometry, never reordered
                <path key={i} d={d} data-quill="2.0" />
              ))}
              {sat.quill.barbs.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static drawing paths built once from geometry, never reordered
                <path key={i} d={d} className="barb" />
              ))}
            </g>
            {/* G · the light */}
            <g data-part="G">
              <g clipPath={`url(#${id}-sphere)`} className="hatch">
                <path d={sat.sphere.shade} />
                <path d={sat.sphere.core} />
              </g>
              <g clipPath={`url(#${id}-cast)`} className="hatch">
                <path d={sat.sphere.castHatch} />
              </g>
              <path d={sat.sphere.contour} data-quill="2.3" />
              <path d={sat.sphere.ground} />
            </g>
          </g>
        )}
      </g>

      <g data-layer="letters" className="p-line">
        {G.passes.map((p) => (
          <KeyLetter key={p.key} at={p.keyAt}>
            {p.key}
          </KeyLetter>
        ))}
        {sat && (
          <>
            <KeyLetter at={sat.quill.keyAt}>F</KeyLetter>
            <KeyLetter at={sat.sphere.keyAt}>G</KeyLetter>
          </>
        )}
      </g>

      <g data-layer="line" transform={REGISTER} className="p-line">
        {wide && (
          <>
            {/* The ruling, measured: a scale at the left with the font's own metrics. */}
            <Seg a={[G.left - 22.5, G.ascY]} b={[G.left - 22.5, S.yb]} />
            {G.ruling.map((r) => (
              <g key={r.name}>
                <Seg a={[G.left - 3, r.y]} b={[G.left - 30, r.y]} ext />
              </g>
            ))}
            <Label at={[G.left - 36, G.ascY + 4]} anchor="end">
              ascender {em(METRICS.ascEm)}
            </Label>
            <Label at={[G.left - 36, G.xhY + 4]} anchor="end">
              x-height {em(METRICS.xHeightEm)}
            </Label>
            <Label at={[G.left - 36, S.yb + 4]} anchor="end">
              baseline 0
            </Label>

            {/* D — the u's stem, and the circle its bowl was cut from. */}
            <Dim
              a={G.stem[0]}
              b={G.stem[1]}
              offset={0}
              outside
              label={em((G.stem[1][0] - G.stem[0][0]) / S.s / 2048)}
              labelAt={1}
              labelDy={-8}
              anchor="start"
            />
            <path
              className="rub"
              vectorEffect="non-scaling-stroke"
              fill="none"
              d={`M${n(G.bowl.c[0] - G.bowl.r * Math.cos(0.35))} ${n(G.bowl.c[1] + G.bowl.r * Math.sin(0.35))}A${n(G.bowl.r)} ${n(G.bowl.r)} 0 0 0 ${n(G.bowl.c[0] + G.bowl.r * Math.cos(1.05))} ${n(G.bowl.c[1] + G.bowl.r * Math.sin(1.05))}`}
            />
            <Seg
              a={[G.bowl.c[0] - 6, G.bowl.c[1]]}
              b={[G.bowl.c[0] + 6, G.bowl.c[1]]}
              dash="12 3 1 3"
              free
            />
            <Seg
              a={[G.bowl.c[0], G.bowl.c[1] - 6]}
              b={[G.bowl.c[0], G.bowl.c[1] + 6]}
              dash="12 3 1 3"
              free
            />
            <Seg
              a={G.bowl.c}
              b={[G.bowl.c[0] + G.bowl.r * Math.cos(1.05), G.bowl.c[1] + G.bowl.r * Math.sin(1.05)]}
            />
            <Dot
              at={[
                G.bowl.c[0] + G.bowl.r * Math.cos(1.05),
                G.bowl.c[1] + G.bowl.r * Math.sin(1.05),
              ]}
            />
            <Label at={[G.bowl.c[0] + 8, G.bowl.c[1] + 18]} anchor="start">
              r {em(METRICS.bowlREm)}
            </Label>

            {/* G — where the light comes from. */}
            {sat && (
              <>
                <Seg a={sat.sphere.lightFrom} b={sat.sphere.lightTo} />
                <Arrow tip={sat.sphere.lightTo} from={sat.sphere.lightFrom} />
              </>
            )}
            <Register w={S.w} h={S.h} />
          </>
        )}

        {/* E — the one selection: the live k, with its own size in em. */}
        <Selection
          box={G.k2Box}
          tag={wide ? `k ${em(METRICS.kAdvEm)} × ${em(METRICS.ascEm)}` : 'k · live'}
          tagAbove={!wide}
        />
      </g>
    </svg>
  );
}

export function PlateKiruk() {
  return (
    <section
      className="plate plate-hero"
      id="plate-i"
      data-plate="i"
      aria-labelledby="plate-i-title"
    >
      <header className="plate-head">
        <p className="plate-no">Plate I</p>
        <h1 id="plate-i-title" className="plate-title">
          <span className="sr-only">kiruk — </span>An art + code studio
        </h1>
      </header>
      <figure data-codex="" className="plate-fig" aria-labelledby="plate-i-title plate-i-claim">
        <div className="sheet-frame" data-ink-plate="">
          <Drawing S={WIDE} G={GEOM_WIDE} wide id="pi-w" />
          <Drawing S={PHONE} G={GEOM_PHONE} wide={false} id="pi-p" />
        </div>
        <figcaption>
          <p className="claim" id="plate-i-claim">
            Every kiruk piece is made the way this word is: scribbled, ruled, inked, measured, then
            made live.
          </p>
        </figcaption>
      </figure>
      <div data-layer="notes" className="notes">
        <ol className="key" aria-label="Key to Plate I">
          {PASSES.map((p) => (
            // biome-ignore lint/a11y/noNoninteractiveTabindex: focusing a key item highlights its part of the drawing
            <li key={p.key} data-key={p.key} tabIndex={0}>
              <b className="k">{p.key}</b>
              <span>
                <em>{p.name}</em> · the {p.letter}. {p.note}
              </span>
            </li>
          ))}
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusing a key item highlights its part of the drawing */}
          <li data-key="F" className="wide-only" tabIndex={0}>
            <b className="k">F</b>
            <span>
              <em>The quill.</em> A goose feather cut to a split point. Pressed, the two tines open
              and the line swells.
            </span>
          </li>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusing a key item highlights its part of the drawing */}
          <li data-key="G" className="wide-only" tabIndex={0}>
            <b className="k">G</b>
            <span>
              <em>The light.</em> It comes from the upper left on every plate, so shade and the
              heavy side of a line fall lower right.
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}
