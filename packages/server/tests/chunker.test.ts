import { describe, expect, it } from 'bun:test';
import { chunkBlocks } from '../src/utils/chunker';

describe('chunkBlocks', () => {
   it('creates overlapping chunks', () => {
      const chunks = chunkBlocks([{ text: 'a'.repeat(120) }], 50, 10);
      expect(chunks.length).toBeGreaterThan(2);
      expect(chunks[0].content.length).toBe(50);
      expect(chunks[1].content.startsWith('a')).toBe(true);
   });
});
