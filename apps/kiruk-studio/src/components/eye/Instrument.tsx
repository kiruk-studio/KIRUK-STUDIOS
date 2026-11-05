'use client';
/**
 * The instrument — the calculus of the eye, set like a map's legend.
 *
 * Each motion on the plate is a function of time, plotted with its derivative
 * as it happens: the gaze on a critically damped spring, the pupil's light
 * reflex (closing faster than it opens), the lid through a blink. Ink is the
 * quantity, red its rate. Figures are EB Garamond in tabular old-style numerals;
 * scales are drawn like a cartographer's, alternate blocks filled.
 *
 * spec-link: ideas/studio-dawn/eye.md — the instrument
 */
import { BLINK } from '@kiruk/burin/motion';
import { drawnScale, EYE, GLOBE, IRIS_MM, MM_PER_LIGNE, UNITS, type Unit } from '@kiruk/burin/rig';
import { DAWN } from './dawn';
import { actions, type HandMedium, type Trace, useEye } from './store';

const PW = 236;
const PH = 54;

const UNIT_NAME: Record<Unit, string> = { d: 'd', mm: 'mm', px: 'px', ligne: 'lignes' };
const WIRE_NEXT = (w: number) => (w === 0.3 ? 1 : w === 1 ? 0 : 0.3);
const WIRE_NAME = (w: number) => (w === 0 ? 'hidden' : w === 1 ? 'full' : 'faint');
const toDeg = (r: number) => Math.round((r * 180) / Math.PI);

const sgn = (v: number, dp = 2) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(dp)}`;

/** The hand's media, in the order a colourist works: under the cut, then over the print. */
const MEDIA: { key: HandMedium | 'iris'; name: string; what: string }[] = [
  { key: 'chalk', name: 'red chalk', what: 'the underdrawing' },
  { key: 'wash', name: 'bistre', what: 'the shade, in washes' },
  { key: 'iris', name: 'the iris', what: 'its colour' },
  { key: 'body', name: 'lead white', what: 'where the light falls' },
  { key: 'ink', name: 'the quill', what: 'hatching in the deepest shade' },
];

function Chart({
  tr,
  lo,
  hi,
  vlo,
  vhi,
  label,
}: {
  tr: Trace;
  lo: number;
  hi: number;
  vlo: number;
  vhi: number;
  label: string;
}) {
  const t1 = tr.t[tr.t.length - 1] ?? 0;
  const X = (t: number) => PW - ((t1 - t) / 3) * PW;
  const Y = (v: number) => PH - 6 - ((v - lo) / (hi - lo)) * (PH - 12);
  const YV = (v: number) => PH - 6 - ((v - vlo) / (vhi - vlo)) * (PH - 12);
  const pts = (f: (i: number) => number) =>
    tr.t.map((t, i) => `${X(t).toFixed(1)},${f(i).toFixed(1)}`).join(' ');
  const last = tr.x.length - 1;
  return (
    <svg
      className="ins-chart"
      width={PW}
      height={PH + 10}
      viewBox={`0 0 ${PW} ${PH + 10}`}
      role="img"
      aria-label={label}
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <path key={f} className="ins-grat" d={`M0 ${(PH * f).toFixed(1)}H${PW}`} />
      ))}
      {[1, 2].map((s) => (
        <path key={s} className="ins-grat" d={`M${(PW * s) / 3} 0V${PH}`} />
      ))}
      <path className="ins-frame" d={`M0.5 0.5H${PW - 0.5}V${PH - 0.5}H0.5Z`} />
      {/* a cartographer's scale: three seconds, alternate seconds filled */}
      {[0, 1, 2].map((s) => (
        <rect
          key={s}
          className={s % 2 ? 'ins-bar ins-bar-open' : 'ins-bar'}
          x={(PW * s) / 3 + 0.5}
          y={PH + 3}
          width={PW / 3 - 1}
          height={4}
        />
      ))}
      {tr.t.length > 1 && (
        <>
          <polyline className="ins-v" points={pts((i) => YV(tr.v[i] ?? 0))} />
          <polyline className="ins-x" points={pts((i) => Y(tr.x[i] ?? 0))} />
          <circle className="ins-dot" cx={PW} cy={Y(tr.x[last] ?? 0)} r={2.6} />
        </>
      )}
    </svg>
  );
}

export function Instrument() {
  const backend = useEye((s) => s.backend);
  const plate = useEye((s) => s.plate);
  const ms = useEye((s) => s.ms);
  const fps = useEye((s) => s.fps);
  const dpr = useEye((s) => s.dpr);
  const gx = useEye((s) => s.gx);
  const gy = useEye((s) => s.gy);
  const gazeV = useEye((s) => s.gazeV);
  const pupil = useEye((s) => s.pupil);
  const open = useEye((s) => s.open);
  const light = useEye((s) => s.light);
  const S = useEye((s) => s.S);
  const gaze = useEye((s) => s.gaze);
  const pupilT = useEye((s) => s.pupilT);
  const lid = useEye((s) => s.lid);
  const wetT = useEye((s) => s.wetT);
  const wet = useEye((s) => s.wet);
  const stain = useEye((s) => s.stain);
  const bleeding = useEye((s) => s.bleeding);
  const dawn = useEye((s) => s.dawn);
  const dawnTarget = useEye((s) => s.dawnTarget);
  const unit = useEye((s) => s.unit);
  const calipers = useEye((s) => s.calipers);
  const wireTarget = useEye((s) => s.wireTarget);
  const sunAz = useEye((s) => s.sunAz);
  const sunEl = useEye((s) => s.sunEl);
  const making = useEye((s) => s.making);
  const make = useEye((s) => s.make);
  const handMake = useEye((s) => s.handMake);
  const hand = useEye((s) => s.hand);

  const engine =
    backend === 'pending'
      ? 'warming the plate'
      : backend === 'css'
        ? 'printed plate (no GPU)'
        : backend === 'webgpu'
          ? 'WebGPU'
          : 'WebGL 2';
  const irisPx = 2 * EYE.iris.R * S;

  return (
    <aside className="instrument" aria-label="Instrument: the eye as a function of time">
      <header className="ins-head">
        <p className="ins-kicker">Instrument</p>
        <h2 className="ins-title">The eye, in time</h2>
        <p className="ins-eq">
          <i>x</i>(<i>t</i>) = <i>T</i> + (<i>A</i> + <i>Bt</i>) <i>e</i>
          <sup>
            −ω<i>t</i>
          </sup>
        </p>
      </header>

      <section className="ins-sec">
        <h3>
          <span className="sc">i.</span> Gaze
        </h3>
        <Chart
          tr={gaze}
          lo={-1}
          hi={1}
          vlo={-8}
          vhi={8}
          label="Horizontal gaze and its rate over the last three seconds"
        />
        <dl className="ins-read">
          <dt>g</dt>
          <dd>
            ({sgn(gx)}, {sgn(gy)})
          </dd>
          <dt>|ġ|</dt>
          <dd>{gazeV.toFixed(2)} /s</dd>
        </dl>
        <p className="ins-note">
          It follows the pointer on a critically damped spring, ω = 11: no overshoot. At rest it
          makes small saccades, as eyes do.
        </p>
      </section>

      <section className="ins-sec">
        <h3>
          <span className="sc">ii.</span> Pupil
        </h3>
        <Chart
          tr={pupilT}
          lo={0.15}
          hi={0.55}
          vlo={-1.6}
          vhi={1.6}
          label="Pupil size and its rate"
        />
        <dl className="ins-read">
          <dt>p</dt>
          <dd>{(pupil * 100).toFixed(0)}% of the iris</dd>
        </dl>
        <p className="ins-note">
          Light reflex: τ = 0.14 s closing, 0.60 s opening — the pupil shuts faster than it
          recovers.{' '}
          <button
            type="button"
            className="ins-btn"
            data-hold-light=""
            aria-pressed="false"
            onPointerDown={() => actions.hold(true)}
            onPointerUp={() => actions.hold(false)}
            onPointerLeave={() => actions.hold(false)}
          >
            Hold to the light
          </button>{' '}
          <kbd>L</kbd>
        </p>
      </section>

      <section className="ins-sec">
        <h3>
          <span className="sc">iii.</span> Lid
        </h3>
        <Chart
          tr={lid}
          lo={0}
          hi={1}
          vlo={-25}
          vhi={12}
          label="Lid aperture and its rate through a blink"
        />
        <dl className="ins-read">
          <dt>a</dt>
          <dd>{open.toFixed(2)}</dd>
        </dl>
        <p className="ins-note">
          A blink closes in {BLINK.close * 1000} ms and opens in {BLINK.open * 1000} ms.{' '}
          <button type="button" className="ins-btn" onClick={() => actions.blink()}>
            Blink
          </button>{' '}
          <kbd>B</kbd>
        </p>
      </section>

      <section className="ins-sec">
        <h3>
          <span className="sc">iv.</span> Dawn
        </h3>
        <fieldset className="ins-dawn">
          <legend className="vh">Paper: old or new</legend>
          {[DAWN.old, DAWN.new].map((d, i) => (
            <button
              key={d.key}
              type="button"
              aria-pressed={dawnTarget === i}
              onClick={() => actions.setDawn(i as 0 | 1)}
            >
              <span className="ins-swatch" style={{ background: d.hex }} aria-hidden="true" />
              <span className="ins-dawn-name">{d.name}</span>
              <span className="ins-dawn-hex">
                {d.key} · {d.hex}
              </span>
            </button>
          ))}
        </fieldset>
        <p className="ins-note">
          <i>{dawnTarget ? DAWN.new.tagline : DAWN.old.tagline}</i>{' '}
          {dawnTarget ? DAWN.new.meaning : DAWN.old.meaning} The papers cross on a spring, <i>d</i>{' '}
          = {dawn.toFixed(2)}. <kbd>D</kbd>
        </p>
      </section>

      <section className="ins-sec">
        <h3>
          <span className="sc">v.</span> Ink
        </h3>
        <Chart
          tr={wetT}
          lo={0}
          hi={1}
          vlo={-3}
          vhi={3}
          label="How wet the sheet is, and how fast it dries"
        />
        <dl className="ins-read">
          <dt>w</dt>
          <dd>
            {bleeding
              ? `${(wet * 100).toFixed(0)}% wet · stain ${(stain * 100).toFixed(0)}%`
              : 'dry'}
          </dd>
        </dl>
        <p className="ins-note">
          Drag across the plate to wet it: the ink lifts off the lines, travels with the water along
          the fibres and dries darkest at its edge, then fades. Water leaves at <i>ẇ</i> = −0.55{' '}
          <i>w</i>; the stain at −0.06 <i>s</i>. Held to the light: {(light * 100).toFixed(0)}%.
        </p>
      </section>

      <section className="ins-sec">
        <h3>
          <span className="sc">vi.</span> Measure
        </h3>
        <fieldset className="ins-units">
          <legend className="vh">Unit</legend>
          {UNITS.map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => actions.setUnit(u)}
            >
              {UNIT_NAME[u]}
            </button>
          ))}
        </fieldset>
        <dl className="ins-read">
          <dt>1 d</dt>
          <dd>
            {IRIS_MM} mm · {(2 * EYE.iris.R * S).toFixed(0)} px ·{' '}
            {(IRIS_MM / MM_PER_LIGNE).toFixed(1)} l.
          </dd>
          <dt>Fig. 1</dt>
          <dd>drawn at {drawnScale(S).toFixed(2)} : 1</dd>
          <dt>axis</dt>
          <dd>
            yaw {sgn(toDeg(gx * GLOBE.yaw), 0)}°, pitch {sgn(toDeg(-gy * GLOBE.pitch), 0)}°
          </dd>
          <dt>light</dt>
          <dd>
            from {-sunAz}°, {sunEl}° above the sheet
          </dd>
        </dl>
        <p className="ins-note">
          <button
            type="button"
            className="ins-btn"
            aria-pressed={calipers}
            onClick={() => actions.calipers(!calipers)}
          >
            Calipers
          </button>{' '}
          <kbd>M</kbd>{' '}
          <button
            type="button"
            className="ins-btn"
            onClick={() => actions.setWire(WIRE_NEXT(wireTarget))}
          >
            Construction · {WIRE_NAME(wireTarget)}
          </button>{' '}
          <kbd>W</kbd>
        </p>
        <p className="ins-note">
          <button
            type="button"
            className="ins-btn"
            aria-pressed={making}
            onClick={() => actions.make()}
          >
            Make it again
          </button>{' '}
          <kbd>C</kbd> — the construction first, then each pass cut across the eye, as the studies
          below show them
          {making
            ? `: now ${
                make >= 5 && handMake < 3
                  ? handMake < 2
                    ? 'the washes'
                    : 'lead white and the quill'
                  : ['I', 'II', 'III', 'IV', 'the plate'][
                      Math.min(4, Math.max(0, Math.ceil(make) - 1))
                    ]
              }`
            : ''}
          .
        </p>
        <p className="ins-note">
          Drag between any two points to measure; the ends snap to the corners, the lids, the iris.
          With the calipers out (<kbd>M</kbd>) the snap shows before you press, and a drag measures
          over the type too. Shift-drag wets the paper. Lengths in d and mm hold; px and the drawn
          scale change with the page. <kbd>U</kbd> changes the unit; move the pointer and the light
          moves with it.
        </p>
      </section>

      <section className="ins-sec">
        <h3>
          <span className="sc">vii.</span> Hand
        </h3>
        <fieldset className="ins-units ins-media">
          <legend className="vh">The hand's media</legend>
          {MEDIA.map((m) => {
            const on = m.key === 'iris' ? hand.iris : hand.media[m.key];
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={hand.on && on}
                disabled={!hand.on}
                title={m.what}
                onClick={() => actions.toggleMedium(m.key)}
              >
                {m.name}
              </button>
            );
          })}
        </fieldset>
        <dl className="ins-read">
          <dt>№</dt>
          <dd>
            impression {hand.seed.toLocaleString('en')}
            {hand.state === 'painting'
              ? ' · the hand is at work'
              : hand.state === 'idle'
                ? ` · coloured in ${hand.ms} ms`
                : hand.state === 'none' || hand.state === 'failed'
                  ? ' · uncoloured (no WebGL 2 for the hand)'
                  : ''}
          </dd>
        </dl>
        <p className="ins-note">
          The plate prints the same every time; a colourist&rsquo;s hand never does. Red chalk went
          down before a line was cut. Bistre sinks into the paper&rsquo;s valleys and dries darkest
          at its rim; the chalk and the white catch only its peaks; the quill is starved on the
          tooth like the cut lines; wet it, and the washes run.{' '}
          <button
            type="button"
            className="ins-btn"
            aria-pressed={hand.on}
            onClick={() => actions.setHand(!hand.on)}
          >
            {hand.on ? 'Coloured by hand' : 'The plain print'}
          </button>{' '}
          <kbd>H</kbd>{' '}
          <button type="button" className="ins-btn" onClick={() => actions.impression()}>
            A new impression
          </button>{' '}
          <kbd>I</kbd>
        </p>
      </section>

      <section className="ins-sec ins-engine">
        <h3>
          <span className="sc">viii.</span> Engine
        </h3>
        <dl className="ins-read">
          <dt>burin</dt>
          <dd>{engine}</dd>
          <dt>frame</dt>
          <dd>
            {fps > 0
              ? `${ms.toFixed(2)} ms · ${fps} fps`
              : 'at rest — drawn only when something moves'}
          </dd>
          <dt>scale</dt>
          <dd>
            iris {irisPx.toFixed(0)} px · dpr {dpr}
          </dd>
          <dt>type</dt>
          <dd>{plate ? 'printed by HTML-in-Canvas' : 'set in the DOM'}</dd>
          <dt>hand</dt>
          <dd>
            {hand.via === 'worker'
              ? 'p5.brush in a worker (WebGL 2) → bitmaps → TSL'
              : hand.via === 'main'
                ? 'p5.brush on the page (WebGL 2) → bitmaps → TSL'
                : hand.state === 'starting' || hand.state === 'painting'
                  ? 'p5.brush, waking'
                  : 'none'}
          </dd>
        </dl>
      </section>
    </aside>
  );
}
