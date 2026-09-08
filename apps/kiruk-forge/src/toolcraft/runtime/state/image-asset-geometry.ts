import type {
  ToolcraftCanvasSize,
  ToolcraftCanvasSizingMode,
} from "../schema/types";
import type {
  ToolcraftImageAsset,
  ToolcraftImageAssetDraft,
  ToolcraftImageAssetIngress,
  ToolcraftPoint,
  ToolcraftSceneElementFrame,
} from "./types";

export type ToolcraftImageAssetGeometryContext = {
  canvasMode: "finite" | "infinite";
  canvasSize: ToolcraftCanvasSize;
  sizingMode: ToolcraftCanvasSizingMode;
};

type ToolcraftImageAssetGeometry = ToolcraftSceneElementFrame & {
  sourceSize: ToolcraftCanvasSize;
};

function cloneGeometry(
  geometry: ToolcraftImageAssetGeometry,
): ToolcraftImageAssetGeometry {
  return {
    position: { ...geometry.position },
    size: { ...geometry.size },
    sourceSize: { ...geometry.sourceSize },
  };
}

function withCanonicalGeometry(
  asset: ToolcraftImageAssetIngress["asset"],
  geometry: ToolcraftImageAssetGeometry,
): ToolcraftImageAssetDraft {
  const canonicalGeometry = {
    ...cloneGeometry(geometry),
  };

  if (asset.lifecycle === "unavailable") {
    return {
      ...asset,
      ...canonicalGeometry,
      error: { ...asset.error },
      ...(asset.transform ? { transform: { ...asset.transform } } : {}),
    };
  }

  return {
    ...asset,
    ...canonicalGeometry,
    ...(asset.transform ? { transform: { ...asset.transform } } : {}),
  };
}

export function cloneToolcraftImageAsset(
  asset: ToolcraftImageAsset,
): ToolcraftImageAsset {
  return {
    ...asset,
    ...(asset.lifecycle === "unavailable"
      ? { error: { ...asset.error } }
      : {}),
    ...cloneGeometry(asset),
    ...(asset.transform ? { transform: { ...asset.transform } } : {}),
  };
}

export function normalizeToolcraftImageAssetGeometry(
  ingress: ToolcraftImageAssetIngress,
  context: ToolcraftImageAssetGeometryContext,
): ToolcraftImageAssetDraft {
  switch (ingress.policy) {
    case "canonical-runtime":
      return withCanonicalGeometry(ingress.asset, ingress.asset);

    case "prepared-source": {
      const preserveSourceFrame =
        context.canvasMode === "infinite" ||
        context.sizingMode === "intrinsic-media";

      return withCanonicalGeometry(ingress.asset, {
        position: preserveSourceFrame
          ? ingress.asset.position
          : { x: 0, y: 0 },
        size: preserveSourceFrame
          ? ingress.asset.sourceSize
          : context.canvasSize,
        sourceSize: ingress.asset.sourceSize,
      });
    }

    case "legacy-record": {
      const position: ToolcraftPoint = ingress.asset.position ?? { x: 0, y: 0 };
      const sourceSize =
        ingress.asset.sourceSize ?? ingress.asset.size ?? context.canvasSize;
      const preserveLegacyScene =
        context.canvasMode === "infinite" ||
        context.sizingMode === "intrinsic-media";

      return withCanonicalGeometry(ingress.asset, {
        position: preserveLegacyScene ? position : { x: 0, y: 0 },
        size: preserveLegacyScene
          ? (ingress.asset.size ?? sourceSize)
          : context.canvasSize,
        sourceSize,
      });
    }
  }
}
