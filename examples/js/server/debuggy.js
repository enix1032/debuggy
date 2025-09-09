import { debuggy } from '@en32/debuggy';

// Configure debuggy with custom options
debuggy.options({
  enabledTags: 'API,DB',
});

globalThis.debuggy = debuggy
