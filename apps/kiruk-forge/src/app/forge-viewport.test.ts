import { describe, expect, it } from "vitest";

import { forgeMarkSceneBounds, zoomToFitTemplate } from "./forge-viewport";

describe("forge viewport fit", () => {
  it("zooms a small template above 100 percent", () => {
    expect(
      zoomToFitTemplate({ height: 720, width: 960 }, { height: 440, width: 384 }),
    ).toBeGreaterThan(100);
  });

  it("clamps a huge template to the Toolcraft zoom floor", () => {
    expect(
      zoomToFitTemplate({ height: 200, width: 200 }, { height: 4000, width: 4000 }),
    ).toBe(25);
  });

  it("centers the mark paper on the Toolcraft world origin", () => {
    expect(forgeMarkSceneBounds({ height: 440, width: 384 })).toEqual({
      height: 440,
      width: 384,
      x: -192,
      y: -220,
    });
  });
});
