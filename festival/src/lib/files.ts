export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function htmlToText(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Remove script/style nodes
  doc.querySelectorAll('script, style, noscript, svg').forEach((n) => n.remove());
  // Preserve block boundaries with newlines
  const blockTags = new Set(['DIV', 'P', 'LI', 'TR', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE']);
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const children = Array.from(el.childNodes).map(walk).join('');
    return blockTags.has(el.tagName) ? `\n${children}\n` : children;
  };
  return walk(doc.body || doc)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
