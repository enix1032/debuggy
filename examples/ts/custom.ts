import debuggy from '@en32/debuggy';

// Configure debuggy with custom options
debuggy.options({
  // enabledTags: 'API,DB',
  activeTemplate: 'myCustom',
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

