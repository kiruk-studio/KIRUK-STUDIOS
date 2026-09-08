import {
  resolveToolcraftExportFrame,
  ToolcraftSceneExportError,
  type ToolcraftExportFrame,
} from "../../export/export-frame";
import type { ToolcraftState } from "../../state/types";
import type { ToolcraftModelRenderHost } from "./model-render-binding";
import { renderToolcraftModelsInWorldContext } from "./model-export-world-context";

export type ToolcraftRenderModelsToCanvas = (
  canvas: HTMLCanvasElement,
) => Promise<number>;

export type ToolcraftModelExportOptions = Readonly<{
  exportFrame: ToolcraftExportFrame;
  suppressedTargets?: readonly string[];
}>;

function resolveModelExportOptions(
  state: ToolcraftState,
  options: ToolcraftModelExportOptions | undefined,
): ToolcraftModelExportOptions {
  if (options) return options;
  const result = resolveToolcraftExportFrame(state, null);
  if (!result.ok) throw new ToolcraftSceneExportError(result);
  return {
    exportFrame: result.frame,
  };
}

export async function renderToolcraftModelsToCanvas(
  host: ToolcraftModelRenderHost | null,
  state: ToolcraftState,
  canvas: HTMLCanvasElement,
  options?: ToolcraftModelExportOptions,
): Promise<number> {
  if (!host) return 0;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Toolcraft model export requires a 2D target canvas.");
  }
  const resolved = resolveModelExportOptions(state, options);
  const scaleX = canvas.width / resolved.exportFrame.width;
  const scaleY = canvas.height / resolved.exportFrame.height;
  context.save();
  try {
    context.setTransform(
      scaleX,
      0,
      0,
      scaleY,
      -resolved.exportFrame.x * scaleX,
      -resolved.exportFrame.y * scaleY,
    );
    return await renderToolcraftModelsInWorldContext({
      canvas,
      context,
      exportFrame: resolved.exportFrame,
      host,
      state,
      suppressedTargets: resolved.suppressedTargets,
    });
  } finally {
    context.restore();
  }
}
