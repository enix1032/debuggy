import { _tpl, parseStackTraceLine, splitAndCleanString, header } from './utils';
import { DebuggyOptions, TemplateParams, DebuggyInstance, CreateMethodReturnType, LogData, IntervalLoggerWithDispose, AsyncLoggerWithDispose } from './types';
export * as utils from './utils'

// Environment check
const isEnabled = process.env.DEBUG && process.env.DEBUG.toLowerCase() === 'debuggy';

/**
 * Main Debuggy class for managing debug logs.
 * @class
 */
export class Debuggy {
  /**
   * @internal
   */
  private _options: DebuggyOptions;

  /**
   * @internal
   */
  private _countMap: Map<string, number>;
  /**
   * Creates an instance of Debuggy.
   * @param {DebuggyOptions} options - The configuration options for Debuggy.
   */
  constructor(options: DebuggyOptions = {}) {
    // --- normalize deprecated fields ---
    options = this.normalizeOptions(options);

    this._options = {
      stackTraceIndex: 2,
      activeTemplate: "default",
      templates: {},
      dateFormatter: undefined,
      useCounter: true,
      logger: {
        enabled: false,
        saveMethod: undefined,
      },
      ...options,
    };

    if (isEnabled) {
      const globalKey = "__debuggy_countMap";
      if (!(globalKey in globalThis)) {
        (globalThis as any)[globalKey] = new Map<string, number>();
      }
      this._countMap = (globalThis as any)[globalKey];

      header(this._options);

    } else {
      this._countMap = new Map(); // fallback dummy map
    }
  }

  /**
   * Updates the configuration options.
   * @param {DebuggyOptions} options - The options to configure Debuggy with.
   */
  public options(options: DebuggyOptions) {
    // --- normalize deprecated fields ---
    options = this.normalizeOptions(options);

    if (options.logger) {
      this._options.logger = { ...this._options.logger, ...options.logger };
    }

    Object.assign(this._options, options);

    if (isEnabled && this._options?.displayHeader) {
      header(this._options, false, true);
    }
  }

  /**
   * Normalize deprecated option names into their new counterparts.
   * Ensures backward compatibility.
   * @internal
   */
  private normalizeOptions(options: DebuggyOptions): DebuggyOptions {
    if(!isEnabled) return options;

    const normalized: DebuggyOptions = { ...options };

    if (options.shows && !options.enabledTags) {
      console.warn('[debuggy] ⚠️ "shows" is deprecated, use "enabledTags" instead.');
      normalized.enabledTags = options.shows;
    }
    if (options.templateActive && !options.activeTemplate) {
      console.warn('[debuggy] ⚠️ "templateActive" is deprecated, use "activeTemplate" instead.');
      normalized.activeTemplate = options.templateActive;
    }
    if (options.stackFileIndex && !options.stackTraceIndex) {
      console.warn('[debuggy] ⚠️ "stackFileIndex" is deprecated, use "stackTraceIndex" instead.');
      normalized.stackTraceIndex = options.stackFileIndex;
    }
    if (options.stackMode && !options.stackTraceMode) {
      console.warn('[debuggy] ⚠️ "stackMode" is deprecated, use "stackTraceMode" instead.');
      normalized.stackTraceMode = options.stackMode;
    }
    if (options.showsHeader && !options.displayHeader) {
      console.warn('[debuggy] ⚠️ "showsHeader" is deprecated, use "displayHeader" instead.');
      normalized.displayHeader = options.showsHeader;
    }
    if (options.logger?.write !== undefined && normalized.logger?.enabled === undefined) {
      console.warn('[debuggy] ⚠️ "logger.write" is deprecated, use "logger.enabled" instead.');
      normalized.logger = {
        ...normalized.logger,
        enabled: options.logger.write,
      };
    }

    return normalized;
  }

  /**
   * @internal
   * @param {boolean} buffered
   * @param {boolean} logger
   * @returns
   */
  private _catchError(buffered: boolean = false): Omit<LogData, 'label'> {
    let parsedStack: Omit<LogData, 'label'> = { at: 'N/A', file: '', line: 0, column: 0 };

    if(!isEnabled) return parsedStack;

    const normalizeForCompare = (p: string) => p.replace(/\\/g, "/");

    try {
      throw new Error();
    } catch (error) {
      if (error instanceof Error && error.stack) {
        const stacks = error.stack
          .split(/\n/m)
          .map(line => line.trim())
          // .filter(line => !line.includes('/dist/debuggy.js') || !line.includes('/src/debuggy.ts')) // Filter out internal files
          .slice(1);
        
        const mode = this._options.stackTraceMode ?? "index";

        // --- Mode: filename / auto ---
        if ((mode === "filename" || mode === "auto") && typeof __filename === "string") {
          const filenameNorm = normalizeForCompare(__filename);
          const found = stacks.find(line => normalizeForCompare(line).includes(filenameNorm + ':'));

          if (found) {
            parsedStack = parseStackTraceLine(found);
            return parsedStack;
          }

          // Auto fallback ke index, kalau filename gagal
          if (mode === "filename") {
            return parsedStack; // gagal, tapi tidak fallback
          }
        }

        const logger = this._options.logger?.enabled
        console.log(logger)
        // --- Mode: index / auto fallback ---
        if (mode === "index" || mode === "auto") {
          let stackTraceIndex = this._options.stackTraceIndex || 2
          if(logger) stackTraceIndex = (process.versions?.bun ? -1 : 0);
          if(buffered) {
            stackTraceIndex = stackTraceIndex + 0
          };

          const str = stacks[stackTraceIndex + (logger ? 1 : 0)];
          if (str) {
            parsedStack = parseStackTraceLine(str);
          }
        }
      }
    }

    return parsedStack;
  }

  /**
   * The main output function. Returns a function to log arguments.
   * @param {string} label - The log label.
   * @param {string | string[]} [mode] - Optional mode for formatting, or template name.
   * @param {string} [templateName] - Optional name of the template to use.
   * @param {string} [level] - Optional log level.
   * @returns {() => void} A function that accepts arguments to be logged.
   */
  public output(
    label: string = '',
    mode?: string | string[],
    templateName?: string,
    level?: string
  ): (...args: any[]) => void {
    const { shows, logger } = this._options;

    if(!isEnabled && !logger?.write) return () => {};

    let prefix = '';
    const tagMatch = /^\[(?<prefix>[A-Z\_\-]+)\]/.exec(label);
    if (tagMatch && tagMatch.groups) {
      prefix = tagMatch.groups.prefix.toUpperCase();
      label = label.replace(tagMatch[0], '').trim();
    }

    const shouldLogToFile = (typeof mode === 'string' && mode.includes('%log')) || (typeof label === 'string' && label.includes('%log'));
    const isTagAllowed = !shows || splitAndCleanString(Array.isArray(shows) ? shows.join(',') : shows).includes(prefix);
    const shouldDisplay = isEnabled && isTagAllowed;

    // A closure to handle logging to file, if applicable
    const logToFile = (args: any[]) => {
      if (logger?.write && logger.saveMethod && shouldLogToFile) {
        let parsedStack: Omit<LogData, 'label'> = { at: 'N/A', file: '', line: 0, column: 0 };
        parsedStack = this._catchError(true);

        const logData: LogData = {
          label: label || parsedStack.at,
          ...parsedStack,
          level: level || 'info'
        };
        logger.saveMethod({
          level,
          args: [args[0]],
          path: logData.file,
          ...logData,
        });
      }
    };

    // Return early if not enabled and not logging to file
    if (!shouldDisplay && !shouldLogToFile) {
      return () => {};
    }

    let templateToUse = templateName || this._options.activeTemplate;
    let finalLabel = label;
    let finalMode = mode;

    // Determine final mode and label
    if (typeof mode === 'string' && (mode.includes('%j') || mode.includes('%t') || mode.includes('%log'))) {
      finalLabel = mode.replace(/\%[\w]/ig, '').trim();
      finalMode = mode;
      templateToUse = this._options.activeTemplate;
    } else if (typeof label === 'string' && (label.includes('%j') || label.includes('%t') || label.includes('%log'))) {
      finalMode = label;
      finalLabel = label.replace(/\%[\w]+/ig, '').trim();
    }

    return (...args: any[]) => {
      // Get stack trace for file, line, and column dynamically
      let parsedStack: Omit<LogData, 'label'> = { at: 'N/A', file: '', line: 0, column: 0 };
      parsedStack = this._catchError()

      const logData: LogData = {
        label: finalLabel || parsedStack.at,
        ...parsedStack,
        level: level || 'info'
      };

      // --- handle counter ---
      let counter = 0;
      if (this._options.useCounter) {
        counter = (this._countMap.get(label) || 0) + 1;
        logData.count = counter
        this._countMap.set(label, counter);
      }

      if (shouldDisplay) {
        this._displayLog({
          label: finalLabel,
          args,
          mode: finalMode,
          templateName: templateToUse || 'default',
          data: logData,
        });
      }
      logToFile(args);
    };
  }

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
  public create<T extends string>(name: T, label: string, templateName?: string): this & CreateMethodReturnType<T> {
    const newMethod = (dynamicLabel: string = '') => {
      const finalLabel = label.replace(/\{label\}/g, dynamicLabel);
      return this.output(finalLabel, undefined, templateName, name);
    };

    // Use a type assertion to add the new method to 'this'
    (this as any)[name] = newMethod;

    return this as this & CreateMethodReturnType<T>;
  }

  /**
   * Shorthand Template
   * @internal
   * @param tpl
   * @param executedTime
   */
  private executeTimeTemplate(tpl: Function, executedTime: string) {
    console.log(tpl(`<hy>---------------------<s>`, { executedTime }));
    console.log(tpl(`<hy>executed time: <hw>{executedTime}ms`, { executedTime }));
  }

  /**
   * Displays the log output based on the active template and writes to logger if configured.
   * @internal
   * @param {object} params - The parameters for displaying the log.
   * @param {string} params.label - The log label.
   * @param {any[]} params.args - The arguments to be logged.
   * @param {string | string[] | undefined} params.mode - The log mode.
   * @param {string} params.templateName - The name of the template to use.
   * @param {LogData} params.data - The log data.
   */
  private _displayLog({ label, args, mode, templateName, data }: {
    label: string,
    args: any[],
    mode: string | string[] | undefined,
    templateName: string,
    data: LogData,
  }) {
    const { templates, dateFormatter } = this._options;

    // Remove `%log` token so it doesn't appear in the console output.
    const sanitizedLabel = typeof label === 'string' ? label.replace('%log', '').trim() : label;
    const sanitizedMode = typeof mode === 'string' ? mode.replace('%log', '').trim() : mode;

    const activeTemplate = templates?.[templateName];

    // Helper function for templates to use
    const tpl = (text: string, tokens: any) => _tpl(text, tokens, dateFormatter);

    // Parameters for the template functions
    const templateParams: TemplateParams = {
      template: tpl,
      tokens: data,
      label: sanitizedLabel,
      mode: sanitizedMode ?? '',
      args,
      data: data,
    };

    if (activeTemplate && typeof activeTemplate.all === 'function') {
      activeTemplate.all(templateParams);
    } else {
      // Default template handling
      if (!activeTemplate || !activeTemplate.head) {
        console.log(tpl(`<hy>####### <s><h>{label}<s>`, data));
        if (data.at && data.at !== 'N/A') {
          console.log(tpl(`<hg>at<s>    : <hc>{at}<s>`, data));
        }
        console.log(tpl(`<hg>file<s>  : <hm>{file}<s>`, data));
        console.log(tpl(`<hg>line<s>  : <hw>{line}<s>`, data));
        console.log(tpl(`<hg>tspan<s> : <h>{datetime}<s>`, {}));
        // console.log(tpl(`<hg>tspan<s> : <h>⌈{datetime}⌋<s>`, {})); // backup simbol `⌈⌋`, :lol
        console.log(tpl(`--------------------------------------- ${ this._options.useCounter ? '<yh>+{count}<s>' : '' }`, data));
      } else {
        activeTemplate.head(templateParams);
      }

      if (!activeTemplate || !activeTemplate.body) {
        if (Array.isArray(sanitizedMode) && sanitizedMode.length === args.length) {
          for (let i = 0; i < args.length; i++) {
            this.logByFormat(sanitizedMode[i], args[i], i + 1);
          }
        } else if (typeof sanitizedMode === 'string' && sanitizedMode.includes('%t')) {
          let i = 1;
          for (const arg of args) {
            console.log(tpl(`<hg># <s><hy>Table ${i}<s>:`, {}));
            const start = performance.now();
            console.table(arg);
            i++;
            const end = performance.now(), executedTime = (end - start).toFixed(2);
            this.executeTimeTemplate(tpl, executedTime)
          }
        } else if (typeof sanitizedMode === 'string' && sanitizedMode.includes('%j')) {
          const start = performance.now();
          console.log(JSON.stringify(args[0], null, 2));
          const end = performance.now(), executedTime = (end - start).toFixed(2);
          this.executeTimeTemplate(tpl, executedTime)
        } else {
          // Log each argument with its execution time
          args.forEach(arg => {
            const start = performance.now();
            console.log(arg);
            const end = performance.now(), executedTime = (end - start).toFixed(2);
            this.executeTimeTemplate(tpl, executedTime)
          });
        }
      } else {
        activeTemplate.body(templateParams);
      }
    }
    console.log();
  }

  /**
   * Logs content with specific formatting.
   * @internal
   * @param {string} format - The formatting string (e.g., '%j', '%t').
   * @param {any} arg - The argument to log.
   * @param {number} [groupIndex] - The index of the log group.
   */
  private logByFormat(format: string, arg: any, groupIndex?: number) {

    const cleanLabel = format.replace(/\%[\w]/ig, '').trim();
    if (groupIndex) {
      console.log(_tpl(`<gh>#<hy> ${cleanLabel}<s>:`, {}));
    }

    const start = performance.now();
    if (format.includes('%j')) {
      console.log(JSON.stringify(arg, null, 2));
    } else if (format.includes('%t')) {
      console.table(arg);
    } else {
      console.log(arg);
    }

    const end = performance.now();
    const executedTime = (end - start).toFixed(2);
    this.executeTimeTemplate(_tpl, executedTime)
  }

  // -------

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
public preset<T extends string>(
  name: T,
  label: string,
  templateName?: string
): this & { [key in T]: (...args: any[]) => void } {
  (this as any)[name] = (...args: any[]) => {
    // sementara naikin index biar tepat
    const prevIndex = this._options.stackTraceIndex ?? 2;
    this._options.stackTraceIndex = prevIndex + 1;

    try {
      const fn = this.output(label, undefined, templateName, name);
      return fn(...args);
    } finally {
      // balikin lagi supaya tidak pengaruh ke log lain
      this._options.stackTraceIndex = prevIndex;
    }
  };

  return this as this & { [key in T]: (...args: any[]) => void };
}

  /**
   * Buffered logger helper.
   *
   * Provides two buffering modes:
   *  - "interval": Collects log calls in a buffer and flushes them every N ms.
   *  - "async": Exposes an async iterable stream that can be consumed with `for await ... of`.
   *
   * Supports `.dispose()` to stop interval or clear async queue.
   */
  public buffered(
    label: string,
    templateName?: string,
    options:
      | { mode: "interval"; interval?: number; flushCallback?: (flushed: any[][]) => void }
      | { mode: "async" } = { mode: "interval" }
  ): IntervalLoggerWithDispose | AsyncLoggerWithDispose | undefined {

    // fallback: noop implementation
    if (!isEnabled) {
      if (!options || options.mode === "interval") {
        const dummy: IntervalLoggerWithDispose = (() => {}) as IntervalLoggerWithDispose;
        dummy.dispose = () => {};
        return dummy;
      }
      if (options.mode === "async") {
        const dummy: AsyncLoggerWithDispose = {
          log: () => {},
          stream: (async function* () {})(), // async generator kosong
          dispose: () => {},
        };
        return dummy;
      }
    }

    // helper untuk log dengan stack terbaru
    const callWithSavedStack = (stack: Omit<LogData, "label">, ...args: any[]) => {
      const logData: LogData = { label, ...stack, level: "info" };

      // --- handle counter ---
      let counter = 0;
      if (this._options.useCounter) {
        counter = (this._countMap.get(label) || 0) + 1;
        logData.count = counter;
        this._countMap.set(label, counter);
      }

      this._displayLog({
        label,
        args,
        mode: undefined,
        templateName: templateName || "default",
        data: logData,
      });
    };

    // --- interval mode ---
    if (options.mode === "interval") {
      let buffer: any[] = [];
      const interval = options.interval ?? 1000;

      const timer = setInterval(() => {
        if (buffer.length > 0) {
          const flush = [...buffer];
          buffer = [];

          options.flushCallback?.(flush);
        }
      }, interval);

      const fn: IntervalLoggerWithDispose = ((...args: any[]) => {
        const parsedStack = this._catchError?.(true);
        callWithSavedStack(parsedStack, ...args);
        buffer.push(args);
      }) as IntervalLoggerWithDispose;

      fn.dispose = () => {
        clearInterval(timer);
        buffer = [];
      };

      return fn;
    }

    // --- async mode ---
    if (options.mode === "async") {
      const queue: any[] = [];
      let resolveNext: (() => void) | null = null;
      let active = true;

      async function* generator() {
        while (active) {
          if (queue.length === 0) {
            await new Promise<void>((resolve) => (resolveNext = resolve));
          }
          while (queue.length > 0) {
            yield queue.shift();
          }
        }
      }

      const gen = generator();

      const log = (...args: any[]) => {
        if (!active) return;
        const parsedStack = this._catchError?.(true)
        callWithSavedStack(parsedStack, ...args);
        queue.push(args);
        if (resolveNext) {
          resolveNext();
          resolveNext = null;
        }
      };

      const dispose = () => {
        active = false;
        queue.length = 0;
        if (resolveNext) {
          resolveNext();
          resolveNext = null;
        }
      };

      return { log, stream: gen, dispose };
    }
  }
}

// Global instance for convenience
const debuggyInstance = new Debuggy();

// Create a callable function that also has the class methods
function debuggyWithLevel(label: string = '', mode?: string | string[], templateName?: string) {
  return debuggyInstance.output(label, mode, templateName);
}

// Assign the methods from the class instance to the callable function.
// This is the correct way to merge the function and object properties in JS.
Object.assign(debuggyWithLevel, {
  options: debuggyInstance.options.bind(debuggyInstance),
  label: (label: string, mode?: string | string[], templateName?: string) => {
    return (...args: any[]) => {
      const fn = debuggyInstance.output(label, mode, templateName);
      return fn(...args);
    };
  },
  create: debuggyInstance.create.bind(debuggyInstance),
  preset: debuggyInstance.preset.bind(debuggyInstance),
  buffered: debuggyInstance.buffered.bind(debuggyInstance),
});

// The final export should be typed as DebuggyInstance
export const debuggy = debuggyWithLevel as DebuggyInstance;

export { debuggyInstance };
export default debuggy;
