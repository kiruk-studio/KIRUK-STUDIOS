import type { InkPoint } from '../types';
import { PAGE_SIZE } from '../types';

export interface InkCaptureHandle {
  readonly cancel: () => void;
  readonly finish: () => InkPoint[];
  readonly points: () => readonly InkPoint[];
}

export function samplePointer(
  e: PointerEvent,
  rect: DOMRect,
  scaleX: number,
  scaleY: number,
): InkPoint {
  const x = ((e.clientX - rect.left) / rect.width) * scaleX;
  const y = ((e.clientY - rect.top) / rect.height) * scaleY;
  const p = e.pointerType === 'mouse' ? 0.5 : e.pressure > 0 ? e.pressure : 0.5;
  return { x, y, p, t: e.timeStamp };
}

export function samplePointerEvent(
  e: PointerEvent,
  rect: DOMRect,
  size: { width: number; height: number },
): InkPoint[] {
  const coalesced =
    e.isTrusted && typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
  const events = coalesced.length > 0 ? coalesced : [e];
  return events.map((ev) => samplePointer(ev, rect, size.width, size.height));
}

/** Touch is always palm-rejected. Pen-only also ignores mouse. */
export function shouldAcceptPointer(e: PointerEvent, penOnly: boolean): boolean {
  if (e.pointerType === 'touch') return false;
  if (penOnly) return e.pointerType === 'pen';
  return e.pointerType === 'pen' || e.pointerType === 'mouse';
}

/**
 * Capture one stroke in page coordinates. Uses coalesced pointer events so a
 * 240 Hz tablet does not drop samples.
 */
export function captureInkStroke(
  canvas: HTMLCanvasElement,
  down: PointerEvent,
  onChange?: () => void,
  size = PAGE_SIZE,
): InkCaptureHandle {
  const rect = () => canvas.getBoundingClientRect();
  const points: InkPoint[] = samplePointerEvent(down, rect(), size);
  const pointerId = down.pointerId;

  const onMove = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    points.push(...samplePointerEvent(event, rect(), size));
    onChange?.();
  };

  canvas.addEventListener('pointermove', onMove, { passive: false });
  try {
    canvas.setPointerCapture(pointerId);
  } catch {
    // Synthetic pointers in tests may reject capture.
  }

  const detach = (): void => {
    canvas.removeEventListener('pointermove', onMove);
    try {
      canvas.releasePointerCapture(pointerId);
    } catch {
      // Already released.
    }
  };

  return {
    cancel: detach,
    finish: () => {
      detach();
      return points;
    },
    points: () => points,
  };
}
