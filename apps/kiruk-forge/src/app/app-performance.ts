import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appRendererPipelineRegistration } from "./forge-pipeline";
import { appSchema } from "./app-schema";

const basePerformance = defineToolcraftPerformance({
  rendererPipeline: appRendererPipelineRegistration,
  rendererStrategy: "dom",
  rendererTechnique: {
    exportRenderer: "none",
    fidelityRisks: [
      "Live Base UI construction must not be replaced with fake sketched strokes when the recipe is empty.",
    ],
    intentionalRasterizationReason:
      "The pen overlay rasterizes only the in-progress stroke; committed ink replays on the live component.",
    layers: [
      {
        content: ["geometry"],
        exportMode: "excluded",
        id: "component-stage",
        kind: "product-foreground",
        primitiveCount: "low",
        renderer: "dom",
        uiSelector: "[data-kiruk-forge-stage]",
      },
      {
        content: ["dense-pattern"],
        exportMode: "excluded",
        id: "pen-overlay",
        intentionalRasterizationReason:
          "Coalesced tablet samples stay on a Canvas 2D overlay during capture.",
        kind: "product-foreground",
        primitiveCount: "medium",
        renderer: "canvas-2d",
        uiSelector: "[data-kiruk-forge-pen]",
      },
    ],
    performanceRisks: [
      "Live freehand outlines resample on animation frames while the pointer is down.",
    ],
    previewRenderer: "dom",
    productRepresentation: "mixed",
    rendererStrategy: "dom",
    sourceRepresentation: "procedural-data",
    whyNotAlternativeStrategies: [
      "Canvas 2D alone would keep magenta paper as the product and hide the live Base UI component.",
      "SVG cannot capture coalesced tablet samples onto the active hotspot.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: { dimensions: [] },
} satisfies ToolcraftEnvelopePerformanceConfig);

const paths = deriveToolcraftPerformancePaths(appSchema, basePerformance);

const scenarios: ToolcraftPerformanceScenario[] = paths
  .filter((path) => path.interaction !== "export")
  .map((path) => ({
  automated: true,
  automatedTestName: `forge ${path.interaction} stays on the paper`,
  browser: true,
  browserTestName: `browser perf: forge ${path.interaction}`,
  coversTargets: path.targets,
  expectedObservable:
    "The named component stage stays on the current piece without hitching the live stroke.",
  fixture: "default Button stage",
  id: `forge-${path.interaction}`,
  interaction: path.interaction as Exclude<
    (typeof path)["interaction"],
    "export"
  >,
  pathId: path.id,
  ...(path.interaction === "control-change"
    ? { uiSelector: '[data-toolcraft-control-target="forge.component"]' }
    : {}),
}));

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...basePerformance,
    scenarios,
  });
