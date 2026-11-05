"use client";

import * as React from "react";

import { type ToolcraftState } from "@/toolcraft/runtime";
import {
  useToolcraft,
  useToolcraftDispatch,
  useToolcraftProductSceneFrame,
  useToolcraftValue,
} from "@/toolcraft/runtime/react";

import {
  appendStroke,
  captureInkStroke,
  coerceInkDocument,
  eraseAlongPath,
  INK_TARGET,
  makeDrawStroke,
  PAGE_SIZE,
  paintSheet,
  shouldAcceptPointer,
  type InkStroke,
  type InkTool,
} from "../kiruk";
import {
  readBackgroundColor,
  readBoolean,
  readInk,
  readString,
  readTool,
} from "./blogism-values";
import styles from "./blogism-page-canvas.module.css";

function backingPixels(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  renderScale: number,
): { height: number; width: number } {
  const scale = Number.isFinite(renderScale) && renderScale > 0 ? renderScale : 2;
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return {
    height: Math.max(1, Math.ceil(cssHeight * dpr * scale)),
    width: Math.max(1, Math.ceil(cssWidth * dpr * scale)),
  };
}

function paintPage(
  context: CanvasRenderingContext2D,
  state: Readonly<ToolcraftState>,
  width: number,
  height: number,
  draft: InkStroke | null,
): void {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  if (readBoolean(state.values, "export.includeBackground", true)) {
    context.fillStyle = readBackgroundColor(state.values);
    context.fillRect(0, 0, width, height);
  }
  context.setTransform(width / PAGE_SIZE.width, 0, 0, height / PAGE_SIZE.height, 0, 0);
  paintSheet(
    context,
    readInk(state.values),
    draft,
    readString(state.values, "blogism.title"),
    readString(state.values, "blogism.body"),
  );
}

export function BlogismPageCanvas(): React.JSX.Element | null {
  const frame = useToolcraftProductSceneFrame();
  const dispatch = useToolcraftDispatch();
  const { state } = useToolcraft();
  const ink = useToolcraftValue(INK_TARGET);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const captureRef = React.useRef<ReturnType<typeof captureInkStroke> | null>(
    null,
  );
  const historyGroupRef = React.useRef<string | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const paintStateRef = React.useRef({
    height: 0,
    state,
    width: 0,
  });

  const rect = frame.kind === "ready" ? frame.rect : null;
  const worldWidth = rect?.width ?? 0;
  const worldHeight = rect?.height ?? 0;
  const doc = readInk(state.values);
  const tool = readTool(state.values);
  const penOnly = readBoolean(state.values, "blogism.penOnly", true);
  const renderScale =
    typeof state.values["canvas.renderScale"] === "number"
      ? state.values["canvas.renderScale"]
      : 2;

  const paintSurface = React.useCallback((draftStroke: InkStroke | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const current = paintStateRef.current;
    if (current.width <= 0 || current.height <= 0) return;
    paintPage(context, current.state, current.width, current.height, draftStroke);
  }, []);

  const cancelDraftFrame = React.useCallback(() => {
    if (rafRef.current == null) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const scheduleDraftPaint = React.useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const points = captureRef.current?.points() ?? [];
      const draftTool = readTool(paintStateRef.current.state.values);
      const draft =
        points.length > 0 && draftTool !== "eraser"
          ? ({
              ...makeDrawStroke(draftTool, [...points]),
              id: "draft",
            } satisfies InkStroke)
          : null;
      paintSurface(draft);
    });
  }, [paintSurface]);

  const syncBacking = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || worldWidth <= 0 || worldHeight <= 0) return;
    const cssWidth = canvas.clientWidth > 0 ? canvas.clientWidth : worldWidth;
    const cssHeight = canvas.clientHeight > 0 ? canvas.clientHeight : worldHeight;
    const next = backingPixels(
      cssWidth,
      cssHeight,
      window.devicePixelRatio || 1,
      Number(renderScale),
    );
    paintStateRef.current = {
      height: next.height,
      state,
      width: next.width,
    };
    if (canvas.width !== next.width) canvas.width = next.width;
    if (canvas.height !== next.height) canvas.height = next.height;
    paintSurface(null);
  }, [paintSurface, renderScale, state, worldHeight, worldWidth]);

  React.useEffect(() => {
    syncBacking();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => syncBacking());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [syncBacking]);

  React.useEffect(() => () => cancelDraftFrame(), [cancelDraftFrame]);

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const capture = captureRef.current;
    if (!capture) return;
    captureRef.current = null;
    cancelDraftFrame();
    event.preventDefault();
    event.stopPropagation();
    const points = capture.finish();
    paintSurface(null);
    if (points.length < 2) return;
    const current = coerceInkDocument(ink, PAGE_SIZE);
    const next =
      tool === "eraser"
        ? eraseAlongPath(current, points)
        : appendStroke(current, makeDrawStroke(tool as Exclude<InkTool, "eraser">, points));
    dispatch({
      historyGroup: historyGroupRef.current ?? undefined,
      label: tool === "eraser" ? "Erase" : "Draw stroke",
      target: INK_TARGET,
      type: "controls.setValue",
      value: next,
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    if (!shouldAcceptPointer(event.nativeEvent, penOnly)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    event.stopPropagation();
    captureRef.current = captureInkStroke(
      canvas,
      event.nativeEvent,
      scheduleDraftPaint,
    );
    historyGroupRef.current = `blogism.ink:${event.pointerId}`;
    scheduleDraftPaint();
  };

  if (!rect) return null;

  return (
    <canvas
      className={styles.surface}
      data-blogism-body={readString(state.values, "blogism.body")}
      data-blogism-collection={readString(state.values, "blogism.collection") || "blog"}
      data-blogism-draft={String(readBoolean(state.values, "blogism.draft", true))}
      data-blogism-excerpt={readString(state.values, "blogism.excerpt")}
      data-blogism-paper={
        readBoolean(state.values, "export.includeBackground", true) ? "on" : "off"
      }
      data-blogism-pen-only={String(penOnly)}
      data-blogism-side={readString(state.values, "blogism.side") || "design"}
      data-blogism-stroke-count={String(doc.strokes.length)}
      data-blogism-title={readString(state.values, "blogism.title")}
      data-blogism-tool={tool}
      data-kiruk-blogism-page=""
      data-render-scale-canvas=""
      data-toolcraft-product-output=""
      onLostPointerCapture={finishStroke}
      onPointerCancel={() => {
        captureRef.current?.cancel();
        captureRef.current = null;
        cancelDraftFrame();
        paintSurface(null);
      }}
      onPointerDown={onPointerDown}
      onPointerUp={finishStroke}
      ref={canvasRef}
    />
  );
}
