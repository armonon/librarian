import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('failed PDF import clears busy state, reports failure and never advertises an unsaved entry', async () => {
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const start = source.indexOf('async function importPdfs(');
  const end = source.indexOf('async function removePdf(', start);
  const state = { library: [], importing: false, libError: '' };
  const context = vm.createContext({ state, uid: () => 'one', render: () => {}, libraryReady: Promise.resolve(),
    pdfSave: async () => { throw new DOMException('Full', 'QuotaExceededError'); } });
  vm.runInContext(source.slice(start, end), context);
  await context.importPdfs([{ name: 'original.pdf', type: 'application/pdf', size: 10 }]);
  assert.equal(state.importing, false);
  assert.equal(state.library.length, 0);
  assert.match(state.libError, /could not be saved/);
});
