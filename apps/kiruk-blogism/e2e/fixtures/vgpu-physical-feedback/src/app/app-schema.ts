import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: true,
    size: { height: 200, unit: "px", width: 320 },
    sizing: { mode: "editable-output" },
  },
  identity: appIdentity,
  panels: {
    controls: {
      sections: [
        {
          controls: {
            enabled: {
              applicability: { mode: "always" },
              defaultValue: true,
              label: "Field",
              performanceRole: "responsiveness",
              target: "simulation.enabled",
              type: "switch",
            },
            impulse: {
              applicability: {
                all: [{ equals: true, target: "simulation.enabled" }],
                mode: "conditional",
              },
              defaultValue: 0.35,
              label: "Impulse",
              max: 1,
              min: 0.1,
              performanceRole: "responsiveness",
              step: 0.05,
              target: "simulation.impulse",
              type: "slider",
              variant: "continuous",
            },
          },
          id: "simulation",
          title: "Simulation",
        },
        {
          controls: {
            includeBackground: {
              applicability: { mode: "always" },
              defaultValue: true,
              description:
                "Controls the physical field background in preview and PNG output.",
              label: "Include",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              applicability: { mode: "always" },
              defaultValue: "#141F38",
              label: false,
              performanceRole: "responsiveness",
              target: "appearance.background",
              type: "color",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["includeBackground", "background"],
              layout: "inline",
            },
          ],
          id: "background",
          title: "Background",
        },
        {
          controls: {
            imageFormat: {
              applicability: { mode: "always" },
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              applicability: { mode: "always" },
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              performanceReason:
                "Image resolution changes the number of pixels computed and presented during export.",
              performanceRole: "workload",
              target: "export.image.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["imageFormat", "imageResolution"],
              layout: "inline",
            },
          ],
          id: "image-export",
          title: "Image Export",
        },
        {
          actionGroup: "secondary",
          controls: {
            outputActions: {
              applicability: {
                all: [{ equals: true, target: "simulation.enabled" }],
                mode: "conditional",
              },
              actions: [
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  role: "export-image",
                  value: "export.png",
                },
              ],
              target: "actions.output",
              type: "panelActions",
            },
          },
          id: "export-actions",
          title: "Export",
        },
      ],
      title: "Physical Field Controls",
    },
    timeline: {
      defaultDurationSeconds: 2,
      enabled: true,
      mode: "playback",
    },
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
