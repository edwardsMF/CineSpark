#!/usr/bin/env node
import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function hasDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    execSync('docker compose version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  const child = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
  return new Promise((resolvePromise, rejectPromise) => {
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function start() {
  const rootDir = resolve(__dirname, '..');
  const hasCompose = existsSync(resolve(rootDir, 'docker-compose.yml'));

  if (hasDocker() && hasCompose) {
    console.log('Docker detected. Starting containers (build + up -d)...');
    await run('docker', ['compose', 'up', '-d', '--build']);
    console.log('Containers are up. Tail logs with: npm run logs');
    return;
  }

  console.log('Docker not available. Falling back to dev mode.');
  // Try full dev (server + client). If server fails (e.g., Oracle not installed), at least run client.
  try {
    await run('npm', ['run', 'dev']);
  } catch (err) {
    console.warn('Full dev failed, starting client only. Reason:', err.message);
    await run('npm', ['run', 'client']);
  }
}

start().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});


