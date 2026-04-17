import { spawn } from "node:child_process";
import net from "node:net";

const basePort = Number(process.env.PORT || 3000);
const maxPort = basePort + 20;

function isPortFree(port) {
  return new Promise((resolve) => {
    const tryHosts = ["127.0.0.1", "::"];
    let index = 0;

    const tryNext = () => {
      if (index >= tryHosts.length) {
        resolve(true);
        return;
      }

      const host = tryHosts[index++];
      const server = net.createServer();
      server.unref();
      server.once("error", () => {
        server.close(() => resolve(false));
      });
      server.listen({ host, port }, () => {
        server.close(() => tryNext());
      });
    };

    tryNext();
  });
}

async function findPort() {
  for (let port = basePort; port <= maxPort; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found between ${basePort} and ${maxPort}`);
}

async function getOpenPorts() {
  const ports = [];
  for (let port = basePort; port <= maxPort; port += 1) {
    if (!(await isPortFree(port))) ports.push(port);
  }
  return ports;
}

const occupiedPorts = await getOpenPorts();
if (occupiedPorts.length > 0) {
  console.log(`Next.js dev server already running on port(s): ${occupiedPorts.join(", ")}`);
  console.log(`Open http://localhost:${occupiedPorts[0]}`);
  process.exit(0);
}

const port = await findPort();
console.log(`Starting Next.js dev server on port ${port}`);

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", String(port)], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(port),
  },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
