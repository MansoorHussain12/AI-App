import { describe, expect, it } from 'bun:test';
import { inferSourceType } from '../src/utils/extractors';

describe('inferSourceType', () => {
   it('accepts supported formats', () => {
      expect(inferSourceType('manual.pdf')).toBe('pdf');
      expect(inferSourceType('guide.docx')).toBe('docx');
   });
});
