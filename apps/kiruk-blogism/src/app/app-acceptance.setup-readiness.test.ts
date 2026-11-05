import { describe, expect, it } from "vitest";

import type { ToolcraftComponentAcceptance } from "./acceptance/types";
import {
  createContractSectionInventoryFixture,
  defineContractSchemaFixture,
  validateContractAcceptance,
} from "./app-acceptance.contract-fixtures";
import { makeControlAcceptance } from "./app-acceptance.test-utils";

function createMandatorySetupSchema(settingsTransfer: false | "auto" = false) {
  return defineContractSchemaFixture({
    canvas: { enabled: true },
    panels: {
      controls: {
        sections: [
          {
            controls: Object.fromEntries(
              Array.from({ length: 6 }, (_, index) => [
                `control${index}`,
                {
                  defaultValue: index,
                  label: `Control ${index + 1}`,
                  orderRole: "detail",
                  semanticGroup: "transform",
                  target: `settings.control${index}`,
                  type: "slider",
                },
              ]),
            ),
            id: "transform-primary",
            title: "Transform Primary",
          },
          {
            controls: Object.fromEntries(
              Array.from({ length: 6 }, (_, offset) => {
                const index = offset + 6;
                return [
                  `control${index}`,
                  {
                    defaultValue: index,
                    label: `Control ${index + 1}`,
                    orderRole: "detail",
                    semanticGroup: "transform",
                    target: `settings.control${index}`,
                    type: "slider",
                  },
                ];
              }),
            ),
            id: "transform-secondary",
            title: "Transform Secondary",
          },
        ],
        title: "Complex Settings",
      },
    },
    settingsTransfer,
  });
}

function createMandatorySetupAcceptance() {
  return Array.from({ length: 12 }, (_, index) =>
    makeControlAcceptance(`settings.control${index}`, "slider"),
  );
}

function createMandatorySetupWithCanvasSizeSchema() {
  return defineContractSchemaFixture({
    canvas: { enabled: true, size: { height: 720, unit: "px", width: 1280 } },
    panels: {
      controls: {
        sections: [
          {
            controls: Object.fromEntries(
              Array.from({ length: 10 }, (_, index) => [
                `control${index}`,
                {
                  defaultValue: index,
                  label: `Control ${index + 1}`,
                  orderRole: "detail",
                  semanticGroup: "transform",
                  target: `settings.control${index}`,
                  type: "slider",
                },
              ]),
            ),
            id: "transform",
            title: "Transform",
          },
        ],
        title: "Runtime Setup Settings",
      },
    },
    settingsTransfer: false,
  });
}

function createMandatorySetupWithCanvasSizeAcceptance(): ToolcraftComponentAcceptance[] {
  return [
    {
      automated: true,
      automatedTestName: "sets Infinity mode without copying it into values",
      browser: {
        budget: "standard",
        file: "e2e/app-controls.spec.ts",
        testName: "browser: Infinity canvas removes the artboard and restores finite size",
      },
      componentType: "canvas",
      evidence: "viewport-side-effect" as const,
      expectedObservable: "Infinity mode restores the previous finite canvas size.",
      fixture: "editable-output canvas",
      id: "canvas.infinity.mode",
      infinityCanvasCoverage: "mode-continuity-and-restoration" as const,
      kind: "runtime" as const,
      userAction: "Toggle Infinity canvas twice.",
    },
    makeControlAcceptance("canvas.size.width", "text"),
    makeControlAcceptance("canvas.size.height", "text"),
    ...Array.from({ length: 10 }, (_, index) =>
      makeControlAcceptance(`settings.control${index}`, "slider"),
    ),
  ];
}

describe("Toolcraft starter setup and readiness acceptance coverage", () => {
  function createComplexSectionInventory(
    schema: ReturnType<typeof createMandatorySetupSchema>,
  ) {
    return createContractSectionInventoryFixture(schema, [
      {
        entity: "Transform",
        entityId: "transform",
        finiteSelectors: [],
        groupingReason: "Primary controls edit the first transform workflow stage.",
        id: "transform-primary",
        splitReason: "The transform entity exceeds ten controls and uses two balanced stages.",
        workflowStage: "primary",
      },
      {
        entity: "Transform",
        entityId: "transform",
        finiteSelectors: [],
        groupingReason: "Secondary controls edit the final transform workflow stage.",
        id: "transform-secondary",
        splitReason: "The transform entity exceeds ten controls and uses two balanced stages.",
        workflowStage: "secondary",
      },
    ]);
  }

  it("rejects generated apps without the mandatory runtime setup controls panel", () => {
    const schema = defineContractSchemaFixture({
      canvas: { enabled: true },
      panels: {},
    });

    expect(validateContractAcceptance({
      schema: schema,
      acceptance: [],
    })).toEqual(
      expect.arrayContaining([
        "Generated Toolcraft apps must define a controls panel so the mandatory runtime Setup section is visible.",
      ]),
    );
  });

  it("does not require app-authored settings transfer because setup controls are runtime-mandatory", () => {
    const complexSchema = createMandatorySetupSchema(false);

    expect(
      validateContractAcceptance({
        schema: complexSchema,
        acceptance: createMandatorySetupAcceptance(),
        sectionInventory: createComplexSectionInventory(complexSchema),
      }),
    ).toEqual([]);
  });

  it("accepts small schemas because settings transfer setup is runtime-mandatory", () => {
    const smallSchema = createMandatorySetupWithCanvasSizeSchema();
    const errors = validateContractAcceptance({
      schema: smallSchema,
      acceptance: createMandatorySetupWithCanvasSizeAcceptance(),
      sectionInventory: createContractSectionInventoryFixture(smallSchema, [{
        entity: "Transform",
        entityId: "transform",
        finiteSelectors: [],
        groupingReason: "Transform controls edit one product transform entity.",
        id: "transform",
      }]),
    });

    expect(errors).toEqual([]);
  });

  it("passes complex schemas with auto settings transfer enabled", () => {
    const complexSchema = createMandatorySetupSchema("auto");
    const acceptance: ToolcraftComponentAcceptance[] = [
      {
        automated: true,
        automatedTestName: "settings transfer exports and imports complex settings",
        browser: {
          budget: "standard",
          file: "e2e/app-controls.spec.ts",
          testName: "browser: settings transfer exports and imports complex settings",
        },
        componentType: "settingsTransfer",
        evidence: "persistence-state",
        expectedObservable:
          "Export Settings downloads app-scoped JSON and Import Settings restores edited controls.",
        fixture: "settings transfer complex fixture",
        id: "settings.transfer",
        kind: "control",
        target: "runtime.settingsTransfer",
        userAction:
          "Change one complex setting, export settings, change it again, import the JSON, and observe the restored value.",
      },
      ...createMandatorySetupAcceptance(),
    ];

    expect(validateContractAcceptance({
      schema: complexSchema,
      acceptance: acceptance,
      sectionInventory: createComplexSectionInventory(complexSchema),
    })).toEqual([]);
  });

  it("rejects app-authored controls that try to own runtime setup targets", () => {
    const schema = defineContractSchemaFixture({
      canvas: {
        enabled: true,
        renderScale: true,
        size: { height: 1080, unit: "px", width: 1920 },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                manualWidth: {
                  defaultValue: 1200,
                  label: "Width",
                  target: "canvas.size.width",
                  textValueKind: "single-line",
                  type: "text",
                },
                manualRenderScale: {
                  defaultValue: 1,
                  label: "Scale",
                  max: 2,
                  min: 1,
                  target: "canvas.renderScale",
                  type: "slider",
                },
                manualTimeline: {
                  defaultValue: true,
                  label: "Timeline",
                  target: "panels.timeline.extended",
                  type: "switch",
                },
              },
              title: "Runtime Duplicates",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(validateContractAcceptance({
      schema: schema,
      acceptance: [],
    })).toEqual(
      expect.arrayContaining([
        'Runtime Setup must not include the Timeline switch unless panels.timeline is enabled.',
        'Runtime Duplicates / manualWidth uses runtime Setup target "canvas.size.width". Runtime Setup owns Export Settings, Import Settings, Infinity canvas, Aspect ratio, Canvas width, Canvas height, Resolution scale, and Timeline; do not declare these controls in app-authored sections.',
        'Runtime Duplicates / manualRenderScale uses runtime Setup target "canvas.renderScale". Runtime Setup owns Export Settings, Import Settings, Infinity canvas, Aspect ratio, Canvas width, Canvas height, Resolution scale, and Timeline; do not declare these controls in app-authored sections.',
        'Runtime Duplicates / manualTimeline uses runtime Setup target "panels.timeline.extended". Runtime Setup owns Export Settings, Import Settings, Infinity canvas, Aspect ratio, Canvas width, Canvas height, Resolution scale, and Timeline; do not declare these controls in app-authored sections.',
      ]),
    );
  });

});
