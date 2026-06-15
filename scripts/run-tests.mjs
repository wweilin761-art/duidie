import { spawn } from 'node:child_process';
import * as esbuild from 'esbuild';

const testEntryPoint = 'tests/core/v03-systems.test.ts';
const outfile = '/tmp/stacklands-v03-tests.mjs';

try {
  await esbuild.build({
    entryPoints: [testEntryPoint],
    bundle: true,
    outfile,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    sourcemap: 'inline',
    logLevel: 'silent',
    absWorkingDir: process.cwd(),
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}

const child = spawn(process.execPath, ['--test', outfile], {
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`node --test terminated by signal ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
