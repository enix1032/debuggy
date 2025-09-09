import type { DebuggyOptions, DebuggyInstance, CreateMethodReturnType, LogData, TemplateParams, LabelFn, CreateFn, PresetFn } from './types';
/**
 * The main Debuggy class for managing debug logs.
 */
export declare class Debuggy {
    constructor(options?: DebuggyOptions);
    options(options: DebuggyOptions): void;
    output(label?: string, mode?: string | string[], templateName?: string, level?: string): (...args: any[]) => void;
    create: CreateFn;
    preset: PresetFn;
}
declare const debuggyInstance: Debuggy;
/**
 * Global debuggy instance (callable + methods).
 */
export declare const debuggy: DebuggyInstance;
export { debuggyInstance, DebuggyOptions, DebuggyInstance, CreateMethodReturnType, LogData, TemplateParams, LabelFn, CreateFn, PresetFn, };
export default debuggy;
