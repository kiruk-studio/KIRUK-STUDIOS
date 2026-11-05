import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { appRendererPipelineRegistration } from "./blogism-pipeline";

const basePerformance = defineToolcraftPerformance({
  rendererPipeline: appRendererPipelineRegistration,
  rendererStrategy: "canvas-2d",
  rendererTechnique: {
    exportRenderer: "canvas-2d",
    fidelityRisks: [
      "Live freehand outlines resample while the pointer is down; export uses committed strokes only.",
    ],
    intentionalRasterizationReason:
      "Tablet pressure and coalesced samples share one Canvas 2D backing so the sheet stays honest during capture.",
    layers: [
      {
        content: ["geometry", "text"],
        exportMode: "included",
        id: "blogism-sheet",
        intentionalRasterizationReason:
          "The finite white page is the design sheet; ink and captions rasterize only for preview and PNG.",
        kind: "product-foreground",
        primitiveCount: "medium",
        renderer: "canvas-2d",
        uiSelector: "[data-kiruk-blogism-page]",
      },
    ],
    performanceRisks: [
      "Live freehand outlines resample on animation frames while the pointer is down.",
    ],
    previewRenderer: "canvas-2d",
    productRepresentation: "pixel",
    rendererStrategy: "canvas-2d",
    sourceRepresentation: "procedural-data",
    whyNotAlternativeStrategies: [
      "SVG would freeze pressure into static paths and cannot host the live pen stream.",
      "DOM cannot capture coalesced tablet samples onto the page sheet.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: { dimensions: [] },
} satisfies ToolcraftEnvelopePerformanceConfig);

const paths = deriveToolcraftPerformancePaths(appSchema, basePerformance);

const scenarios: ToolcraftPerformanceScenario[] = paths.map((path) => {
  const shared = {
    automated: true as const,
    automatedTestName: `blogism ${path.interaction} stays on the sheet`,
    browser: true as const,
    browserTestName: `browser perf: blogism ${path.interaction}`,
    coversTargets: path.targets,
    expectedObservable:
      "The white page sheet stays on the current ink without hitching the live stroke.",
    fixture: "default white page sheet",
    id: `blogism-${path.interaction}`,
    pathId: path.id,
  };

  if (path.interaction === "export") {
    return {
      ...shared,
      actionValue: "export.png",
      completionEvidence: "download" as const,
      controlLabel: "Export PNG",
      interaction: "export" as const,
    };
  }

  return {
    ...shared,
    interaction: path.interaction,
    ...(path.interaction === "control-change"
      ? { uiSelector: '[data-toolcraft-control-target="blogism.side"]' }
      : {}),
  };
});

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...basePerformance,
    scenarios,
  });
