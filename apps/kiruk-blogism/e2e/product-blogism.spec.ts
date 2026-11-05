import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
} from "./browser-proof-session";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { expectToolcraftViewportSideEffect } from "./browser-state-evidence-helpers";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import {
  blackInk,
  denseInkExportBounds,
  denseInkWithTitleExportBounds,
  exportPng,
  fillControl,
  finiteExportSize,
  infiniteExportSize,
  inkWithPen,
  openBlogism,
  pageCanvas,
  panWorld,
  paperBlue,
  proveSwitchApplicability,
  readCornerPaper,
  readViewport,
  selectOption,
  selectTab,
  stubDirectoryPicker,
  target,
  waitForPageCanvas,
  whitePaper,
} from "./product-blogism-support";
import { DESK_SIZE } from "../src/kiruk";

const pageSelector = "[data-kiruk-blogism-page]";

test("browser acceptance: BLOGISM canvas captures a pen stroke", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction("blogism.ink", async (currentPage) => {
      await inkWithPen(currentPage, true);
    }),
    { requirementId: "renderer.draw-stroke" },
  );
  await expect(pageCanvas(page)).not.toHaveAttribute(
    "data-blogism-stroke-count",
    "0",
  );
});

test("browser acceptance: BLOGISM uses selected backing pixels", async ({
  page,
}) => {
  await openBlogism(page);
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "canvas.renderScale",
    "renderer.render-scale",
  );
  await expectToolcraftCanvasRenderScaleEvidence(page, {
    canvasSelector: pageSelector,
    requirementId: "renderer.render-scale",
    selectedScale: 2,
    stateTransitions: [
      { run: async () => undefined, state: "steady" },
      {
        run: async () => {
          await inkWithPen(page);
        },
        state: "interaction",
      },
    ],
    target: "canvas.renderScale",
  });
});

test("browser acceptance: BLOGISM Infinity canvas preserves the page scene", async ({
  page,
}) => {
  await openBlogism(page);
  const scene = page.locator("[data-toolcraft-product-scene]");
  const canvas = pageCanvas(page);
  await expect(scene).toHaveAttribute(
    "data-toolcraft-product-scene-status",
    "ready",
  );
  const sceneHandle = await scene.elementHandle();
  const canvasHandle = await canvas.elementHandle();
  if (!sceneHandle || !canvasHandle) {
    throw new Error("BLOGISM scene nodes are unavailable.");
  }

  const before = await observeInfinityCanvas(page);
  const expectedSceneRect = before.productScene.worldRect;
  if (!expectedSceneRect) {
    throw new Error("BLOGISM page scene has no world rect.");
  }

  await target(page, "canvas.infinity").getByRole("switch").click();
  const enabled = await observeInfinityCanvas(page);
  const beforeToEnabled = {
    productHostPreserved: await scene.evaluate(
      (element, initial) => element === initial,
      sceneHandle,
    ),
    productOutputPreserved: await canvas.evaluate(
      (element, initial) => element === initial,
      canvasHandle,
    ),
  };

  await panWorld(page);
  const afterPan = await observeInfinityCanvas(page);

  await page.reload();
  await waitForPageCanvas(page);
  const afterReload = await observeInfinityCanvas(page);

  await target(page, "canvas.infinity").getByRole("switch").click();
  const restored = await observeInfinityCanvas(page);

  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeInfinityCanvas(page);

  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    {
      afterPan,
      afterReload,
      before,
      enabled,
      redone,
      restored,
      undone,
    },
    {
      afterReloadToRestored: {
        productHostPreserved: true,
        productOutputPreserved: true,
      },
      beforeToEnabled,
      restoredToUndone: {
        productHostPreserved: true,
        productOutputPreserved: true,
      },
      undoneToRedone: {
        productHostPreserved: true,
        productOutputPreserved: true,
      },
    },
    {
      expectedFiniteSize: DESK_SIZE,
      expectedSceneRect,
      requirementId: "renderer.infinity-mode",
      target: "canvas.infinity",
    },
  );
});

test("browser acceptance: BLOGISM export crops to Infinity scene bounds", async ({
  page,
}) => {
  await openBlogism(page);
  await inkWithPen(page, true);
  const finite = finiteExportSize();
  const infinite = infiniteExportSize();
  const finiteArtifact = await exportPng(page);
  await target(page, "canvas.infinity").getByRole("switch").click();
  const infiniteArtifact = await exportPng(page);
  await expectToolcraftInfinityCanvasImageExportEvidence(
    {
      finite: {
        byteLength: finiteArtifact.inspection.byteLength,
        height: finiteArtifact.inspection.height,
        width: finiteArtifact.inspection.width,
      },
      infinite: {
        byteLength: infiniteArtifact.inspection.byteLength,
        height: infiniteArtifact.inspection.height,
        width: infiniteArtifact.inspection.width,
      },
    },
    {
      expectedFiniteSize: { height: finite.height, width: finite.width },
      expectedInfiniteSize: { height: infinite.height, width: infinite.width },
      requirementId: "renderer.infinity-export",
      target: "canvas.infinity",
    },
  );
});

test("browser acceptance: BLOGISM canvas pan coalesces and resumes", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  const observe = session.observe(readViewport);
  const before = await readToolcraftBrowserObservation(observe);
  await expectToolcraftViewportSideEffect(
    observe,
    session.targetAction("canvas.setOffset", async (currentPage) => {
      await panWorld(currentPage);
    }),
    {
      ...before,
      offsetX: before.offsetX + 112,
      offsetY: before.offsetY + 68,
    },
    { requirementId: "renderer.viewport" },
  );
});

test("browser acceptance: BLOGISM canvas zoom coalesces and resumes", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  const observe = session.observe(readViewport);
  const before = await readToolcraftBrowserObservation(observe);
  await expectToolcraftViewportSideEffect(
    observe,
    session.targetAction("canvas.setViewport", async (currentPage) => {
      await currentPage.getByRole("button", { name: "Zoom in" }).click();
    }),
    {
      ...before,
      zoom: before.zoom === 100 ? 110 : before.zoom + 10,
    },
    { requirementId: "renderer.viewport-zoom" },
  );
});

test("browser acceptance: BLOGISM background inclusion controls output", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await target(page, "canvas.infinity").getByRole("switch").click();
  await expect
    .poll(async () => pageCanvas(page).getAttribute("data-blogism-paper"))
    .toBe("on");
  const infiniteBackground = await observeInfinityCanvasBackground(page);
  const preview = session.observe(readCornerPaper);
  const before = await readToolcraftBrowserObservation(preview);

  await expectToolcraftBackgroundOutputSemantics(
    preview,
    session.controlAction("export.includeBackground", async (control) => {
      await control.getByRole("switch").click();
    }),
    {
      backgroundVisible: false,
      outputSignature: `clear-${before.outputSignature.replace(/^paper-(\d+).*$/u, "$1")}`,
    },
    session.targetAction("actions.output", async (currentPage) => {
      const downloadPromise = currentPage.waitForEvent("download");
      await currentPage.getByRole("button", { name: "Export PNG" }).click();
      return downloadPromise;
    }),
    async (download) => {
      const inspected = await inspectToolcraftImageDownload({
        backgroundRgba: [0, 0, 0, 0],
        download,
        page,
      });
      return {
        ...inspected.inspection,
        backgroundAlpha: inspected.observation.normalizedPixels[3] ?? 0,
      };
    },
    { requirementId: "renderer.background-inclusion" },
  );

  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await target(page, "export.includeBackground").getByRole("switch").click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    {
      backgroundExcluded,
      backgroundRestored,
      infinite: infiniteBackground,
    },
    {
      expectedBackgroundColor: "#FFFFFF",
      requirementId: "renderer.background-inclusion",
      target: "export.includeBackground",
    },
  );
});

test("browser acceptance: BLOGISM background color reaches export", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  const requirementIds = await proveSwitchApplicability(
    session,
    "appearance.background",
    "export.includeBackground",
    "renderer.background-color",
  );
  await target(page, "export.includeBackground").getByRole("switch").evaluate(
    async (sw) => {
      if (sw.getAttribute("aria-checked") !== "true") {
        (sw as HTMLElement).click();
      }
    },
  );
  await expect(target(page, "export.includeBackground").getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await inkWithPen(page, true);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.background", async (control) => {
      const input = control.getByRole("textbox");
      await input.fill("#203040");
      await input.press("Enter");
    }),
    { requirementId: "renderer.background-color" },
  );
  const size = finiteExportSize();
  await expectToolcraftImageExportArtifact(
    session.targetAction("actions.output", async (currentPage) => {
      const downloadPromise = currentPage.waitForEvent("download");
      await currentPage.getByRole("button", { name: "Export PNG" }).click();
      return downloadPromise;
    }),
    {
      additionalArtifactRequirements: requirementIds.map((requirementId) => ({
        requirementId,
        target: "appearance.background",
      })),
      backgroundRgba: paperBlue,
      expectedBounds: denseInkExportBounds,
      expectedHeight: size.height,
      expectedMediaType: "image/png",
      expectedPixels: [
        { rgba: paperBlue, xRatio: 0.02, yRatio: 0.02 },
        { rgba: blackInk, xRatio: 0.15, yRatio: 0.15 },
      ],
      expectedWidth: size.width,
      page,
      requirementId: "renderer.background-color",
    },
  );
});

test("browser acceptance: BLOGISM image formats remain selectable", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  for (const format of ["JPG", "PNG"] as const) {
    await expectToolcraftAcceptanceOutcome(
      () =>
        target(page, "export.image.format")
          .getByRole("combobox")
          .textContent(),
      session.controlAction("export.image.format", async () => {
        await selectOption(page, "export.image.format", format);
      }),
      {
        evidenceType: "command-side-effect",
        requirementId: "renderer.image-format",
      },
    );
  }
});

test("browser acceptance: BLOGISM image resolutions remain selectable", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  for (const resolution of ["2K", "8K", "4K"] as const) {
    await expectToolcraftAcceptanceOutcome(
      () =>
        target(page, "export.image.resolution")
          .getByRole("combobox")
          .textContent(),
      session.controlAction("export.image.resolution", async () => {
        await selectOption(page, "export.image.resolution", resolution);
      }),
      {
        evidenceType: "command-side-effect",
        requirementId: "renderer.image-resolution",
      },
    );
  }
});

test("browser acceptance: BLOGISM Save Publish and Export PNG deliver", async ({
  page,
}) => {
  await stubDirectoryPicker(page);
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await selectTab(page, "Develop");
  await fillControl(page, "blogism.title", "Help me");
  await selectTab(page, "Design");
  await inkWithPen(page, true);
  await page.getByRole("button", { name: "Save" }).click();
  await expect
    .poll(() =>
      page
        .locator("[data-panel-action-feedback-code]")
        .getAttribute("data-panel-action-feedback-code"),
    )
    .toMatch(/kit-clipboard|kit-saved|kit-copy-failed/);
  await page.getByRole("button", { name: "Publish" }).click();
  await expect
    .poll(() =>
      page
        .locator("[data-panel-action-feedback-code]")
        .getAttribute("data-panel-action-feedback-code"),
    )
    .toMatch(/kit-clipboard|kit-published|kit-copy-failed/);
  const size = finiteExportSize();
  await expectToolcraftImageExportArtifact(
    session.targetAction("actions.output", async (currentPage) => {
      const downloadPromise = currentPage.waitForEvent("download");
      await currentPage.getByRole("button", { name: "Export PNG" }).click();
      return downloadPromise;
    }),
    {
      backgroundRgba: whitePaper,
      expectedBounds: denseInkWithTitleExportBounds,
      expectedHeight: size.height,
      expectedMediaType: "image/png",
      expectedPixels: [
        { rgba: whitePaper, xRatio: 0.02, yRatio: 0.02 },
        { rgba: blackInk, xRatio: 0.15, yRatio: 0.15 },
      ],
      expectedWidth: size.width,
      page,
      requirementId: "renderer.delivery",
    },
  );
});
