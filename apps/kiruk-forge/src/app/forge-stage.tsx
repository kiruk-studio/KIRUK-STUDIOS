"use client";

import * as React from "react";
import {
  Button as KirukalButton,
  Frame as KirukalFrame,
} from "@kiruk/kirukal";
import type { Sample } from "@kiruk/kirukal";
import {
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  useToolcraft,
  useToolcraftDispatch,
  useToolcraftProductSceneFrame,
  useToolcraftValue,
} from "@/toolcraft/runtime/react";

import {
  anatomyForComponent,
  capturePenStroke,
  getInkStrokes,
  getMarkTemplateSize,
  getMarkViewBox,
  inkPathsFromStrokes,
  isImplementedKirukalPreview,
  MARK_INK_TARGET,
  rasterizeInkPaths,
  resolveDeskSelection,
  setInkStrokes,
} from "../kiruk";
import { getStageHotspots, hasAuthoredStageLayout } from "./forge-stage-layout";
import {
  previewDataUri,
  previewSvgForComponent,
} from "./forge-template-previews";
import styles from "./forge-stage.module.css";

const INK_FILL = "#111111";

function writeDesk(
  dispatch: ReturnType<typeof useToolcraftDispatch>,
  next: { markId: string; take: string },
): void {
  const historyGroup = `forge.desk:${next.markId}:${next.take}`;
  dispatch({
    historyGroup,
    label: "Anatomy",
    target: "forge.anatomy",
    type: "controls.setValue",
    value: next,
  });
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

function stageBackground(
  state: Readonly<ToolcraftState>,
): string | null {
  if (!shouldIncludeToolcraftPreviewBackground({ state })) return null;
  const background = state.values["appearance.background"];
  return typeof background === "string" && background.trim()
    ? background
    : "#FFFFFF";
}

export function ForgeComponentStage(): React.JSX.Element | null {
  const frame = useToolcraftProductSceneFrame();
  const dispatch = useToolcraftDispatch();
  const { state } = useToolcraft();
  const desk = resolveDeskSelection(state.values);
  const ink = useToolcraftValue(MARK_INK_TARGET);
  const hotspots = getStageHotspots(desk.componentId);
  const active =
    hotspots.find((hotspot) => hotspot.markId === desk.markId) ?? hotspots[0];
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const captureRef = React.useRef<ReturnType<typeof capturePenStroke> | null>(
    null,
  );
  const historyGroupRef = React.useRef<string | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const rect = frame.kind === "ready" ? frame.rect : null;
  const viewBox = getMarkViewBox(desk.markId);
  const strokes = getInkStrokes(ink, desk.markId, desk.take);
  const paper = stageBackground(state);

  const paintDraft = React.useCallback(
    (draftSamples: readonly Sample[] | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      rasterizeInkPaths(
        context,
        inkPathsFromStrokes(
          desk.markId,
          strokes,
          canvas.width,
          canvas.height,
        ),
        INK_FILL,
      );
      if (draftSamples && draftSamples.length >= 2) {
        rasterizeInkPaths(
          context,
          inkPathsFromStrokes(
            desk.markId,
            [{ role: "body", samples: draftSamples }],
            canvas.width,
            canvas.height,
            { last: false },
          ),
          INK_FILL,
        );
      }
    },
    [desk.componentId, desk.markId, strokes],
  );

  const cancelDraftFrame = React.useCallback(() => {
    if (rafRef.current == null) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const scheduleDraftPaint = React.useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paintDraft(captureRef.current?.samples() ?? null);
    });
  }, [paintDraft]);

  React.useEffect(() => {
    paintDraft(captureRef.current?.samples() ?? null);
  }, [paintDraft, strokes, viewBox.height, viewBox.width]);

  React.useEffect(() => () => cancelDraftFrame(), [cancelDraftFrame]);

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const capture = captureRef.current;
    if (!capture) return;
    captureRef.current = null;
    cancelDraftFrame();
    event.preventDefault();
    event.stopPropagation();
    const stroke = capture.finish();
    paintDraft(null);
    if (stroke.samples.length < 2) return;
    const next = setInkStrokes(ink, desk.markId, desk.take, [
      ...strokes,
      stroke,
    ]);
    dispatch({
      historyGroup: historyGroupRef.current ?? undefined,
      label: "Draw stroke",
      target: MARK_INK_TARGET,
      type: "controls.setValue",
      value: next,
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    if (event.pointerType === "touch") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    event.stopPropagation();
    captureRef.current = capturePenStroke(
      canvas,
      event.nativeEvent,
      "body",
      scheduleDraftPaint,
    );
    historyGroupRef.current = `mark.ink:${desk.markId}:${desk.take}:${event.pointerId}`;
    scheduleDraftPaint();
  };

  if (!rect) return null;

  const outlineSvg =
    isImplementedKirukalPreview(desk.componentId) ||
    hasAuthoredStageLayout(desk.componentId)
      ? null
      : previewSvgForComponent(desk.componentId);
  const liveHost = isImplementedKirukalPreview(desk.componentId)
    ? hotspots[0]
    : undefined;

  return (
    <div
      className={styles.stage}
      data-kiruk-component={desk.componentId}
      data-kiruk-forge-stage=""
      data-kiruk-mark-id={desk.markId}
      data-kiruk-stroke-count={String(strokes.length)}
      data-kiruk-take={desk.take}
      data-kiruk-template-height={String(getMarkTemplateSize(desk.markId).height)}
      data-kiruk-template-width={String(getMarkTemplateSize(desk.markId).width)}
      data-render-scale-canvas=""
      style={{ background: paper ?? "transparent" }}
    >
      <div
        aria-hidden="true"
        className={styles.live}
        data-kiruk-live={desk.componentId}
        style={
          liveHost
            ? {
                height: liveHost.height,
                left: liveHost.x,
                position: "absolute",
                top: liveHost.y,
                width: liveHost.width,
              }
            : undefined
        }
      >
        {desk.componentId === "button" ? (
          <KirukalButton className={styles.buttonHost}>Button</KirukalButton>
        ) : null}
        {desk.componentId === "frame" ? (
          <KirukalFrame className={styles.frameHost}>Frame</KirukalFrame>
        ) : null}
        {outlineSvg ? (
          <img
            alt=""
            className={styles.outline}
            data-kiruk-construction=""
            src={previewDataUri(outlineSvg)}
          />
        ) : null}
      </div>
      {([...hotspots].sort((left, right) => {
        const activeId = active?.markId ?? desk.markId;
        if (left.markId === activeId) return -1;
        if (right.markId === activeId) return 1;
        return 0;
      })).map((hotspot) => {
        const isActive = hotspot.markId === (active?.markId ?? desk.markId);
        return (
          <button
            aria-label={hotspot.label}
            aria-pressed={isActive}
            className={
              isActive ? `${styles.hotspot} ${styles.hotspotActive}` : styles.hotspot
            }
            data-kiruk-hotspot={hotspot.markId}
            data-testid={isActive ? "kiruk-forge-hotspot" : undefined}
            data-toolcraft-canvas-handle=""
            key={hotspot.markId}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (hotspot.markId === desk.markId) return;
              writeDesk(
                dispatch,
                anatomyForComponent(desk.componentId, ink, hotspot.markId),
              );
            }}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              height: hotspot.height,
              left: hotspot.x,
              position: "absolute",
              top: hotspot.y,
              width: hotspot.width,
            }}
            type="button"
          >
            {isActive ? (
              <canvas
                className={styles.pen}
                data-kiruk-forge-mark=""
                data-kiruk-forge-pen=""
                data-toolcraft-product-output=""
                height={viewBox.height}
                onLostPointerCapture={finishStroke}
                onPointerCancel={() => {
                  captureRef.current?.cancel();
                  captureRef.current = null;
                  cancelDraftFrame();
                  paintDraft(null);
                }}
                onPointerDown={onPointerDown}
                onPointerUp={finishStroke}
                ref={canvasRef}
                width={viewBox.width}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
