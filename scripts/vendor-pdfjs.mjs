import { cp, copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'node_modules/pdfjs-dist');
const destination = path.join(root, 'public/pdfjs');
await mkdir(destination, { recursive: true });
for (const directory of ['cmaps', 'standard_fonts', 'wasm']) {
  await cp(path.join(source, directory), path.join(destination, directory), { recursive: true });
}
await copyFile(path.join(source, 'LICENSE'), path.join(destination, 'LICENSE.txt'));
