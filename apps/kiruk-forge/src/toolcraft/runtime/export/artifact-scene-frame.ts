import {
  getToolcraftFiniteArtboardRect,
  resolveToolcraftProductSceneFrame,
  resolveToolcraftSceneBounds,
  unionToolcraftSceneRects,
  type ToolcraftProductSceneFrame,
  type ToolcraftProductSceneBoundsProvider,
  type ToolcraftRuntimeSceneVisibility,
  type ToolcraftSceneRect,
} from "../scene";
import { getToolcraftCanvasFrame } from "../state/canvas-frame";
import type { ToolcraftState } from "../state/types";
import type { ToolcraftVideoArtifactFramePlanEntry } from "./artifact-frame-state";
import {
  resolveToolcraftExportFrame,
  ToolcraftSceneExportError,
  type ToolcraftExportFrame,
  type ToolcraftExportFrameResult,
} from "./export-frame";

type ToolcraftArtifactSceneFrameBaseRequest = Readonly<{
  boundsProvider: ToolcraftProductSceneBoundsProvider | undefined;
  productSceneRequired: boolean;
  visibility: ToolcraftRuntimeSceneVisibility;
}>;

export type ToolcraftStillArtifactSceneFrameRequest =
  ToolcraftArtifactSceneFrameBaseRequest &
    Readonly<{ state: ToolcraftState }>;

export type ToolcraftVideoArtifactSceneFrameRequest =
  ToolcraftArtifactSceneFrameBaseRequest &
    Readonly<{ framePlan: readonly ToolcraftVideoArtifactFramePlanEntry[] }>;

export type ToolcraftArtifactScenePlan = Readonly<{
  outputFrame: ToolcraftExportFrame;
  productFrame: ToolcraftProductSceneFrame;
}>;

export type ToolcraftVideoArtifactScenePlanEntry =
  ToolcraftVideoArtifactFramePlanEntry &
    Readonly<{ productFrame: ToolcraftProductSceneFrame }>;

export type ToolcraftVideoArtifactScenePlan = Readonly<{
  framePlan: readonly ToolcraftVideoArtifactScenePlanEntry[];
  outputFrame: ToolcraftExportFrame;
}>;

function requireFrame(result: ToolcraftExportFrameResult): ToolcraftExportFrame {
  if (!result.ok) {
    throw new ToolcraftSceneExportError(result);
  }

  return result.frame;
}

function resolveProductFrame(
  state: ToolcraftState,
  request: ToolcraftArtifactSceneFrameBaseRequest,
): ToolcraftProductSceneFrame {
  if (!request.productSceneRequired) {
    return { kind: "empty", rect: null };
  }

  const canvas = getToolcraftCanvasFrame(state.canvas);
  const productFrame = resolveToolcraftProductSceneFrame({
    boundsProvider: request.boundsProvider,
    fallbackRect:
      !request.boundsProvider &&
      canvas.kind === "finite"
        ? getToolcraftFiniteArtboardRect(canvas.size)
        : undefined,
    state,
  });

  if (productFrame.kind === "unavailable") {
    throw new ToolcraftSceneExportError({
      code: "scene-bounds-unavailable",
      message: request.boundsProvider
        ? "Product scene bounds are unavailable or invalid."
        : "This infinite product scene does not provide export bounds.",
      ok: false,
    });
  }

  return productFrame;
}

function isFiniteCanvas(state: ToolcraftState): boolean {
  return getToolcraftCanvasFrame(state.canvas).kind === "finite";
}

export function resolveToolcraftStillArtifactFrame(
  request: ToolcraftStillArtifactSceneFrameRequest,
): ToolcraftArtifactScenePlan {
  const productFrame = resolveProductFrame(request.state, request);
  const bounds = isFiniteCanvas(request.state)
    ? null
    : resolveToolcraftSceneBounds(
        request.state,
        productFrame.kind === "ready" ? [productFrame.rect] : [],
        request.visibility,
      );
  return {
    outputFrame: requireFrame(
      resolveToolcraftExportFrame(request.state, bounds),
    ),
    productFrame,
  };
}

export function resolveToolcraftVideoArtifactFrame(
  request: ToolcraftVideoArtifactSceneFrameRequest,
): ToolcraftVideoArtifactScenePlan {
  const firstState = request.framePlan[0]?.state;
  if (!firstState) {
    throw new ToolcraftSceneExportError({
      code: "empty-scene",
      message: "Video export has no scheduled frames.",
      ok: false,
    });
  }
  const frameBounds: ToolcraftSceneRect[] = [];
  const finite = isFiniteCanvas(firstState);
  const framePlan = request.framePlan.map((entry) => {
    const productFrame = resolveProductFrame(entry.state, request);
    if (!finite) {
      const result = resolveToolcraftSceneBounds(
        entry.state,
        productFrame.kind === "ready" ? [productFrame.rect] : [],
        request.visibility,
      );
      if (result.ok) {
        frameBounds.push(result.bounds);
      } else if (result.code !== "empty-scene") {
        throw new ToolcraftSceneExportError(result);
      }
    }
    return Object.freeze({ ...entry, productFrame });
  });

  return {
    framePlan: Object.freeze(framePlan),
    outputFrame: requireFrame(
      resolveToolcraftExportFrame(
        firstState,
        finite ? null : unionToolcraftSceneRects(frameBounds),
      ),
    ),
  };
}
