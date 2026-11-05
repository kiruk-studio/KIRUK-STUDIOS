import type { DeviceInfo, Sample, Stroke, StrokeRole } from '@kiruk/kirukal';

export interface PenCaptureHandle {
  readonly cancel: () => void;
  readonly device: () => DeviceInfo;
  readonly finish: () => Stroke;
  readonly samples: () => readonly Sample[];
}

function toSample(canvas: HTMLCanvasElement, event: PointerEvent): Sample {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 1;
  const height = rect.height || 1;
  return [
    ((event.clientX - rect.left) / width) * canvas.width,
    ((event.clientY - rect.top) / height) * canvas.height,
    event.pressure > 0 ? event.pressure : 0.5,
    event.tiltX ?? 0,
    event.tiltY ?? 0,
  ];
}

/**
 * Capture one stroke in mark viewBox units. Uses coalesced pointer events so
 * a 240 Hz tablet does not drop three-quarters of its samples.
 */
export function capturePenStroke(
  canvas: HTMLCanvasElement,
  down: PointerEvent,
  role: StrokeRole = 'body',
  onChange?: () => void,
): PenCaptureHandle {
  const samples: Sample[] = [toSample(canvas, down)];
  const pointerId = down.pointerId;
  let hasTilt = (down.tiltX ?? 0) !== 0 || (down.tiltY ?? 0) !== 0;
  const pointerType = (down.pointerType || 'mouse') as DeviceInfo['pointerType'];

  const onMove = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    const batch =
      typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
    for (const coalesced of batch.length > 0 ? batch : [event]) {
      if ((coalesced.tiltX ?? 0) !== 0 || (coalesced.tiltY ?? 0) !== 0) {
        hasTilt = true;
      }
      samples.push(toSample(canvas, coalesced));
    }
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
    device: () => ({ hasTilt, pointerType }),
    finish: () => {
      detach();
      return { role, samples };
    },
    samples: () => samples,
  };
}
