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
  data: any;
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
}
