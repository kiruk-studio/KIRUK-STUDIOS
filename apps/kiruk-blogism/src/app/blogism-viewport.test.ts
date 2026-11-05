import { describe, expect, it } from "vitest";

import { DESK_SIZE, PAGE_SIZE } from "../kiruk";
import { blogismPageSceneBounds, clampBlogismZoom, zoomToFitPage } from "./blogism-viewport";

describe("blogism viewport", () => {
  it("centers the portrait page in world space", () => {
    expect(blogismPageSceneBounds()).toEqual({
      height: PAGE_SIZE.height,
      width: PAGE_SIZE.width,
      x: -PAGE_SIZE.width / 2,
      y: -PAGE_SIZE.height / 2,
    });
    expect(PAGE_SIZE.width / PAGE_SIZE.height).not.toBe(
      DESK_SIZE.width / DESK_SIZE.height,
    );
  });

  it("fits the page into the viewport and clamps zoom", () => {
    expect(zoomToFitPage({ height: 720, width: 960 })).toBeGreaterThan(0);
    expect(clampBlogismZoom(10)).toBe(25);
    expect(clampBlogismZoom(900)).toBe(400);
  });
});
