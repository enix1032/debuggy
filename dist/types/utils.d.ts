/**
 * src/utils.ts
 *
 * This file contains utility functions for the debuggy logger,
 * including ANSI color code management, stack trace parsing, and string manipulation.
 */
/**
 * ANSI color codes mapping.
 * @type {{[key: string]: number}}
 */
export declare const colorsCode: {
    s: number;
    h: number;
    u: number;
    k: number;
    n: number;
    b: number;
    r: number;
    g: number;
    y: number;
    e: number;
    m: number;
    c: number;
    w: number;
    B: number;
    R: number;
    G: number;
    Y: number;
    E: number;
    M: number;
    C: number;
    W: number;
};
/**
 * Custom date formatter function.
 * @param {Date} date - The Date object to format.
 * @param {string[]} locales - The locales to use for formatting.
 * @returns {string} The formatted date string.
 */
export declare const customDateFormatter: (date: Date, locales?: string[]) => string;
/**
 * Utility function to apply ANSI color tags to a string.
 * This function now correctly handles multiple tags within a single `<...>` block.
 * @param {string} text - The string with color tags.
 * @param {any} tokens - The tokens to replace in the string.
 * @param {Function} [dateFormatter] - The date formatter function.
 * @returns {string} The formatted string with applied ANSI colors.
 */
export declare const _tpl: (text: string, tokens?: any, dateFormatter?: Function) => string;
/**
 * Splits a string by separators and cleans up the resulting array.
 * @param {string} inputString - The string to split.
 * @returns {string[]} An array of cleaned strings.
 */
export declare const splitAndCleanString: (inputString: string) => string[];
/**
 * Parses a single line of a stack trace to extract file, line, and column.
 * @param {string} line - The stack trace line string.
 * @returns {{at: string, file: string, line: number, column: number}} An object with parsed stack details.
 */
export declare const parseStackTraceLine: (line: string) => {
    at: string;
    file: string;
    line: number;
    column: number;
};
/**
 * Welcome Message
 */
export declare const welcomeMessage: () => void;
/**
 * Inlines a multiline string by joining lines and trimming excess whitespace. Optionally truncates the string.
 *
 * @param str The input string to be processed.
 * @param options Options for truncation.
 * - maxLength: The maximum number of characters before truncation occurs.
 * - suffix: The suffix to be appended after the string is truncated. The default is '... <truncated>'.
 * @returns The inlined and possibly truncated string.
 */
export declare const inlineString: (str: string, options?: {
    maxLength?: number;
    suffix?: string;
}) => string;
