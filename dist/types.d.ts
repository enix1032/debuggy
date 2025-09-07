/**
 * Interface for the log options.
 */
export interface DebuggyOptions {
  shows?: string | string[];
  templateActive?: string;
  templates?: {
    [key: string]: {
      head?: (params: TemplateParams) => void;
      body?: (params: TemplateParams) => void;
      all?: (params: TemplateParams) => void;
    };
  };
  dateFormatter?: (date: Date) => string;
  stackFileIndex?: number;
  logger?: {
    write: boolean;
    saveMethod?: (data: LogData) => void;
  };
}

/**
 * Interface for the template parameters.
 */
export interface TemplateParams {
  template: (text: string, tokens: any) => string;
  tokens: any;
  label: string;
  mode: string | string[];
  args: any[];
  data: LogData;
  executedTime?: string;
}

/**
 * Interface for log data, including location.
 */
export interface LogData {
  level?: string;
  args?: any[];
  path?: string;
  label: string;
  at: string;
  file: string;
  line: number;
  column: number;
}

/**
 * Return type for the `create` method to allow method chaining.
 * This is a generic type that extends DebuggyInstance with new methods.
 */
export type CreateMethodReturnType<T extends string, Prev = DebuggyInstance> = Prev & {
  [key in T]: (dynamicLabel?: string) => (...args: any[]) => void;
};

/**
 * Interface for the main debuggy function instance.
 */
export interface DebuggyInstance {
  (label?: string, mode?: string | string[], templateName?: string): (...args: any[]) => void;
  options: (options: DebuggyOptions) => void;
  set: (label: string) => (...args: any[]) => void;
  create: <T extends string>(
    name: T,
    label: string,
    templateName?: string
  ) => CreateMethodReturnType<T, this>;
  info: (label?: string, ...args: any[]) => void;
  warn: (label?: string, ...args: any[]) => void;
  error: (label?: string, ...args: any[]) => void;
  debug: (label?: string, ...args: any[]) => void;
}

/**
 * Interface for the main debuggy function instance.
 * It combines a callable function with additional properties.
 */
declare function debuggy(label?: string, mode?: string | string[], templateName?: string): (...args: any[]) => void;

declare namespace debuggy {
    function options(options: DebuggyOptions): void;
    function set(label: string): (...args: any[]) => void;
    function create<T extends string>(
        name: T,
        label: string,
        mode?: string | string[],
        templateName?: string
    ): CreateMethodReturnType<T, typeof debuggy>;
    function info(label?: string): (...args: any[]) => void;
    function warn(label?: string): (...args: any[]) => void;
    function error(label?: string): (...args: any[]) => void;
    function debug(label?: string): (...args: any[]) => void;
}

export { debuggy };
