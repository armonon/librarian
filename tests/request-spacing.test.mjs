import test from 'node:test';
import assert from 'node:assert/strict';
import { spacedRequests } from '../src/request-spacing.js';

test('concurrent pages and edition lookups share spaced starts even after failures', async () => {
  let clock = 0;
  const starts = [];
  const schedule = spacedRequests(1100, { now: () => clock, wait: async ms => { clock += ms; } });
  const requests = Array.from({ length: 6 }, (_, i) => schedule(() => {
    starts.push(clock);
    if (i === 1) throw new Error('upstream unavailable');
    return i;
  }));
  const results = await Promise.allSettled(requests);
  assert.deepEqual(starts, [0, 1100, 2200, 3300, 4400, 5500]);
  assert.equal(results[1].status, 'rejected');
  assert.equal(results[5].value, 5);
});

test('late timer wakeups do not allow queued calls to burst on resume', async () => {
  let clock = 0;
  const starts = [];
  let late = true;
  const schedule = spacedRequests(1100, { now: () => clock, wait: async ms => {
    clock += late ? 60000 : ms;
    late = false;
  } });
  await Promise.all([0, 1, 2].map(() => schedule(() => starts.push(clock))));
  assert.deepEqual(starts, [0, 60000, 61100]);
});
