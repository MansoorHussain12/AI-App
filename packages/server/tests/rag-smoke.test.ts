import { describe, it } from 'bun:test';

const hasOllama = process.env.RUN_OLLAMA_SMOKE === '1';

describe.skipIf(!hasOllama)('rag smoke', () => {
   it('placeholder smoke enabled with RUN_OLLAMA_SMOKE=1', () => {
      // Integration smoke can be expanded in real deployments.
   });
});
