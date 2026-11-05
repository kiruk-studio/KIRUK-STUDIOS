import type { ToolcraftPanelActionContext } from "@/toolcraft/runtime/react";
import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  buildPostMdx,
  clearStrokes,
  contentPath,
  exportSvg,
  INK_TARGET,
  inkPublicDir,
  isSafeSlug,
  nextInkId,
  resolvePostSlug,
  serialize,
} from "../kiruk";
import { readBoolean, readCollection, readInk, readString } from "./blogism-values";

const KIT_FOLDER_ID = "kiruk-in-repo";

let repoRoot: FileSystemDirectoryHandle | null = null;

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

async function pickRepoRoot(): Promise<FileSystemDirectoryHandle | null> {
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
    repoRoot = handle;
    return handle;
  } catch (error) {
    if (isAbortError(error)) return null;
    throw error;
  }
}

async function walkDirectory(
  root: FileSystemDirectoryHandle,
  segments: readonly string[],
  create: boolean,
): Promise<FileSystemDirectoryHandle> {
  let dir = root;
  for (const segment of segments) {
    dir = await dir.getDirectoryHandle(segment, { create });
  }
  return dir;
}

async function listFileNames(
  dir: FileSystemDirectoryHandle,
): Promise<string[]> {
  const names: string[] = [];
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === "file") names.push(name);
  }
  return names;
}

async function writeTextFile(
  dir: FileSystemDirectoryHandle,
  fileName: string,
  contents: string,
): Promise<void> {
  const file = await dir.getFileHandle(fileName, { create: true });
  const writable = await file.createWritable();
  await writable.write(contents);
  await writable.close();
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function clearSheet(context: ToolcraftPanelActionContext): void {
  const next = clearStrokes(readInk(context.state.values));
  context.dispatch({
    label: "Clear sheet",
    target: INK_TARGET,
    type: "controls.setValue",
    value: next,
  });
}

function postFromState(state: Readonly<ToolcraftState>, publish: boolean) {
  const title = readString(state.values, "blogism.title");
  const excerpt = readString(state.values, "blogism.excerpt");
  const body = readString(state.values, "blogism.body");
  const collection = readCollection(state.values);
  const draft = publish ? false : readBoolean(state.values, "blogism.draft", true);
  const slug = resolvePostSlug(title);
  const ink = readInk(state.values);
  return { body, collection, draft, excerpt, ink, slug, title };
}

async function writeKirukInPost(
  context: ToolcraftPanelActionContext,
  publish: boolean,
): Promise<void> {
  const post = postFromState(context.state, publish);
  if (!isSafeSlug(post.slug)) {
    context.reportFeedback({
      code: "kit-bad-slug",
      message: "Give the page a title that can become a URL slug.",
    });
    return;
  }

  context.reportProgress(0.15);
  let root = repoRoot;
  if (!root) {
    root = await pickRepoRoot();
  } else if (!(await ensureWritePermission(root))) {
    root = await pickRepoRoot();
  }

  const hasInk = post.ink.strokes.length > 0;
  let inkId: string | undefined;
  let inkSrc: string | undefined;
  if (hasInk) {
    inkId = "ink-01";
    if (root) {
      try {
        const inkDir = await walkDirectory(
          root,
          inkPublicDir(post.collection, post.slug).split("/"),
          true,
        );
        inkId = nextInkId(await listFileNames(inkDir));
      } catch {
        inkId = "ink-01";
      }
    }
    inkSrc = `/${post.collection}/${post.slug}/${inkId}.svg`;
  }

  const mdx = buildPostMdx({
    body: post.body,
    collection: post.collection,
    draft: post.draft,
    excerpt: post.excerpt,
    inkSrc,
    slug: post.slug,
    title: post.title.trim() || post.slug,
  });

  context.reportProgress(0.55);

  if (root) {
    const contentDir = await walkDirectory(root, ["content", post.collection], true);
    await writeTextFile(contentDir, `${post.slug}.mdx`, mdx);
    if (hasInk && inkId) {
      const inkDir = await walkDirectory(
        root,
        inkPublicDir(post.collection, post.slug).split("/"),
        true,
      );
      await writeTextFile(inkDir, `${inkId}.json`, serialize(post.ink));
      await writeTextFile(inkDir, `${inkId}.svg`, exportSvg(post.ink));
    }
    context.reportProgress(1);
    context.reportFeedback({
      code: publish ? "kit-published" : "kit-saved",
      message: `Wrote ${contentPath(post.collection, post.slug)}${
        inkSrc ? ` and ${inkSrc}` : ""
      }.`,
    });
    return;
  }

  const copied = await copyText(hasInk ? `${mdx}\n${exportSvg(post.ink)}` : mdx);
  context.reportProgress(1);
  context.reportFeedback({
    code: copied ? "kit-clipboard" : "kit-copy-failed",
    message: copied
      ? `Copied ${contentPath(post.collection, post.slug)}. Save it into the kiruk.in repo.`
      : `Could not open the kiruk.in repo. Allow the folder picker, or paste the clipboard into ${contentPath(post.collection, post.slug)}.`,
  });
}

export async function runBlogismKitAction(
  context: ToolcraftPanelActionContext,
): Promise<void> {
  if (context.action.value === "page.clear") {
    clearSheet(context);
    return;
  }
  if (context.action.value === "kit.save") {
    await writeKirukInPost(context, false);
    return;
  }
  if (context.action.value === "kit.publish") {
    await writeKirukInPost(context, true);
  }
}
