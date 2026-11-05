import type { ToolcraftProductExportRenderer } from "@/toolcraft/runtime";

import {
  DESK_SIZE,
  PAGE_SIZE,
  paintSheet,
  type InkDocument,
} from "../kiruk";
import { readInk, readString } from "./blogism-values";

export type BlogismExportRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export type BlogismExportTransform = Readonly<{
  scaleX: number;
  scaleY: number;
  x: number;
  y: number;
}>;

/**
 * Runtime export already mapped the output frame onto the canvas.
 * Multiply onto that CTM. Never call setTransform — it would wipe the mapping
 * and stamp PAGE pixels into the corner of a 4K bitmap.
 *
 * Finite PNG stretches the portrait sheet across the landscape desk.
 * Infinity crops to the page, so PAGE maps 1:1 onto the product frame.
 */
export function pageExportTransform(
  frame: BlogismExportRect,
  mode: "finite" | "infinite",
  desk: { height: number; width: number } = DESK_SIZE,
): BlogismExportTransform {
  if (mode === "infinite") {
    return {
      scaleX: frame.width / PAGE_SIZE.width,
      scaleY: frame.height / PAGE_SIZE.height,
      x: frame.x,
      y: frame.y,
    };
  }
  return {
    scaleX: desk.width / PAGE_SIZE.width,
    scaleY: desk.height / PAGE_SIZE.height,
    x: -desk.width / 2,
    y: -desk.height / 2,
  };
}

function paintPage(
  context: CanvasRenderingContext2D,
  transform: BlogismExportTransform,
  doc: InkDocument,
  title: string,
  body: string,
): void {
  context.save();
  context.translate(transform.x, transform.y);
  context.scale(transform.scaleX, transform.scaleY);
  paintSheet(context, { ...doc, size: PAGE_SIZE }, null, title, body);
  context.restore();
}

export const blogismExportRenderer: ToolcraftProductExportRenderer = {
  baseFileName: "blogism-page",
  renderFrame: ({ context, frame, state }) => {
    paintPage(
      context,
      pageExportTransform(frame, state.canvas.mode, state.canvas.size),
      readInk(state.values),
      readString(state.values, "blogism.title"),
      readString(state.values, "blogism.body"),
    );
  },
};
