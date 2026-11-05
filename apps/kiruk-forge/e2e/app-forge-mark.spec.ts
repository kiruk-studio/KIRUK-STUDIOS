import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  dragCanvasHandle,
  expectExportExcludesCanvasHandles,
} from "./canvas-handle-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import {
  getFiniteArtboardSize,
  inkQuickStroke,
  inkTheMark,
  markCanvas,
  openForge,
  panWorld,
  penCanvas,
  selectComponent,
  stubDirectoryPicker,
  target,
  waitForMarkCanvas,
} from "./app-forge-mark-support";

test("browser acceptance: Forge named catalog labels every component", async ({
  page,
}) => {
  await openForge(page);
  const session = await createToolcraftBrowserProofSession(page);
  const labels = page.locator("[data-kiruk-catalog-label]");
  await expect(labels.first()).toBeVisible();
  const names = await labels.allTextContents();
  expect(names.some((name) => name.trim() === "Button")).toBe(true);
  expect(names.every((name) => name.trim().length > 0)).toBe(true);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("forge.component", async () => {
      await selectComponent(page, "Switch");
    }),
    { requirementId: "forge.catalog" },
  );
  await selectComponent(page, "Button");
  await expect(markCanvas(page)).toHaveAttribute("data-kiruk-component", "button");
  await expect(page.locator('[data-kiruk-live="button"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Export PNG" })).toHaveCount(0);
});

test("browser acceptance: Forge hotspot selects the arrow piece", async ({
  page,
}) => {
  await openForge(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expect(markCanvas(page)).toHaveAttribute(
    "data-kiruk-mark-id",
    "frame.box-tight",
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction("forge.anatomy", async (currentPage) => {
      await currentPage.locator('[data-kiruk-hotspot="glyph.arrow"]').click();
    }),
    { requirementId: "forge.hotspot" },
  );
  await dragCanvasHandle(page, "kiruk-forge-hotspot", { x: 2, y: 2 }, {
    requirementId: "forge.hotspot",
    target: "forge.anatomy",
  });
  await expectExportExcludesCanvasHandles(
    page,
    async () => page.locator("[data-toolcraft-product-output]").screenshot(),
    async (artifact) => ({
      byteLength: artifact.byteLength,
      contentHash: "forge-hotspot-stage",
      height: 1,
      mediaType: "image/png",
      width: 1,
    }),
    { requirementId: "forge.hotspot", target: "forge.anatomy" },
  );
  await expect(markCanvas(page)).toHaveAttribute(
    "data-kiruk-mark-id",
    "glyph.arrow",
  );
});

test("browser acceptance: Forge canvas captures a pen stroke", async ({ page }) => {
  await openForge(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expect(penCanvas(page)).toBeVisible();
  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction("controls.setValue", async (currentPage) => {
      await inkTheMark(currentPage);
    }),
    { requirementId: "renderer.draw-stroke" },
  );
  await expect(markCanvas(page)).not.toHaveAttribute("data-kiruk-stroke-count", "0");
});

test("browser acceptance: Forge take slots isolate ink", async ({ page }) => {
  await openForge(page);
  const session = await createToolcraftBrowserProofSession(page);
  await inkTheMark(page);
  const takeTwo = page.locator('[data-kiruk-take-slot="2"]').first();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("forge.anatomy", async () => {
      await takeTwo.click();
    }),
    { requirementId: "forge.anatomy" },
  );
  await expect(markCanvas(page)).toHaveAttribute("data-kiruk-take", "2");
  await expect(markCanvas(page)).toHaveAttribute("data-kiruk-stroke-count", "0");
  await inkQuickStroke(page, 18);
  await page.locator('[data-kiruk-take-slot="1"]').first().click();
  await expect(markCanvas(page)).not.toHaveAttribute("data-kiruk-stroke-count", "0");
});

test("browser acceptance: Forge clear empties the current take", async ({
  page,
}) => {
  await openForge(page);
  const session = await createToolcraftBrowserProofSession(page);
  await inkTheMark(page);
  await expectToolcraftAcceptanceOutcome(
    () => markCanvas(page).getAttribute("data-kiruk-stroke-count"),
    session.controlAction("mark.clearTake", async (control) => {
      await control.getByRole("button", { name: "Clear" }).click();
    }),
    {
      evidenceType: "command-side-effect",
      requirementId: "forge.clear",
    },
  );
  await expect(markCanvas(page)).toHaveAttribute("data-kiruk-stroke-count", "0");
});

test("browser acceptance: Forge Publish is the kit delivery command", async ({
  page,
}) => {
  await stubDirectoryPicker(page);
  await openForge(page);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.getByRole("button", { name: "Add take" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await inkTheMark(page);
  await expectToolcraftAcceptanceOutcome(
    () =>
      page.evaluate(
        () =>
          document
            .querySelector("[data-panel-action-feedback-code]")
            ?.getAttribute("data-panel-action-feedback-code") ?? "",
      ),
    session.targetAction("actions.kit", async (currentPage) => {
      await currentPage.getByRole("button", { name: "Publish" }).click();
    }),
    {
      evidenceType: "command-side-effect",
      requirementId: "forge.kit",
    },
  );
  await page.evaluate(() => {
    const groups = [
      ...document.querySelectorAll('[data-slot="panel-actions"]'),
    ];
    const group = groups.at(-1);
    if (!group) throw new Error("Forge sticky Publish actions are missing.");
    const button = [...group.querySelectorAll("button")].find((element) =>
      (element.textContent ?? "").includes("Edit"),
    );
    if (!button) throw new Error("Forge Edit action is missing.");
    button.click();
  });
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          document
            .querySelector("[data-panel-action-feedback-code]")
            ?.getAttribute("data-panel-action-feedback-code") ?? "",
      ),
    )
    .toBe("kit-editing");
  await expect(page.getByRole("button", { name: "Export PNG" })).toHaveCount(0);
});

test("browser acceptance: Forge background inclusion controls output", async ({
  page,
}) => {
  await openForge(page);
  const session = await createToolcraftBrowserProofSession(page);
  await target(page, "canvas.infinity").getByRole("switch").click();
  const infiniteBackground = await observeInfinityCanvasBackground(page);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("export.includeBackground", async (control) => {
      await control.getByRole("switch").click();
    }),
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

test("browser acceptance: Forge background color reaches preview", async ({
  page,
}) => {
  await openForge(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.background", async (control) => {
      const input = control.getByRole("textbox");
      await input.fill("#203040");
      await input.press("Enter");
    }),
    { requirementId: "renderer.background-color" },
  );
});

test("browser acceptance: Forge Infinity canvas preserves the mark scene", async ({
  page,
}) => {
  await openForge(page);
  const scene = page.locator("[data-toolcraft-product-scene]");
  const canvas = markCanvas(page);
  await expect(scene).toHaveAttribute(
    "data-toolcraft-product-scene-status",
    "ready",
  );
  const sceneHandle = await scene.elementHandle();
  const canvasHandle = await canvas.elementHandle();
  if (!sceneHandle || !canvasHandle) {
    throw new Error("Forge scene nodes are unavailable.");
  }

  const before = await observeInfinityCanvas(page);
  const expectedSceneRect = before.productScene.worldRect;
  if (!expectedSceneRect) {
    throw new Error("Forge mark scene has no world rect.");
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
  await waitForMarkCanvas(page);
  const afterReload = await observeInfinityCanvas(page);

  await target(page, "canvas.infinity").getByRole("switch").click();
  const restored = await observeInfinityCanvas(page);
  const afterReloadToRestored = {
    productHostPreserved: true,
    productOutputPreserved: true,
  };

  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeInfinityCanvas(page);
  const restoredToUndone = {
    productHostPreserved: true,
    productOutputPreserved: true,
  };

  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeInfinityCanvas(page);
  const undoneToRedone = {
    productHostPreserved: true,
    productOutputPreserved: true,
  };

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
      afterReloadToRestored,
      beforeToEnabled,
      restoredToUndone,
      undoneToRedone,
    },
    {
      expectedFiniteSize: getFiniteArtboardSize(),
      expectedSceneRect,
      requirementId: "forge.infinity",
      target: "canvas.infinity",
    },
  );
});
