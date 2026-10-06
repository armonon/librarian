import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export function normalizeIOSPackage(source) {
  // Capacitor 8.5.2 emits .v18 under tools 5.9, where that enum is unavailable.
  // The string initializer expresses the same deployment target under tools 5.9.
  if (source.includes('platforms: [.iOS("18.0")]')) return source;
  if (!source.includes('platforms: [.iOS(.v18)]')) throw new Error('Unexpected iOS Swift package deployment target');
  return source.replace('platforms: [.iOS(.v18)]', 'platforms: [.iOS("18.0")]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const file = new URL('../ios/App/CapApp-SPM/Package.swift', import.meta.url);
  const source = await readFile(file, 'utf8');
  const normalized = normalizeIOSPackage(source);
  if (source !== normalized) await writeFile(file, normalized);
}
