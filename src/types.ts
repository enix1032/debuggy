/**
 * Interface for the log options.
 */
export interface DebuggyOptions {
  /**
   * (Deprecated) Filter logs by tag.
   * Use `enabledTags` instead.
   */
  shows?: string | string[];

  /**
   * A clearer replacement for `shows`.
   * Defines which tags are allowed to be displayed.
   */
  enabledTags?: string | string[];

  /**
   * (Deprecated) Name of the active template.
   * Use `activeTemplate` instead.
   */
  templateActive?: string;

  /**
   * The currently active template name.
   */
  activeTemplate?: string;

  /**
   * Template definitions for customizing log output.
   */
  templates?: {
    [key: string]: {
      head?: (params: TemplateParams) => void;
      body?: (params: TemplateParams) => void;
      all?: (params: TemplateParams) => void;
    };
  };

  /**
   * Custom date formatter function.
   */
  dateFormatter?: (date: Date) => string;

  /**
   * (Deprecated) Stack trace index position.
   * Use `stackTraceIndex` instead.
   */
  stackFileIndex?: number;

  /**
   * Defines which stack trace frame to use when resolving file/line/column.
   */
  stackTraceIndex?: number;

  /**
   * (Deprecated) Mode for resolving stack trace information.
   * Use `stackTraceMode` instead.
   */
  stackMode?: "index" | "filename" | "auto";

  /**
   * Mode for resolving stack trace information.
   */
  stackTraceMode?: "index" | "filename" | "auto";

  /**
   * Logger configuration for file/database integration.
   */
  logger?: {
    /**
     * (Deprecated) Whether log saving is enabled.
     * Use `enabled` instead.
     */
    write?: boolean;

    /**
     * Enables or disables log saving.
     */
    enabled?: boolean;

    /**
     * Custom save method for persisting logs (e.g., database, file).
     */
    saveMethod?: (data: LogData) => void;
  };

  /**
   * (Deprecated) Whether to print the header.
   * Use `displayHeader` instead.
   */
  showsHeader?: boolean;

  /**
   * Whether to print the header banner on startup.
   */
  displayHeader?: boolean;
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
 * Type alias for the `label()` method.
 */
export type LabelFn = (label: string) => (...args: unknown[]) => void;

/**
 * Type alias for the `create()` method.
 */
export type CreateFn = <T extends string, This extends DebuggyInstance>(
  this: This,
  name: T,
  label: string,
  templateName?: string
) => CreateMethodReturnType<T, This>;

/**
 * Type alias for the `preset()` method.
 */
export type PresetFn = <T extends string, This extends DebuggyInstance>(
  this: This,
  name: T,
  label: string,
  templateName?: string
) => This & { [key in T]: (...args: any[]) => void };

/**
 * Interface for the main debuggy function instance.
 */
export interface DebuggyInstance {
  (label?: string, mode?: string | string[], templateName?: string): (...args: any[]) => void;
  options: (options: DebuggyOptions) => void;
  label: LabelFn;
  create: CreateFn;
  preset: PresetFn;
}
