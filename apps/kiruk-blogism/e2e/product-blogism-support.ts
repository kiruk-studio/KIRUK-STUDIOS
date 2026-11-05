import { expect, type Locator, type Page } from "@playwright/test";
import {
  createToolcraftState,
  getToolcraftImageExportSize,
} from "@/toolcraft/runtime";

import {
  appControlSectionInventory,
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import { DESK_SIZE, PAGE_SIZE } from "../src/kiruk";
import {
  expectToolcraftControlApplicabilityState,
} from "./browser-control-applicability-evidence";
import type { ToolcraftBrowserProofSession } from "./browser-proof-session";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";

export const whitePaper = [255, 255, 255, 255] as const;
export const paperBlue = [32, 48, 64, 255] as const;
export const blackInk = [0, 0, 0, 255] as const;
/** 64×64 nearest downsample of a dense page stroke stretched across the desk. */
export const denseInkExportBounds = {
  height: 0.84375,
  width: 0.8125,
  x: 0.078125,
  y: 0.078125,
} as const;
/** Same stroke plus Develop title/caption ink in the top-left. */
export const denseInkWithTitleExportBounds = {
  height: 0.875,
  width: 0.8125,
  x: 0.078125,
  y: 0.046875,
} as const;

export function target(page: Page, name: string): Locator {
  return page.locator(`[data-toolcraft-control-target="${name}"]`);
}

export function pageCanvas(page: Page): Locator {
  return page.locator("[data-kiruk-blogism-page]");
}

export async function waitForPageCanvas(page: Page): Promise<Locator> {
  const canvas = pageCanvas(page);
  await expect(canvas).toBeVisible();
  return canvas;
}

export async function openBlogism(page: Page): Promise<void> {
  await page.goto("/");
  await waitForPageCanvas(page);
}

export async function selectOption(
  page: Page,
  controlTarget: string,
  optionName: string,
): Promise<void> {
  const trigger = target(page, controlTarget).getByRole("combobox");
  await trigger.click();
  await page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: optionName })
    .click();
  await expect(trigger).toContainText(optionName);
}

export async function selectTab(
  page: Page,
  label: "Design" | "Develop",
): Promise<void> {
  await target(page, "blogism.side").getByRole("tab", { name: label }).click();
  await expect(pageCanvas(page)).toHaveAttribute(
    "data-blogism-side",
    label === "Develop" ? "develop" : "design",
  );
}

export async function fillControl(
  page: Page,
  controlTarget: string,
  value: string,
): Promise<void> {
  const field = target(page, controlTarget);
  const input = field.getByRole("textbox").or(field.locator("textarea"));
  await input.first().fill(value);
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
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => undefined,
      },
    });
  });
}

export async function readCanvasZoom(page: Page): Promise<number> {
  const zoom = await page
    .locator("[data-toolcraft-canvas-world]")
    .first()
    .getAttribute("data-toolcraft-canvas-zoom");
  return Number(zoom);
}

export function readViewport(root: HTMLElement): {
  offsetX: number;
  offsetY: number;
  outputHeight: number;
  outputWidth: number;
  zoom: number;
} {
  const world = root.querySelector("[data-toolcraft-canvas-world]");
  const canvas = root.querySelector<HTMLCanvasElement>("[data-kiruk-blogism-page]");
  return {
    offsetX: Number(world?.getAttribute("data-toolcraft-canvas-offset-x") ?? 0),
    offsetY: Number(world?.getAttribute("data-toolcraft-canvas-offset-y") ?? 0),
    outputHeight: canvas?.height ?? PAGE_SIZE.height,
    outputWidth: canvas?.width ?? PAGE_SIZE.width,
    zoom: Number(world?.getAttribute("data-toolcraft-canvas-zoom") ?? 100),
  };
}

export function readCornerPaper(root: HTMLElement): {
  backgroundVisible: boolean;
  outputSignature: string;
} {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-kiruk-blogism-page]");
  if (!canvas) {
    return { backgroundVisible: false, outputSignature: "missing" };
  }
  const context = canvas.getContext("2d");
  const includePaper = canvas.getAttribute("data-blogism-paper") === "on";
  const pixel = context?.getImageData(8, 8, 1, 1).data;
  const pixelLooksPaper = Boolean(
    pixel && pixel[3] > 200 && pixel[0] > 200 && pixel[1] > 200 && pixel[2] > 200,
  );
  const backgroundVisible = includePaper || pixelLooksPaper;
  return {
    backgroundVisible,
    outputSignature: backgroundVisible
      ? `paper-${canvas.width}-${pixel?.[0] ?? 255}-${pixel?.[1] ?? 255}-${pixel?.[2] ?? 255}`
      : `clear-${canvas.width}`,
  };
}

export async function inkWithPen(page: Page, dense = false): Promise<void> {
  const canvas = await waitForPageCanvas(page);
  const before = await getToolcraftProductObservableSnapshot(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Page canvas has no bounding box.");

  await page.evaluate(
    ({ dense: fillPage }) => {
      const el = document.querySelector<HTMLCanvasElement>("[data-kiruk-blogism-page]");
      if (!el) throw new Error("Missing BLOGISM page canvas.");
      const rect = el.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const left = rect.left;
      const top = rect.top;
      const pointerId = 11;
      const fire = (type: string, x: number, y: number, buttons: number) => {
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            button: type === "pointermove" ? -1 : 0,
            buttons,
            cancelable: true,
            clientX: x,
            clientY: y,
            composed: true,
            isPrimary: true,
            pointerId,
            pointerType: "pen",
            pressure: 0.72,
          }),
        );
      };
      const inset = Math.max(10, Math.min(width, height) * 0.12);
      const points: Array<[number, number]> = [];
      if (fillPage) {
        const rows = 32;
        const cols = 24;
        for (let row = 0; row < rows; row += 1) {
          const y = top + inset + ((height - inset * 2) * row) / (rows - 1);
          for (let col = 0; col < cols; col += 1) {
            const xIndex = row % 2 === 0 ? col : cols - 1 - col;
            const x =
              left + inset + ((width - inset * 2) * xIndex) / (cols - 1);
            points.push([x, y]);
          }
        }
      } else {
        points.push(
          [left + inset, top + inset],
          [left + width - inset, top + height - inset],
        );
      }
      const start = points[0];
      if (!start) return;
      fire("pointerdown", start[0], start[1], 1);
      for (const [x, y] of points.slice(1)) {
        fire("pointermove", x, y, 1);
      }
      const end = points[points.length - 1] ?? start;
      fire("pointerup", end[0], end[1], 0);
    },
    { dense },
  );

  await expect(canvas).not.toHaveAttribute("data-blogism-stroke-count", "0");
  await expect
    .poll(() => getToolcraftProductObservableSnapshot(page), {
      message: "Pen ink should change product pixels.",
    })
    .not.toEqual(before);
}

export async function mouseStroke(page: Page): Promise<void> {
  const canvas = await waitForPageCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Page canvas has no bounding box.");
  const inset = Math.max(8, Math.min(box.width, box.height) * 0.12);
  await page.evaluate(
    ({ height, left, top, width, inset: pad }) => {
      const el = document.querySelector<HTMLCanvasElement>(
        "[data-kiruk-blogism-page]",
      );
      if (!el) throw new Error("Missing BLOGISM page canvas.");
      const pointerId = 21;
      const fire = (type: string, x: number, y: number, buttons: number) => {
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            button: type === "pointermove" ? -1 : 0,
            buttons,
            cancelable: true,
            clientX: x,
            clientY: y,
            composed: true,
            isPrimary: true,
            pointerId,
            pointerType: "mouse",
            pressure: type === "pointerup" ? 0 : 0.5,
          }),
        );
      };
      fire("pointerdown", left + pad, top + pad, 1);
      fire("pointermove", left + width - pad, top + height - pad, 1);
      fire("pointerup", left + width - pad, top + height - pad, 0);
    },
    {
      height: box.height,
      inset,
      left: box.x,
      top: box.y,
      width: box.width,
    },
  );
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

export function finiteExportSize(resolution: "2k" | "4k" | "8k" = "4k") {
  const state = createToolcraftState(appSchema);
  return getToolcraftImageExportSize({
    frame: { height: DESK_SIZE.height, width: DESK_SIZE.width, x: 0, y: 0 },
    resolution,
    state,
  });
}

export function infiniteExportSize(resolution: "2k" | "4k" | "8k" = "4k") {
  const state = createToolcraftState(appSchema);
  return getToolcraftImageExportSize({
    frame: { height: PAGE_SIZE.height, width: PAGE_SIZE.width, x: 0, y: 0 },
    resolution,
    state,
  });
}

export async function exportPng(page: Page) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  return inspectToolcraftImageDownload({
    backgroundRgba: whitePaper,
    download: await downloadPromise,
    page,
  });
}

export function visibleRequirementId(
  controlTarget: string,
  baseRequirementId: string,
): string {
  const visibleCase = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target: controlTarget,
  }).find((entry) => entry.expectation === "visible");
  return visibleCase
    ? getToolcraftApplicabilityRequirementId(baseRequirementId, visibleCase)
    : baseRequirementId;
}

export async function proveSideApplicability(
  page: Page,
  session: ToolcraftBrowserProofSession,
  controlTarget: string,
  baseRequirementId: string,
): Promise<void> {
  const cases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target: controlTarget,
  });
  for (const applicabilityCase of cases) {
    const label =
      applicabilityCase.selectorValue === "develop" ? "Develop" : "Design";
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction("blogism.side", async (control) => {
        await control.getByRole("tab", { name: label }).click();
      }),
      applicabilityCase,
      { baseRequirementId },
    );
  }
}

export async function proveSwitchApplicability(
  session: ToolcraftBrowserProofSession,
  controlTarget: string,
  selectorTarget: string,
  baseRequirementId: string,
): Promise<string[]> {
  const cases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target: controlTarget,
  });
  const requirementIds: string[] = [];
  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction(selectorTarget, async (control) => {
        const sw = control.getByRole("switch");
        const wanted = String(applicabilityCase.selectorValue);
        if ((await sw.getAttribute("aria-checked")) !== wanted) {
          await sw.click();
        }
      }),
      applicabilityCase,
      { baseRequirementId },
    );
    requirementIds.push(
      getToolcraftApplicabilityRequirementId(baseRequirementId, applicabilityCase),
    );
  }
  return requirementIds;
}
