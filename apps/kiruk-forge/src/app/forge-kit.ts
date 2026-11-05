import type { ToolcraftPanelActionContext } from "@/toolcraft/runtime/react";
import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  buildSourceSvg,
  clearInkTake,
  getInkStrokes,
  getMarkFamilyId,
  getPublishedVersion,
  latestFilledTake,
  latestSourceVersion,
  MARK_INK_TARGET,
  nextDeskAfterPublish,
  nextSourceVersion,
  resolveDeskSelection,
  setPublishedVersion,
  sourceFileName,
  sourceRelativePath,
} from "../kiruk";

const KIT_FOLDER_ID = "kirukal-assets-source";
const BUILD_HINT = "pnpm --filter @kiruk/kirukal assets:build";
const MARK_PUBLISHED_TARGET = "mark.published";

let sourceRoot: FileSystemDirectoryHandle | null = null;

function readDesk(state: Readonly<ToolcraftState>) {
  return resolveDeskSelection(state.values);
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AbortError"
  );
}

type WritableDirectoryHandle = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor?: {
    mode?: "read" | "readwrite";
  }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: {
    mode?: "read" | "readwrite";
  }) => Promise<PermissionState>;
};

async function ensureWritePermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const writable = handle as WritableDirectoryHandle;
  const mode = { mode: "readwrite" as const };
  const current = (await writable.queryPermission?.(mode)) ?? "granted";
  if (current === "granted") return true;
  const next = (await writable.requestPermission?.(mode)) ?? "denied";
  return next === "granted";
}

async function pickSourceFolder(): Promise<FileSystemDirectoryHandle | null> {
  const picker = (
    globalThis as typeof globalThis & {
      showDirectoryPicker?: (options?: {
        id?: string;
        mode?: "read" | "readwrite";
      }) => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (typeof picker !== "function") return null;
  try {
    const handle = await picker({
      id: KIT_FOLDER_ID,
      mode: "readwrite",
    });
    if (!(await ensureWritePermission(handle))) return null;
    sourceRoot = handle;
    return handle;
  } catch (error) {
    if (isAbortError(error)) return null;
    throw error;
  }
}

async function listFamilyFiles(
  root: FileSystemDirectoryHandle,
  family: string,
): Promise<string[]> {
  try {
    const dir = await root.getDirectoryHandle(family);
    const names: string[] = [];
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === "file") names.push(name);
    }
    return names;
  } catch {
    return [];
  }
}

async function writeSourceFile(
  root: FileSystemDirectoryHandle,
  family: string,
  fileName: string,
  contents: string,
): Promise<void> {
  const dir = await root.getDirectoryHandle(family, { create: true });
  const file = await dir.getFileHandle(fileName, { create: true });
  const writable = await file.createWritable();
  await writable.write(contents);
  await writable.close();
}

async function copySvg(svg: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(svg);
    return true;
  } catch {
    return false;
  }
}

function writeDeskSelection(
  context: ToolcraftPanelActionContext,
  next: { markId: string; take: string },
): void {
  const historyGroup = `forge.desk:${next.markId}:${next.take}`;
  context.dispatch({
    historyGroup,
    label: "Anatomy",
    target: "forge.anatomy",
    type: "controls.setValue",
    value: next,
  });
  context.dispatch({
    historyGroup,
    label: "Mark",
    target: "mark.id",
    type: "controls.setValue",
    value: next.markId,
  });
  context.dispatch({
    historyGroup,
    label: "Take",
    target: "mark.take",
    type: "controls.setValue",
    value: next.take,
  });
}

function recordPublished(
  context: ToolcraftPanelActionContext,
  markId: string,
  version: number,
): void {
  context.dispatch({
    label: "Published version",
    target: MARK_PUBLISHED_TARGET,
    type: "controls.setValue",
    value: setPublishedVersion(
      context.state.values[MARK_PUBLISHED_TARGET],
      markId,
      version,
    ),
  });
}

function advanceDesk(context: ToolcraftPanelActionContext): void {
  const desk = readDesk(context.state);
  const next = nextDeskAfterPublish(
    desk.componentId,
    desk.markId,
    desk.take,
    context.state.values[MARK_INK_TARGET],
  );
  if (next.markId === desk.markId && next.take === desk.take) return;
  writeDeskSelection(context, next);
}

function clearCurrentTake(context: ToolcraftPanelActionContext): void {
  const desk = readDesk(context.state);
  const next = clearInkTake(
    context.state.values[MARK_INK_TARGET],
    desk.markId,
    desk.take,
  );
  context.dispatch({
    label: "Clear take",
    target: MARK_INK_TARGET,
    type: "controls.setValue",
    value: next,
  });
}

async function resolveSourceRoot(): Promise<FileSystemDirectoryHandle | null> {
  let root = sourceRoot;
  if (!root) {
    root = await pickSourceFolder();
  } else if (!(await ensureWritePermission(root))) {
    root = await pickSourceFolder();
  }
  return root;
}

async function publishKitTake(
  context: ToolcraftPanelActionContext,
): Promise<void> {
  const desk = readDesk(context.state);
  const strokes = getInkStrokes(
    context.state.values[MARK_INK_TARGET],
    desk.markId,
    desk.take,
  );
  if (strokes.length === 0) {
    context.reportFeedback({
      code: "kit-empty-take",
      message: "Draw a stroke on this take before publishing it to kirukal.",
    });
    return;
  }

  context.reportProgress(0.2);
  const svg = buildSourceSvg(desk.markId, strokes);
  const root = await resolveSourceRoot();
  const family = getMarkFamilyId(desk.markId);
  const existing = root ? await listFamilyFiles(root, family) : [];
  const known = getPublishedVersion(
    context.state.values[MARK_PUBLISHED_TARGET],
    desk.markId,
  );
  const version = Math.max(nextSourceVersion(existing, desk.markId), known + 1);
  const relative = sourceRelativePath(desk.markId, version);
  context.reportProgress(0.6);

  if (root) {
    await writeSourceFile(root, family, sourceFileName(desk.markId, version), svg);
    context.reportProgress(1);
    recordPublished(context, desk.markId, version);
    advanceDesk(context);
    context.reportFeedback({
      code: "kit-published",
      message: `Wrote ${relative}. Next: ${BUILD_HINT}.`,
    });
    return;
  }

  const copied = await copySvg(svg);
  context.reportProgress(1);
  recordPublished(context, desk.markId, version);
  context.reportFeedback({
    code: copied ? "kit-clipboard" : "kit-copy-failed",
    message: copied
      ? `Copied ${sourceFileName(desk.markId, version)}. Save it to packages/kirukal/assets/source/${family}/ then ${BUILD_HINT}.`
      : `Could not open packages/kirukal/assets/source. Save this take as ${relative} then ${BUILD_HINT}.`,
  });
}

async function editKitTake(context: ToolcraftPanelActionContext): Promise<void> {
  const desk = readDesk(context.state);
  const ink = context.state.values[MARK_INK_TARGET];
  const family = getMarkFamilyId(desk.markId);
  let folderVersion = 0;
  if (sourceRoot) {
    const existing = await listFamilyFiles(sourceRoot, family);
    folderVersion = latestSourceVersion(existing, desk.markId);
  }
  const sessionVersion = getPublishedVersion(
    context.state.values[MARK_PUBLISHED_TARGET],
    desk.markId,
  );
  const published = Math.max(folderVersion, sessionVersion);
  const filled = latestFilledTake(ink, desk.markId);

  if (published < 1 && !filled) {
    context.reportFeedback({
      code: "kit-edit-empty",
      message: "Nothing published for this piece yet. Draw and Publish first.",
    });
    return;
  }

  if (filled && filled !== desk.take) {
    writeDeskSelection(context, { markId: desk.markId, take: filled });
  }

  const nextVersion = published + 1;
  context.reportFeedback({
    code: "kit-editing",
    message:
      published > 0
        ? `Editing ${sourceFileName(desk.markId, published)}. Publish writes ${sourceFileName(desk.markId, nextVersion)}.`
        : "Loaded the session take. Publish writes the next version.",
  });
}

export async function runForgeKitAction(
  context: ToolcraftPanelActionContext,
): Promise<void> {
  if (
    context.action.value === "kit.publish" ||
    context.action.value === "kit.add"
  ) {
    await publishKitTake(context);
    return;
  }
  if (context.action.value === "kit.edit") {
    await editKitTake(context);
    return;
  }
  if (context.action.value === "mark.clear") {
    clearCurrentTake(context);
  }
}
