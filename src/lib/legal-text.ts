import type { Block } from '@/content/legal';

/**
 * Legal pages are edited as plain text:
 *   blank line = new paragraph · lines starting "- " = bullet list · lines starting "### " = sub-heading.
 */
export function textToBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    let para: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
      if (list.length) blocks.push({ type: 'ul', items: list });
      para = [];
      list = [];
    };
    for (const l of lines) {
      if (l.startsWith('### ')) {
        flush();
        blocks.push({ type: 'h4', text: l.slice(4).trim() });
      } else if (/^[-•*]\s+/.test(l)) {
        if (para.length) {
          blocks.push({ type: 'p', text: para.join(' ') });
          para = [];
        }
        list.push(l.replace(/^[-•*]\s+/, ''));
      } else {
        if (list.length) {
          blocks.push({ type: 'ul', items: list });
          list = [];
        }
        para.push(l);
      }
    }
    flush();
  }
  return blocks;
}

export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((b) => (b.type === 'ul' ? b.items.map((i) => `- ${i}`).join('\n') : b.type === 'h4' ? `### ${b.text}` : b.text))
    .join('\n\n');
}
