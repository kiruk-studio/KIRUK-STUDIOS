/**
 * The rest of the landing, kept light: ISM, Framework, Writing as an index,
 * then the colophon — the paper itself, held to the light, and contact.
 * Founder, 2026-11-04: landing only, no plate per project.
 *
 * spec-link: ideas/studio-dawn/folio.md — Plates III–V (index form)
 */
import Link from 'next/link';
import { Eye } from '../ink/logogram';
import { n } from '../ink/pen';
import { FRAMEWORK, ISMS, PAPER, STUDIO } from '../truth';

/** A small ruled study of a laid mould: close laid wires, wide chain wires, the eye sewn on. */
function Mould() {
  const w = 520;
  const h = 300;
  const laid = Array.from({ length: 34 }, (_, i) => 40 + i * 6.6);
  const chain = [70, 160, 250, 340, 430];
  return (
    <svg
      className="mould"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="A papermaker's mould: laid wires, chain wires and the kiruk eye as a watermark"
    >
      <g data-layer="construction" className="cons">
        <path d={`M14 ${h - 18}L${w - 14} 18`} />
      </g>
      <g data-layer="ink">
        <rect x={30} y={30} width={w - 60} height={h - 60} className="mould-frame" />
        <rect x={20} y={20} width={w - 40} height={h - 40} className="mould-deckle" />
        {laid.map((y) => (
          <path key={y} className="laid" d={`M30 ${n(y)}H${w - 30}`} />
        ))}
        {chain.map((x) => (
          <path key={x} className="chain" d={`M${x} 30V${h - 30}`} />
        ))}
        <Eye cx={w / 2 + 45} cy={h / 2} size={110} className="eye eye-wire" />
      </g>
      <g data-layer="line" className="p-line">
        <path className="rub" d={`M160 ${h - 12}H250`} vectorEffect="non-scaling-stroke" />
        <path
          className="rub"
          d={`M160 ${h - 18}V${h - 6}M250 ${h - 18}V${h - 6}`}
          vectorEffect="non-scaling-stroke"
        />
        <text className="lbl" x={205} y={h - 18} textAnchor="middle">
          chain = a column
        </text>
      </g>
    </svg>
  );
}

export function FolioIndex() {
  return (
    <>
      <section
        className="plate plate-index"
        id="plate-iii"
        data-plate="iii"
        aria-labelledby="plate-iii-title"
      >
        <header className="plate-head">
          <p className="plate-no">Plate III</p>
          <h2 id="plate-iii-title" className="plate-title">
            ISM — one idea a day, in ink
          </h2>
        </header>
        <p className="claim">
          Every ism is named, sketched and asked in the open. Inktober 2026, days 7–12.
        </p>
        <ol className="ism-list">
          {ISMS.map((ism) => (
            <li key={ism.name}>
              <span className="ism-cap" aria-hidden>
                {ism.cap}
              </span>
              <span className="ism-day">Day {ism.day}</span>
              <b className="ism-name">{ism.name}</b>
              <span className="ism-idea">{ism.idea}</span>
            </li>
          ))}
        </ol>
        <p className="index-more">
          <Link href="/ism">All isms →</Link>
        </p>
      </section>

      <section
        className="plate plate-index plate-split"
        id="plate-iv"
        data-plate="iv"
        aria-labelledby="plate-iv-title"
      >
        <div>
          <header className="plate-head">
            <p className="plate-no">Plate IV</p>
            <h2 id="plate-iv-title" className="plate-title">
              The kiruk framework
            </h2>
          </header>
          <p className="status-stamp">{FRAMEWORK.status}</p>
          <p className="notes-p">{FRAMEWORK.line}</p>
          <p className="index-more">
            <Link href="/framework">Follow the research →</Link>
          </p>
        </div>
        <div>
          <header className="plate-head">
            <p className="plate-no">Writing</p>
            <h2 className="plate-title">Still in ink</h2>
          </header>
          <p className="notes-p">
            The first deep article — the studio, its isms and how it ideates — is being written. It
            lands here when it is true.
          </p>
          <p className="index-more">
            <Link href="/writing">Writing →</Link>
          </p>
        </div>
      </section>

      <section
        className="plate plate-colophon"
        id="plate-v"
        data-plate="v"
        aria-labelledby="plate-v-title"
      >
        <header className="plate-head">
          <p className="plate-no">Plate V · Colophon</p>
          <h2 id="plate-v-title" className="plate-title">
            On this paper
          </h2>
        </header>
        <div className="colophon-grid">
          <figure data-codex="" className="plate-fig">
            <Mould />
            <figcaption>
              <p className="claim">
                This page is laid paper: its chain wires are the page’s columns, its laid wires run
                every {PAPER.laidPx} px ({PAPER.laidNote}), its watermark is {PAPER.watermark}.
              </p>
            </figcaption>
          </figure>
          <div className="colophon-text">
            <p className="notes-p">
              Paper in Leonardo’s time was formed on a mould — a frame strung with wires. Pulp
              settles thinner over every wire, so a sheet held to the light shows the wireframe it
              was made on. kiruk’s sheets are made the same way: the structure is in the paper, the
              drawing is on it.
            </p>
            <button
              type="button"
              className="hold-light needs-js"
              data-hold-light=""
              aria-pressed="false"
            >
              <span aria-hidden>☼</span> Hold the page to the light
            </button>
            <p className="hint needs-js">Press and hold — or press L.</p>
            <ul className="contact">
              <li>
                Write · <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>
              </li>
              <li>
                Read the process · <a href={STUDIO.github}>GitHub</a>
              </li>
              <li>
                Follow · <a href={STUDIO.instagram}>@kirukism</a>
              </li>
            </ul>
            <p className="colo">
              Set in IM Fell, Xanh Mono and JetBrains Mono. Drawn in code, inked on the GPU. kiruk ·{' '}
              {STUDIO.year}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
