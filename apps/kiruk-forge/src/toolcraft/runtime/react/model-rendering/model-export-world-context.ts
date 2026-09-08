import type { ToolcraftExportFrame } from "../../export/export-frame";
import { getToolcraftSceneElementRect } from "../../scene";
import type { ToolcraftState } from "../../state/types";
import type { ToolcraftModelRenderHost } from "./model-render-binding";
import { getToolcraftVisibleModelExportRequests } from "./model-render-state";

export type ToolcraftModelWorldContextRenderRequest = Readonly<{
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  exportFrame: ToolcraftExportFrame;
  host: ToolcraftModelRenderHost;
  state: ToolcraftState;
  suppressedTargets?: readonly string[];
}>;

function getExportPixelRatio(
  frame: ToolcraftExportFrame,
  canvas: HTMLCanvasElement,
): number {
  const pixelRatio = Math.min(
    canvas.width / frame.width,
    canvas.height / frame.height,
  );
  return Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
}

export async function renderToolcraftModelsInWorldContext({
  canvas,
  context,
  exportFrame,
  host,
  state,
  suppressedTargets,
}: ToolcraftModelWorldContextRenderRequest): Promise<number> {
  const pixelRatio = getExportPixelRatio(exportFrame, canvas);
  const requests = getToolcraftVisibleModelExportRequests(state, {
    suppressedTargets,
    viewportForAsset: (asset) => {
      const rect = getToolcraftSceneElementRect(asset);
      return { height: rect.height, width: rect.width };
    },
  });

  for (const request of requests) {
    const rect = getToolcraftSceneElementRect(request.asset);
    await host.renderExport(request, {
      height: rect.height,
      onRendered: (source) => {
        context.drawImage(source, rect.x, rect.y, rect.width, rect.height);
      },
      pixelRatio,
      width: rect.width,
    });
  }

  return requests.length;
}
