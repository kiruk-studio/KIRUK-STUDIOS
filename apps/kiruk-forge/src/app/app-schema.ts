import { DEFAULT_COMPONENT_ID } from "@kiruk/kirukal";
import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { FORGE_STAGE_SIZE } from "./forge-stage-size";
import { DEFAULT_ANATOMY } from "../kiruk";

export const FORGE_CATALOG_CONTROL_TYPE = "forgeCatalog";
export const FORGE_ANATOMY_CONTROL_TYPE = "forgeAnatomy";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    size: {
      height: FORGE_STAGE_SIZE.height,
      unit: "px",
      width: FORGE_STAGE_SIZE.width,
    },
    sizing: { mode: "editable-output" },
    upload: false,
  },
  identity: appIdentity,
  panels: {
    controls: {
      sections: [
        {
          controls: {
            component: {
              applicability: { mode: "always" },
              defaultValue: DEFAULT_COMPONENT_ID,
              label: false,
              orderRole: "input",
              performanceRole: "responsiveness",
              target: "forge.component",
              type: FORGE_CATALOG_CONTROL_TYPE,
            },
            anatomy: {
              applicability: { mode: "always" },
              defaultValue: DEFAULT_ANATOMY,
              label: false,
              orderRole: "primary",
              performanceRole: "responsiveness",
              target: "forge.anatomy",
              type: FORGE_ANATOMY_CONTROL_TYPE,
            },
            clearTake: {
              actions: [
                {
                  icon: "eraser",
                  label: "Clear",
                  value: "mark.clear",
                },
              ],
              applicability: { mode: "always" },
              defaultValue: null,
              label: "Current take",
              orderRole: "action",
              performanceRole: "responsiveness",
              target: "mark.clearTake",
              type: "actions",
            },
          },
          id: "component",
          title: "Component",
        },
        {
          controls: {
            kit: {
              actions: [
                {
                  icon: "upload-simple",
                  label: "Publish",
                  value: "kit.publish",
                },
                {
                  icon: "copy",
                  label: "Edit",
                  value: "kit.edit",
                },
              ],
              applicability: { mode: "always" },
              target: "actions.kit",
              type: "panelActions",
            },
          },
          id: "publish",
          title: "Publish",
        },
      ],
      title: "Controls",
    },
  },
  persistence: {
    additionalValueTargets: [
      "mark.id",
      "mark.take",
      "mark.ink",
      "mark.published",
    ],
    include: ["canvas", "panels", "values"],
    key: "toolcraft:kiruk/forge:state:v4",
    storage: "localStorage",
    version: 4,
  },
  toolbar: {
    history: true,
    radar: false,
    zoom: true,
  },
});
