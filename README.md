# `@en32/debuggy`

A simple, customizable, and lightweight debug logger for Node.js and Bun. It provides flexible logging with automatic file and line number detection, custom templates, and tag-based filtering.

![Screenshot](https://raw.githubusercontent.com/enix1032/debuggy/refs/heads/dev/sc.jpg "deBuggy")

-----

## Features

  * **Simple API:** Log messages with a straightforward `debuggy('Label')('Message')` syntax.
  * **Automatic Source Info:** Automatically displays the file path, line, and column where the log originated.
  * **Customizable Templates:** Create your own log display templates to match your project's style.
  * **Tag-Based Filtering:** Use tags (e.g., `[API]`, `[DB]`) to show only relevant logs via the `DEBUG` environment variable.
  * **Rich Formatting:** Supports various console formatting options including tables (`%t`), JSON (`%j`), and custom ANSI color codes.
  * **Extensible:** Easily create new custom methods for the debuggy instance (e.g., `debuggy.warn`, `debuggy.error`).

-----

## Installation

You can install `@en32/debuggy` using npm, yarn, or Bun.

```bash
# Using npm
npm install @en32/debuggy

# Using yarn
yarn add @en32/debuggy

# Using Bun
bun add @en32/debuggy
```

-----

## Usage

### Simple Logging

Import the `debuggy` function and use it to log messages.

```typescript
// simple.ts
import { debuggy } from '@en32/debuggy';

// Simple message
debuggy('Hello')('Hello World');

// Log a variable, label is automatically inferred from variable name
const data = {
  name: 'John',
  age: 30,
};
debuggy()(data);

// Log multiple arguments
const otherData = {
  name: 'Jane',
  age: 25,
};
debuggy('Debug Multiple')(data, otherData);
```

To run the example, use the `DEBUG` environment variable:

```bash
DEBUG=debuggy bun run ./examples/simple.ts
```

### Advanced Formatting

Use special characters to format your output, such as `%t` for tables and `%j` for JSON.

```typescript
import { debuggy } from '@en32/debuggy';

const data = {
  name: 'John',
  age: 30,
};

// Display as a table
debuggy('Data Table %t')(data);

// Display as JSON
debuggy('Data JSON %j')(data);
```

You can also apply ANSI color codes using simple tags.

```typescript
import { debuggy } from '@en32/debuggy';

// Colored log message: <hy> (highlight yellow), <s> (reset)
debuggy('<hy>Colored Log')(data);

// Colored log with background: <hBy> (highlight background yellow)
debuggy('<hBy>Colored Log with Background')(data);
```

### Custom Methods

The `create` method allows you to define new log methods with predefined labels and templates.

```typescript
import { debuggy } from '@en32/debuggy';

// Create 'warn' and 'error' methods with specific labels and colors
const debug = debuggy
  .create('warn', '<rYh>{label}<s>')
  .create('error', '<yRh>{label}<s>');

const sampleData = {
  id: 1,
  message: 'This is a sample message.',
};

// Use the new custom methods
debug.warn('Warning Label')(sampleData);
debug.error('Error Label')(sampleData);
```

You can also chain the `create` method and use it immediately for a one-off log.

```typescript
// Chaining `create` and calling the new method directly
debuggy
  .create('info', '<ch>{label}<s>')
  .info('Info Label')('This is an info message.');
```

### Log Shortcuts with `set()`

The `set()` method provides a quick way to create a reusable log function with a fixed label and formatting.

```typescript
import { debuggy } from '@en32/debuggy';

const data = {
  name: 'John',
  age: 30,
};

// Create a shortcut for a colored 'WARNING' label
const warn = debuggy.set('<hYb>WARNING<s>');
warn('%t', data);

// Create a shortcut for a colored 'ERROR' label
const err = debuggy.set('<rh>ERROR<s>');
err(data);
```

### Custom Templates

You can customize the entire log output by defining your own templates. This gives you full control over the header and body of each log entry.

```typescript
import { debuggy } from '@en32/debuggy';

debuggy.options({
  templateActive: 'myCustom',
  templates: {
    myCustom: {
      head: ({ template, tokens }) => {
        console.log(template(`<hy>###### <s>{label}`, tokens));
        console.log(template(`<hg>#<s> {file}:{line}:{column}`, tokens));
      },
      body: ({ args }) => {
        console.log(...args);
        console.log();
      },
    },
  },
});

debuggy('Custom Log Example')('Hello from custom template!');
```

### Logging to File

You can configure `debuggy` to save logs to a file by integrating it with an external logger. This is useful for persistent logging and debugging. The `@en32/logger` package is a good option for this.

1.  **Installation**:
    First, ensure you have `@en32/logger` installed.

    ```bash
    npm install @en32/logger
    ```

2.  **Configuration**:
    Create an instance of `Logger` and configure `debuggy`'s `logger` option. You can define a custom `saveMethod` to handle how logs are written to the file. The `write: true` option is crucial, as it enables the file logging functionality.

    ```typescript
    import { debuggy } from '@en32/debuggy';
    import Logger, { LogLevel } from '@en32/logger';

    const isAllowed = true;
    const logger = new Logger('./my-app.log', LogLevel.DEBUG, isAllowed, 5000);

    debuggy.options({
      logger: {
        write: true,
        saveMethod: (params) => {
          const { args, path, line, column, level } = params;
          const message = args[0];
          const location = { path, line, column };

          if (logger[level]) {
            logger[level](message, location);
          } else {
            logger.info(message, location);
          }
        },
      },
    });
    ```

3.  **Selective Logging**:
    To selectively log messages to the file, use a specific token. The convention is to use `%log`. When you include `%log` in the label or mode, the log entry will be saved to the file, and the token will be automatically removed from the console output.

    ```typescript
    // Create a new method that includes the `%log` token in its label.
    const log = debuggy
      .create('warn', '<y>WARN:<s> {label} %log')
      .create('error', '<r>ERROR:<s> {label} %log');

    // This log will be displayed in the console AND saved to the log file
    log.warn('Login Failed')('The user entered an invalid password.');

    // This log will be displayed in the console but NOT saved to the file
    debuggy('UI Update')('The UI has been successfully refreshed.');
    ```

For more detailed examples, please refer to the files in the **[examples directory](https://www.google.com/search?q=./examples)**.

-----

## API

### `debuggy(label, mode?, templateName?)`

The main debug function. Returns a function to log the actual arguments.

  * `label` (string, optional): A label for the log entry.
  * `mode` (string | string[], optional): Special formatting string(s) like `'%t'` or `'%j'`.
  * `templateName` (string, optional): The name of a custom template to use.

### `debuggy.options(options)`

Updates the global configuration for `debuggy`.

  * `options` (object):
      * `shows` (string | string[]): A comma-separated list of tags to enable.
      * `templateActive` (string): The default template to use.
      * `templates` (object): An object containing your custom template definitions.
      * `dateFormatter` (function): A custom function to format the date in templates.
      * `stackFileIndex` (number): The stack trace index to use for file location.
      * `logger` (object): Configures file logging.
          * `write` (boolean): Set to `true` to enable file logging. Defaults to `false`.
          * `saveMethod` (function): A custom function that handles writing the log to a file. It receives a `params` object containing `args`, `path`, `line`, `column`, and `level` of the log entry. This allows you to integrate with any external logging library.

### `debuggy.create(name, label, templateName?)`

Creates a new custom method on the `debuggy` instance for reusable logging functions.

  * `name` (string): The name of the new method (e.g., `'warn'`, `'error'`).
  * `label` (string): The predefined label for the new method.
  * `templateName` (string, optional): The template to use for this method.

### `debuggy.set(label)`

A shortcut for creating a new log function with a predefined label.

-----

## Global Usage

You can also use a global instance of `debuggy` by importing the global entry point.

```typescript
// Add this at the top of your main file
import '@en32/debuggy/global';

// Now `debuggy` is available globally without needing to import
debuggy('Global Log')('This is a global log message.');
```

-----

## ANSI Color Cheatsheet

You can use single-character tags within `<...>` to apply ANSI color codes.

| Tag | Name | Type | Description |
|:---:|:---|:---|:---|
| `s` | `reset` | **Style** | Resets all attributes |
| `h` | `bright` | **Style** | Sets text to bright/bold |
| `u` | `underline` | **Style** | Underlines the text |
| `k` | `blink` | **Style** | Makes the text blink |
| `n` | `hidden` | **Style** | Hides the text |
| `b` | `black` | **Foreground** | Black text |
| `r` | `red` | **Foreground** | Red text |
| `g` | `green` | **Foreground** | Green text |
| `y` | `yellow` | **Foreground** | Yellow text |
| `e` | `blue` | **Foreground** | Blue text |
| `m` | `magenta` | **Foreground** | Magenta text |
| `c` | `cyan` | **Foreground** | Cyan text |
| `w` | `white` | **Foreground** | White text |
| `B` | `black` | **Background** | Black background |
| `R` | `red` | **Background** | Red background |
| `G` | `green` | **Background** | Green background |
| `Y` | `yellow` | **Background** | Yellow background |
| `E` | `blue` | **Background** | Blue background |
| `M` | `magenta` | **Background** | Magenta background |
| `C` | `cyan` | **Background** | Cyan background |
| `W` | `white` | **Background** | White background |

Tags can be combined within a single `<...>` block, e.g., `<hBy>` for a bright yellow foreground with a black background. The `<...>` block does not include a reset, so you should use the `<s>` tag to reset the style after the colored text.

-----

## License

This project is licensed under the **MIT License**.