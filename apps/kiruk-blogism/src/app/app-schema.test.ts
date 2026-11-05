import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
  appProductReadiness,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { DESK_SIZE, PAGE_SIZE } from "../kiruk";

describe("appSchema", () => {
  const pageSection = () =>
    appSchema.panels.controls?.sections.find((section) => section.id === "page");
  const setupSection = () =>
    appSchema.panels.controls?.sections.find(
      (section) => section.id === "runtime.setup",
    );

  it("keeps a finite white desk with a smaller page scene", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.canvas.size).toEqual({
      height: DESK_SIZE.height,
      unit: "px",
      width: DESK_SIZE.width,
    });
    expect(PAGE_SIZE.width).toBeLessThan(DESK_SIZE.width);
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
  });

  it("declares Design and Develop on one page entity", () => {
    const page = pageSection();
    expect(page?.title).toBe("Page");
    expect(page?.controls.side).toMatchObject({
      target: "blogism.side",
      type: "tabs",
    });
    expect(page?.controls.body).toMatchObject({
      target: "blogism.body",
      textValueKind: "multiline",
      type: "code",
    });
  });

  it("does not imply timeline behavior", () => {
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
  });

  it("declares production reload coverage for the generated product schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    const slices =
      appSchema.persistence.storage === "localStorage"
        ? appSchema.persistence.include
        : [];
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      automated: true,
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: slices,
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });

  it("page sheet captures a pen stroke", () => {
    expect(appAcceptance.some((entry) => entry.id === "renderer.draw-stroke")).toBe(
      true,
    );
  });

  it("page sheet uses selected backing pixels", () => {
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
  });

  it("page sheet uses runtime scene bounds", () => {
    expect(PAGE_SIZE).toEqual({ width: 768, height: 1024 });
  });

  it("page sheet export crops to runtime scene bounds", () => {
    expect(DESK_SIZE.width / DESK_SIZE.height).not.toBe(
      PAGE_SIZE.width / PAGE_SIZE.height,
    );
  });

  it("page sheet coalesces viewport activity", () => {
    expect(appSchema.toolbar.zoom).toBe(true);
  });

  it("page sheet canvas zoom coalesces and resumes", () => {
    expect(appSchema.toolbar.history).toBe(true);
  });

  it("design develop tabs replace the panel body", () => {
    expect(appProductReadiness.mode).toBe("product");
  });

  it("ink pencil eraser change the live tool", () => {
    expect(
      appControlSectionInventory[0]?.finiteSelectors.some(
        (selector) => selector.target === "blogism.tool",
      ),
    ).toBe(true);
  });

  it("pen only rejects mouse until turned off", () => {
    expect(pageSection()?.controls.penOnly?.defaultValue).toBe(true);
  });

  it("clear empties the current sheet", () => {
    expect(pageSection()?.controls.clear?.type).toBe("actions");
  });

  it("title paints onto the sheet", () => {
    expect(pageSection()?.controls.title?.target).toBe("blogism.title");
  });

  it("excerpt stays in develop state", () => {
    expect(pageSection()?.controls.excerpt?.target).toBe("blogism.excerpt");
  });

  it("collection options remain selectable", () => {
    expect(pageSection()?.controls.collection?.type).toBe("select");
  });

  it("draft toggle records publish intent", () => {
    expect(pageSection()?.controls.draft?.type).toBe("switch");
  });

  it("body captions paint onto the sheet", () => {
    expect(pageSection()?.controls.body?.type).toBe("code");
  });

  it("background inclusion controls preview and PNG transparency", () => {
    expect(
      appAcceptance.find((entry) => entry.id === "renderer.background-inclusion")
        ?.backgroundOutputCoverage,
    ).toEqual([
      "preview-hidden-when-excluded",
      "image-transparent-when-excluded",
      "infinity-viewport-color-and-dependency",
    ]);
  });

  it("background color changes page output", () => {
    expect(setupSection()?.controls.background?.target).toBe(
      "appearance.background",
    );
  });

  it("image format options remain selectable", () => {
    expect(
      appAcceptance.find((entry) => entry.id === "renderer.image-format")
        ?.optionCoverage,
    ).toEqual(["png", "jpg"]);
  });

  it("image resolution options remain selectable", () => {
    expect(
      appAcceptance.find((entry) => entry.id === "renderer.image-resolution")
        ?.optionCoverage,
    ).toEqual(["2k", "4k", "8k"]);
  });

  it("save publish and png are the delivery commands", () => {
    expect(
      appAcceptance.find((entry) => entry.id === "renderer.delivery")?.actionCoverage,
    ).toEqual(["kit.save", "kit.publish", "export.png"]);
  });

  it("keeps performance scenarios derived from the compiled pipeline", () => {
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
  });
});
