// Share one gate between search pages and edition lookups. Reserve each start
// after the timer wakes, so a suspended app cannot release a burst on resume.
export function spacedRequests(interval = 1100, {
  now = () => Date.now(),
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  let previous = -Infinity;
  let tail = Promise.resolve();
  return run => {
    const slot = tail.then(async () => {
      const delay = interval - (now() - previous);
      if (delay > 0) await wait(delay);
      previous = now();
    });
    tail = slot.catch(() => {});
    return slot.then(run);
  };
}
