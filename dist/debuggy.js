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

// src/debuggy.ts
var __filename = "/home/enix90s/Github/enix90s/debuggy-v2/src/debuggy.ts";
var isEnabled = process.env.DEBUG && process.env.DEBUG.toLowerCase() === "debuggy";

class Debuggy {
  _options;
  _countMap;
  constructor(options = {}) {
    options = this.normalizeOptions(options);
    this._options = {
      stackTraceIndex: 2,
      activeTemplate: "default",
      templates: {},
      dateFormatter: undefined,
      useCounter: true,
      logger: {
        enabled: false,
        saveMethod: undefined
      },
      ...options
    };
    if (isEnabled) {
      const globalKey = "__debuggy_countMap";
      if (!(globalKey in globalThis)) {
        globalThis[globalKey] = new Map;
      }
      this._countMap = globalThis[globalKey];
      header(this._options);
    } else {
      this._countMap = new Map;
    }
  }
  options(options) {
    options = this.normalizeOptions(options);
    if (options.logger) {
      this._options.logger = { ...this._options.logger, ...options.logger };
    }
    Object.assign(this._options, options);
    if (isEnabled && this._options?.displayHeader) {
      header(this._options, false, true);
    }
  }
  normalizeOptions(options) {
    if (!isEnabled)
      return options;
    const normalized = { ...options };
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
        enabled: options.logger.write
      };
    }
    return normalized;
  }
  _catchError(buffered = false, logger = false) {
    let parsedStack = { at: "N/A", file: "", line: 0, column: 0 };
    if (!isEnabled)
      return parsedStack;
    const normalizeForCompare = (p) => p.replace(/\\/g, "/");
    try {
      throw new Error;
    } catch (error) {
      if (error instanceof Error && error.stack) {
        const stacks = error.stack.split(/\n/m).map((line) => line.trim()).filter((line) => !line.includes("debuggy.ts") && !line.includes("buffered.ts")).slice(1);
        const mode = this._options.stackTraceMode ?? "index";
        if ((mode === "filename" || mode === "auto") && typeof __filename === "string") {
          const filenameNorm = normalizeForCompare(__filename);
          const found = stacks.find((line) => normalizeForCompare(line).includes(filenameNorm + ":"));
          if (found) {
            parsedStack = parseStackTraceLine(found);
            return parsedStack;
          }
          if (mode === "filename") {
            return parsedStack;
          }
        }
        if (mode === "index" || mode === "auto") {
          let stackTraceIndex = this._options.stackTraceIndex || 2;
          if (logger)
            stackTraceIndex = process.versions?.bun ? -1 : 0;
          if (buffered) {
            stackTraceIndex = stackTraceIndex + 0;
          }
          const str = stacks[stackTraceIndex + (logger ? 1 : 0)];
          if (str) {
            parsedStack = parseStackTraceLine(str);
          }
        }
      }
    }
    return parsedStack;
  }
  output(label = "", mode, templateName, level) {
    const { shows, logger } = this._options;
    if (!isEnabled && !logger?.write)
      return () => {};
    let prefix = "";
    const tagMatch = /^\[(?<prefix>[A-Z\_\-]+)\]/.exec(label);
    if (tagMatch && tagMatch.groups) {
      prefix = tagMatch.groups.prefix.toUpperCase();
      label = label.replace(tagMatch[0], "").trim();
    }
    const shouldLogToFile = typeof mode === "string" && mode.includes("%log") || typeof label === "string" && label.includes("%log");
    const isTagAllowed = !shows || splitAndCleanString(Array.isArray(shows) ? shows.join(",") : shows).includes(prefix);
    const shouldDisplay = isEnabled && isTagAllowed;
    const logToFile = (args) => {
      if (logger?.write && logger.saveMethod && shouldLogToFile) {
        let parsedStack = { at: "N/A", file: "", line: 0, column: 0 };
        parsedStack = this._catchError(true);
        const logData = {
          label: label || parsedStack.at,
          ...parsedStack,
          level: level || "info"
        };
        logger.saveMethod({
          level,
          args: [args[0]],
          path: logData.file,
          ...logData
        });
      }
    };
    if (!shouldDisplay && !shouldLogToFile) {
      return () => {};
    }
    let templateToUse = templateName || this._options.activeTemplate;
    let finalLabel = label;
    let finalMode = mode;
    if (typeof mode === "string" && (mode.includes("%j") || mode.includes("%t") || mode.includes("%log"))) {
      finalLabel = mode.replace(/\%[\w]/ig, "").trim();
      finalMode = mode;
      templateToUse = this._options.activeTemplate;
    } else if (typeof label === "string" && (label.includes("%j") || label.includes("%t") || label.includes("%log"))) {
      finalMode = label;
      finalLabel = label.replace(/\%[\w]+/ig, "").trim();
    }
    return (...args) => {
      let parsedStack = { at: "N/A", file: "", line: 0, column: 0 };
      parsedStack = this._catchError();
      const logData = {
        label: finalLabel || parsedStack.at,
        ...parsedStack,
        level: level || "info"
      };
      let counter = 0;
      if (this._options.useCounter) {
        counter = (this._countMap.get(label) || 0) + 1;
        logData.count = counter;
        this._countMap.set(label, counter);
      }
      if (shouldDisplay) {
        this._displayLog({
          label: finalLabel,
          args,
          mode: finalMode,
          templateName: templateToUse || "default",
          data: logData
        });
      }
      logToFile(args);
    };
  }
  create(name, label, templateName) {
    const newMethod = (dynamicLabel = "") => {
      const finalLabel = label.replace(/\{label\}/g, dynamicLabel);
      return this.output(finalLabel, undefined, templateName, name);
    };
    this[name] = newMethod;
    return this;
  }
  executeTimeTemplate(tpl, executedTime) {
    console.log(tpl(`<hy>---------------------<s>`, { executedTime }));
    console.log(tpl(`<hy>executed time: <hw>{executedTime}ms`, { executedTime }));
  }
  _displayLog({ label, args, mode, templateName, data }) {
    const { templates, dateFormatter } = this._options;
    const sanitizedLabel = typeof label === "string" ? label.replace("%log", "").trim() : label;
    const sanitizedMode = typeof mode === "string" ? mode.replace("%log", "").trim() : mode;
    const activeTemplate = templates?.[templateName];
    const tpl = (text, tokens) => _tpl(text, tokens, dateFormatter);
    const templateParams = {
      template: tpl,
      tokens: data,
      label: sanitizedLabel,
      mode: sanitizedMode ?? "",
      args,
      data
    };
    if (activeTemplate && typeof activeTemplate.all === "function") {
      activeTemplate.all(templateParams);
    } else {
      if (!activeTemplate || !activeTemplate.head) {
        console.log(tpl(`<hy>####### <s><h>{label}<s>`, data));
        if (data.at && data.at !== "N/A") {
          console.log(tpl(`<hg>at<s>    : <hc>{at}<s>`, data));
        }
        console.log(tpl(`<hg>file<s>  : <hm>{file}<s>`, data));
        console.log(tpl(`<hg>line<s>  : <hw>{line}<s>`, data));
        console.log(tpl(`<hg>tspan<s> : <h>{datetime}<s>`, {}));
        console.log(tpl(`--------------------------------------- ${this._options.useCounter ? "<yh>+{count}<s>" : ""}`, data));
      } else {
        activeTemplate.head(templateParams);
      }
      if (!activeTemplate || !activeTemplate.body) {
        if (Array.isArray(sanitizedMode) && sanitizedMode.length === args.length) {
          for (let i = 0;i < args.length; i++) {
            this.logByFormat(sanitizedMode[i], args[i], i + 1);
          }
        } else if (typeof sanitizedMode === "string" && sanitizedMode.includes("%t")) {
          let i = 1;
          for (const arg of args) {
            console.log(tpl(`<hg># <s><hy>Table ${i}<s>:`, {}));
            const start = performance.now();
            console.table(arg);
            i++;
            const end = performance.now(), executedTime = (end - start).toFixed(2);
            this.executeTimeTemplate(tpl, executedTime);
          }
        } else if (typeof sanitizedMode === "string" && sanitizedMode.includes("%j")) {
          const start = performance.now();
          console.log(JSON.stringify(args[0], null, 2));
          const end = performance.now(), executedTime = (end - start).toFixed(2);
          this.executeTimeTemplate(tpl, executedTime);
        } else {
          args.forEach((arg) => {
            const start = performance.now();
            console.log(arg);
            const end = performance.now(), executedTime = (end - start).toFixed(2);
            this.executeTimeTemplate(tpl, executedTime);
          });
        }
      } else {
        activeTemplate.body(templateParams);
      }
    }
    console.log();
  }
  logByFormat(format, arg, groupIndex) {
    const cleanLabel = format.replace(/\%[\w]/ig, "").trim();
    if (groupIndex) {
      console.log(_tpl(`<gh>#<hy> ${cleanLabel}<s>:`, {}));
    }
    const start = performance.now();
    if (format.includes("%j")) {
      console.log(JSON.stringify(arg, null, 2));
    } else if (format.includes("%t")) {
      console.table(arg);
    } else {
      console.log(arg);
    }
    const end = performance.now();
    const executedTime = (end - start).toFixed(2);
    this.executeTimeTemplate(_tpl, executedTime);
  }
  preset(name, label, templateName) {
    const newMethod = (...args) => {
      const fn = this.output(label, undefined, templateName, name);
      return fn(...args);
    };
    this[name] = newMethod;
    return this;
  }
  buffered(label, templateName, options = { mode: "interval" }) {
    if (!isEnabled) {
      if (!options || options.mode === "interval") {
        const dummy = () => {};
        dummy.dispose = () => {};
        return dummy;
      }
      if (options.mode === "async") {
        const dummy = {
          log: () => {},
          stream: async function* () {}(),
          dispose: () => {}
        };
        return dummy;
      }
    }
    const callWithSavedStack = (stack, ...args) => {
      const logData = { label, ...stack, level: "info" };
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
        data: logData
      });
    };
    if (options.mode === "interval") {
      let buffer = [];
      const interval = options.interval ?? 1000;
      const timer = setInterval(() => {
        if (buffer.length > 0) {
          const flush = [...buffer];
          buffer = [];
          const parsedStack = this._catchError?.(true) ?? { at: "N/A", file: "", line: 0, column: 0 };
          callWithSavedStack(parsedStack, flush);
          options.flushCallback?.(flush);
        }
      }, interval);
      const fn = (...args) => {
        buffer.push(args);
      };
      fn.dispose = () => {
        clearInterval(timer);
        buffer = [];
      };
      return fn;
    }
    if (options.mode === "async") {
      const queue = [];
      let resolveNext = null;
      let active = true;
      async function* generator() {
        while (active) {
          if (queue.length === 0) {
            await new Promise((resolve) => resolveNext = resolve);
          }
          while (queue.length > 0) {
            yield queue.shift();
          }
        }
      }
      const gen = generator();
      const log = (...args) => {
        if (!active)
          return;
        const parsedStack = this._catchError?.(true) ?? { at: "N/A", file: "", line: 0, column: 0 };
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
var debuggyInstance = new Debuggy;
function debuggyWithLevel(label = "", mode, templateName) {
  return debuggyInstance.output(label, mode, templateName);
}
Object.assign(debuggyWithLevel, {
  options: debuggyInstance.options.bind(debuggyInstance),
  label: (label, mode, templateName) => {
    return (...args) => {
      const fn = debuggyInstance.output(label, mode, templateName);
      return fn(...args);
    };
  },
  create: debuggyInstance.create.bind(debuggyInstance),
  preset: debuggyInstance.preset.bind(debuggyInstance),
  buffered: debuggyInstance.buffered.bind(debuggyInstance)
});
var debuggy = debuggyWithLevel;
var debuggy_default = debuggy;
export {
  exports_utils as utils,
  debuggy_default as default,
  debuggyInstance,
  debuggy,
  Debuggy
};
