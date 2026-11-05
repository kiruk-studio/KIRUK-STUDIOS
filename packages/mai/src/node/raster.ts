/**
 * Rasterise a plate in headless Chromium (Playwright), for proofs and the pixel checks.
 * Node only. Playwright is resolved from the environment, never bundled.
 */
import { createRequire } from 'node:module';

type Browser = {
  newPage(o: {
    viewport: { width: number; height: number };
    deviceScaleFactor: number;
  }): Promise<Page>;
  close(): Promise<void>;
};
type Page = {
  setContent(html: string, o?: { waitUntil?: string }): Promise<void>;
  screenshot(o: {
    type?: 'png';
    clip?: { x: number; y: number; width: number; height: number };
    omitBackground?: boolean;
  }): Promise<Uint8Array>;
  evaluate<T>(fn: string): Promise<T>;
  close(): Promise<void>;
};

let browserP: Promise<Browser> | null = null;

function playwright(): { chromium: { launch(o?: object): Promise<Browser> } } {
  const req = createRequire(import.meta.url);
  try {
    return req('playwright');
  } catch {
    throw new Error(
      'mai: proofs need Playwright with Chromium. In a kiruk cloud session it is preinstalled; locally run `npm i -g playwright && npx playwright install chromium`.',
    );
  }
}

export async function browser(): Promise<Browser> {
  if (!browserP) browserP = playwright().chromium.launch();
  return browserP;
}

export async function closeBrowser() {
  if (browserP) {
    const b = await browserP;
    browserP = null;
    await b.close();
  }
}

/** Screenshot an SVG document (with its own width/height in px) as PNG bytes. */
export async function rasterSVG(
  svg: string,
  width: number,
  height: number,
  scale = 1,
): Promise<Uint8Array> {
  const b = await browser();
  const page = await b.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  try {
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff}svg{display:block}</style></head><body>${svg}</body></html>`,
      { waitUntil: 'load' },
    );
    return await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
  } finally {
    await page.close();
  }
}

/** Decode a PNG to RGBA in the browser (no native deps). */
export async function decodePNG(
  png: Uint8Array,
): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
  const b = await browser();
  const page = await b.newPage({ viewport: { width: 8, height: 8 }, deviceScaleFactor: 1 });
  try {
    const b64 = Buffer.from(png).toString('base64');
    const res = await page.evaluate<{ w: number; h: number; d: string }>(`(async () => {
      const img = new Image();
      img.src = 'data:image/png;base64,${b64}';
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let s = '';
      const CH = 0x8000;
      for (let i = 0; i < d.length; i += CH) s += String.fromCharCode.apply(null, d.subarray(i, i + CH));
      return { w: c.width, h: c.height, d: btoa(s) };
    })()`);
    const bin = Buffer.from(res.d, 'base64');
    return {
      width: res.w,
      height: res.h,
      data: new Uint8ClampedArray(bin.buffer, bin.byteOffset, bin.length),
    };
  } finally {
    await page.close();
  }
}
