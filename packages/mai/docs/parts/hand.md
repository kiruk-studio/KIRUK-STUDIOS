# The hand

**Module:** `src/hand/hand.ts` (`perform`) · **Calculus:** bench 1 · **Checks:** `style.tremor`, `style.ends`, `connect.landing`, `style.width` · **Ledger:** MA-2, MA-11, MA-27

A plotter draws the path. A hand performs it: it lands, runs and leaves; it slows into every bend; it trembles; it drifts on long fast runs; it lifts when the line outruns its reach; and it leaves the paper in one of a few ways (a taper, a hook, a stop). Every visible quirk of a mai line starts here, and every one is a number.

## The calculation

| Quantity  | Formula                                                                                                                                  | Notes                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Peak      | `v̂ = pace · ROLE_PACE[role] · (1 − 0.35·precision) · U(0.9, 1.1)`                                                                        | pace 140 mm/s (codex, architect), 160 (construction), 120 (night); precision 0.45 free, 0.85 guided                                      |
| Envelope  | `E(s) = v̂ · [v_in + (1 − v_in)·up(s)] · [v_out + (1 − v_out)·down(s)]`                                                                   | v_in: dip 0.12, touch 0.30, carry 0.75; v_out: stop 0.04, lift 0.30, hook 0.35, taper 0.70; smoothstep ramps                             |
| Power law | `v(s) = max(2, min(E(s), K·κ(s)^(−1/3)))`, `K = 0.27·v̂`                                                                                  | free strokes only; the two-thirds power law of human movement                                                                            |
| Curvature | `κ = turning between the chords before and after the point / chord length`                                                               | chords up to 1.5 mm (L/12 on short strokes, min 0.4 mm): a curve handed over as a polyline is read as a curve (MA-27)                    |
| Time      | `t(s) = ∫ dσ / v(σ)`                                                                                                                     | time is spent where the speed is low                                                                                                     |
| Tremor    | `δ(t) = a·[0.62 sin 2πf₁t + 0.28 sin 2πf₂t + 0.25·n(38t)]` across the line                                                               | a = 0.024 mm × (1.15 − 0.5·precision), ×0.18 on a ruler, 0 exact; f₁ ∈ [8.5, 11.5] Hz, f₂ = f₁ × [1.31, 1.47]                            |
| Drift     | `d(s) = min(0.65, 0.006·L·(0.55 + 0.45·v̄/120))·(1 − 0.6·precision)·n(s/λ)·envelope(u)`                                                   | free strokes only; speed costs accuracy                                                                                                  |
| Pressure  | `p = base · rampIn · rampOut · breath · pull · slow · light`                                                                             | base from `ROLE_PRESSURE` (contour 0.62, hatch 0.48, letter 0.55, construction 0.30); breath ±11%; the pull favours the hand's direction |
| Lifts     | a free or ruled line longer than `1.15 × reach` is drawn in pieces (contour, hatch and the drawing roles; never a burin or a ruling pen) | reach 42 mm (×1.8 against a ruler); each piece lands where the last lifted                                                               |
| Landing   | an anchored stroke lands `±land·(1.2 − 0.6·precision)` short or past its mark                                                            | land 0.12 mm                                                                                                                             |
| Hooks     | a landing hook by role: contour 0.5, letter 0.6, hatch 0.1, overlay 0                                                                    | MA-2: one hook on every hatch read as a fish                                                                                             |

Every number is drawn from the stroke's own rng, forked from the plate seed by the mark's id, so adding a stroke never re-rolls its neighbours.

## Driving it

- `p.stroke(path, { role, guide, pressure, pace, precision, start, end, anchored, overshoot, bow, weight })`. The role sets the pace, the pressure and the hook; override only with a reason.
- `guide: 'free'` is the hand; `'ruler'` keeps a hair of tilt and offset and splits outlines at corners over 25° (MA-11); `'compass'` keeps the leg's jitter; `'exact'` is the overlay: no tremor, no law, a steady feed.
- A plate with `trace: true` keeps each stroke's numbers on `mark.trace`: s, t, x, y, v, κ, p, w, load per sample, the law's gain K and the peak.

## What the critic reads

- `style.tremor`: the median tremor left on free strokes, inside the style's envelope.
- `style.ends`: ≥ 70% of strokes enter and leave like a pen, tapered or pooled at their ends.
- `connect.landing`: joined contours land within 0.02–0.35 mm (median), never more than 1.2 mm off.
- `style.width`: width CV inside the style's envelope; a width that does not breathe is a plotter.

## What the numbers say on a real plate

On Plate III the bend sets the speed in about 45% of free samples: 81% of contour samples and 75% of letters, but under 10% of hatching, which is straight flicks held by the land-run-leave envelope. The calculus page plots every free sample of the plate against the law.

## Sources

- Research: `ideas/kiruk-codex/research/01-leonardo.md` §1 (stroke anatomy, hooks, the left hand)
- Code: `src/hand/hand.ts`; tests `test/engine.test.ts` (the hand), `test/outer.test.ts` (MA-27, the trace)
- Ledger: MA-2, MA-11, MA-27 in [`../ledger.md`](../ledger.md)
