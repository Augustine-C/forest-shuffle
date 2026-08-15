import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [
  spawn(npmCommand, ['--prefix', 'server', 'run', 'dev'], {
    cwd: repositoryRoot,
    stdio: 'inherit',
  }),
  spawn(npmCommand, ['--prefix', 'client', 'run', 'dev'], {
    cwd: repositoryRoot,
    stdio: 'inherit',
  }),
];

let stopping = false;

const stop = (signal = 'SIGTERM') => {
  if (stopping) return;
  stopping = true;
  processes.forEach(child => {
    if (!child.killed) child.kill(signal);
  });
};

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

processes.forEach(child => {
  child.on('error', error => {
    console.error(error);
    process.exitCode = 1;
    stop();
  });

  child.on('exit', (code, signal) => {
    if (stopping) return;
    process.exitCode = code ?? (signal ? 1 : 0);
    stop();
  });
});
