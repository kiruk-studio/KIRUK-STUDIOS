import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import { INK_TARGET } from "../kiruk";

type BlogismRendererPasses = {
  "sheet-paint": ToolcraftRendererPipelinePassContract<string[]>;
};

const previewPass = "sheet-paint" as const;

export const appRendererPipelineRegistration =
  registerToolcraftRendererPipeline<BlogismRendererPasses>()({
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
          "blogism.side",
          "blogism.tool",
          "blogism.penOnly",
          "blogism.title",
          "blogism.excerpt",
          "blogism.body",
          "blogism.collection",
          "blogism.draft",
          INK_TARGET,
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
          INK_TARGET,
          "blogism.title",
          "blogism.body",
          "export.includeBackground",
          "appearance.background",
        ],
        invalidatedBy: [
          INK_TARGET,
          "blogism.title",
          "blogism.body",
          "export.includeBackground",
          "appearance.background",
        ],
        kind: "vector-build",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "preview",
        quality: "full",
        runsOn: "main",
      },
    ],
    runtimeId: "kiruk-blogism-sheet",
  });
