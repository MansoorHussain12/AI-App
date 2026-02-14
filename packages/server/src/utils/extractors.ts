import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import PizZip from 'pizzip';

export type ExtractedBlock = {
   text: string;
   pageNumber?: number;
   slideNumber?: number;
};

export async function extractDocument(
   filePath: string,
   sourceType: string
): Promise<ExtractedBlock[]> {
   if (sourceType === 'pdf') return extractPdf(filePath);
   if (sourceType === 'docx') return extractDocx(filePath);
   if (sourceType === 'pptx' || sourceType === 'ppt')
      return extractPptx(filePath);
   throw new Error(`Unsupported source type: ${sourceType}`);
}

async function extractPdf(filePath: string): Promise<ExtractedBlock[]> {
   const buffer = await fs.readFile(filePath);
   const pages: ExtractedBlock[] = [];
   await pdf(buffer, {
      pagerender: async (pageData) => {
         const textContent = await pageData.getTextContent();
         const text = textContent.items.map((i: any) => i.str).join(' ');
         pages.push({ text, pageNumber: pages.length + 1 });
         return text;
      },
   });
   return pages;
}

async function extractDocx(filePath: string): Promise<ExtractedBlock[]> {
   const result = await mammoth.extractRawText({ path: filePath });
   return [{ text: result.value }];
}

async function extractPptx(filePath: string): Promise<ExtractedBlock[]> {
   const content = await fs.readFile(filePath);
   const zip = new PizZip(content);
   const slideFiles = Object.keys(zip.files)
      .filter((k) => k.startsWith('ppt/slides/slide') && k.endsWith('.xml'))
      .sort(
         (a, b) =>
            Number(a.match(/slide(\d+)/)?.[1] ?? 0) -
            Number(b.match(/slide(\d+)/)?.[1] ?? 0)
      );

   return slideFiles.map((slidePath, idx) => {
      const xml = zip.file(slidePath)?.asText() ?? '';
      const text = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)]
         .map((m) => decodeXml(m[1]))
         .join(' ');
      return { text, slideNumber: idx + 1 };
   });
}

function decodeXml(input: string) {
   return input
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&apos;', "'");
}

export function inferSourceType(fileName: string) {
   const ext = path.extname(fileName).toLowerCase().replace('.', '');
   if (!['pdf', 'docx', 'ppt', 'pptx'].includes(ext))
      throw new Error('Invalid file type');
   return ext;
}
