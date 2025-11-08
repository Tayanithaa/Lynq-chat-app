// app/polyfills.ts
// Synchronous polyfills evaluated at module load time.
// This file statically imports expo-random (must be installed) and
// provides crypto.getRandomValues for libraries like crypto-js.

import * as Random from 'expo-random';

try {
  if (typeof (globalThis as any).crypto === 'undefined') {
    (globalThis as any).crypto = {
      getRandomValues: (arr: Uint8Array) => {
        // expo-random exposes getRandomBytes
        const bytes = (Random as any).getRandomBytes(arr.length);
        arr.set(bytes);
        return arr;
      },
    };
     
    console.log('✅ crypto.getRandomValues polyfilled synchronously using expo-random');
  }
} catch (err) {
   
  console.warn('⚠️ Failed to apply synchronous expo-random polyfill:', err);
}
