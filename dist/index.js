// src/utils.ts
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
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  };
  return date.toLocaleString(locales, options);
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
var welcomeMessage = () => {
  const spacer = (n, w = " ") => String(w).repeat(n);
  const { group, groupEnd } = console;
  group(_tpl(`
` + `<E>${spacer(34)}<s>
` + `<Ehr>   <Ehy>deBuggy<s><Ehw> is starting here....   <s>
` + `<E>${spacer(34)}<s>
`));
  groupEnd();
};

// src/index.ts
var isEnabled = process.env.DEBUG && process.env.DEBUG.toLowerCase() === "debuggy";

class Debuggy {
  _options;
  constructor(options = {}) {
    this._options = {
      stackFileIndex: 3,
      templateActive: "default",
      templates: {},
      dateFormatter: undefined,
      logger: {
        write: false,
        saveMethod: undefined
      },
      ...options
    };
    welcomeMessage();
  }
  options(options) {
    if (options.logger) {
      this._options.logger = { ...this._options.logger, ...options.logger };
    }
    Object.assign(this._options, options);
  }
  catchError(logger = false) {
    let parsedStack = { at: "N/A", file: "", line: 0, column: 0 };
    try {
      throw new Error;
    } catch (error) {
      let stacks = [];
      if (error instanceof Error) {
        stacks = (error.stack?.split(/\n/m) ?? []).map((item) => item.trim()).slice(1);
        const stackIndex = (this._options.stackFileIndex || 2) + (process.versions?.bun ? -1 : 0);
        const str = stacks[stackIndex + (logger ? 1 : 0)];
        parsedStack = parseStackTraceLine(str);
      }
    }
    return parsedStack;
  }
  output(label = "", mode, templateName, level) {
    const { shows, logger } = this._options;
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
        let parsedStack2 = { at: "N/A", file: "", line: 0, column: 0 };
        parsedStack2 = this.catchError(true);
        const logData2 = {
          label: label || parsedStack2.at,
          ...parsedStack2,
          level: level || "info"
        };
        logger.saveMethod({
          level,
          args: [args[0]],
          path: logData2.file,
          ...logData2
        });
      }
    };
    if (!shouldDisplay && !shouldLogToFile) {
      return () => {};
    }
    let templateToUse = templateName || this._options.templateActive;
    let finalLabel = label;
    let finalMode = mode;
    if (typeof mode === "string" && (mode.includes("%j") || mode.includes("%t") || mode.includes("%log"))) {
      finalLabel = mode.replace(/\%[\w]/ig, "").trim();
      finalMode = mode;
      templateToUse = this._options.templateActive;
    } else if (typeof label === "string" && (label.includes("%j") || label.includes("%t") || label.includes("%log"))) {
      finalMode = label;
      finalLabel = label.replace(/\%[\w]+/ig, "").trim();
    }
    let parsedStack = { at: "N/A", file: "", line: 0, column: 0 };
    parsedStack = this.catchError();
    const logData = {
      label: finalLabel || parsedStack.at,
      ...parsedStack,
      level: level || "info"
    };
    return (...args) => {
      if (shouldDisplay) {
        this.displayLog({
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
  displayLog({ label, args, mode, templateName, data }) {
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
        console.log(tpl(`<hy>####### <s><h>{label}`, data));
        if (data.at && data.at !== "N/A") {
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
            console.log(_tpl(`<hy>---------------------<s>`, { executedTime }));
            console.log(tpl(`<hy>executed time: <hw>{executedTime}ms
`, { executedTime }));
          }
        } else if (typeof sanitizedMode === "string" && sanitizedMode.includes("%j")) {
          const start = performance.now();
          console.log(JSON.stringify(args[0], null, 2));
          const end = performance.now(), executedTime = (end - start).toFixed(2);
          console.log(_tpl(`<hy>---------------------<s>`, { executedTime }));
          console.log(tpl(`<hy>executed time: <hw>{executedTime}ms`, { executedTime }));
        } else {
          args.forEach((arg) => {
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
    console.log(_tpl(`<hy>---------------------<s>`, { executedTime }));
    console.log(_tpl(`<hy>executed time: <hw>{executedTime}ms`, { executedTime }));
  }
}
var debuggyInstance = new Debuggy;
function debuggyWithLevel(label = "", mode, templateName, level) {
  return debuggyInstance.output(label, mode, templateName, level);
}
var debuggy = debuggyWithLevel;
debuggy.options = debuggyInstance.options.bind(debuggyInstance);
debuggy.set = (label) => debuggyInstance.output.bind(debuggyInstance, label);
debuggy.create = debuggyInstance.create.bind(debuggyInstance);
["info", "warn", "error", "debug"].forEach((level) => {
  debuggy[level] = (label = "") => {
    const fullLabel = label ? `%log ${level.toUpperCase()}: ${label}` : `%log ${level.toUpperCase()}:`;
    return debuggyInstance.output(fullLabel, undefined, undefined);
  };
});
var src_default = debuggy;
export {
  src_default as default,
  debuggy,
  Debuggy
};
