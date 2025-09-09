import debuggy from '@en32/debuggy';

// Configure debuggy with custom options
debuggy.options({
  enabledTags: 'API|DB',
  stackTraceMode: 'auto',
  displayHeader: true,
});

globalThis.debuggy = debuggy
