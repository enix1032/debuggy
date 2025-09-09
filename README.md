# `@en32/debuggy`

A simple, customizable, and lightweight debug logger for Node.js and Bun. It provides flexible logging with automatic file and line number detection, custom templates, and tag-based filtering.

![Screenshot](https://raw.githubusercontent.com/enix1032/debuggy/refs/heads/v2/debuggy.jpg "deBuggy")

-----

## Features

  * **Simple API:** Log messages with a straightforward `debuggy('Label')('Message')` syntax.
  * **Automatic Source Info:** Automatically displays the file path, line, and column where the log originated.
  * **Customizable Templates:** Create your own log display templates to match your project's style.
  * **Tag-Based Filtering:** Use tags (e.g., `[API]`, `[DB]`) to show only relevant logs via the `DEBUG` environment variable.
  * **Rich Formatting:** Supports various console formatting options including tables (`%t`), JSON (`%j`), and custom ANSI color codes.
  * **Extensible:** Easily create new custom methods, labels, and presets for reusable logging.
  * **Buffered Logging:** Collect and flush logs periodically or stream them asynchronously.

-----

## Installation

You can install `@en32/debuggy` using npm, yarn, or Bun.

```bash
# Using npm
npm install @en32/debuggy

# Using Bun
bun add @en32/debuggy
```

-----

## Usage

### Simple Logging

```typescript
import '@en32/debuggy/global';

// Simple message
debuggy('Hello')('Hello World');

// Log a variable, label is automatically inferred from variable name
const data = { name: 'John', age: 30 };
debuggy()(data);

// Log multiple arguments
const otherData = { name: 'Jane', age: 25 };
debuggy('Debug Multiple')(data, otherData);

// Table format (%t)
debuggy('Debug %t')(data);
debuggy('Debug %t')(data, otherData);

// JSON format (%j)
debuggy('Debug %j')(data);

// Grouped logs with mixed formats
debuggy('Debug Group', ['Group 1 %t', 'Group 2 %j'])(data, otherData);

// Combined formatting
debuggy('Debug %t %j')(data, otherData);

// Custom colors
debuggy('<hy>Colored Log')(data);
debuggy('<hBy>Colored Log with Background')(data);
```

Run with:

```bash
# BunJS
DEBUG=debuggy bun run --hot ./examples-ts/simple.ts
```

```bash
# NodeJS + Nodemon
DEBUG=debuggy nodemon ./examples/simple.js
```

### Shortcuts with `label()` and `preset()`

```typescript
// Using label()
const warn = debuggy.label('<hYb>WARNING<s>');
warn({ id: 1, msg: 'Something happened' });

const err = debuggy.label('<rh>ERROR<s>');
err({ id: 2, msg: 'Critical failure' });

// Using preset()
const debug = debuggy
  .preset('log', '<bYh>Log Data<s>')
  .preset('info', '<yGh>Info Data<s>', 'myCustom');

debug.log({ id: 1, message: 'Hello' });
debug.info({ id: 2, message: 'World' });
```

### Custom Methods

```typescript
// Create 'warn' and 'error' methods with specific labels and colors
const debug = debuggy
  .create('warn', '<rYh>{label}<s>')
  .create('error', '<yRh>{label}<s>');

const sampleData = { id: 1, message: 'This is a sample message.' };

// Use the new custom methods
debug.warn('Warning Label')(sampleData);
debug.error('Error Label')(sampleData);

// Simple
const deWarn = debuggy.create('warn', '[WARN] <rYh>{label}<s>').warn
const deError = debuggy.create('error', '[ERROR] <yRh>{label}<s>').error
const deSQL = debuggy.create('sql', '[SQL] <yRh>{label}<s>').sql

deWarn('Warning Label #1')(sampleData);
deError('Error Label')(sampleData);

deWarn('Warning Label #2')(sampleData);
deSQL('SQL Query')(sampleSQLString);

// One-off chained usage
debuggy
  .create('info', '<ch>{label}<s>')
  .info('Info Label')('This is an info message.');
```

### Custom Templates

```typescript
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
    full: {
      all: ({ data, args }) => {
        console.log('--- Custom Full Template ---');
        console.log('Tokens:', data);
        console.log('Arguments:', args);
        console.log('---------------------------');
      },
    },
  },
});

debuggy('Custom Log Example')('Hello from custom template!');
debuggy('Full Custom Template', 'full')('This log uses the "full" template.');
```

### Buffered Logging (Experimental)

```typescript
import { buffered } from '@en32/debuggy/buffered';

// Interval mode: collect logs and flush every 2 seconds
const warn = buffered('<hYb>WARNING<s>', 'myCustom', { mode: 'interval', interval: 2000 });
for (let i = 0; i < 5; i++) {
  warn({ id: i, msg: `batched warning ${i}` });
}

// Async mode: stream logs
const { log: errorLog, stream } = buffered('<rh>ERROR<s>', 'myCustom', { mode: 'async' });
for (let i = 0; i < 3; i++) {
  errorLog({ id: i, msg: `async error ${i}` });
}

(async () => {
  for await (const entry of stream) {
    console.log('>>> Stream received:', entry);
    break;
  }
})();
```

### Inline SQL Example (Utility)

```typescript
import { inlineString } from '@en32/debuggy/utils';

const sql = `WITH monthly_sales AS ( ... ) SELECT ... <truncated>`;
debuggy('[SQL] SQL Query')(inlineString(sql, { maxLength: 100 }));
```

### Logging to File (Experimental)

```typescript
import { debuggy } from '@en32/debuggy';
import { Logger, LogLevel } from '@en32/logger';

const logger = new Logger('./examples/logs/example.log', LogLevel.DEBUG, true, 5000);

debuggy.options({
  logger: {
    write: true,
    saveMethod: ({ args, path, line, column, level }) => {
      const message: string = args?.[0] || '';
      const location = { path, line, column };

      if (typeof level === 'string' && logger[level as keyof typeof logger]) {
        logger.create(level as LogLevel, message, location);
      } else {
        logger.debug(message, location);
      }
    },
  },
});

// Selective logging with %log token
const log = debuggy
  .create('warn', '<y>WARN:<s> {label} %log')
  .create('error', '<r>ERROR:<s> {label} %log');

log.warn('Login Failed')('The user entered an invalid password.');
debuggy('UI Update')('This one will not be saved.');
```

For more examples, please refer to the [`./examples`](https://github.com/enix1032/debuggy/tree/v2/examples) directories.

-----

## API

### `debuggy(label?, mode?, templateName?)`

Main debug function. Returns a function to log the actual arguments.

  * `label` (string, optional): A label for the log entry.
  * `mode` (string | string[], optional): Formatting string(s) like `'%t'`, `'%j'`, `'%log'`.
  * `templateName` (string, optional): The name of a custom template.

### `debuggy.options(options)`

Update the global configuration.

  * `shows`: Tags to enable.
  * `templateActive`: Default template.
  * `templates`: Custom template definitions.
  * `dateFormatter`: Custom date formatter.
  * `stackFileIndex`: Index for stack trace (number).
  * `stackMode`: _index_, _filename_, or, _auto_ (string).
  * `logger`: File logging config.

### `debuggy.create(name, label, templateName?)`

Add a reusable custom method.

### `debuggy.label(label)`

Create a shortcut function with a fixed label.

### `debuggy.preset(name, label, templateName?)`

Create a reusable one-step method (`method(data)`).

-----

## Global Usage

```typescript
import '@en32/debuggy/global';

debuggy('Global Log')('This is a global log message.');
```

### Note:

If you encounter issues with global types, use one of the following approaches:

#### 1. Add a triple-slash directive

Place this **once** at the very top of your main TypeScript entry file, such as `index.ts`, `main.ts`, etc.:

```ts
/// <reference types="@en32/debuggy/global" />

debuggy('Hello Global!')('This works without import');
```

---

#### 2. Configure `tsconfig.json`

Add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@en32/debuggy/global"]
  }
}
```

-----

## ANSI Color Cheatsheet

| Tag | Name | Type | Description |
|:---:|:---|:---|:---|
| `s` | reset | Style | Reset all attributes |
| `h` | bright | Style | Bright/bold text |
| `u` | underline | Style | Underlined text |
| `k` | blink | Style | Blinking text |
| `n` | hidden | Style | Hidden text |
| `b` | black | Foreground | Black text |
| `r` | red | Foreground | Red text |
| `g` | green | Foreground | Green text |
| `y` | yellow | Foreground | Yellow text |
| `e` | blue | Foreground | Blue text |
| `m` | magenta | Foreground | Magenta text |
| `c` | cyan | Foreground | Cyan text |
| `w` | white | Foreground | White text |
| `B` | black | Background | Black background |
| `R` | red | Background | Red background |
| `G` | green | Background | Green background |
| `Y` | yellow | Background | Yellow background |
| `E` | blue | Background | Blue background |
| `M` | magenta | Background | Magenta background |
| `C` | cyan | Background | Cyan background |
| `W` | white | Background | White background |

Combine tags inside `<...>`, e.g., `<hBy>` = bright + yellow foreground + black background. Always end with `<s>` to reset.

-----

## License

This project is licensed under the **MIT License**.

-----

## Examples

### ./examples/ts/buffered.ts

```typescript
import { buffered } from "@en32/debuggy/buffered";

// --- Interval mode example ---
const warn = buffered("<hYb>WARNING<s>", "myCustom", { mode: "interval", interval: 2000 });

// Push multiple logs quickly → they will be flushed together every 2 seconds
for (let i = 0; i < 5; i++) {
  warn({ id: i, msg: `batched warning ${i}` });
}

// --- Async mode example ---
const { log: errorLog, stream } = buffered("<rh>ERROR<s>", "myCustom", { mode: "async" });

// Produce logs
for (let i = 0; i < 3; i++) {
  errorLog({ id: i, msg: `async error ${i}` });
}

// Consume logs as an async stream
(async () => {
  console.log("--- Start consuming async stream ---");
  let count = 0;
  for await (const entry of stream) {
    console.log(">>> Stream received:", entry);
    count++;
    if (count >= 3) {
      console.log("--- Stopping async consumer ---");
      break; // stop after 3 entries
    }
  }
})();

// Auto-stop after first interval flush
setTimeout(() => {
  console.log("\n=== Interval flush should have happened above ===");
  console.log("--- Exiting now ---\n");
  process.exit(0);
}, 2500);

/** Bug in BunJS runtime. */

```
---

### ./examples/ts/custom.ts

```typescript
import debuggy from '@en32/debuggy';

// Configure debuggy with custom options
debuggy.options({
  // shows: 'API,DB',
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
    full: {
      all: ({ data, args }) => {
        console.log('--- Custom Full Template ---');
        console.log('Tokens:', data);
        console.log('Arguments:', args);
        console.log('---------------------------');
      },
    },
  },
});

// A log with a tag that is enabled by `shows`
debuggy('[API] User fetched')(1, 2, 3);

// A log with a tag that is not enabled by `shows`, so it won't be displayed
debuggy('[UI] Button clicked')('This log should not appear');

// Using the default custom template (`myCustom`)
debuggy('Custom Log Example')('Hello from custom template!');

// Using a specific template
debuggy('Full Custom Template', 'full')('This log uses the "full" template.');

// Create new custom methods for the debuggy instance
const debug = debuggy.create('warn', '<rYh>{label}<s>').create('error', '<yRh>{label}<s>', 'myCustom');

const sampleData = {
  id: 1,
  message: 'This is a sample message.',
};

// Use the newly created custom methods
console.log('--- Using custom methods ---');
debug.warn('Warning Label')(sampleData);
debug.error('Error Label')(sampleData);

// You can also chain the `create` method and use it immediately
debuggy
  .create('info', '<ch>{label}<s>')
  .info('Info Label')('This is an info message.');


```
---

### ./examples/ts/logger.ts

```typescript
/**
 * @file This example demonstrates how to use the `%log` token to selectively save logs to a file.
 * @description Only log calls that contain the `%log` token in their label or mode will be saved
 * to the log file.
 */

import debuggy from '@en32/debuggy';
import { Logger, LogLevel } from '@en32/logger';
//import { Logger, LogLevel } from './../../logger/dist/index.js';

// Adjust based on your environment: DEVELOPMENT, PRODUCTION, TESTING, or ALL (always active).
const isAllowed = true;

/** * 1. Create a Logger instance from @en32/logger. 
 * @type {Logger}
 */
const logger = new Logger('./examples/ts/logs/example.log', LogLevel.DEBUG, isAllowed, 5000);

/**
 * 2. Configure debuggy to use the logger.
 */
debuggy.options({
  logger: {
    write: true,
    saveMethod: ({ args, path, line, column, level }) => {
      const message: string = args?.[0] || '';
      const location = { path, line, column };

      if (typeof level === 'string' && logger[level as keyof typeof logger]) {
        logger.create(level as LogLevel, message, location);
      } else {
        logger.info(message, location);
      }

      // You can also use other logging libraries here, including those that store log data in a database like SQLite.
    },
  },
});

/**
 * A custom method to create a 'warn' log that will automatically save to a file.
 * The `%log` token is included in the predefined label.
 */
const log = debuggy
  .create('warn', '<y>WARN:<s> {label} %log')
  .create('error', '<r>ERROR:<s> {label} %log')
  .create('info', '<b>INFO:<s> {label} %log')
  .create('debug', '<w>DEBUG:<s> {label} %log');

// --- Log calls with and without the `%log` token ---

// This log will be displayed in the console AND saved to the log file.
// The `%log` token in the label will be removed in the console output.
log.warn('Login Failed')('The user entered an invalid password.');

// This log will be displayed in the console AND saved to the log file.
// The `%log` token is passed as the mode.
log.error('Database Error')((new Error('Failed to connect to the database.')).toString());

// This log will be displayed in the console but will NOT be saved to the file,
// because it does not contain the `%log` token.
debuggy('UI Update')('The UI has been successfully refreshed.');
log.debug('UI Update')('The UI has been successfully refreshed.');

// A regular log without any token. It will not be saved to the file.
debuggy('General Info')('Application started successfully.');
log.info('General Info')('Application started successfully.');

```
---

### ./examples/ts/server/debuggy.ts

```typescript
import debuggy from '@en32/debuggy';

// Configure debuggy with custom options
debuggy.options({
  // shows: 'API,DB',
});

globalThis.debuggy = debuggy

```
---

### ./examples/ts/server/helpers/hello.ts

```typescript
export default (message: string) => {
  debuggy('Hello')(message);
}

```
---

### ./examples/ts/server/index.ts

```typescript
import './debuggy'
import hello from './helpers/hello'

hello('Hello World!!!');

```
---

### ./examples/ts/simple.ts

```typescript
import '@en32/debuggy/global';
import { inlineString } from '@en32/debuggy/utils'

// Simple logging
debuggy('Hello')('Hello World');

// Automatic label from variable name
const data = {
  name: 'John',
  age: 30,
};
debuggy()(data);

// Displaying multiple arguments
const otherData = {
  name: 'Jane',
  age: 25,
};
debuggy('Debug Multiple')(data, otherData);

// Displaying objects as a table (%t)
debuggy('Debug %t')(data);
debuggy('Debug %t')(data, otherData);

// Displaying objects as JSON (%j)
debuggy('Debug %j')(data);

// Grouping logs with different formats
debuggy('Debug Group', ['Group 1 %t', 'Group 2 %j'])(data, otherData);

// Combinations of formatting
debuggy('Debug %t %j')(data, otherData);

// Using custom colors
debuggy('<hy>Colored Log')(data);
debuggy('<hBy>Colored Log with Background')(data);

// Creating a shortcut

// This works, but the output line remains the same. Not recommended. Can be used if necessary.
const debug = debuggy('Debug: <yh>always line 42<s>');
debug('debug here...');
debug('here...');
debug('and here...');

// Solution #1 (Slight issue in BunJS runtime display)
const warn = debuggy.label('<hYb>WARNING<s>');
warn(data);

const err = debuggy.label('<rh>ERROR<s>');
err(data);

// Solution #2
const debug2 = debuggy
  .preset('log', '<bYh>Log Data<s>')
  .preset('info', '<yGh>Info Data<s>', 'myCustom');

debug2.log({ id: 1, message: 'Hello' });
debug2.info({ id: 2, message: 'World' });

// Example of a long SQL query string. `inlineString()` is a simple helper, do not expect too much.

const sql = `WITH monthly_sales AS (
    SELECT 
        strftime('%Y-%m', o.order_date) AS month,
        u.id AS user_id,
        u.name AS customer_name,
        SUM(oi.quantity * p.price) AS total_spent,
        COUNT(DISTINCT o.id) AS total_orders
    FROM orders o
    JOIN users u ON u.id = o.user_id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status = 'completed'
    GROUP BY month, u.id
),
top_customers AS (
    SELECT 
        month,
        user_id,
        customer_name,
        total_spent,
        RANK() OVER (PARTITION BY month ORDER BY total_spent DESC) AS rank
    FROM monthly_sales
)
SELECT 
    tc.month,
    tc.customer_name,
    tc.total_spent,
    tc.rank,
    (
        SELECT GROUP_CONCAT(c.name, ', ')
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN categories c ON c.id = p.category_id
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = tc.user_id 
          AND strftime('%Y-%m', o.order_date) = tc.month
    ) AS purchased_categories
FROM top_customers tc
WHERE tc.rank <= 3
ORDER BY tc.month DESC, tc.rank ASC;
`

debuggy('[SQL] SQL Query')(inlineString(sql, { maxLength: 100 }))

// Output:
// ``WITH monthly_sales AS ( SELECT strftime('%Y-%m', o.order_date) AS month, u.id AS user... <truncated>``

```
---

