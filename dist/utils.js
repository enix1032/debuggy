var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/utils.ts
var exports_utils = {};
__export(exports_utils, {
  splitAndCleanString: () => splitAndCleanString,
  parseStackTraceLine: () => parseStackTraceLine,
  inlineString: () => inlineString,
  header: () => header,
  customDateFormatter: () => customDateFormatter,
  colorsCode: () => colorsCode,
  _tpl: () => _tpl
});
var colorsCode = {
  s: 0,
  h: 1,
  u: 4,
  k: 5,
  n: 8,
  b: 30,
  r: 31,
  g: 32,
  y: 33,
  e: 34,
  m: 35,
  c: 36,
  w: 37,
  B: 40,
  R: 41,
  G: 42,
  Y: 43,
  E: 44,
  M: 45,
  C: 46,
  W: 47
};
var color = {};
for (const [k, v] of Object.entries(colorsCode)) {
  color[k] = `\x1B[${v}m`;
  color[`:${k}`] = `\x1B[${v + 10}m`;
}
var customDateFormatter = (date, locales = ["en-US"]) => {
  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    fractionalSecondDigits: 3
  };
  const formatted = date.toLocaleString(locales, options);
  const [datePart, yearPart, timePart] = formatted.split(",").map((s) => s.trim());
  return `\uD83D\uDCC5 ${datePart}, ${yearPart} ⏰ ${timePart ?? ""}`;
};
var _tpl = (text, tokens, dateFormatter) => {
  const replacers = {
    ...tokens,
    datetime: dateFormatter ? dateFormatter(new Date) : customDateFormatter(new Date)
  };
  for (const [key, value] of Object.entries(replacers)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  const tagRegex = /\<([a-zA-Z\:]+)\>/g;
  return text.replace(tagRegex, (_match, p1) => {
    const codes = p1.split("").map((char) => {
      const code = colorsCode[char];
      if (char.toUpperCase() === char && "BRGYEMCW".includes(char)) {
        return `\x1B[${code}m`;
      }
      return `\x1B[${colorsCode[char]}m`;
    }).join("");
    return `${codes}`;
  }) + color.s;
};
var splitAndCleanString = (inputString) => {
  return inputString.split(/[\s|;,]+/).filter(Boolean).map((item) => item.toUpperCase());
};
var parseStackTraceLine = (line) => {
  const regex = /at (?:(.+) )?\(?(file:\/\/\/[^\s:]+|[^\s:]+):(\d+):?(\d+)?\)?/;
  const match = line.match(regex);
  if (!match) {
    return { at: "N/A", file: "", line: 0, column: 0 };
  }
  let [, at, file, lineStr, columnStr] = match;
  file = file.replace("file://", "");
  if (process.cwd()) {
    file = file.replace(process.cwd(), "");
  }
  return {
    at: at || "anonymous",
    file,
    line: parseInt(lineStr, 10),
    column: columnStr ? parseInt(columnStr, 10) : 1
  };
};
var header = (options, showsWelcome = true, showsOptions = false) => {
  const { group, groupEnd, table, log } = console;
  if (showsWelcome) {
    group(_tpl(`
` + `<E>${"".padEnd(34, " ")}<s>
` + `<Ehr>   <Ehy>deBuggy<s><Ehw> is starting here....   <s>
` + `<E>${"".padEnd(34, " ")}<s>
`));
    groupEnd();
  }
  if (showsOptions) {
    if (!!!process.versions?.bun)
      log("\x1B[40m\x1B[92m");
    const opts = {
      enabledTags: options.enabledTags ?? "*",
      stackTraceMode: options.stackTraceMode ?? "index",
      stackTraceIndex: options.stackTraceIndex,
      defaultTemplate: options.activeTemplate ?? "default",
      customTemplates: Object.keys(options.templates || {}).join(", ")
    };
    if (options.stackMode && options.stackMode !== "index")
      delete opts["stackTraceIndex"];
    table(opts);
    if (!!!process.versions?.bun)
      log("\x1B[0m");
    else
      log();
  }
};
var inlineString = (str, options) => {
  const inlinedStr = str.split(`
`).map((item) => item.trim()).join(" ");
  const maxLength = options?.maxLength;
  const suffix = options?.suffix ?? "... <truncated>";
  if (maxLength !== undefined && inlinedStr.length > maxLength) {
    const trimmedLength = maxLength - suffix.length;
    if (trimmedLength > 0) {
      return inlinedStr.substring(0, trimmedLength) + suffix;
    }
  }
  return inlinedStr;
};
export {
  splitAndCleanString,
  parseStackTraceLine,
  inlineString,
  header,
  customDateFormatter,
  colorsCode,
  _tpl
};
