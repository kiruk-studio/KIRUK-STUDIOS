import { describe, expect, it } from "vitest";

import { DESK_SIZE, PAGE_SIZE } from "../kiruk";
import { blogismPageSceneBounds } from "./blogism-viewport";
import { pageExportTransform } from "./blogism-export";

describe("pageExportTransform", () => {
  it("stretches the portrait sheet across the finite desk", () => {
    expect(pageExportTransform(blogismPageSceneBounds(), "finite")).toEqual({
      scaleX: DESK_SIZE.width / PAGE_SIZE.width,
      scaleY: DESK_SIZE.height / PAGE_SIZE.height,
      x: -DESK_SIZE.width / 2,
      y: -DESK_SIZE.height / 2,
    });
  });

  it("keeps Infinity export in page scene coordinates", () => {
    const frame = blogismPageSceneBounds();
    expect(pageExportTransform(frame, "infinite")).toEqual({
      scaleX: 1,
      scaleY: 1,
      x: frame.x,
      y: frame.y,
    });
  });
});
