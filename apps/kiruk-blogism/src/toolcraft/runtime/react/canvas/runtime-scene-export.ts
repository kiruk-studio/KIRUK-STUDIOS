import type { ToolcraftExportFrame } from "../../export/export-frame";
import type { ToolcraftRuntimeSceneVisibility } from "../../scene";
import type { ToolcraftImageAsset, ToolcraftState } from "../../state/types";
import type { ToolcraftModelRenderHost } from "../model-rendering/model-render-binding";
import { renderToolcraftModelsInWorldContext } from "../model-rendering/model-export-world-context";
import { getVisibleCanvasImageAssets } from "./canvas-default-media-layer";
import { normalizeCanvasMediaRotation } from "./canvas-media-transform";

export type ToolcraftRuntimeSceneExportResult = Readonly<{
  imageCount: number;
  modelCount: number;
}>;

export type ToolcraftCanvasImageLoader = (
  asset: ToolcraftImageAsset,
) => Promise<CanvasImageSource>;

export type ToolcraftCanvasImageResourceResolver = (
  resourceRef: string,
  options: Readonly<{ signal: AbortSignal }>,
) => Promise<Uint8Array | null>;

function loadCanvasImageUrl(
  fileName: string,
  url: string,
): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not decode ${fileName}.`));
    image.src = url;
  });
}

async function loadCanvasImage(
  asset: ToolcraftImageAsset,
  resolveResource: ToolcraftCanvasImageResourceResolver,
): Promise<CanvasImageSource> {
  if (asset.lifecycle !== "ready") {
    throw new Error(`Could not load ${asset.fileName} for export.`);
  }

  const bytes = await resolveResource(asset.resourceRef, {
    signal: new AbortController().signal,
  });

  if (!bytes) {
    throw new Error(`Could not load ${asset.fileName} for export.`);
  }

  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes).buffer], { type: asset.mimeType }),
  );

  try {
    return await loadCanvasImageUrl(asset.fileName, url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawImageAsset(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  asset: ToolcraftImageAsset,
): void {
  const rotation = normalizeCanvasMediaRotation(asset.transform?.rotationDeg);
  const sourceAspect = asset.sourceSize.width / asset.sourceSize.height;
  const sceneAspect = asset.size.width / asset.size.height;
  const sourceWidth = sourceAspect > sceneAspect
    ? asset.sourceSize.height * sceneAspect
    : asset.sourceSize.width;
  const sourceHeight = sourceAspect > sceneAspect
    ? asset.sourceSize.height
    : asset.sourceSize.width / sceneAspect;
  const sourceX = (asset.sourceSize.width - sourceWidth) / 2;
  const sourceY = (asset.sourceSize.height - sourceHeight) / 2;

  context.save();
  context.translate(asset.position.x, asset.position.y);
  context.rotate((rotation * Math.PI) / 180);
  context.scale(
    asset.transform?.flipHorizontal ? -1 : 1,
    asset.transform?.flipVertical ? -1 : 1,
  );
  context.drawImage(
    source,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -asset.size.width / 2,
    -asset.size.height / 2,
    asset.size.width,
    asset.size.height,
  );
  context.restore();
}

export async function renderToolcraftRuntimeSceneToCanvas({
  canvas,
  host,
  loadImage,
  resolveImageResource,
  state,
  visibility,
  outputFrame,
}: Readonly<{
  canvas: HTMLCanvasElement;
  host: ToolcraftModelRenderHost | null;
  loadImage?: ToolcraftCanvasImageLoader;
  resolveImageResource?: ToolcraftCanvasImageResourceResolver;
  state: ToolcraftState;
  visibility: ToolcraftRuntimeSceneVisibility;
  outputFrame: ToolcraftExportFrame;
}>): Promise<ToolcraftRuntimeSceneExportResult> {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Toolcraft scene export requires a 2D target canvas.");
  }

  const modelCount = host
    ? await renderToolcraftModelsInWorldContext({
        canvas,
        context,
        exportFrame: outputFrame,
        host,
        state,
        suppressedTargets: visibility.suppressedModelTargets,
      })
    : 0;
  const images = visibility.renderDefaultImages
    ? getVisibleCanvasImageAssets(state)
    : [];
  const imageLoader =
    loadImage ??
    (resolveImageResource
      ? (asset: ToolcraftImageAsset) =>
          loadCanvasImage(asset, resolveImageResource)
      : null);

  if (images.length > 0 && !imageLoader) {
    throw new Error("Toolcraft scene export cannot resolve image resources.");
  }

  if (imageLoader) {
    for (const asset of images) {
      drawImageAsset(context, await imageLoader(asset), asset);
    }
  }

  return { imageCount: images.length, modelCount };
}
