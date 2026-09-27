#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runJob } from '../src/job.js';

function parseArgs(argv) {
  const options = {};
  const valued = new Set(['--out', '--now', '--fixture']);
  const flags = new Map([['--low-battery', 'lowBattery'], ['--dry-run', 'dryRun']]);
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (valued.has(token)) {
      if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`${token} needs a value`);
      const key = token.slice(2);
      if (options[key] != null) throw new Error(`${token} was repeated`);
      options[key] = argv[++index];
    } else if (flags.has(token)) {
      const key = flags.get(token);
      if (options[key]) throw new Error(`${token} was repeated`);
      options[key] = true;
    } else {
      throw new Error(`unknown argument: ${token}`);
    }
  }
  return options;
}

export async function runCli(argv, deps = {}, io = { out: console.log, err: console.error }) {
  const started = performance.now();
  let step = 'arguments';
  try {
    const options = parseArgs(argv);
    const result = await runJob(options, { ...deps, onStep: value => { step = value; } });
    io.out(JSON.stringify({ level: 'info', step: 'complete', ms: Math.round(performance.now() - started),
      dataUpdateTime: result.dataUpdateTime, footerTimestamp: result.footerTimestamp,
      dryRun: Boolean(options.dryRun) }));
    return 0;
  } catch (error) {
    io.err(JSON.stringify({ level: 'error', step, ms: Math.round(performance.now() - started),
      dataUpdateTime: null, footerTimestamp: null, error: error.message }));
    return 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = await runCli(process.argv.slice(2));
}
