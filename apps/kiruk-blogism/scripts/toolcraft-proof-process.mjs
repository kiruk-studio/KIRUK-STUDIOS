import { existsSync } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";

import spawn from "cross-spawn";

const chromiumInstallPromises = new Map();
const defaultCaptureLimits = Object.freeze({ ipcBytes: 4 * 1024 * 1024, ipcMessages: 32,
  stderrBytes: 4 * 1024 * 1024, stdoutBytes: 4 * 1024 * 1024 });

export function detectToolcraftPackageManager(projectDir, env = process.env) {
  if (existsSync(path.join(projectDir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(projectDir, "yarn.lock"))) return "yarn";
  if (
    existsSync(path.join(projectDir, "bun.lock")) ||
    existsSync(path.join(projectDir, "bun.lockb"))
  ) {
    return "bun";
  }
  if (existsSync(path.join(projectDir, "package-lock.json"))) return "npm";
  const userAgent = env.npm_config_user_agent ?? "";
  if (userAgent.startsWith("pnpm/")) return "pnpm";
  if (userAgent.startsWith("yarn/")) return "yarn";
  if (userAgent.startsWith("bun/")) return "bun";
  if (userAgent.startsWith("npm/")) return "npm";
  return "npm";
}

export function getToolcraftBinaryPath(projectDir, name) {
  return path.join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

export function getToolcraftFrozenInstallCommand(packageManager) {
  return {
    bun: { args: ["install", "--frozen-lockfile"], command: "bun" },
    npm: { args: ["ci"], command: "npm" },
    pnpm: { args: ["install", "--frozen-lockfile"], command: "pnpm" },
    yarn: { args: ["install", "--immutable"], command: "yarn" },
  }[packageManager];
}

function createProofProcessError({
  command,
  code,
  signal,
  stderr,
  stdout,
}) {
  const outcome = signal
    ? `after signal ${signal}`
    : `with code ${code ?? 1}`;
  const capturedOutput = [stdout, stderr]
    .filter((output) => output.length > 0)
    .join("\n");
  const error = new Error(
    `${path.basename(command)} exited ${outcome}.${capturedOutput ? `\n${capturedOutput}` : ""}`,
  );
  error.code = code;
  error.signal = signal;
  error.stderr = stderr;
  error.stdout = stdout;
  return error;
}

function createProofProcessSpawnError({ command, error, stderr, stdout }) {
  const reason = error.code ? `${error.code}: ${error.message}` : error.message;
  const capturedOutput = [stdout, stderr]
    .filter((output) => output.length > 0)
    .join("\n");
  const wrapped = new Error(
    `${path.basename(command)} failed to start: ${reason}.${capturedOutput ? `\n${capturedOutput}` : ""}`,
    { cause: error },
  );
  wrapped.code = error.code ?? null;
  wrapped.signal = null;
  wrapped.stderr = stderr;
  wrapped.stdout = stdout;
  return wrapped;
}

function createProofProcessDeadlineError({ cleanupErrors = [], command, deadlineMs, stderr, stdout }) {
  const capturedOutput = [stdout, stderr]
    .filter((output) => output.length > 0)
    .join("\n");
  const cleanupSummary = cleanupErrors.length === 0
    ? ""
    : ` Cleanup failures: ${cleanupErrors.map((error) => error.message).join(" | ")}.`;
  const error = new Error(
    `${path.basename(command)} exceeded its protected ${deadlineMs}ms wall deadline.${cleanupSummary}${capturedOutput ? `\n${capturedOutput}` : ""}`,
  );
  error.code = "TOOLCRAFT_PROOF_PROCESS_DEADLINE";
  error.signal = "SIGKILL";
  error.stderr = stderr;
  error.stdout = stdout;
  error.cleanupErrors = cleanupErrors;
  return error;
}

function createProofProcessResourceError({ command, resource }) {
  const error = new Error(`${path.basename(command)} exceeded its protected proof-process resource limit (${resource}).`);
  error.code = "TOOLCRAFT_PROOF_PROCESS_RESOURCE_LIMIT";
  error.resource = resource;
  return error;
}

export async function terminateToolcraftProofProcessTree({
  child,
  platform = process.platform,
  signal,
  spawnProcess = spawn,
  timeoutMs = 5_000,
}) {
  if (platform === "win32" && Number.isInteger(child.pid)) {
    await new Promise((resolve, reject) => {
      const termination = spawnProcess(
        "taskkill",
        ["/PID", String(child.pid), "/T", ...(signal === "SIGKILL" ? ["/F"] : [])],
        { stdio: "ignore" },
      );
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        termination.kill?.("SIGKILL");
        reject(new Error(`Windows process-tree termination timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      termination.once("error", (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Windows process-tree termination failed to start: ${error.message}`, { cause: error }));
      });
      termination.once("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`Windows process-tree termination exited with code ${code ?? 1}.`));
      });
    });
    return;
  }
  if (Number.isInteger(child.pid)) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Fall back to the direct child when a process group is unavailable.
    }
  }
  child.kill?.(signal);
}

function spawnToolcraftProofProcess(
  command,
  args,
  {
    capture = false,
    cwd,
    deadlineMs,
    env = process.env,
    limits = defaultCaptureLimits,
    platform = process.platform,
    spawnProcess = spawn,
    terminationGraceMs = 1_000,
    terminateProcessTree = terminateToolcraftProofProcessTree,
    useIpc = false,
  } = {},
) {
  if (
    deadlineMs !== undefined &&
    (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0)
  ) {
    throw new Error("Toolcraft proof process deadlineMs must be a positive safe integer.");
  }
  for (const [name, value] of Object.entries(limits)) if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`Toolcraft proof process ${name} limit must be a positive safe integer.`);
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, {
      cwd,
      detached: deadlineMs !== undefined && platform !== "win32",
      env,
      stdio: useIpc
        ? ["ignore", "pipe", "pipe", "ipc"]
        : capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let settled = false;
    let stdout = "";
    let stderr = "";
    const messages = [];
    let deadlineExceeded = false;
    let resourceExceeded = false;
    const deadlineTimer = deadlineMs === undefined
      ? undefined
      : setTimeout(() => {
          deadlineExceeded = true;
          void (async () => {
            const cleanupErrors = [];
            try {
              await terminateProcessTree({ child, platform, signal: "SIGTERM", spawnProcess });
            } catch (error) {
              cleanupErrors.push(error);
            }
            await new Promise((finishGrace) => setTimeout(finishGrace, terminationGraceMs));
            try {
              await terminateProcessTree({ child, platform, signal: "SIGKILL", spawnProcess });
            } catch (error) {
              cleanupErrors.push(error);
            }
            if (settled) return;
            settled = true;
            reject(createProofProcessDeadlineError({ cleanupErrors, command, deadlineMs, stderr, stdout }));
          })();
        }, deadlineMs);
    const clearProcessTimers = () => {
      if (deadlineTimer) clearTimeout(deadlineTimer);
    };
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    let stdoutBytes = 0, stderrBytes = 0, ipcBytes = 0;
    const stopForResource = (resource) => {
      if (settled || resourceExceeded) return;
      resourceExceeded = true; clearProcessTimers();
      child.stdout?.off("data", onStdout); child.stderr?.off("data", onStderr); child.off?.("message", onMessage);
      void Promise.resolve(terminateProcessTree({ child, platform, signal: "SIGKILL", spawnProcess })).then(() => {
        if (settled) return; settled = true; reject(createProofProcessResourceError({ command, resource }));
      }, (cleanupError) => {
        if (settled) return; settled = true;
        const error = createProofProcessResourceError({ command, resource }); error.cleanupErrors = [cleanupError]; reject(error);
      });
    };
    const onStdout = (chunk) => { stdoutBytes += Buffer.byteLength(chunk); if (stdoutBytes > limits.stdoutBytes) stopForResource("stdout-bytes"); else stdout += chunk; };
    const onStderr = (chunk) => { stderrBytes += Buffer.byteLength(chunk); if (stderrBytes > limits.stderrBytes) stopForResource("stderr-bytes"); else stderr += chunk; };
    const onMessage = (message) => {
      if (messages.length + 1 > limits.ipcMessages) return stopForResource("ipc-message-count");
      let serialized;
      try { serialized = JSON.stringify(message); } catch { return stopForResource("ipc-serialized-bytes"); }
      ipcBytes += Buffer.byteLength(serialized); if (ipcBytes > limits.ipcBytes) return stopForResource("ipc-serialized-bytes"); messages.push(message);
    };
    child.stdout?.on("data", onStdout); child.stderr?.on("data", onStderr); child.on?.("message", onMessage);
    child.once("error", (error) => {
      if (settled) return;
      if (resourceExceeded) return;
      if (deadlineExceeded) return;
      settled = true;
      clearProcessTimers();
      reject(createProofProcessSpawnError({ command, error, stderr, stdout }));
    });
    child.once("close", (code, signal) => {
      if (settled) return;
      if (resourceExceeded) return;
      if (deadlineExceeded) return;
      settled = true;
      clearProcessTimers();
      if (signal || code !== 0) {
        reject(
          createProofProcessError({
            command,
            code,
            signal,
            stderr,
            stdout,
          }),
        );
      } else {
        resolve(useIpc ? { messages, stderr, stdout } : capture ? stdout : undefined);
      }
    });
  });
}

export function runToolcraftProofProcess(command, args, options = {}) {
  return spawnToolcraftProofProcess(command, args, options);
}

export function captureToolcraftProofProcess(command, args, options = {}) {
  return spawnToolcraftProofProcess(command, args, {
    ...options,
    capture: true,
  });
}

export function captureToolcraftProofIpcProcess(command, args, options = {}) {
  return spawnToolcraftProofProcess(command, args, {
    ...options,
    capture: true,
    useIpc: true,
  });
}

export function runToolcraftProofPackageScript(
  projectDir,
  scriptName,
  { env = process.env } = {},
) {
  const packageManager = detectToolcraftPackageManager(projectDir, env);
  const args =
    packageManager === "npm" || packageManager === "bun"
      ? ["run", scriptName]
      : [scriptName];
  return runToolcraftProofProcess(packageManager, args, {
    cwd: projectDir,
    env,
  });
}

export async function ensureToolcraftChromium({
  accessFile = access,
  playwright,
  projectDir,
  runProcess = runToolcraftProofProcess,
}) {
  let executablePath;
  try {
    executablePath = playwright.chromium.executablePath();
    await accessFile(executablePath);
    return;
  } catch {
    // The canonical Playwright installer below owns recovery for a missing browser.
  }
  const installKey = JSON.stringify([
    path.resolve(projectDir),
    executablePath ?? "chromium",
  ]);
  let installPromise = chromiumInstallPromises.get(installKey);
  if (!installPromise) {
    installPromise = Promise.resolve().then(() =>
      runProcess(
        getToolcraftBinaryPath(projectDir, "playwright"),
        ["install", "chromium"],
        { cwd: projectDir, deadlineMs: 120_000 },
      )
    );
    chromiumInstallPromises.set(installKey, installPromise);
  }
  try {
    await installPromise;
  } finally {
    if (chromiumInstallPromises.get(installKey) === installPromise) {
      chromiumInstallPromises.delete(installKey);
    }
  }
}
