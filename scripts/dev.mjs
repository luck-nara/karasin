import { spawn } from "node:child_process";

function getRunner() {
  if (process.platform === "win32") {
    return {
      command: "powershell.exe",
      baseArgs: ["-NoLogo", "-NoProfile", "-Command"],
      makeArgs: (npmArgs) => {
        const cmd = `npm ${npmArgs.map((a) => JSON.stringify(a)).join(" ")}`;
        return [...["-NoLogo", "-NoProfile", "-Command"], cmd];
      },
    };
  }
  return {
    command: "npm",
    baseArgs: [],
    makeArgs: (npmArgs) => npmArgs,
  };
}

const runner = getRunner();

function run(name, npmArgs) {
  const child = spawn(runner.command, runner.makeArgs(npmArgs), {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
  });
  child.on("error", (err) => {
    console.error(`[${name}] failed to start:`, err);
    process.exitCode = 1;
  });
  return child;
}

run("backend", ["run", "dev", "--workspace", "backend"]);
run("frontend", ["run", "dev", "--workspace", "frontend"]);

