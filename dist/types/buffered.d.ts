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
export declare function buffered(label: string, templateName?: string, options?: {
    mode: "interval";
    interval?: number;
    flushCallback?: (flushed: any[][]) => void;
}): (...args: any[]) => void;
export declare function buffered(label: string, templateName?: string, options?: {
    mode: "async";
}): {
    log: (...args: any[]) => void;
    stream: AsyncGenerator<any>;
};
