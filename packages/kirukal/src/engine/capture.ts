/**
 * Pen capture — the reason the forge exists.
 *
 * Records the full pointer stream from a graphics tablet: position, pressure,
 * tilt. Every existing hand-drawn UI library (rough.js, Wired Elements,
 * Sketchbook UI) fakes the hand with a randomizer. Pressure and taper are the
 * half that cannot be faked, because they are the record of a hand slowing down,
 * leaning and lifting — so we keep the samples rather than an exported image.
 *
 * `getCoalescedEvents()` is not optional. Browsers deliver one `pointermove` per
 * animation frame, but a 240 Hz tablet produced roughly four samples in that
 * time; without coalesced events about three quarters of the pen data is dropped
 * and the line goes visibly polygonal on fast strokes.
 */
import type { DeviceInfo, Sample, Stroke, StrokeRole } from './types';

export interface CaptureHandle {
  /** Stop listening and return the captured stroke. */
  readonly finish: () => Stroke;
  /** Abandon the stroke and detach listeners. */
  readonly cancel: () => void;
  /** What the pointer actually reported — used to warn on a mouse-drawn mark. */
  readonly device: () => DeviceInfo;
}

function toSample(e: PointerEvent, rect: DOMRect): Sample {
  return [
    e.clientX - rect.left,
    e.clientY - rect.top,
    // Chrome reports 0 pressure for mouse and, briefly, for pen at contact.
    // 0.5 is the neutral default rather than a dropout.
    e.pressure > 0 ? e.pressure : 0.5,
    e.tiltX ?? 0,
    e.tiltY ?? 0,
  ];
}

/**
 * Begin capturing one stroke on `surface`, starting from `down`.
 *
 * Call from a `pointerdown` handler. The surface should carry
 * `touch-action: none` so the browser does not steal the gesture for scrolling.
 */
export function captureStroke(
  surface: HTMLElement,
  down: PointerEvent,
  role: StrokeRole = 'body',
): CaptureHandle {
  const rect = surface.getBoundingClientRect();
  const samples: Sample[] = [toSample(down, rect)];
  const pointerId = down.pointerId;

  let hasTilt = (down.tiltX ?? 0) !== 0 || (down.tiltY ?? 0) !== 0;
  const pointerType = (down.pointerType || 'mouse') as DeviceInfo['pointerType'];

  const onMove = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    // The coalesced list holds every sample since the last frame. Falling back to
    // the event itself keeps this working where the API is unavailable.
    const batch = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    for (const c of batch.length > 0 ? batch : [e]) {
      if ((c.tiltX ?? 0) !== 0 || (c.tiltY ?? 0) !== 0) hasTilt = true;
      samples.push(toSample(c, rect));
    }
  };

  surface.addEventListener('pointermove', onMove);
  try {
    surface.setPointerCapture(pointerId);
  } catch {
    // Synthetic pointers (and some test environments) reject capture. Losing
    // capture only costs us samples outside the element, so carry on.
  }

  const detach = (): void => {
    surface.removeEventListener('pointermove', onMove);
    try {
      surface.releasePointerCapture(pointerId);
    } catch {
      // Already released, or capture was never granted.
    }
  };

  return {
    finish: () => {
      detach();
      return { role, samples };
    },
    cancel: detach,
    device: () => ({ pointerType, hasTilt }),
  };
}
