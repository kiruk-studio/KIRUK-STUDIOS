import {
  coerceInkDocument,
  INK_TARGET,
  isCollection,
  PAGE_SIZE,
  type BlogismCollection,
  type BlogismSide,
  type InkDocument,
  type InkTool,
} from "../kiruk";

export function readString(values: Readonly<Record<string, unknown>>, target: string): string {
  const value = values[target];
  return typeof value === "string" ? value : "";
}

export function readBoolean(
  values: Readonly<Record<string, unknown>>,
  target: string,
  fallback: boolean,
): boolean {
  const value = values[target];
  return typeof value === "boolean" ? value : fallback;
}

export function readSide(values: Readonly<Record<string, unknown>>): BlogismSide {
  return readString(values, "blogism.side") === "develop" ? "develop" : "design";
}

export function readTool(values: Readonly<Record<string, unknown>>): InkTool {
  const value = readString(values, "blogism.tool");
  if (value === "pencil" || value === "eraser" || value === "ink") return value;
  return "ink";
}

export function readCollection(
  values: Readonly<Record<string, unknown>>,
): BlogismCollection {
  const value = readString(values, "blogism.collection");
  return isCollection(value) ? value : "blog";
}

export function readInk(values: Readonly<Record<string, unknown>>): InkDocument {
  return coerceInkDocument(values[INK_TARGET], PAGE_SIZE);
}

export function readBackgroundColor(
  values: Readonly<Record<string, unknown>>,
): string {
  const value = values["appearance.background"];
  return typeof value === "string" && value.trim() ? value : "#FFFFFF";
}
