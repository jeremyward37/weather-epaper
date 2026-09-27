// Node resolves `node --test server/test` through this package entrypoint.
// Keep it equivalent to the npm test glob without duplicating test discovery.
import { readdir } from 'node:fs/promises';

for (const name of (await readdir(new URL('.', import.meta.url))).filter(file => file.endsWith('.test.js')).sort()) {
  await import(`./${name}`);
}
