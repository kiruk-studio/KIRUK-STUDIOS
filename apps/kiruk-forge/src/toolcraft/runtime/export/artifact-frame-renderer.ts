import type { ToolcraftRendererPipelineClient } from "../rendering";
import type { ToolcraftProductSceneFrame } from "../scene";
import type { ToolcraftState } from "../state/types";
import type { ToolcraftExportFrame } from "./export-frame";
import {
  normalizeToolcraftExportError,
  ToolcraftArtifactExportError,
} from "./export-error";
import type { ToolcraftProductExportFrameRenderer } from "./product-export-renderer";
import { getToolcraftArtifactTimelineProgress } from "./artifact-frame-state";

export type ToolcraftArtifactFrameRenderRequest = Readonly<{
  backgroundColor: string;
  canvas: HTMLCanvasElement;
  outputFrame: ToolcraftExportFrame;
  includeBackground: boolean;
  pixelRatio: number;
  productFrame: ToolcraftProductSceneFrame;
  renderProductFrame: ToolcraftProductExportFrameRenderer | null;
  renderRuntimeScene: (
    canvas: HTMLCanvasElement,
    frame: ToolcraftExportFrame,
    state: ToolcraftState,
  ) => Promise<unknown>;
  rendererPipeline: ToolcraftRendererPipelineClient | null;
  state: ToolcraftState;
}>;

export async function renderToolcraftArtifactFrame(
  request: ToolcraftArtifactFrameRenderRequest,
): Promise<void> {
  const context = request.canvas.getContext("2d");
  if (!context) {
    throw new ToolcraftArtifactExportError({
      code: "canvas-context-unavailable",
      message: "Toolcraft export requires a 2D canvas context.",
    });
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, request.canvas.width, request.canvas.height);
  if (request.includeBackground) {
    context.fillStyle = request.backgroundColor;
    context.fillRect(0, 0, request.canvas.width, request.canvas.height);
  }

  const scaleX = request.canvas.width / request.outputFrame.width;
  const scaleY = request.canvas.height / request.outputFrame.height;
  context.save();
  try {
    context.setTransform(
      scaleX,
      0,
      0,
      scaleY,
      -request.outputFrame.x * scaleX,
      -request.outputFrame.y * scaleY,
    );
    try {
      await request.renderRuntimeScene(
        request.canvas,
        request.outputFrame,
        request.state,
      );
    } catch (error) {
      throw normalizeToolcraftExportError(error, {
        code: "runtime-scene-render-failed",
        message: "Toolcraft could not render runtime scene layers for export.",
      });
    }

    if (request.renderProductFrame && request.productFrame.kind === "ready") {
      try {
        await request.renderProductFrame({
          context,
          frame: request.productFrame.rect,
          pixelRatio: request.pixelRatio,
          rendererPipeline: request.rendererPipeline,
          state: request.state,
          timeSeconds: request.state.timeline.currentTimeSeconds,
          timelineProgress: getToolcraftArtifactTimelineProgress(request.state),
        });
      } catch (error) {
        throw normalizeToolcraftExportError(error, {
          code: "product-frame-render-failed",
          message: "Toolcraft could not render product pixels for export.",
        });
      }
    }
  } finally {
    context.restore();
  }
}
