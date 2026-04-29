const { spawn } = require("node:child_process");

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";

const processes = [
  ["backend", ["run", "backend:dev"]],
  ["frontend", ["run", "frontend:dev"]],
];

const children = processes.map(([name, args]) => {
  const child = spawn(npmCommand, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`${name} stopped with signal ${signal}`);
      return;
    }

    if (code !== 0) {
      console.log(`${name} exited with code ${code}`);
    }
  });

  return child;
});

function stopChildren() {
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
}

process.on("SIGINT", () => {
  stopChildren();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopChildren();
  process.exit(0);
});
