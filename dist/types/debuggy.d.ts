import { DebuggyOptions, DebuggyInstance, CreateMethodReturnType, IntervalLoggerWithDispose, AsyncLoggerWithDispose } from './types';
export * as utils from './utils';
/**
 * Main Debuggy class for managing debug logs.
 * @class
 */
export declare class Debuggy {
    /**
     * Creates an instance of Debuggy.
     * @param {DebuggyOptions} options - The configuration options for Debuggy.
     */
    constructor(options?: DebuggyOptions);
    /**
     * Updates the configuration options.
     * @param {DebuggyOptions} options - The options to configure Debuggy with.
     */
    options(options: DebuggyOptions): void;
    /**
     * The main output function. Returns a function to log arguments.
     * @param {string} label - The log label.
     * @param {string | string[]} [mode] - Optional mode for formatting, or template name.
     * @param {string} [templateName] - Optional name of the template to use.
     * @param {string} [level] - Optional log level.
     * @returns {() => void} A function that accepts arguments to be logged.
     */
    output(label?: string, mode?: string | string[], templateName?: string, level?: string): (...args: any[]) => void;
    /**
     * Creates a new custom method for the debuggy instance.
     * This allows users to create reusable logging functions with predefined labels and templates.
     * @template T The name of the custom method.
     * @param {T} name The name of the custom method (e.g., 'warn', 'error').
     * @param {string} label A predefined label for the custom method.
     * @param {string} [templateName] The name of the template to use for this method.
     * @returns {this & CreateMethodReturnType<T>} The debuggy instance with the new custom method added.
     * @example
     * ```typescript
     * const debug = debuggy
     * .create('warn', '<rYh>{label}<s>')
     * .create('error', '<yRh>{label}<s>');
     *
     * debug.warn('Warning Label')(sampleData);
     * debug.error('Error Label')(sampleData);
     * ```
     */
    create<T extends string>(name: T, label: string, templateName?: string): this & CreateMethodReturnType<T>;
    /**
     * Creates a new custom preset method for the debuggy instance.
     * Unlike `create`, which returns a two-step logger (`method(label)(data)`),
     * `preset` provides a one-step shortcut (`method(data)`).
     *
     * This allows defining reusable logging functions with fixed labels
     * and optional templates.
     *
     * @template T The name of the custom method (e.g., 'log', 'info').
     * @param {T} name The name of the preset method.
     * @param {string} label A predefined label for the preset method.
     * @param {string} [templateName] The name of the template to use for this method.
     * @returns {this & { [key in T]: (...args: any[]) => void }}
     * The debuggy instance with the new preset method added.
     *
     * @example
     * ```typescript
     * const debug = debuggy
     * .preset('log', '<bYh>Log Data<s>')
     * .preset('info', '<yGh>Info Data<s>', 'myCustom');
     *
     * debug.log({ id: 1, message: 'Hello' });
     * debug.info({ id: 2, message: 'World' });
     * ```
     */
    preset<T extends string>(name: T, label: string, templateName?: string): this & {
        [key in T]: (...args: any[]) => void;
    };
    /**
     * Buffered logger helper.
     *
     * Provides two buffering modes:
     *  - "interval": Collects log calls in a buffer and flushes them every N ms.
     *  - "async": Exposes an async iterable stream that can be consumed with `for await ... of`.
     *
     * Supports `.dispose()` to stop interval or clear async queue.
     */
    buffered(label: string, templateName?: string, options?: {
        mode: "interval";
        interval?: number;
        flushCallback?: (flushed: any[][]) => void;
    } | {
        mode: "async";
    }): IntervalLoggerWithDispose | AsyncLoggerWithDispose | undefined;
}
declare const debuggyInstance: Debuggy;
export declare const debuggy: DebuggyInstance;
export { debuggyInstance };
export default debuggy;
