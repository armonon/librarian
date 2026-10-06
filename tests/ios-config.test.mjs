import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import config from '../vite.config.js';
import { normalizeIOSPackage } from '../scripts/normalize-ios-package.mjs';

test('Capacitor regeneration keeps iOS 18 compatible with its Swift 5.9 manifest', () => {
  const source = '// swift-tools-version: 5.9\nplatforms: [.iOS(.v18)],\n';
  const result = normalizeIOSPackage(source);
  assert.equal(result, '// swift-tools-version: 5.9\nplatforms: [.iOS("18.0")],\n');
  assert.equal(normalizeIOSPackage(result), result);
  assert.throws(() => normalizeIOSPackage('platforms: [.iOS(.v15)]'));
});

test('iOS uses matching legacy PDF API and worker with a Safari target', () => {
  const ios = config({ mode: 'ios' });
  assert.equal(ios.build.target, 'safari18');
  assert.deepEqual(ios.resolve.alias, [
    { find: 'pdfjs-dist/build/pdf.mjs', replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
    { find: 'pdfjs-dist/build/pdf.worker.min.mjs?url', replacement: 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url' },
  ]);
  assert.equal(config({ mode: 'production' }).resolve, undefined);
});

test('iOS sync selects the compatible build and declares arm64 on iOS 18+', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  assert.match(pkg.scripts['ios:sync'], /build -- --mode ios/);
  const project = await readFile(new URL('../ios/App/App.xcodeproj/project.pbxproj', import.meta.url), 'utf8');
  const targets = [...project.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g)];
  assert.equal(targets.length, 4);
  for (const target of targets) assert.equal(target[1], '18.0');
  const info = await readFile(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8');
  assert.match(info, /<string>arm64<\/string>/);
  assert.doesNotMatch(info, /<string>armv7<\/string>/);
});
