import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import {
  appSchema,
  FORGE_ANATOMY_CONTROL_TYPE,
  FORGE_CATALOG_CONTROL_TYPE,
} from "./app-schema";
import { ForgeAnatomyControl } from "./forge-anatomy-control";
import { ForgeCatalogControl } from "./forge-catalog-control";
import { runForgeKitAction } from "./forge-kit";
import { ForgeComponentStage } from "./forge-stage";
import { forgeMarkSceneBounds } from "./forge-viewport";
import { appRendererPipelineRegistration } from "./forge-pipeline";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <ForgeComponentStage />,
  controlRenderers: {
    [FORGE_ANATOMY_CONTROL_TYPE]: ForgeAnatomyControl,
    [FORGE_CATALOG_CONTROL_TYPE]: ForgeCatalogControl,
  },
  modelPresentation: { mode: "runtime" },
  onPanelAction: runForgeKitAction,
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration: appRendererPipelineRegistration,
  sceneBoundsProvider: ({ state }) => [
    forgeMarkSceneBounds({
      height: state.canvas.size.height,
      width: state.canvas.size.width,
    }),
  ],
  schema: appSchema,
};
