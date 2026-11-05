import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

const canvasBrowser = {
  budget: "standard" as const,
  file: "e2e/product-blogism.spec.ts" as const,
};

const pageBrowser = {
  budget: "standard" as const,
  file: "e2e/product-blogism-page.spec.ts" as const,
};

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "A canvas copy of Design/Develop would hide the structure fields behind the sheet.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "Usability comparison keeps the workflow tabs in the panel so they replace the controls below them.",
        source: "usability-analysis",
      },
      id: "page-side",
      reason:
        "The controls panel owns Design versus Develop because that choice replaces the panel body, not the sheet.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: "blogism.side",
    },
    {
      alternative: {
        reason:
          "Putting ink, pencil, and eraser as canvas chrome would cover the handwriting.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "Usability comparison keeps the tool segmented control beside Pen only in Design.",
        source: "usability-analysis",
      },
      id: "page-tool",
      reason:
        "The panel owns the drawing tool because it is a discrete mode, not a spatial handle.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: "blogism.tool",
    },
    {
      alternative: {
        reason:
          "Title and body on the canvas would become a Word column fighting the ink.",
        surface: "canvas",
      },
      capability: "precise-value-entry",
      evidence: {
        detail:
          "The requested Develop side keeps typed captions as panel fields that paint onto the sheet.",
        source: "user-request",
      },
      id: "page-title",
      reason:
        "The panel owns title entry so the sheet stays spatial handwriting, not a text editor.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: "blogism.title",
    },
    {
      alternative: {
        reason:
          "Panel buttons would separate continuous panning from the spatial viewport it controls.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "Usability comparison selects direct canvas dragging for continuous viewport offset.",
        source: "usability-analysis",
      },
      id: "viewport-pan",
      reason:
        "The canvas owns viewport panning because the gesture directly moves the visible world frame.",
      surface: "canvas",
      target: "canvas.setOffset",
    },
    {
      alternative: {
        reason:
          "Panel zoom would duplicate runtime zoom tools and detach focus from the sheet.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "Usability comparison selects canvas wheel and runtime zoom around the active viewport.",
        source: "usability-analysis",
      },
      id: "viewport-zoom",
      reason:
        "The canvas owns viewport zoom because scale and focus need immediate spatial feedback.",
      surface: "canvas",
      target: "canvas.setViewport",
    },
  ],
  mode: "product",
  productName: "BLOGISM",
  productSummary:
    "A white finite page for tablet ink and a Develop panel for title, collection, and kiruk.in save.",
  requestedBehavior:
    "Sketch on the white sheet with a pen, then develop typed captions and save MDX plus ink into the kiruk.in git CMS.",
  viewInteraction: {
    mode: "non-spatial",
    reason: "The notebook sheet is two-dimensional handwriting, not a 3D model camera.",
  },
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName:
      "declares production reload coverage for the generated product schema",
    browser: {
      budget: "extended-io",
      file: "e2e/app-persistence.spec.ts" as const,
      testName:
        "browser: app restores exact canvas, values, and panel workspace slices after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size and zoom, page values, and the Controls workspace restore after a real browser reload.",
    fixture: "blogism persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "canvas.size.width",
    userAction: "Edit Canvas width, title, and zoom, then reload.",
  },
  {
    automated: true,
    automatedTestName: "page sheet captures a pen stroke",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM canvas captures a pen stroke",
    },
    componentType: "canvas",
    evidence: "product-output",
    expectedObservable: "A pen stroke commits ink onto the white page sheet.",
    fixture: "empty white page",
    id: "renderer.draw-stroke",
    kind: "runtime",
    target: "blogism.ink",
    userAction: "Draw a pen stroke on the page sheet.",
  },
  {
    automated: true,
    automatedTestName: "page sheet uses selected backing pixels",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM uses selected backing pixels",
    },
    componentType: "canvas",
    evidence: "rendered-pixels",
    expectedObservable:
      "Page backing remains CSS size times device pixel ratio times selected scale during steady and interaction.",
    fixture: "finite white page at render scale 2",
    id: "renderer.render-scale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "steady"],
    },
    target: "canvas.renderScale",
    userAction: "Keep render scale 2 and inspect live backing pixels.",
  },
  {
    automated: true,
    automatedTestName: "page sheet uses runtime scene bounds",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM Infinity canvas preserves the page scene",
    },
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity mode changes only the finite desk boundary while the page scene, renderer identity, and live backing remain continuous.",
    fixture: "white page on the desk",
    id: "renderer.infinity-mode",
    infinityCanvasCoverage: "mode-continuity-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Toggle Infinity both directions and inspect page frame continuity.",
  },
  {
    automated: true,
    automatedTestName: "page sheet export crops to runtime scene bounds",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM export crops to Infinity scene bounds",
    },
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinity PNG export crops to the page sheet rather than the dormant finite desk size.",
    fixture: "white page scene-bounds image crop",
    id: "renderer.infinity-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Enable Infinity canvas and compare decoded export dimensions with the page.",
  },
  {
    automated: true,
    automatedTestName: "page sheet coalesces viewport activity",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM canvas pan coalesces and resumes",
    },
    componentType: "canvas viewport",
    evidence: "viewport-side-effect",
    expectedObservable: "Viewport pan moves the world frame without changing playback state.",
    fixture: "interactive page viewport",
    id: "renderer.viewport",
    interactionId: "viewport-pan",
    kind: "runtime",
    target: "canvas.setOffset",
    userAction: "Drag the canvas while observing the page sheet.",
  },
  {
    automated: true,
    automatedTestName: "page sheet canvas zoom coalesces and resumes",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM canvas zoom coalesces and resumes",
    },
    componentType: "canvas viewport",
    evidence: "viewport-side-effect",
    expectedObservable: "Viewport zoom scales the page without changing ink state.",
    fixture: "interactive page viewport",
    id: "renderer.viewport-zoom",
    interactionId: "viewport-zoom",
    kind: "runtime",
    target: "canvas.setViewport",
    userAction: "Zoom the canvas while observing the page sheet.",
  },
  {
    automated: true,
    automatedTestName: "design develop tabs replace the panel body",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM Design and Develop tabs swap the panel",
    },
    componentType: "tabs",
    evidence: "command-side-effect",
    expectedObservable:
      "Design shows ink tools; Develop shows title, excerpt, collection, and body.",
    fixture: "page workflow tabs",
    id: "renderer.side",
    interactionId: "page-side",
    kind: "control",
    optionCoverage: ["design", "develop"],
    target: "blogism.side",
    userAction: "Switch Design and Develop and watch the panel body plus data-blogism-side.",
  },
  {
    automated: true,
    automatedTestName: "ink pencil eraser change the live tool",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM tool options stay selectable",
    },
    componentType: "segmented",
    evidence: "command-side-effect",
    expectedObservable: "Ink, pencil, and eraser remain selectable on Design.",
    fixture: "design tools",
    id: "renderer.tool",
    interactionId: "page-tool",
    kind: "control",
    optionCoverage: ["ink", "pencil", "eraser"],
    target: "blogism.tool",
    userAction: "Select Ink, Pencil, and Eraser.",
  },
  {
    automated: true,
    automatedTestName: "pen only rejects mouse until turned off",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM pen only rejects the mouse",
    },
    componentType: "switch",
    evidence: "command-side-effect",
    expectedObservable: "Pen only on ignores mouse; off accepts a mouse stroke.",
    fixture: "design pen gate",
    id: "renderer.pen-only",
    kind: "control",
    target: "blogism.penOnly",
    userAction: "Toggle Pen only and attempt a mouse stroke.",
  },
  {
    automated: true,
    automatedTestName: "clear empties the current sheet",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM clear empties the sheet",
    },
    componentType: "actions",
    evidence: "command-side-effect",
    expectedObservable: "Clear removes committed ink from the page.",
    fixture: "inked page",
    id: "renderer.clear",
    kind: "control",
    target: "blogism.clear",
    userAction: "Draw, then click Clear.",
  },
  {
    automated: true,
    automatedTestName: "title paints onto the sheet",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM title reaches the sheet",
    },
    componentType: "text",
    evidence: "product-output",
    expectedObservable: "Typing a title updates the sheet caption and data-blogism-title.",
    fixture: "develop copy",
    id: "renderer.title",
    interactionId: "page-title",
    kind: "control",
    target: "blogism.title",
    userAction: "Switch to Develop and type a title.",
  },
  {
    automated: true,
    automatedTestName: "excerpt stays in develop state",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM excerpt stays editable",
    },
    componentType: "text",
    evidence: "command-side-effect",
    expectedObservable: "Excerpt text is stored on the page values.",
    fixture: "develop copy",
    id: "renderer.excerpt",
    kind: "control",
    target: "blogism.excerpt",
    userAction: "Type an excerpt on Develop.",
  },
  {
    automated: true,
    automatedTestName: "collection options remain selectable",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM collection options remain selectable",
    },
    componentType: "select",
    evidence: "command-side-effect",
    expectedObservable: "Blog and Notes remain available collections.",
    fixture: "develop collection",
    id: "renderer.collection",
    kind: "control",
    optionCoverage: ["blog", "notes"],
    target: "blogism.collection",
    userAction: "Select Blog and Notes.",
  },
  {
    automated: true,
    automatedTestName: "draft toggle records publish intent",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM draft toggle records intent",
    },
    componentType: "switch",
    evidence: "command-side-effect",
    expectedObservable: "Draft on/off is visible on the page data attribute.",
    fixture: "develop draft",
    id: "renderer.draft",
    kind: "control",
    target: "blogism.draft",
    userAction: "Toggle Draft.",
  },
  {
    automated: true,
    automatedTestName: "body captions paint onto the sheet",
    browser: {
      ...pageBrowser,
      testName: "browser acceptance: BLOGISM body reaches the sheet",
    },
    componentType: "code",
    evidence: "product-output",
    expectedObservable: "Body captions sit on the sheet with the ink.",
    fixture: "develop copy",
    id: "renderer.body",
    kind: "control",
    target: "blogism.body",
    userAction: "Type body copy on Develop.",
  },
  {
    automated: true,
    automatedTestName: "background inclusion controls preview and PNG transparency",
    backgroundOutputCoverage: [
      "preview-hidden-when-excluded",
      "image-transparent-when-excluded",
      "infinity-viewport-color-and-dependency",
    ],
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM background inclusion controls output",
    },
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Turning Background off removes the finite preview base, exports transparent PNG corners, and disables Infinity canvas.",
    fixture: "white page background semantics",
    id: "renderer.background-inclusion",
    kind: "control",
    target: "export.includeBackground",
    userAction: "Toggle Background and compare preview, Infinity dependency, and PNG alpha.",
  },
  {
    automated: true,
    automatedTestName: "background color changes page output",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM background color reaches export",
    },
    componentType: "color",
    evidence: "exported-bytes",
    expectedObservable: "The selected Background color appears at the scene export corners.",
    fixture: "selected page background",
    id: "renderer.background-color",
    kind: "control",
    target: "appearance.background",
    userAction: "Change Background color and inspect decoded export corners.",
  },
  {
    automated: true,
    automatedTestName: "image format options remain selectable",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM image formats remain selectable",
    },
    componentType: "select",
    evidence: "command-side-effect",
    expectedObservable: "PNG and JPG remain available image formats.",
    fixture: "page image formats",
    id: "renderer.image-format",
    kind: "control",
    optionCoverage: ["png", "jpg"],
    target: "export.image.format",
    userAction: "Select PNG and JPG.",
  },
  {
    automated: true,
    automatedTestName: "image resolution options remain selectable",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM image resolutions remain selectable",
    },
    componentType: "select",
    evidence: "command-side-effect",
    expectedObservable: "2K, 4K, and 8K remain available image resolutions.",
    fixture: "page image resolutions",
    id: "renderer.image-resolution",
    kind: "control",
    optionCoverage: ["2k", "4k", "8k"],
    target: "export.image.resolution",
    userAction: "Select 2K, 4K, and 8K.",
  },
  {
    actionCoverage: ["kit.save", "kit.publish", "export.png"],
    automated: true,
    automatedTestName: "save publish and png are the delivery commands",
    browser: {
      ...canvasBrowser,
      testName: "browser acceptance: BLOGISM Save Publish and Export PNG deliver",
    },
    componentType: "panelActions",
    evidence: "exported-bytes",
    exportArtifactCoverage: "all-required-image-export-behavior",
    expectedObservable:
      "Save and Publish write kiruk.in paths or copy them; Export PNG downloads the page.",
    fixture: "page delivery actions",
    id: "renderer.delivery",
    kind: "control",
    target: "actions.output",
    userAction: "Save with a stubbed folder picker, then export PNG.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Notebook page",
      entityId: "notebook-page",
      finiteSelectors: [
        {
          affectedTargets: [],
          reason:
            "Design versus Develop replaces which page settings are relevant; dependents come from applicability.",
          role: "branch",
          target: "blogism.side",
        },
        {
          reason: "Ink, pencil, and eraser change the live tool without hiding peers.",
          role: "parameter",
          target: "blogism.tool",
        },
        {
          reason: "Pen only gates mouse input without changing other Design controls.",
          role: "parameter",
          target: "blogism.penOnly",
        },
        {
          reason: "Collection chooses the kiruk.in folder without hiding copy fields.",
          role: "parameter",
          target: "blogism.collection",
        },
        {
          reason: "Draft records publish intent without changing other Develop fields.",
          role: "parameter",
          target: "blogism.draft",
        },
      ],
      groupingReason:
        "Design ink and Develop copy jointly author one notebook page that writes into kiruk.in.",
      id: "page",
      targets: [
        "blogism.side",
        "blogism.tool",
        "blogism.penOnly",
        "blogism.clear",
        "blogism.title",
        "blogism.excerpt",
        "blogism.collection",
        "blogism.draft",
        "blogism.body",
      ],
      title: "Page",
    },
    {
      entity: "Output background",
      entityId: "output-background",
      finiteSelectors: [
        {
          affectedTargets: ["appearance.background"],
          reason: "Background inclusion determines whether its color affects output.",
          role: "branch",
          target: "export.includeBackground",
        },
      ],
      groupingReason:
        "Inclusion and color jointly define the preview and exported page background.",
      id: "background",
      targets: ["export.includeBackground", "appearance.background"],
      title: "Background",
    },
    {
      entity: "Image delivery",
      entityId: "image-delivery",
      finiteSelectors: [
        {
          reason: "Image format changes its own exported artifact encoding.",
          role: "parameter",
          target: "export.image.format",
        },
        {
          reason: "Image resolution changes its own exported artifact dimensions.",
          role: "parameter",
          target: "export.image.resolution",
        },
      ],
      groupingReason: "Format and resolution jointly configure the exported page image.",
      id: "image-export",
      targets: ["export.image.format", "export.image.resolution"],
      title: "Image Export",
    },
  ];
