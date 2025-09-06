import { _tpl, parseStackTraceLine, splitAndCleanString, welcomeMessage } from './utils';
import { DebuggyOptions, TemplateParams, DebuggyInstance, CreateMethodReturnType, LogData } from './types';

// Environment check
const isEnabled = process.env.DEBUG && process.env.DEBUG.toLowerCase() === 'debuggy';

/**
 * Main Debuggy class for managing debug logs.
 * @class
 */
export class Debuggy {
  private _options: DebuggyOptions;

  /**
   * Creates an instance of Debuggy.
   * @param {DebuggyOptions} options - The configuration options for Debuggy.
   */
  constructor(options: DebuggyOptions = {}) {
    this._options = {
      stackFileIndex: 3,
      templateActive: 'default',
      templates: {},
      dateFormatter: undefined,
      logger: {
        write: false,
        saveMethod: undefined,
      },
      ...options,
    };
    welcomeMessage();
  }

  /**
   * Updates the configuration options.
   * @param {DebuggyOptions} options - The options to configure Debuggy with.
   */
  public options(options: DebuggyOptions) {
    if (options.logger) {
      this._options.logger = { ...this._options.logger, ...options.logger };
    }
    Object.assign(this._options, options);
  }

  private catchError (logger: boolean = false) {
    let parsedStack: Omit<LogData, 'label'> = { at: 'N/A', file: '', line: 0, column: 0 };

    try{
      throw new Error() //('[DEBUGGY] ' + label.replace(/\<[\w]+\>/ig, '').trim())
    }
    catch(error){
      let stacks: string[] = []

      if (error instanceof Error) {
        stacks = (error.stack?.split(/\n/m) ?? [])
          .map((item: string) => item.trim())
          .slice(1)
        ;

        const stackIndex = (this._options.stackFileIndex || 2) + (process.versions?.bun ? -1 : 0)
        const str = stacks[stackIndex + (logger ? 1 : 0)]
        parsedStack = parseStackTraceLine(str)
      }
    }

    return parsedStack
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
    // const { shows, stackFileIndex, logger } = this._options;
    const { shows, logger } = this._options;

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
        parsedStack = this.catchError(true);

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

    let templateToUse = templateName || this._options.templateActive;
    let finalLabel = label;
    let finalMode = mode;

    // Determine final mode and label
    if (typeof mode === 'string' && (mode.includes('%j') || mode.includes('%t') || mode.includes('%log'))) {
      finalLabel = mode.replace(/\%[\w]/ig, '').trim();
      finalMode = mode;
      templateToUse = this._options.templateActive;
    } else if (typeof label === 'string' && (label.includes('%j') || label.includes('%t') || label.includes('%log'))) {
      finalMode = label;
      finalLabel = label.replace(/\%[\w]+/ig, '').trim();
    }

    // Get stack trace for file, line, and column
    let parsedStack: Omit<LogData, 'label'> = { at: 'N/A', file: '', line: 0, column: 0 };
    parsedStack = this.catchError()

    const logData: LogData = {
      label: finalLabel || parsedStack.at,
      ...parsedStack,
      level: level || 'info'
    };

    return (...args: any[]) => {
      if (shouldDisplay) {
        this.displayLog({
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
   * Displays the log output based on the active template and writes to logger if configured.
   * @param {object} params - The parameters for displaying the log.
   * @param {string} params.label - The log label.
   * @param {any[]} params.args - The arguments to be logged.
   * @param {string | string[] | undefined} params.mode - The log mode.
   * @param {string} params.templateName - The name of the template to use.
   * @param {LogData} params.data - The log data.
   */
  private displayLog({ label, args, mode, templateName, data }: {
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
        console.log(tpl(`<hy>####### <s><h>{label}`, data));
        if (data.at && data.at !== 'N/A') {
          console.log(tpl(`<hg>at<s>    : <hc>{at}`, data));
        }
        console.log(tpl(`<hg>File<s>  : <hm>{file}`, data));
        console.log(tpl(`<hg>Line<s>  : <hw>{line}<s>`, data));
        console.log(tpl(`<hg>-----<s> : <h>⌈{datetime}⌋<s>`, {}));
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
            console.log(_tpl(`<hy>---------------------<s>`, { executedTime }));
            console.log(tpl(`<hy>executed time: <hw>{executedTime}ms\n`, { executedTime }));
          }
        } else if (typeof sanitizedMode === 'string' && sanitizedMode.includes('%j')) {
          const start = performance.now();
          console.log(JSON.stringify(args[0], null, 2));
          const end = performance.now(), executedTime = (end - start).toFixed(2);
          console.log(_tpl(`<hy>---------------------<s>`, { executedTime }));
          console.log(tpl(`<hy>executed time: <hw>{executedTime}ms`, { executedTime }));
        } else {
          // Log each argument with its execution time
          args.forEach(arg => {
            const start = performance.now();
            console.log(arg);
            const end = performance.now(), executedTime = (end - start).toFixed(2);
            console.log(_tpl(`<hy>---------------------<s>`, { executedTime }));
            console.log(tpl(`<hy>executed time: <hw>{executedTime}ms`, { executedTime }));
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
    console.log(_tpl(`<hy>---------------------<s>`, { executedTime }));
    console.log(_tpl(`<hy>executed time: <hw>{executedTime}ms`, { executedTime }));
  }
}

// Global instance for convenience
const debuggyInstance = new Debuggy();

// Helper to ensure level diteruskan
function debuggyWithLevel(label: string = '', mode?: string | string[], templateName?: string, level?: string) {
  return debuggyInstance.output(label, mode, templateName, level);
}

export const debuggy = debuggyWithLevel as DebuggyInstance;
(debuggy as any).options = debuggyInstance.options.bind(debuggyInstance);
(debuggy as any).set = (label: string) => debuggyInstance.output.bind(debuggyInstance, label);
(debuggy as any).create = debuggyInstance.create.bind(debuggyInstance);

// Set up dynamic methods (info, warn, error)
['info', 'warn', 'error', 'debug'].forEach(level => {
  (debuggy as any)[level] = (label: string = '') => {
    // Gabungkan label dinamis jika ada
    const fullLabel = label ? `%log ${level.toUpperCase()}: ${label}` : `%log ${level.toUpperCase()}:`;
    return debuggyInstance.output(fullLabel, undefined, undefined);
  };
});

export default debuggy;
