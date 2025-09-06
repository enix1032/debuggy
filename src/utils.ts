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
export const colorsCode = {
  s: 0, // reset
  h: 1, // bright
  u: 4, // underline
  k: 5, // blink
  n: 8, // hidden
  // Foreground
  b: 30, // black
  r: 31, // red
  g: 32, // green
  y: 33, // yellow
  e: 34, // blue
  m: 35, // magenta
  c: 36, // cyan
  w: 37, // white
  // Background
  B: 40, // black
  R: 41, // red
  G: 42, // green
  Y: 43, // yellow
  E: 44, // blue
  M: 45, // magenta
  C: 46, // cyan
  W: 47, // white
};

/**
 * A mapping from single-character color tags to their ANSI escape sequences.
 * @type {{[key: string]: string}}
 */
const color: { [key: string]: string } = {};
for (const [k, v] of Object.entries(colorsCode)) {
  color[k] = `\x1b[${v}m`;
  color[`:${k}`] = `\x1b[${v + 10}m`;
}

/**
 * Custom date formatter function.
 * @param {Date} date - The Date object to format.
 * @param {string[]} locales - The locales to use for formatting.
 * @returns {string} The formatted date string.
 */
export const customDateFormatter = (date: Date, locales: string[] = ['en-US']): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return date.toLocaleString(locales, options);
};

/**
 * Utility function to apply ANSI color tags to a string.
 * This function now correctly handles multiple tags within a single `<...>` block.
 * @param {string} text - The string with color tags.
 * @param {any} tokens - The tokens to replace in the string.
 * @param {Function} [dateFormatter] - The date formatter function.
 * @returns {string} The formatted string with applied ANSI colors.
 */
export const _tpl = (text: string, tokens?: any, dateFormatter?: Function): string => {
  const replacers = {
    ...tokens,
    datetime: dateFormatter ? dateFormatter(new Date()) : customDateFormatter(new Date()),
  };

  for (const [key, value] of Object.entries(replacers)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }

  // Updated regex to capture multiple characters within a single tag
  const tagRegex = /\<([a-zA-Z\:]+)\>/g;
  return text.replace(tagRegex, (_match, p1) => {
    // Split the captured string into individual characters and map to color codes
    const codes = p1.split('').map((char: string) => {
      const code = colorsCode[char];
      // Special handling for background colors to use the correct ANSI code
      if (char.toUpperCase() === char && "BRGYEMCW".includes(char)) {
        return `\x1b[${code}m`;
      }
      return `\x1b[${colorsCode[char]}m`;
    }).join('');
    return `${codes}`; // Removed the extra reset `color.s` to allow stacking
  }) + color.s; // Add a single reset at the end of the line
};

/**
 * Splits a string by separators and cleans up the resulting array.
 * @param {string} inputString - The string to split.
 * @returns {string[]} An array of cleaned strings.
 */
export const splitAndCleanString = (inputString: string): string[] => {
  return inputString.split(/[\s|;,]+/).filter(Boolean).map(item => item.toUpperCase());
};

/**
 * Parses a single line of a stack trace to extract file, line, and column.
 * @param {string} line - The stack trace line string.
 * @returns {{at: string, file: string, line: number, column: number}} An object with parsed stack details.
 */
export const parseStackTraceLine = (line: string): { at: string, file: string, line: number, column: number } => {
  const regex = /at (?:(.+) )?\(?(file:\/\/\/[^\s:]+|[^\s:]+):(\d+):?(\d+)?\)?/;
  const match = line.match(regex);

  if (!match) {
    return { at: 'N/A', file: '', line: 0, column: 0 };
  }

  let [, at, file, lineStr, columnStr] = match;

  file = file.replace('file://', '');
  if (process.cwd()) {
    file = file.replace(process.cwd(), '');
  }

  return {
    at: at || 'anonymous',
    file,
    line: parseInt(lineStr, 10),
    column: columnStr ? parseInt(columnStr, 10) : 1,
  };
};

/**
 * Welcome Message
 */
export const welcomeMessage = (): void => {
  const spacer = (n: number, w = ' ') => String(w).repeat(n)
  const { group, groupEnd } = console
  group(_tpl(
    `\n` +
    `<E>${spacer(34)}<s>\n` +
    `<Ehr>   <Ehy>deBuggy<s><Ehw> is starting here....   <s>\n` +
    `<E>${spacer(34)}<s>\n`
  ))
  groupEnd()
}
