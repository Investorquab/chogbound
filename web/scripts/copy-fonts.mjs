import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '../../fonts');
const target = path.resolve(here, '../public/fonts');
await mkdir(target, { recursive: true });
try {
  const files = (await readdir(source)).filter((name) => name.endsWith('.woff2'));
  if (files.length === 0) throw new Error('No .woff2 files found');
  await Promise.all(files.map((name) => cp(path.join(source, name), path.join(target, name))));
  console.log(`Copied ${files.length} self-hosted fonts to web/public/fonts`);
} catch (error) {
  if (process.env.CI === 'true') throw error;
  console.warn(`Font copy deferred: ${error instanceof Error ? error.message : String(error)}. Run from a full repository checkout to copy /fonts.`);
}
