import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const distDir = resolve(projectRoot, "dist");

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

try {
  await run("npm", ["run", "build"]);
  await access(distDir);
  console.log("✅ Frontend build verification passed. dist/ is present.");
} catch (error) {
  console.error("❌ Frontend build verification failed.");
  console.error(error.message);
  process.exitCode = 1;
}
