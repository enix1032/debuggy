import debuggy from "./debuggy";

/**
 * Buffered logger helper for @en32/debuggy.
 *
 * Provides two buffering modes:
 *  - "interval": Collects log calls in a buffer and flushes them every N ms.
 *  - "async": Exposes an async iterable stream that can be consumed with `for await ... of`.
 *
 * Options:
 *  - mode: "interval" | "async"
 *  - interval: flush interval in ms (default 1000, only used in interval mode)
 *  - flushCallback: function called after each flush (interval mode only)
 */
export function buffered(
  label: string,
  templateName?: string,
  options?: { mode: "interval"; interval?: number; flushCallback?: (flushed: any[][]) => void }
): (...args: any[]) => void;

export function buffered(
  label: string,
  templateName?: string,
  options?: { mode: "async" }
): { log: (...args: any[]) => void; stream: AsyncGenerator<any> };

export function buffered(
  label: string,
  templateName?: string,
  options:
    | { mode: "interval"; interval?: number; flushCallback?: (flushed: any[][]) => void }
    | { mode: "async" } = { mode: "interval" }
) {
  if (options.mode === "interval") {
    let buffer: any[] = [];
    const interval = options.interval ?? 1000;

    setInterval(() => {
      if (buffer.length > 0) {
        const flush = [...buffer];
        buffer = [];
        debuggy(label, undefined, templateName)(flush);

        // Call user callback if provided
        if ("flushCallback" in options && typeof options.flushCallback === "function") {
          options.flushCallback(flush);
        }
      }
    }, interval);

    return (...args: any[]) => {
      buffer.push(args);
    };
  }

  if (options.mode === "async") {
    const queue: any[] = [];
    let resolveNext: (() => void) | null = null;

    async function* generator() {
      while (true) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => {
            resolveNext = resolve;
          });
        }
        while (queue.length > 0) {
          yield queue.shift();
        }
      }
    }

    const gen = generator();

    const log = (...args: any[]) => {
      debuggy(label, undefined, templateName)(...args);
      queue.push(args);

      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    };

    return { log, stream: gen };
  }
}
