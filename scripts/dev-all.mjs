import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const processes = [
  spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'watch', 'server/src/server.ts'], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true
  }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--configLoader', 'runner'], {
    cwd: path.join(root, 'client'),
    stdio: 'inherit',
    windowsHide: true
  })
];

let stopping = false;
function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (child.exitCode === null) child.kill();
  }
  process.exitCode = exitCode;
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error('Unable to start a development service:', error.message);
    stopAll(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      if (signal) console.log(`Development service stopped (${signal}).`);
      stopAll(code ?? 1);
    }
  });
}

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
