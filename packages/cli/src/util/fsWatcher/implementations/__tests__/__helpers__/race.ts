import * as timers from 'node:timers/promises';

export async function race(maxDuration: number, controller: AbortController, expectation: () => void) {
  const opts = { signal: controller.signal } as const;
  await Promise.race([
    timers.setTimeout(maxDuration, opts).then(() => controller.abort()),
    (async () => {
      for await (const _ of timers.setInterval(50, opts)) {
        try {
          expectation();
          break;
        } catch {
          // no-op
        }
      }
    })(),
  ]);
}
