import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { shelfRecord } from '../src/catalog-rights.js';

const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
function fixture(mode = 'ok', saved = []) {
  const disk = new Map([['shelf', JSON.stringify(saved)]]);
  const updates = [];
  const state = { saved, tab: 'search', shelfError: '' };
  const context = vm.createContext({ shelfRecord, state, storeKey: 'shelf',
    localStorage: {
      setItem(key, value) {
        if (mode === 'quota') throw new DOMException('Full', 'QuotaExceededError');
        if (mode === 'blocked') throw new DOMException('Blocked', 'SecurityError');
        if (mode !== 'silent') disk.set(key, value);
      },
      getItem: key => disk.get(key),
    },
    findBook: () => ({ id: 'fixture', title: 'Disposable book' }), key: book => book.id,
    render: () => updates.push('render'), syncSaveButtons: () => updates.push('buttons'),
    syncShelfCount: () => updates.push('count'),
    document: { querySelectorAll: () => [] },
  });
  vm.runInContext(source.slice(source.indexOf('function persist('), source.indexOf('function loadLibrary(')), context);
  vm.runInContext(source.slice(source.indexOf('function toggleSave('), source.indexOf('function syncSaveButtons(')), context);
  return { state, disk, updates, context };
}

for (const mode of ['quota', 'blocked', 'silent']) {
  test(`${mode} shelf writes keep the old shelf and report an error`, () => {
    const f = fixture(mode);
    f.context.toggleSave('fixture');
    assert.equal(f.state.saved.length, 0);
    assert.equal(f.disk.get('shelf'), '[]');
    assert.match(f.state.shelfError, /Could not confirm/);
    assert.deepEqual(f.updates, ['render']);
  });
  test(`${mode} shelf removals preserve the saved entry`, () => {
    const original = [{ id: 'fixture', title: 'Disposable book' }];
    const f = fixture(mode, original);
    f.context.remove('fixture');
    assert.equal(f.state.saved, original);
    assert.deepEqual(JSON.parse(f.disk.get('shelf')), original);
    assert.match(f.state.shelfError, /Could not confirm/);
    assert.deepEqual(f.updates, ['render']);
  });
}
test('successful writes commit once, persist order, and clear a prior error', () => {
  const f = fixture('ok', [{ id: 'older' }]);
  f.state.shelfError = 'Earlier failure';
  f.context.toggleSave('fixture');
  assert.deepEqual(JSON.parse(f.disk.get('shelf')).map(book => book.id), ['fixture', 'older']);
  assert.equal(f.state.shelfError, '');
  assert.deepEqual(f.updates, ['render']);
  f.context.toggleSave('fixture');
  assert.deepEqual(JSON.parse(f.disk.get('shelf')).map(book => book.id), ['older']);
  assert.equal(f.state.saved.length, 1);
});
test('shelf errors are exposed in both the page and book dialog', () => {
  assert.equal((source.match(/role="alert" data-shelf-error/g) || []).length, 2);
});
