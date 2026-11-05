import path from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import {
  validateToolcraftFeatureVerificationPlan,
} from "./toolcraft-feature-verification-plan.mjs";
import { captureToolcraftProofIpcProcess } from "./toolcraft-proof-process.mjs";

const childPath = fileURLToPath(
  new URL("./toolcraft-feature-source-loader-child.mjs", import.meta.url),
);
const SOURCE_LOAD_DEADLINE_MS = 20_000;

const featureSourcePath =
  "/src/app/app-acceptance.ts";

function createDefaultDependencies() {
  return Object.freeze({ createServer });
}

export async function loadToolcraftFeatureVerificationPlanFromSource({
  dependencies = createDefaultDependencies(),
  projectDir,
  request,
}) {
  const server = await dependencies.createServer({
    appType: "custom",
    logLevel: "error",
    root: path.resolve(projectDir),
    server: { hmr: false, middlewareMode: true },
  });

  let primaryError;
  let hasPrimaryError = false;
  try {
    const sourceModule = await server.ssrLoadModule(featureSourcePath);
    if (
      typeof sourceModule.createToolcraftFeaturePlanFromCurrentApp !==
      "function"
    ) {
      throw new Error(
        `Toolcraft feature source ${featureSourcePath} must export createToolcraftFeaturePlanFromCurrentApp.`,
      );
    }
    const value = await sourceModule.createToolcraftFeaturePlanFromCurrentApp(
      request,
    );
    const validation = validateToolcraftFeatureVerificationPlan(value);
    if (validation.errors.length > 0) {
      throw new Error(
        `Invalid Toolcraft feature verification plan:\n${validation.errors.join("\n")}`,
      );
    }
    return validation.plan;
  } catch (error) {
    primaryError = error;
    hasPrimaryError = true;
    throw error;
  } finally {
    try {
      await server.close();
    } catch (cleanupError) {
      if (hasPrimaryError) {
        throw new AggregateError(
          [primaryError, cleanupError],
          "Toolcraft feature source loading and Vite cleanup both failed.",
        );
      }
      throw cleanupError;
    }
  }
}

export async function loadToolcraftFeatureVerificationPlanInIsolatedProcess({
  dependencies = { runIpcProcess: captureToolcraftProofIpcProcess },
  env,
  projectDir,
  request,
}) {
  const result = await dependencies.runIpcProcess(
    process.execPath,
    [childPath, JSON.stringify(request)],
    {
      cwd: projectDir,
      deadlineMs: SOURCE_LOAD_DEADLINE_MS,
      env,
    },
  );
  if (
    result.messages.length !== 1 ||
    result.messages[0]?.kind !== "toolcraft-feature-verification-plan" ||
    result.messages[0]?.version !== 1
  ) {
    throw new Error(
      `Toolcraft isolated feature source returned an invalid IPC protocol.${result.stdout || result.stderr ? `\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}` : ""}`,
    );
  }
  const validation = validateToolcraftFeatureVerificationPlan(
    result.messages[0].plan,
  );
  if (validation.errors.length > 0) {
    throw new Error(
      `Invalid Toolcraft feature verification plan from isolated IPC:\n${validation.errors.join("\n")}`,
    );
  }
  return validation.plan;
}
