import { classifyScreenplay } from './screenplayLines';

/** Génère le scénario en .docx (Courier 12 pt : séquences en gras, répliques centrées) et le télécharge. */
export async function downloadScreenplayDocx(filename: string, title: string, screenplay: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');
  const font = 'Courier New';
  const run = (text: string, o: { bold?: boolean; italics?: boolean; size?: number } = {}) =>
    new TextRun({ text, font, size: o.size ?? 24, bold: o.bold, italics: o.italics });

  const body = classifyScreenplay(screenplay).map(({ type, text }) => {
    switch (type) {
      case 'blank': return new Paragraph({ children: [] });
      case 'slug': return new Paragraph({ children: [run(text.toUpperCase(), { bold: true })], spacing: { before: 240, after: 120 }, keepNext: true });
      case 'cue': return new Paragraph({ children: [run(text, { bold: true })], alignment: AlignmentType.CENTER, keepNext: true });
      case 'paren': return new Paragraph({ children: [run(text, { italics: true })], alignment: AlignmentType.CENTER, keepNext: true });
      case 'dialogue': return new Paragraph({ children: [run(text)], alignment: AlignmentType.CENTER, indent: { left: 1700, right: 1700 } });
      default: return new Paragraph({ children: [run(text)] });
    }
  });

  const doc = new Document({
    title,
    sections: [{
      children: [
        new Paragraph({ children: [run(title || 'Sans titre', { bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 360 } }),
        ...body,
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
