import * as pdfjs from 'pdfjs-dist';
// Use the bundled worker via a static URL Vite can resolve
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function pdfFileToText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lines: { y: number; text: string }[] = [];
    let last: { y: number; text: string } | null = null;
    for (const item of content.items as { str: string; transform: number[] }[]) {
      const y = Math.round(item.transform[5]);
      if (!last || Math.abs(last.y - y) > 2) {
        last = { y, text: item.str };
        lines.push(last);
      } else {
        last.text += ' ' + item.str;
      }
    }
    parts.push(lines.map((l) => l.text.trim()).filter(Boolean).join('\n'));
  }
  return parts.join('\n\n');
}
