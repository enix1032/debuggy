import { LogData, DebuggyOptions, TemplateParams, CreateMethodReturnType } from './types';

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
