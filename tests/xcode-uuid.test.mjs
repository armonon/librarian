import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const xcode = require('xcode');
const parser = require('xcode/lib/parser/pbxproj');

test('Xcode UUID override generates valid IDs and preserves the iOS project', () => {
  const project = xcode.project(fileURLToPath(new URL('../ios/App/App.xcodeproj/project.pbxproj', import.meta.url)));
  project.parseSync();
  const ids = new Set(Array.from({ length: 100 }, () => project.generateUuid()));
  assert.equal(ids.size, 100);
  for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/);
  const reparsed = parser.parse(project.writeSync());
  assert.deepEqual(reparsed.project, project.hash.project);
});
