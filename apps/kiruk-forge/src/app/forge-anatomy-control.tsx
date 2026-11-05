"use client";

import * as React from "react";
import type { ToolcraftCustomControlRendererProps } from "@/toolcraft/runtime/react";
import { Button } from "@/toolcraft/ui/components/primitives";

import {
  anatomyForComponent,
  asComponentId,
  getComponentRecipe,
  getInkStrokes,
  getSharedConsumerLabels,
  isForgeAnatomyValue,
  MARK_INK_TARGET,
  type ForgeAnatomyValue,
} from "../kiruk";
import styles from "./forge-anatomy-control.module.css";

function asAnatomy(value: unknown): ForgeAnatomyValue | null {
  return isForgeAnatomyValue(value) ? value : null;
}

function writeDesk(
  setValue: ToolcraftCustomControlRendererProps["setValue"],
  dispatch: ToolcraftCustomControlRendererProps["dispatch"],
  next: ForgeAnatomyValue,
): void {
  const historyGroup = `forge.desk:${next.markId}:${next.take}`;
  setValue(next);
  dispatch({
    historyGroup,
    label: "Mark",
    target: "mark.id",
    type: "controls.setValue",
    value: next.markId,
  });
  dispatch({
    historyGroup,
    label: "Take",
    target: "mark.take",
    type: "controls.setValue",
    value: next.take,
  });
}

function filledCount(ink: unknown, markId: string, wanted: number): number {
  let count = 0;
  for (let index = 1; index <= wanted; index += 1) {
    if (getInkStrokes(ink, markId, String(index)).length > 0) count += 1;
  }
  return count;
}

export function ForgeAnatomyControl({
  dispatch,
  setValue,
  state,
  value,
}: ToolcraftCustomControlRendererProps): React.ReactNode {
  const componentId = asComponentId(state.values["forge.component"]);
  const ink = state.values[MARK_INK_TARGET];
  const recipe = getComponentRecipe(componentId);
  const current = asAnatomy(value);
  const activeMarkId = current?.markId ?? recipe[0]?.markId;
  const activeTake = current?.take ?? "1";

  React.useEffect(() => {
    if (recipe.some((piece) => piece.markId === current?.markId)) return;
    writeDesk(setValue, dispatch, anatomyForComponent(componentId, ink));
  }, [componentId, current?.markId, dispatch, ink, recipe, setValue]);

  const shared = activeMarkId
    ? getSharedConsumerLabels(componentId, activeMarkId)
    : [];
  const wanted =
    recipe.find((piece) => piece.markId === activeMarkId)?.takesWanted ?? 1;

  return (
    <div className={styles.desk} data-kiruk-anatomy="">
      <div className={styles.pieces}>
        {recipe.map((piece) => {
          const filled = Array.from({ length: piece.takesWanted }, (_, index) =>
            getInkStrokes(ink, piece.markId, String(index + 1)).length > 0,
          );
          const isActive = piece.markId === activeMarkId;
          return (
            <div className={styles.piece} key={piece.markId}>
              <span className={styles.status}>{piece.label}</span>
              <div className={styles.takes}>
                {filled.map((hasInk, index) => {
                  const take = String(index + 1);
                  const isTakeActive = isActive && take === activeTake;
                  return (
                    <Button
                      aria-label={`${piece.label} take ${take}`}
                      aria-pressed={isTakeActive}
                      data-kiruk-take-slot={take}
                      key={take}
                      onClick={() =>
                        writeDesk(setValue, dispatch, {
                          markId: piece.markId,
                          take,
                        })
                      }
                      size="icon-xxs"
                      type="button"
                      variant="ghost"
                    >
                      <span
                        className={[
                          styles.dot,
                          hasInk ? styles.dotFilled : "",
                          isTakeActive ? styles.dotActive : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {activeMarkId ? (
        <p className={styles.status} data-kiruk-take-progress="">
          {`Takes ${filledCount(ink, activeMarkId, wanted)} of ${wanted}`}
          {shared.length > 0 ? ` · Also skins ${shared.join(", ")}` : ""}
        </p>
      ) : null}
    </div>
  );
}
