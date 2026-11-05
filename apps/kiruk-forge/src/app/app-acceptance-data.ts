import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";

const starterPersistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

const customControlCoverage = [
  "built-in-gap",
  "kit-primitives",
  "minimal-ui",
  "product-output",
  "runtime-state",
] as const;

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: {
      evidence:
        "Forge publishes append-only kirukal source SVG through Publish, not a PNG of the component stage.",
      mode: "user-removed",
    },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "A nameless image grid cannot identify Button from Checkbox; names belong in the panel catalog.",
        surface: "canvas",
      },
      capability: "structured-selection",
      evidence: {
        detail:
          "Usability: identification requires a visible name plus the real template vector, which imagePicker never captions.",
        source: "usability-analysis",
      },
      id: "catalog-select",
      reason:
        "Choosing which named component to forge is a catalog decision, not a spatial pick on the stage.",
      surface: "panel",
      target: "forge.component",
    },
    {
      alternative: {
        reason:
          "The panel keeps take progress as status and must not become a second picker of mark IDs.",
        surface: "panel",
      },
      capability: "structured-selection",
      evidence: {
        detail:
          "The requested desk puts the live component on the page with textless hotspots for Tight box, Arrow, Track, and Knob.",
        source: "user-request",
      },
      id: "anatomy-hotspot",
      reason:
        "The place that can change on the live component is on the stage, so the hotspot owns piece selection.",
      surface: "canvas",
      target: "forge.anatomy",
    },
    {
      alternative: {
        reason:
          "Canvas hotspots choose the piece; stacking take-slot hits on the same handles would hide which take is active.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "Take dots stay in the panel as progress status so the founder can jump to take 2 of 4 without leaving the named catalog.",
        source: "usability-analysis",
      },
      id: "anatomy-take",
      reason:
        "Take index is an exact slot on the current piece, which the panel dots can name without crowding the stage.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: "forge.anatomy",
    },
    {
      alternative: {
        reason:
          "Kit ingest is a folder write, not a spatial gesture, so Publish and Edit stay in the sticky footer.",
        surface: "canvas",
      },
      capability: "command",
      evidence: {
        detail:
          "The requested job language is Publish, Edit, and republish of append-only vNN source, replacing Add take.",
        source: "user-request",
      },
      id: "kit-publish",
      reason:
        "Writing the next kirukal source version is a delivery command, not a handle on the component stage.",
      surface: "panel",
      target: "actions.kit",
    },
  ],
  mode: "product",
  productName: "Kiruk Forge",
  productSummary:
    "Named component stage for forging kirukal pieces with live Base UI, textless hotspots, and append-only Publish.",
  requestedBehavior:
    "Select a named component, draw on its anatomy hotspots, and Publish or Edit takes into packages/kirukal/assets/source.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The stage is a 2D component page with pen capture; there is no visible three-dimensional scene or orbit camera.",
  },
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName:
      "declares production reload coverage for the starter schema",
    browser: {
      budget: "extended-io",
      file: "e2e/app-persistence.spec.ts",
      testName:
        "browser: app restores exact canvas, values, and panel workspace slices after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size and zoom, their runtime values, and the moved and collapsed Controls workspace remain visibly restored after a real browser reload.",
    fixture: "Forge persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: starterPersistenceSlices,
    target: "canvas.size.width",
    userAction:
      "Edit Canvas width and zoom, move and collapse Controls, wait for persistence, and reload the page.",
  },
  {
    automated: true,
    automatedTestName: "named catalog labels every component tile",
    browser: {
      budget: "standard",
      file: "e2e/app-forge-mark.spec.ts",
      testName: "browser acceptance: Forge named catalog labels every component",
    },
    builtInFitCheck: {
      capabilities: ["custom-interaction", "custom-visualization"],
      checkedBuiltIns: ["imagePicker", "select", "tabs"],
      closestBuiltIn: "imagePicker",
      productObservable:
        "Each catalog tile shows a human name and the primary template vector, and choosing Button puts a Button on the stage.",
      whyInsufficient:
        "imagePicker, select, and tabs can store a component id, but imagePicker never shows captions and none of them render the real kirukal template outline beside a readable name.",
    },
    componentType: "forgeCatalog",
    customControlCoverage,
    evidence: "product-output",
    expectedObservable:
      "The panel catalog shows Button with the frame.box-tight template vector, not a nameless silhouette.",
    fixture: "Default Button catalog",
    id: "forge.catalog",
    interactionId: "catalog-select",
    kind: "control",
    target: "forge.component",
    userAction: "Read the named catalog tiles and select Button.",
  },
  {
    automated: true,
    automatedTestName: "anatomy status reports takes without saying Part",
    browser: {
      budget: "standard",
      file: "e2e/app-forge-mark.spec.ts",
      testName: "browser acceptance: Forge take slots isolate ink",
    },
    builtInFitCheck: {
      capabilities: ["custom-value-model", "custom-visualization"],
      checkedBuiltIns: ["segmented", "tabs", "select"],
      closestBuiltIn: "segmented",
      productObservable:
        "Take dots mark filled slots for the active piece and the status line reports Takes N of M plus Also skins.",
      whyInsufficient:
        "segmented, tabs, and select can pick a take index, but they cannot show per-piece fill dots plus shared-mark status for the inverted catalog.",
    },
    componentType: "forgeAnatomy",
    customControlCoverage,
    evidence: "product-output",
    expectedObservable:
      "Take dots isolate ink per slot and the status line reports take progress without the word Part.",
    fixture: "Button Tight box takes",
    id: "forge.anatomy",
    interactionId: "anatomy-take",
    kind: "control",
    target: "forge.anatomy",
    userAction: "Click take dots on the active piece and confirm ink isolation.",
  },
  {
    automated: true,
    automatedTestName: "clear empties the current take",
    browser: {
      budget: "standard",
      file: "e2e/app-forge-mark.spec.ts",
      testName: "browser acceptance: Forge clear empties the current take",
    },
    componentType: "actions",
    evidence: "command-side-effect",
    expectedObservable: "Clear removes strokes from the current take only.",
    fixture: "Inked Tight box take",
    id: "forge.clear",
    kind: "control",
    target: "mark.clearTake",
    userAction: "Draw a stroke, then click Clear.",
  },
  {
    automated: true,
    automatedTestName: "Publish writes the next kirukal source take",
    browser: {
      budget: "standard",
      file: "e2e/app-forge-mark.spec.ts",
      testName: "browser acceptance: Forge Publish is the kit delivery command",
    },
    actionCoverage: ["kit.publish", "kit.edit"],
    componentType: "panelActions",
    evidence: "command-side-effect",
    expectedObservable:
      "Publish writes the next append-only vNN source (or copies it) and Edit loads a published take.",
    fixture: "Inked Tight box take",
    id: "forge.kit",
    interactionId: "kit-publish",
    kind: "control",
    target: "actions.kit",
    userAction: "Draw, Publish, then Edit.",
  },
  {
    automated: true,
    automatedTestName: "hotspot selects the live anatomy piece",
    browser: {
      budget: "standard",
      file: "e2e/app-forge-mark.spec.ts",
      testName: "browser acceptance: Forge hotspot selects the arrow piece",
    },
    canvasHandle: {
      outputObservable:
        "Clicking the Arrow hotspot makes glyph.arrow the active piece on the live Button stage.",
      testId: "kiruk-forge-hotspot",
      writesTarget: "forge.anatomy",
    },
    componentType: "canvas-handle",
    evidence: "product-output",
    expectedObservable:
      "The textless Arrow hotspot writes the active anatomy piece without leaving the Button on the page.",
    fixture: "Default Button stage",
    id: "forge.hotspot",
    interactionId: "anatomy-hotspot",
    kind: "canvas-handle",
    target: "forge.anatomy",
    userAction: "Click the Arrow hotspot on the component stage.",
  },
  {
    automated: true,
    automatedTestName: "Infinity canvas preserves the component stage",
    browser: {
      budget: "standard",
      file: "e2e/app-forge-mark.spec.ts",
      testName:
        "browser acceptance: Forge Infinity canvas preserves the mark scene",
    },
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity removes the finite clip only; turning it off restores the 384 by 440 component stage.",
    fixture: "Finite Button stage",
    id: "forge.infinity",
    infinityCanvasCoverage: "mode-continuity-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Toggle Infinity canvas on and off and confirm the stage returns.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Component",
      entityId: "component",
      finiteSelectors: [],
      groupingReason:
        "Catalog, take progress, and Clear all forge one selected component.",
      id: "component",
      targets: ["forge.component", "forge.anatomy", "mark.clearTake"],
      title: "Component",
    },
  ];
