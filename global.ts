// File: global.ts
// Entry point for global usage, e.g., `import '@en32/debuggy/global'`

import { debuggy as Debuggy } from './src/index';
import { DebuggyInstance } from './src/types';

// Expose the debuggy function to the global scope
declare global {
  var debuggy: DebuggyInstance;
}

globalThis.debuggy = Debuggy as DebuggyInstance;
