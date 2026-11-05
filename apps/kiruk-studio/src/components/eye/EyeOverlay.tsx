/**
 * The plate's type and rubric — all of it real DOM, positioned in eye units
 * with the page's CSS custom properties (--cx, --cy, --S), so it sits on the
 * GPU drawing exactly. With HTML-in-Canvas this whole layer is printed into
 * the paper by the engine; without it, it renders in place.
 *
 * Letters follow the old anatomical plates: lower case, j skipped.
 * Names are the Latin of the anatomy, then plain English.
 * spec-link: ideas/studio-dawn/eye.md
 */
import { EYE, LANDMARKS } from '@kiruk/burin/rig';
import type { CSSProperties } from 'react';
import { Construction } from './Construction';
import { DawnToggle } from './DawnToggle';
import { KeyFit } from './KeyFit';
import { Neatline } from './Neatline';
import { Notes } from './Notes';
import { ScaleLabels } from './ScaleLabels';

type V = CSSProperties & Record<`--${string}`, string | number>;

const d = 2 * EYE.iris.R;
const MARKS = [
  { y: LANDMARKS.browTop, name: 'brow' },
  { y: LANDMARKS.crease, name: 'crease' },
  { y: LANDMARKS.lidTop, name: 'lid' },
  { y: LANDMARKS.canthus, name: 'corners' },
  { y: LANDMARKS.lidBottom, name: 'lid' },
  { y: LANDMARKS.cheek, name: 'cheek' },
];

export const PARTS = [
  { k: 'a', la: 'supercilium', en: 'the brow', x: -0.62, y: -1.47 },
  { k: 'b', la: 'sulcus palpebralis', en: 'the lid crease', x: 0.86, y: -0.77 },
  { k: 'c', la: 'palpebra superior', en: 'the upper lid', x: 0.12, y: -0.6 },
  { k: 'd', la: 'cilia', en: 'the lashes', x: 1.12, y: -0.42 },
  { k: 'e', la: 'angulus oculi medialis', en: 'the inner corner', x: -1.2, y: 0.12 },
  { k: 'f', la: 'caruncula lacrimalis', en: 'the caruncle', x: -0.95, y: 0.24 },
  { k: 'g', la: 'sclera', en: 'the white', x: 0.66, y: 0.06 },
  { k: 'h', la: 'iris', en: 'the iris', x: 0.27, y: 0.25 },
  { k: 'k', la: 'pupilla', en: 'the pupil', x: -0.62, y: -0.62, to: [-0.07, -0.02] },
  { k: 'l', la: 'palpebra inferior', en: 'the lower lid', x: 0.38, y: 0.55 },
  { k: 'm', la: 'angulus oculi lateralis', en: 'the outer corner', x: 1.14, y: 0.02 },
  {
    k: 'n',
    la: 'stella',
    en: 'the light it holds: the kiruk star',
    x: 0.62,
    y: -0.62,
    to: [-0.05, -0.06],
  },
] as const;

export const STUDIES = ['Construction', 'Contour', 'Hatching', 'Cross-hatching'];

export function EyeOverlay() {
  return (
    <div className="eye-overlay">
      {/* The printer's ink spread, for browsers where the GPU cannot print the type itself. */}
      <svg className="defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="ink-spread" x="-2%" y="-10%" width="104%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="1.1"
            xChannelSelector="R"
            yChannelSelector="G"
            result="d"
          />
          <feGaussianBlur in="d" stdDeviation="0.25" result="b" />
          <feComposite in="b" in2="d" operator="over" />
        </filter>
      </svg>
      <header className="eye-title">
        <p className="eye-plate-no">
          Plate I · <i>Oculus</i>
        </p>
        <h1 className="eye-name">kiruk</h1>
        <p className="eye-tag">
          <i>to scribble, and make something.</i>
        </p>
        <p className="eye-sub">
          An art + code studio. This eye is cut line by line by our own burin engine, into paper the
          engine makes too.
        </p>
        <DawnToggle />
      </header>

      <ol className="eye-key" aria-label="Key to Fig. 1">
        {PARTS.map((p) => (
          <li key={p.k}>
            <b>{p.k}</b>{' '}
            <span className="la">
              <i>{p.la}</i>,{' '}
            </span>
            {p.en}
          </li>
        ))}
      </ol>

      <svg
        className="eye-guides"
        viewBox={`${EYE.frame.x0} ${EYE.frame.y0} ${EYE.frame.w} ${EYE.frame.h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {MARKS.map((m, i) => (
          <path key={`${m.name}-${m.y}`} className="g-line" d={`M-1.32 ${m.y}H1.5`} />
        ))}
        <path className="g-scale" d={`M1.53 ${LANDMARKS.browTop}V${LANDMARKS.cheek}`} />
        {MARKS.map((m, i) => (
          <path key={`t-${m.y}`} className="g-scale" d={`M1.5 ${m.y}H1.56`} />
        ))}
        {/* d — the iris, the unit every other distance is read in */}
        <path
          className="g-rub"
          d={`M${-EYE.iris.R} 0.6H${EYE.iris.R}M${-EYE.iris.R} 0.36V0.64M${EYE.iris.R} 0.36V0.64`}
        />
        {PARTS.filter((p) => 'to' in p).map((p) => {
          const t = (p as { to: readonly [number, number] }).to;
          return (
            <path
              key={p.k}
              className="g-rub"
              d={`M${p.x + (p.x < 0 ? 0.04 : -0.04)} ${p.y + 0.03}L${t[0]} ${t[1]}`}
            />
          );
        })}
      </svg>

      <Construction />
      <ScaleLabels marks={MARKS.map((m) => m.y)} />
      <span className="g-label g-label-d" style={{ '--x': 0, '--y': 0.6 } as V}>
        <i>d</i> = the iris
      </span>

      <span className="fig-no">
        <i>Fig.</i> 1.
      </span>
      {PARTS.map((p) => (
        <span
          key={p.k}
          className="fig-letter"
          style={{ '--x': p.x, '--y': p.y } as V}
          aria-hidden="true"
        >
          {p.k}
        </span>
      ))}

      <ol className="studies-labels" aria-label="The engine's passes, from scribble to plate">
        {STUDIES.map((s, i) => (
          <li key={s}>
            <span className="roman">{['I', 'II', 'III', 'IV'][i]}.</span> {s}
          </li>
        ))}
      </ol>

      <KeyFit />
      <Neatline />
      <Notes />
    </div>
  );
}
