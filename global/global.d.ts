// File: global.ts
// Entry point for global usage, e.g., `import '@en32/debuggy/global'`

// global/global.d.ts
import type { DebuggyInstance } from './../dist/types/types';

declare global {
  var debuggy: DebuggyInstance;
}

/*

declare module '@en32/debuggy' {
  export default debuggy;
}

*/
