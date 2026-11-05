import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { blogismExportRenderer } from "./blogism-export";
import { runBlogismKitAction } from "./blogism-kit";
import { BlogismPageCanvas } from "./blogism-page-canvas";
import { appRendererPipelineRegistration } from "./blogism-pipeline";
import { blogismPageSceneBounds } from "./blogism-viewport";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <BlogismPageCanvas />,
  exportRenderer: blogismExportRenderer,
  modelPresentation: { mode: "runtime" },
  onPanelAction: runBlogismKitAction,
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration: appRendererPipelineRegistration,
  sceneBoundsProvider: () => [blogismPageSceneBounds()],
  schema: appSchema,
};
