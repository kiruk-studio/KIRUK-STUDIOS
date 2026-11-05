import { expect, type Locator, type Page } from "@playwright/test";

import { FORGE_STAGE_SIZE } from "../src/app/forge-stage-size";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";

export function target(page: Page, name: string): Locator {
  return page.locator(`[data-toolcraft-control-target="${name}"]`);
}

export function markCanvas(page: Page): Locator {
  return page.locator("[data-kiruk-forge-stage]");
}

export function penCanvas(page: Page): Locator {
  return page.locator("[data-kiruk-forge-pen]");
}

export async function waitForMarkCanvas(page: Page): Promise<Locator> {
  const stage = markCanvas(page);
  await expect(stage).toBeVisible();
  return stage;
}

export async function readCanvasZoom(page: Page): Promise<number> {
  const zoom = await page
    .locator("[data-toolcraft-canvas-zoom]")
    .first()
    .getAttribute("data-toolcraft-canvas-zoom");
  return Number(zoom);
}

export async function selectComponent(
  page: Page,
  label: string,
): Promise<void> {
  const tile = page
    .locator("[data-kiruk-catalog-item]")
    .filter({ hasText: label })
    .first();
  await tile.click();
  await expect(markCanvas(page)).toHaveAttribute(
    "data-kiruk-component",
    (await tile.getAttribute("data-kiruk-catalog-item")) ?? "",
  );
}

export async function inkTheMark(page: Page): Promise<void> {
  const canvas = penCanvas(page);
  await expect(canvas).toBeVisible();
  const before = await getToolcraftProductObservableSnapshot(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Pen overlay has no bounding box.");
  const inset = Math.max(6, Math.min(box.width, box.height) * 0.18);
  await page.mouse.move(box.x + inset, box.y + inset);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - inset, box.y + inset, { steps: 8 });
  await page.mouse.move(
    box.x + box.width - inset,
    box.y + box.height - inset,
    { steps: 8 },
  );
  await page.mouse.move(box.x + inset, box.y + box.height - inset, { steps: 8 });
  await page.mouse.up();
  await expect(markCanvas(page)).not.toHaveAttribute(
    "data-kiruk-stroke-count",
    "0",
  );
  await expect
    .poll(() => getToolcraftProductObservableSnapshot(page), {
      message: "Inked hotspot should change product pixels.",
    })
    .not.toEqual(before);
}

export async function inkQuickStroke(
  page: Page,
  originOffset = 16,
): Promise<void> {
  const canvas = penCanvas(page);
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Pen overlay has no bounding box.");
  const inset = Math.max(8, originOffset);
  await page.mouse.move(box.x + inset, box.y + inset);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width - inset,
    box.y + box.height - inset,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect(markCanvas(page)).not.toHaveAttribute(
    "data-kiruk-stroke-count",
    "0",
  );
}

export function getFiniteArtboardSize() {
  return { height: FORGE_STAGE_SIZE.height, width: FORGE_STAGE_SIZE.width };
}

export async function openForge(page: Page): Promise<void> {
  await page.goto("/");
  await waitForMarkCanvas(page);
}

export async function stubDirectoryPicker(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: () =>
        Promise.reject(
          Object.assign(new Error("The user aborted a request."), {
            name: "AbortError",
          }),
        ),
    });
  });
}

export async function panWorld(page: Page): Promise<void> {
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  if (!box) throw new Error("Canvas viewport has no bounding box.");
  await page.mouse.move(box.x + 28, box.y + 28);
  await page.mouse.down();
  await page.mouse.move(box.x + 140, box.y + 96, { steps: 12 });
  await page.mouse.up();
}
