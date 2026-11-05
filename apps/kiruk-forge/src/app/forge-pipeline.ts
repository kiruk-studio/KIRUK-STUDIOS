import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

type ForgeRendererPasses = {
  "vector-build": ToolcraftRendererPipelinePassContract<string[]>;
};

const previewPass = "vector-build" as const;

export const appRendererPipelineRegistration =
  registerToolcraftRendererPipeline<ForgeRendererPasses>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: [previewPass],
        targets: ["canvas.initial-render"],
      },
      {
        interaction: "control-change",
        invalidates: [previewPass],
        targets: [
          "forge.component",
          "forge.anatomy",
          "mark.id",
          "mark.take",
          "mark.ink",
          "export.includeBackground",
          "appearance.background",
        ],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: [previewPass],
        targets: ["canvas.viewport.offset"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: [previewPass],
        targets: ["canvas.viewport.zoom"],
      },
    ],
    passes: [
      {
        cost: { dimensions: [], frequency: "discrete", relationship: "constant" },
        id: previewPass,
        inputs: [
          "forge.component",
          "forge.anatomy",
          "mark.ink",
          "mark.id",
          "mark.take",
        ],
        invalidatedBy: [
          "forge.component",
          "forge.anatomy",
          "mark.ink",
          "mark.id",
          "mark.take",
        ],
        kind: "vector-build",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "preview",
        quality: "full",
        runsOn: "main",
      },
    ],
    runtimeId: "kiruk-forge-mark",
  });
