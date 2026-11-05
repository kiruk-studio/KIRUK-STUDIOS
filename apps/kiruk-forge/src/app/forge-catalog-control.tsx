"use client";

import * as React from "react";
import { COMPONENT_CATALOG } from "@kiruk/kirukal";
import type { ToolcraftCustomControlRendererProps } from "@/toolcraft/runtime/react";
import { Button, ScrollFade } from "@/toolcraft/ui";

import {
  previewDataUri,
  previewSvgForComponent,
} from "./forge-template-previews";
import styles from "./forge-catalog-control.module.css";

function asComponentId(value: unknown): string {
  return typeof value === "string" && value.trim()
    ? value
    : COMPONENT_CATALOG[0]?.id ?? "button";
}

export function ForgeCatalogControl({
  setValue,
  value,
}: ToolcraftCustomControlRendererProps): React.ReactNode {
  const selected = asComponentId(value);
  const previews = React.useMemo(
    () =>
      COMPONENT_CATALOG.map((entry) => ({
        id: entry.id,
        label: entry.label,
        src: previewDataUri(previewSvgForComponent(entry.id)),
      })),
    [],
  );

  return (
    <ScrollFade height={280} scrollBoundaryBehavior="chain">
      <div className={styles.grid} data-kiruk-catalog="">
        {previews.map((entry) => {
          const pressed = entry.id === selected;
          return (
            <Button
              aria-pressed={pressed}
              className={styles.item}
              data-kiruk-catalog-item={entry.id}
              key={entry.id}
              onClick={() => setValue(entry.id)}
              type="button"
              variant={pressed ? "secondary" : "ghost"}
            >
              <img
                alt=""
                className={styles.thumb}
                data-kiruk-catalog-thumb={entry.id}
                src={entry.src}
              />
              <span className={styles.label} data-kiruk-catalog-label="">
                {entry.label}
              </span>
            </Button>
          );
        })}
      </div>
    </ScrollFade>
  );
}
