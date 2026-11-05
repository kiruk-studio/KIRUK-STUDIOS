import { describe, expect, it } from "vitest";

import {
  contractSchemaFixture,
  createContractSectionInventoryFixture,
  defineContractSchemaFixture,
  validateContractAcceptance,
} from "./app-acceptance.contract-fixtures";

describe("starter acceptance slider marker contract", () => {
  it("requires discrete slider markerCount to match the step count", () => {
    const schemaWithDiscreteSlider = {
      ...contractSchemaFixture,
      panels: {
        ...contractSchemaFixture.panels,
        controls: {
          sections: [
            {
              controls: {
                grain: {
                  defaultValue: 0.08,
                  label: "Grain",
                  markerCount: 6,
                  max: 1,
                  min: 0,
                  sliderValueKind: "discrete" as const,
                  step: 0.1,
                  target: "shader.grain",
                  type: "slider",
                  variant: "discrete",
                },
              },
              id: "volume",
              title: "Volume",
            },
          ],
          title: "Shader",
        },
      },
    };

    expect(
      validateContractAcceptance({
        schema: schemaWithDiscreteSlider,
        acceptance: [
          {
            automated: true,
            automatedTestName: "grain changes rendered output",
            browser: {
              budget: "standard",
              file: "e2e/app-controls.spec.ts",
              testName: "browser: grain slider changes rendered output",
            },
            componentType: "slider",
            evidence: "rendered-pixels",
            expectedObservable: "Changing Grain changes pixel variance.",
            fixture: "grain fixture",
            id: "shader.grain",
            kind: "control",
            target: "shader.grain",
            userAction: "Drag the Grain slider.",
          },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        "Volume / grain (shader.grain) discrete slider must render one marker per step; expected markerCount 11, received 6.",
      ]),
    );
  });

  it("rejects visual discrete sliders with too many positions", () => {
    const schemaWithDenseDiscreteSlider = defineContractSchemaFixture({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                revealSpeed: {
                  defaultValue: 118,
                  label: "Reveal speed",
                  max: 150,
                  min: 0,
                  orderRole: "primary",
                  sliderValueKind: "discrete",
                  step: 1,
                  target: "ascii.speed",
                  type: "slider",
                  unit: "cols/s",
                  variant: "discrete",
                },
              },
              title: "Timing",
            },
          ],
          title: "ASCII",
        },
      },
    });

    expect(
      validateContractAcceptance({
        schema: schemaWithDenseDiscreteSlider,
        acceptance: [
          {
            automated: true,
            automatedTestName: "reveal speed changes rendered output",
            browser: {
              budget: "standard",
              file: "e2e/app-controls.spec.ts",
              testName: "browser: reveal speed slider changes rendered output",
            },
            componentType: "slider",
            evidence: "rendered-pixels",
            expectedObservable: "Changing Reveal speed changes reveal density.",
            fixture: "ASCII fixture",
            id: "ascii.speed",
            kind: "control",
            target: "ascii.speed",
            userAction: "Drag the Reveal speed slider.",
          },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        'Timing / revealSpeed (ascii.speed) declares variant "discrete" with 151 positions, which would overload tick markers. Keep it stepped continuous or use a different control.',
      ]),
    );
  });

  it("accepts continuous stepped sliders without visual markers", () => {
    const schemaWithNormalizedSlider = defineContractSchemaFixture({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                grain: {
                  defaultValue: 0.08,
                  label: "Grain",
                  max: 1,
                  min: 0,
                  step: 0.1,
                  target: "shader.grain",
                  type: "slider",
                },
              },
              id: "volume",
              title: "Volume",
            },
          ],
          title: "Shader",
        },
      },
    });

    expect(
      validateContractAcceptance({
        schema: schemaWithNormalizedSlider,
        acceptance: [
          {
            automated: true,
            automatedTestName: "grain changes rendered output",
            browser: {
              budget: "standard",
              file: "e2e/app-controls.spec.ts",
              testName: "browser: grain slider changes rendered output",
            },
            componentType: "slider",
            evidence: "rendered-pixels",
            expectedObservable: "Changing Grain changes pixel variance.",
            fixture: "grain fixture",
            id: "shader.grain",
            kind: "control",
            target: "shader.grain",
            userAction: "Drag the Grain slider.",
          },
        ],
        sectionInventory: createContractSectionInventoryFixture(
          schemaWithNormalizedSlider,
          [{
            entity: "Volume",
            entityId: "volume",
            finiteSelectors: [],
            groupingReason: "Grain controls the rendered shader volume.",
            id: "volume",
          }],
        ),
      }),
    ).toEqual([]);
  });
});
