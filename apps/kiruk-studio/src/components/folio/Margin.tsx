'use client';
/**
 * The margin — the page written as a function, UI = f(W, s), live.
 * After Shu Ding's "The Calculus of Interfaces": breakpoints found exactly,
 * the page's own wireframe redrawn from f at any width, steps softened into
 * σ(a / sτ) so layout changes glide without a written tween, a spring plotted
 * with its derivative while it moves, and rules proven for every width.
 *
 * spec-link: ideas/studio-dawn/folio.md — the margin
 */
import { useMemo, useRef, useState } from 'react';
import { at, breakpoints, derivativeAt, K, prove, RULES } from './calc/fn';
import { sigma } from './calc/spring';
import { FIT_BEND, scaleFor } from './plates/desirable-geom';
import { useFolio } from './store';
import { DESIRABLE } from './truth';

const PW = 248; // plot width, px
const f1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);
const xOfW = (W: number) => ((W - K.W_MIN) / (K.W_MAX - K.W_MIN)) * PW;
const WofX = (x: number) => K.W_MIN + (Math.max(0, Math.min(PW, x)) / PW) * (K.W_MAX - K.W_MIN);

function polyline(fn: (W: number) => number, lo: number, hi: number, h: number, step = 4) {
  const pts: string[] = [];
  for (let x = 0; x <= PW; x += step) {
    const v = fn(WofX(x));
    pts.push(`${x.toFixed(1)},${(h - ((v - lo) / (hi - lo)) * h).toFixed(1)}`);
  }
  return pts.join(' ');
}

function Wireframe({ W, tau }: { W: number; tau: number }) {
  const L = at(W, tau);
  const s = PW / Math.max(W, 1);
  const vh = 900 * s;
  const left = ((W - L.container) / 2 + L.pad) * s;
  const main = L.main * s;
  const heroH = (main * 760) / 1200 + 120 * s;
  const railX = left + main + K.RAIL_GAP * s;
  const colW = (main - (L.cols - 1) * K.NOTE_GAP * s) / Math.max(1, L.cols);
  const notesY = 34 * s + heroH;
  return (
    <svg
      className="m-wire"
      width={PW}
      height={Math.min(150, vh)}
      viewBox={`0 0 ${PW} ${Math.min(150, vh)}`}
      aria-hidden="true"
    >
      <rect x={0.5} y={0.5} width={PW - 1} height={Math.min(150, vh) - 1} className="m-frame" />
      <path
        className="m-lid"
        d={`M0 0H${PW}V${72 * s}Q${PW / 2} ${(2 * 12 - 72) * s} 0 ${72 * s}Z`}
      />
      <rect x={left} y={34 * s} width={main} height={heroH} className="m-block" />
      <rect x={left} y={notesY + 8 * s} width={main} height={60 * s} className="m-block m-soft" />
      {Array.from({ length: Math.round(L.cols) }, (_, i) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: static columns built once from the layout, never reordered
          key={i}
          x={left + i * (colW + K.NOTE_GAP * s)}
          y={notesY + 8 * s}
          width={colW}
          height={60 * s}
          className="m-col"
        />
      ))}
      <rect
        x={railX}
        y={84 * s}
        width={K.RAIL_W * s}
        height={vh}
        className="m-rail"
        opacity={L.rail}
      />
    </svg>
  );
}

export function Margin() {
  const W = useFolio((s) => s.W);
  const H = useFolio((s) => s.H);
  const progress = useFolio((s) => s.progress);
  const velocity = useFolio((s) => s.velocity);
  const transmit = useFolio((s) => s.transmit);
  const trace = useFolio((s) => s.transmitTrace);
  const tableW = useFolio((s) => s.tableW);
  const glass = useFolio((s) => s.glass);
  const backend = useFolio((s) => s.backend);
  const hic = useFolio((s) => s.htmlInCanvas);
  const dpr = useFolio((s) => s.dpr);
  const frameMs = useFolio((s) => s.frameMs);

  const [probe, setProbe] = useState<number | null>(null);
  const [tau, setTau] = useState(0.35);
  const rulerRef = useRef<SVGSVGElement>(null);

  const bps = useMemo(() => breakpoints(), []);
  const ticks = useMemo(() => {
    const m = new Map<number, { W: number; jump: boolean; tags: string[] }>();
    for (const b of bps) {
      const k = Math.round(b.W);
      const e = m.get(k) ?? { W: b.W, jump: false, tags: [] };
      e.jump ||= b.kind === 'jump';
      e.tags.push(b.tag);
      m.set(k, e);
    }
    return [...m.values()];
  }, [bps]);
  const proofs = useMemo(() => RULES.map((r) => ({ ...r, p: prove(r.g) })), []);

  const Wp = probe ?? W;
  const L = at(W);
  const dL = derivativeAt(W);
  const piece = (() => {
    const xs = [K.W_MIN, ...ticks.map((t) => t.W), K.W_MAX];
    for (let i = 0; i < xs.length - 1; i++)
      if (W >= xs[i]! && W < xs[i + 1]!) return [i + 1, xs.length - 1, xs[i]!, xs[i + 1]!] as const;
    return [xs.length - 1, xs.length - 1, xs[xs.length - 2]!, K.W_MAX] as const;
  })();

  const drag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === 'pointerdown') (e.currentTarget as Element).setPointerCapture(e.pointerId);
    else if (!(e.buttons & 1)) return;
    const r = rulerRef.current!.getBoundingClientRect();
    setProbe(Math.round(WofX(e.clientX - r.left)));
  };

  // f(W) = the name's height: kinks where the sheet changes, jumps where the margin opens.
  const ascLo = 60;
  const ascHi = 300;
  const kLo = 2;
  const kHi = 3.8;
  const vmax = Math.max(400, ...velocity.map(Math.abs));

  return (
    <aside className="margin" aria-label="Marginalia: the page as a function">
      <p className="m-title">Marginalia</p>
      <p className="m-eq">UI = f(W, s)</p>
      <dl className="m-read">
        <div>
          <dt>W</dt>
          <dd>{W} px</dd>
        </div>
        <div>
          <dt>H</dt>
          <dd>{H} px</dd>
        </div>
        <div>
          <dt>s</dt>
          <dd>{progress.toFixed(3)}</dd>
        </div>
        <div>
          <dt>piece</dt>
          <dd>
            {piece[0]} of {piece[1]}
          </dd>
        </div>
      </dl>

      <section className="m-sec">
        <h3>Breakpoints</h3>
        <p className="m-note">
          Where f jumps (a step flips) or bends (a ReLU turns). Found exactly, by bisection. Drag to
          probe a width.
        </p>
        <svg
          ref={rulerRef}
          className="m-ruler"
          width={PW}
          height={34}
          viewBox={`0 0 ${PW} 34`}
          onPointerDown={drag}
          onPointerMove={drag}
          onDoubleClick={() => setProbe(null)}
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: a scrubbable width with its own pointer and key handling
          role="slider"
          aria-label="Probe width"
          aria-valuemin={K.W_MIN}
          aria-valuemax={K.W_MAX}
          aria-valuenow={Wp}
          aria-valuetext={`probe at ${Wp} pixels`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') setProbe(Math.min(K.W_MAX, Wp + (e.shiftKey ? 50 : 10)));
            if (e.key === 'ArrowLeft') setProbe(Math.max(K.W_MIN, Wp - (e.shiftKey ? 50 : 10)));
            if (e.key === 'Home' || e.key === 'Escape') setProbe(null);
          }}
        >
          <path className="m-axis" d={`M0 22.5H${PW}`} />
          {ticks.map((t) => (
            <path
              key={t.W}
              className={t.jump ? 'm-jump' : 'm-bend'}
              d={`M${xOfW(t.W).toFixed(1)} ${t.jump ? 12 : 16}V22.5`}
            >
              <title>{`${f1(t.W)} px — ${t.tags.join(', ')}`}</title>
            </path>
          ))}
          <path className="m-now" d={`M${xOfW(W)} 24l-4 7h8z`} />
          <path className="m-probe" d={`M${xOfW(Wp).toFixed(1)} 2V30`} />
          <text className="m-tiny" x={0} y={8}>
            320
          </text>
          <text className="m-tiny" x={PW} y={8} textAnchor="end">
            2560
          </text>
        </svg>
        <Wireframe W={Wp} tau={tau} />
        <p className="m-note">
          The page at W = <b>{Wp}</b> px, softened at τ = {tau.toFixed(2)}: {at(Wp).cols} note
          column{at(Wp).cols > 1 ? 's' : ''}
          {at(Wp).rail ? ', margin open' : ''}.
        </p>
        <label className="m-tau">
          <span>τ</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={tau}
            onChange={(e) => setTau(Number(e.target.value))}
            aria-label="Softening temperature"
          />
          <svg width={64} height={26} viewBox="0 0 64 26" aria-hidden="true">
            <polyline
              className="m-curve"
              points={Array.from(
                { length: 33 },
                (_, i) =>
                  `${i * 2},${(24 - 22 * (tau < 0.01 ? (i >= 16 ? 1 : 0) : sigma((i - 16) / (tau * 6)))).toFixed(1)}`,
              ).join(' ')}
            />
          </svg>
        </label>
        <p className="m-note">
          Every step 1[a ≥ 0] becomes σ(a / sτ). As τ → 0 the glide shortens to the jump the CSS
          draws; the softened f is the animation.
        </p>
      </section>

      <section className="m-sec">
        <h3>The name, h(W)</h3>
        <svg className="m-plot" width={PW} height={70} viewBox={`0 0 ${PW} 70`} aria-hidden="true">
          <polyline
            className="m-curve m-soft"
            points={polyline((w) => at(w, tau).heroAsc, ascLo, ascHi, 64)}
          />
          <polyline
            className="m-curve"
            points={polyline((w) => at(w).heroAsc, ascLo, ascHi, 64, 2)}
          />
          <circle
            className="m-dot"
            cx={xOfW(W)}
            cy={64 - ((L.heroAsc - ascLo) / (ascHi - ascLo)) * 64}
            r={3}
          />
        </svg>
        <p className="m-note">
          h = {f1(L.heroAsc)} px, ∂h/∂W = {dL.heroAsc.d.toFixed(3)}. Main column ∂main/∂W ={' '}
          {dL.main.d.toFixed(2)}.
        </p>
      </section>

      <section className="m-sec">
        <h3>Hold to the light</h3>
        <svg className="m-plot" width={PW} height={58} viewBox={`0 0 ${PW} 58`} aria-hidden="true">
          <path className="m-axis" d={`M0 29.5H${PW}`} />
          <polyline
            className="m-curve"
            points={trace
              .map((p) => `${Math.min(PW, p.t * 300).toFixed(1)},${(52 - p.x * 46).toFixed(1)}`)
              .join(' ')}
          />
          <polyline
            className="m-curve m-rub"
            points={trace
              .map((p) => `${Math.min(PW, p.t * 300).toFixed(1)},${(29 - p.v * 6.5).toFixed(1)}`)
              .join(' ')}
          />
        </svg>
        <p className="m-note">
          x(t) = T + (A + Bt)e<sup>−ωt</sup>, critically damped (ω = 9): no overshoot. Ink:
          position. Red: its derivative v(t). Now x = {transmit.toFixed(3)}. Hold <kbd>L</kbd>.
        </p>
      </section>

      <section className="m-sec">
        <h3>Plate II, the table</h3>
        <svg className="m-plot" width={PW} height={50} viewBox={`0 0 ${PW} 50`} aria-hidden="true">
          <polyline
            className="m-curve"
            points={Array.from({ length: 63 }, (_, i) => {
              const w =
                DESIRABLE.width.min + (i / 62) * (DESIRABLE.width.max - DESIRABLE.width.min);
              return `${(i * PW) / 62},${(46 - ((scaleFor(w, true) - kLo) / (kHi - kLo)) * 42).toFixed(1)}`;
            }).join(' ')}
          />
          <path
            className="m-bend"
            d={`M${(((FIT_BEND - DESIRABLE.width.min) / (DESIRABLE.width.max - DESIRABLE.width.min)) * PW).toFixed(1)} 0V50`}
          />
          {glass && (
            <path
              className="m-jump"
              d={`M${(((DESIRABLE.glassLimit - DESIRABLE.width.min) / (DESIRABLE.width.max - DESIRABLE.width.min)) * PW).toFixed(1)} 0V50`}
            />
          )}
          <circle
            className="m-dot"
            cx={((tableW - DESIRABLE.width.min) / (DESIRABLE.width.max - DESIRABLE.width.min)) * PW}
            cy={46 - ((scaleFor(tableW, true) - kLo) / (kHi - kLo)) * 42}
            r={3}
          />
        </svg>
        <p className="m-note">
          W = {tableW} cm. Far leg x = W − {DESIRABLE.inset(DESIRABLE.leg)}, so ∂x/∂W = 1: legs ride
          the edge, the top stretches. Scale k(W) bends at {Math.round(FIT_BEND)} cm, where the
          drawing starts to fit itself.
          {glass ? ` Glass: 1[W > ${DESIRABLE.glassLimit}] — the rule jumps.` : ''}
        </p>
      </section>

      <section className="m-sec">
        <h3>Proven for every width</h3>
        <ul className="m-proofs">
          {proofs.map((r) => (
            <li key={r.id} data-verdict={r.p.verdict}>
              <span className="m-stamp">{r.p.verdict === 'proven' ? 'Q.E.D.' : r.p.verdict}</span>
              {r.text}, ∀W ∈ [320, 2560] <span className="m-tiny">· {r.p.boxes} boxes</span>
            </li>
          ))}
        </ul>
        <p className="m-note">
          Interval arithmetic bounds each rule over a whole range of widths at once; boxes that
          straddle are split until they settle.
        </p>
      </section>

      <section className="m-sec">
        <h3>Reading</h3>
        <svg className="m-plot" width={PW} height={34} viewBox={`0 0 ${PW} 34`} aria-hidden="true">
          <path className="m-axis" d={`M0 17.5H${PW}`} />
          <polyline
            className="m-curve"
            points={velocity
              .map((v, i) => `${((i / 89) * PW).toFixed(1)},${(17 - (v / vmax) * 15).toFixed(1)}`)
              .join(' ')}
          />
          <rect className="m-progress" x={0} y={31} width={progress * PW} height={2} />
        </svg>
        <p className="m-note">ds/dt, the last ninety frames. The rule underneath is s.</p>
      </section>

      <section className="m-sec m-inst">
        <h3>Instrument</h3>
        <p className="m-note">
          Paper:{' '}
          {backend === 'pending'
            ? 'warming'
            : backend === 'css'
              ? 'CSS (no GPU)'
              : backend === 'webgpu'
                ? 'WebGPU'
                : 'WebGL 2'}
          {backend !== 'css' && backend !== 'pending'
            ? ` · ${frameMs} ms a frame · dpr ${dpr}`
            : ''}
          . HTML-in-Canvas:{' '}
          {hic
            ? 'on — move over Plate I and its claim wets into the paper'
            : 'off (Chrome origin trial 148–150, or chrome://flags/#canvas-draw-element)'}
          .
        </p>
      </section>
    </aside>
  );
}
