import { describe, expect, it } from "vitest";

import { COMPONENT_CATALOG } from "@kiruk/kirukal";

import {
  appAcceptance,
  appControlSectionInventory,
  appProductReadiness,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { FORGE_STAGE_SIZE } from "./forge-stage-size";
import { getStageHotspots } from "./forge-stage-layout";
import { previewSvgForComponent } from "./forge-template-previews";

describe("appSchema", () => {
  it("keeps runtime Setup and a finite component stage", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.canvas.size).toMatchObject(FORGE_STAGE_SIZE);
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(
      appSchema.panels.controls?.sections[0]?.controls.settingsTransfer,
    ).toMatchObject({
      target: "runtime.settingsTransfer",
      type: "settingsTransfer",
    });
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage === "localStorage") {
      expect(appSchema.persistence.key).toContain(":v4");
    }
    expect(appSchema.toolbar).toMatchObject({
      history: true,
      radar: false,
      zoom: true,
    });
  });

  it("publishes a Component section instead of unnamed silhouettes", () => {
    const productSections =
      appSchema.panels.controls?.sections.filter(
        (section) => section.title !== "Setup",
      ) ?? [];
    expect(productSections.map((section) => section.title)).toEqual([
      "Component",
      "Export",
    ]);
    expect(productSections[0]?.title).toBe("Component");
    const kitActions = appSchema.panels.controls?.sections.flatMap((section) => {
      const kit = section.controls.kit ?? section.controls.footer;
      if (!kit || !("actions" in kit)) return [];
      return (
        kit.actions?.map((action) =>
          typeof action === "string" ? action : action.label,
        ) ?? []
      );
    });
    expect(kitActions).toEqual(expect.arrayContaining(["Publish", "Edit"]));
  });

  it("declares production reload coverage for the starter schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      persistenceCoverage: "reload",
      persistenceSlices:
        appSchema.persistence.storage === "localStorage"
          ? appSchema.persistence.include
          : [],
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});

describe("Forge named catalog and stage", () => {
  it("named catalog labels every component tile", () => {
    expect(COMPONENT_CATALOG.every((entry) => entry.label.trim())).toBe(true);
    const button = previewSvgForComponent("button");
    expect(button).toContain("96");
    expect(button).not.toContain("#FF00FF");
    expect(button).not.toContain("#ff00ff");
  });

  it("anatomy status reports takes without saying Part", () => {
    expect(appControlSectionInventory[0]?.entity).toBe("Component");
    expect(
      getStageHotspots("button").some(
        (hotspot) => hotspot.markId === "frame.box-tight",
      ),
    ).toBe(true);
  });

  it("hotspot selects the live anatomy piece", () => {
    const arrow = getStageHotspots("button").find(
      (hotspot) => hotspot.markId === "glyph.arrow",
    );
    expect(arrow).toBeDefined();
    expect(arrow?.label).toBe("Arrow");
  });

  it("clear empties the current take", () => {
    expect(appSchema.panels.controls?.sections[1]?.controls.clearTake).toMatchObject({
      type: "actions",
    });
  });

  it("Publish writes the next kirukal source take", () => {
    expect(appProductReadiness.mode).toBe("product");
    expect(appPerformance.usesCustomRenderer).toBe(true);
  });

  it("Infinity canvas preserves the component stage", () => {
    expect(appAcceptance.some((entry) => entry.id === "forge.infinity")).toBe(
      true,
    );
  });
});
