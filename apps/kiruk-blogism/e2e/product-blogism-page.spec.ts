import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import {
  fillControl,
  inkWithPen,
  mouseStroke,
  openBlogism,
  pageCanvas,
  proveSideApplicability,
  selectOption,
  selectTab,
  target,
  visibleRequirementId,
} from "./product-blogism-support";

test("browser acceptance: BLOGISM Design and Develop tabs swap the panel", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expect(target(page, "blogism.tool")).toBeVisible();
  await expectToolcraftAcceptanceOutcome(
    () => pageCanvas(page).getAttribute("data-blogism-side"),
    session.controlAction("blogism.side", async () => {
      await selectTab(page, "Develop");
    }),
    {
      evidenceType: "command-side-effect",
      requirementId: "renderer.side",
    },
  );
  await expect(target(page, "blogism.title")).toBeVisible();
  await expect(target(page, "blogism.tool")).toHaveCount(0);
  await expectToolcraftAcceptanceOutcome(
    () => pageCanvas(page).getAttribute("data-blogism-side"),
    session.controlAction("blogism.side", async () => {
      await selectTab(page, "Design");
    }),
    {
      evidenceType: "command-side-effect",
      requirementId: "renderer.side",
    },
  );
  await expect(target(page, "blogism.tool")).toBeVisible();
});

test("browser acceptance: BLOGISM tool options stay selectable", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await proveSideApplicability(page, session, "blogism.tool", "renderer.tool");
  await selectTab(page, "Design");
  const requirementId = visibleRequirementId("blogism.tool", "renderer.tool");
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Tool", {
    requirementId,
    target: "blogism.tool",
  });
  for (const tool of ["Pencil", "Eraser", "Ink"] as const) {
    await expectToolcraftAcceptanceOutcome(
      () => pageCanvas(page).getAttribute("data-blogism-tool"),
      session.controlAction("blogism.tool", async (control) => {
        await control
          .locator('[data-slot="toggle-group-item"]')
          .filter({ hasText: tool })
          .click();
      }),
      {
        evidenceType: "command-side-effect",
        requirementId,
      },
    );
    await expect(pageCanvas(page)).toHaveAttribute(
      "data-blogism-tool",
      tool.toLowerCase(),
    );
  }
});

test("browser acceptance: BLOGISM pen only rejects the mouse", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await proveSideApplicability(
    page,
    session,
    "blogism.penOnly",
    "renderer.pen-only",
  );
  await selectTab(page, "Design");
  const requirementId = visibleRequirementId(
    "blogism.penOnly",
    "renderer.pen-only",
  );
  await expect(pageCanvas(page)).toHaveAttribute("data-blogism-pen-only", "true");
  await mouseStroke(page);
  await expect(pageCanvas(page)).toHaveAttribute("data-blogism-stroke-count", "0");
  await expectToolcraftAcceptanceOutcome(
    () => pageCanvas(page).getAttribute("data-blogism-pen-only"),
    session.controlAction("blogism.penOnly", async (control) => {
      await control.getByRole("switch").click();
    }),
    {
      evidenceType: "command-side-effect",
      requirementId,
    },
  );
  await expect(pageCanvas(page)).toHaveAttribute("data-blogism-pen-only", "false");
  await mouseStroke(page);
  await expect(pageCanvas(page)).not.toHaveAttribute(
    "data-blogism-stroke-count",
    "0",
  );
});

test("browser acceptance: BLOGISM clear empties the sheet", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await proveSideApplicability(page, session, "blogism.clear", "renderer.clear");
  await selectTab(page, "Design");
  await inkWithPen(page);
  const requirementId = visibleRequirementId("blogism.clear", "renderer.clear");
  await expectToolcraftAcceptanceOutcome(
    () => pageCanvas(page).getAttribute("data-blogism-stroke-count"),
    session.controlAction("blogism.clear", async (control) => {
      await control.getByRole("button", { name: "Clear" }).click();
    }),
    {
      evidenceType: "command-side-effect",
      requirementId,
    },
  );
  await expect(pageCanvas(page)).toHaveAttribute("data-blogism-stroke-count", "0");
});

test("browser acceptance: BLOGISM title reaches the sheet", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await proveSideApplicability(page, session, "blogism.title", "renderer.title");
  await selectTab(page, "Develop");
  const requirementId = visibleRequirementId("blogism.title", "renderer.title");
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("blogism.title", async () => {
      await fillControl(page, "blogism.title", "Help me");
    }),
    { requirementId },
  );
  await expect(pageCanvas(page)).toHaveAttribute("data-blogism-title", "Help me");
});

test("browser acceptance: BLOGISM excerpt stays editable", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await proveSideApplicability(
    page,
    session,
    "blogism.excerpt",
    "renderer.excerpt",
  );
  await selectTab(page, "Develop");
  const requirementId = visibleRequirementId(
    "blogism.excerpt",
    "renderer.excerpt",
  );
  await expectToolcraftAcceptanceOutcome(
    () => pageCanvas(page).getAttribute("data-blogism-excerpt"),
    session.controlAction("blogism.excerpt", async () => {
      await fillControl(page, "blogism.excerpt", "A short note.");
    }),
    {
      evidenceType: "command-side-effect",
      requirementId,
    },
  );
  await expect(pageCanvas(page)).toHaveAttribute(
    "data-blogism-excerpt",
    "A short note.",
  );
});

test("browser acceptance: BLOGISM collection options remain selectable", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await proveSideApplicability(
    page,
    session,
    "blogism.collection",
    "renderer.collection",
  );
  await selectTab(page, "Develop");
  const requirementId = visibleRequirementId(
    "blogism.collection",
    "renderer.collection",
  );
  for (const option of ["Notes", "Blog"] as const) {
    await expectToolcraftAcceptanceOutcome(
      () => pageCanvas(page).getAttribute("data-blogism-collection"),
      session.controlAction("blogism.collection", async () => {
        await selectOption(page, "blogism.collection", option);
      }),
      {
        evidenceType: "command-side-effect",
        requirementId,
      },
    );
    await expect(pageCanvas(page)).toHaveAttribute(
      "data-blogism-collection",
      option.toLowerCase(),
    );
  }
});

test("browser acceptance: BLOGISM draft toggle records intent", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await proveSideApplicability(page, session, "blogism.draft", "renderer.draft");
  await selectTab(page, "Develop");
  const requirementId = visibleRequirementId("blogism.draft", "renderer.draft");
  await expectToolcraftAcceptanceOutcome(
    () => pageCanvas(page).getAttribute("data-blogism-draft"),
    session.controlAction("blogism.draft", async (control) => {
      await control.getByRole("switch").click();
    }),
    {
      evidenceType: "command-side-effect",
      requirementId,
    },
  );
  await expect(pageCanvas(page)).toHaveAttribute("data-blogism-draft", "false");
});

test("browser acceptance: BLOGISM body reaches the sheet", async ({
  page,
}) => {
  await openBlogism(page);
  const session = await createToolcraftBrowserProofSession(page);
  await proveSideApplicability(page, session, "blogism.body", "renderer.body");
  await selectTab(page, "Develop");
  const requirementId = visibleRequirementId("blogism.body", "renderer.body");
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("blogism.body", async () => {
      await fillControl(page, "blogism.body", "Caption beside the ink.");
    }),
    { requirementId },
  );
  await expect(pageCanvas(page)).toHaveAttribute(
    "data-blogism-body",
    "Caption beside the ink.",
  );
});
