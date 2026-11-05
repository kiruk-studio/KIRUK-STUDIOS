import { defineToolcraft } from "@/toolcraft/runtime";

import { DESK_SIZE } from "../kiruk";
import { appIdentity } from "./app-identity";

const designOnly = {
  all: [{ equals: "design" as const, target: "blogism.side" }],
  mode: "conditional" as const,
};

const developOnly = {
  all: [{ equals: "develop" as const, target: "blogism.side" }],
  mode: "conditional" as const,
};

export const appSchema = defineToolcraft({
  canvas: {
    draggable: true,
    enabled: true,
    renderScale: true,
    size: {
      height: DESK_SIZE.height,
      unit: "px",
      width: DESK_SIZE.width,
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
            side: {
              applicability: { mode: "always" },
              defaultValue: "design",
              label: "Page",
              orderRole: "input",
              options: [
                { label: "Design", value: "design" },
                { label: "Develop", value: "develop" },
              ],
              performanceRole: "responsiveness",
              semanticGroup: "workflow",
              target: "blogism.side",
              type: "tabs",
            },
            tool: {
              applicability: designOnly,
              defaultValue: "ink",
              label: "Tool",
              options: [
                { label: "Ink", value: "ink" },
                { label: "Pencil", value: "pencil" },
                { label: "Eraser", value: "eraser" },
              ],
              orderRole: "input",
              performanceRole: "responsiveness",
              semanticGroup: "ink",
              target: "blogism.tool",
              type: "segmented",
            },
            penOnly: {
              applicability: designOnly,
              defaultValue: true,
              description:
                "Touch is always ignored. Pen only also ignores the mouse so a palm cannot steal the stroke.",
              label: "Pen only",
              performanceRole: "responsiveness",
              semanticGroup: "ink",
              target: "blogism.penOnly",
              type: "switch",
            },
            clear: {
              actions: [
                {
                  icon: "eraser",
                  label: "Clear",
                  value: "page.clear",
                },
              ],
              applicability: designOnly,
              defaultValue: null,
              label: "Sheet",
              orderRole: "action",
              performanceRole: "responsiveness",
              semanticGroup: "ink",
              target: "blogism.clear",
              type: "actions",
            },
            title: {
              applicability: developOnly,
              commitMode: "content",
              defaultValue: "",
              label: "Title",
              orderRole: "input",
              performanceRole: "responsiveness",
              semanticGroup: "copy",
              target: "blogism.title",
              textValueKind: "single-line",
              type: "text",
            },
            excerpt: {
              applicability: developOnly,
              commitMode: "content",
              defaultValue: "",
              label: "Excerpt",
              orderRole: "input",
              performanceRole: "responsiveness",
              semanticGroup: "copy",
              target: "blogism.excerpt",
              textValueKind: "single-line",
              type: "text",
            },
            collection: {
              applicability: developOnly,
              defaultValue: "blog",
              label: "Collection",
              options: [
                { label: "Blog", value: "blog" },
                { label: "Notes", value: "notes" },
              ],
              performanceRole: "responsiveness",
              semanticGroup: "copy",
              target: "blogism.collection",
              type: "select",
            },
            draft: {
              applicability: developOnly,
              defaultValue: true,
              label: "Draft",
              performanceRole: "responsiveness",
              semanticGroup: "copy",
              target: "blogism.draft",
              type: "switch",
            },
            body: {
              applicability: developOnly,
              commitMode: "content",
              defaultValue: "",
              description:
                "Short clean-type captions that sit on the sheet with the ink, not a second Word document.",
              label: "Body",
              orderRole: "input",
              performanceRole: "responsiveness",
              semanticGroup: "copy",
              target: "blogism.body",
              textValueKind: "multiline",
              type: "code",
            },
          },
          id: "page",
          title: "Page",
        },
        {
          controls: {
            includeBackground: {
              applicability: { mode: "always" },
              defaultValue: true,
              description:
                "Shows the white sheet in preview and PNG. Video would keep it either way.",
              label: "Include",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              applicability: { mode: "always" },
              defaultValue: "#FFFFFF",
              label: false,
              performanceRole: "responsiveness",
              target: "appearance.background",
              type: "color",
            },
          },
          id: "background",
          layoutGroups: [
            {
              columns: 2,
              controls: ["includeBackground", "background"],
              layout: "inline",
            },
          ],
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
              performanceRole: "responsiveness",
              target: "export.image.resolution",
              type: "select",
            },
          },
          id: "image-export",
          layoutGroups: [
            {
              columns: 2,
              controls: ["imageFormat", "imageResolution"],
              layout: "inline",
            },
          ],
          title: "Image Export",
        },
        {
          actionGroup: "primary",
          controls: {
            outputActions: {
              applicability: { mode: "always" },
              actions: [
                {
                  icon: "download-simple",
                  label: "Save",
                  value: "kit.save",
                },
                {
                  icon: "check",
                  label: "Publish",
                  value: "kit.publish",
                },
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
          title: "Delivery",
        },
      ],
      title: "Controls",
    },
  },
  persistence: {
    additionalValueTargets: ["blogism.ink"],
    include: ["canvas", "panels", "values"],
    key: "toolcraft:kiruk/blogism:state:v1",
    storage: "localStorage",
    version: 1,
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
