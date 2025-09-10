import debuggy from '@en32/debuggy';

// Configure debuggy with custom options
debuggy.options({
  // You can filter logs by tag. Example:
  // enabledTags: 'API,DB',
  activeTemplate: 'myCustom',
  useCounter: true,
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

/**
 * Example 1: Basic tagged logs
 */

// A log with a tag that matches `enabledTags` (e.g. [API])
// Will be displayed when the tag filter is enabled.
debuggy('[API] User fetched')(1, 2, 3);

// A log with a tag that is not enabled, so it will be ignored.
debuggy('[UI] Button clicked')('This log should not appear');

/**
 * Example 2: Using templates
 */

// Using the default custom template (`myCustom`)
debuggy('Custom Log Example')('Hello from custom template!');

// Using a specific template (`full`)
debuggy('Full Custom Template', 'full')('This log uses the "full" template.');

/**
 * Example 3: Defining custom methods
 */

// Create new reusable methods for the debuggy instance.
// `create` uses a two-step call: method(label)(data)
const debug = debuggy
  .create('warn', '<rYh>{label}<s>')
  .create('error', '<yRh>{label}<s>', 'myCustom');

const sampleData = {
  id: 1,
  message: 'This is a sample message.',
};

console.log('--- Using custom methods ---');
debug.warn('Warning Label')(sampleData);
debug.error('Error Label')(sampleData);

// You can also chain `create` and use it immediately:
debuggy
  .create('info', '<ch>{label}<s>')
  .info('Info Label')('This is an info message.');

/**
 * Example 4: Using `preset` (one-step shortcut)
 *
 * Unlike `create`, `preset` does not require a label argument.
 * Just call the method directly with your data.
 */
const bug = debuggy
  .preset('log', '<bYh>Log Data<s>')
  .preset('info', '<yGh>Info Data<s>', 'myCustom');

bug.log({ id: 1, message: 'Hello' });
bug.info({ id: 2, message: 'World' });
