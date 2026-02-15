import type { ExtractedBlock } from './extractors';

export type ChunkPayload = {
   content: string;
   chunkIndex: number;
   pageNumber?: number;
   slideNumber?: number;
};

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

export function chunkBlocks(
   blocks: ExtractedBlock[],
   size: number,
   overlap: number
): ChunkPayload[] {
   const chunks: ChunkPayload[] = [];
   let index = 0;
   for (const block of blocks) {
      const text = normalize(block.text);
      if (!text) continue;
      let pos = 0;
      while (pos < text.length) {
         const end = Math.min(pos + size, text.length);
         const content = text.slice(pos, end);
         chunks.push({
            content,
            chunkIndex: index++,
            pageNumber: block.pageNumber,
            slideNumber: block.slideNumber,
         });
         if (end === text.length) break;
         pos = Math.max(0, end - overlap);
      }
   }
   return chunks;
}
