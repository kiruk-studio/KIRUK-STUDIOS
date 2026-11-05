import { getComponentRecipe, type AnatomyPiece } from "@kiruk/kirukal";

import { FORGE_STAGE_SIZE } from "./forge-stage-size";

export type StageHotspot = Readonly<{
  height: number;
  label: string;
  markId: string;
  width: number;
  x: number;
  y: number;
}>;

const STAGE_LAYOUTS: Readonly<Record<string, readonly StageHotspot[]>> = {
  button: [
    {
      height: 48,
      label: "Tight box",
      markId: "frame.box-tight",
      width: 200,
      x: 92,
      y: 156,
    },
    {
      height: 40,
      label: "Arrow",
      markId: "glyph.arrow",
      width: 44,
      x: 300,
      y: 160,
    },
  ],
  frame: [
    {
      height: 288,
      label: "Box",
      markId: "frame.box",
      width: 288,
      x: 48,
      y: 48,
    },
  ],
  switch: [
    {
      height: 40,
      label: "Track",
      markId: "part.switch-track",
      width: 200,
      x: 92,
      y: 188,
    },
    {
      height: 48,
      label: "Knob",
      markId: "part.switch-knob",
      width: 48,
      x: 236,
      y: 184,
    },
  ],
  card: [
    {
      height: 288,
      label: "Box",
      markId: "frame.box",
      width: 288,
      x: 48,
      y: 48,
    },
  ],
  dialog: [
    {
      height: 288,
      label: "Box",
      markId: "frame.box",
      width: 256,
      x: 64,
      y: 48,
    },
    {
      height: 220,
      label: "Sheet",
      markId: "frame.sheet",
      width: 220,
      x: 82,
      y: 82,
    },
  ],
};

function fallbackHotspots(pieces: readonly AnatomyPiece[]): readonly StageHotspot[] {
  const count = Math.max(1, pieces.length);
  const gap = 12;
  const columns = Math.min(2, count);
  const rows = Math.ceil(count / columns);
  const width = Math.floor(
    (FORGE_STAGE_SIZE.width - gap * (columns + 1)) / columns,
  );
  const height = Math.min(
    96,
    Math.floor((FORGE_STAGE_SIZE.height - gap * (rows + 1)) / rows),
  );
  return pieces.map((piece, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      height,
      label: piece.label,
      markId: piece.markId,
      width,
      x: gap + column * (width + gap),
      y: gap + row * (height + gap),
    };
  });
}

export function hasAuthoredStageLayout(componentId: string): boolean {
  return Object.hasOwn(STAGE_LAYOUTS, componentId);
}

export function getStageHotspots(componentId: string): readonly StageHotspot[] {
  const recipe = getComponentRecipe(componentId);
  const authored = STAGE_LAYOUTS[componentId];
  if (!authored) return fallbackHotspots(recipe);
  const allowed = new Set<string>(recipe.map((piece) => piece.markId));
  const matched = authored.filter((hotspot) => allowed.has(hotspot.markId));
  return matched.length > 0 ? matched : fallbackHotspots(recipe);
}
