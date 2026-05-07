const collapseSpacedLetters = (text: string): string => {
  return text
    .split('\n')
    .map((line) =>
      line.replace(
        /\b(?:[A-Z][ \t]+){2,}[A-Z](?:[ \t]*-[ \t]*(?:[A-Z][ \t]+){2,}[A-Z])*\b/g,
        (match) => {
          return match.replace(/[ \t]+/g, '');
        }
      )
    )
    .join('\n');
};

const normalizeLines = (text: string): string => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
};

export const cleanText = (text: string): string => {
  const normalizedNewlines = text.replace(/\r/g, '\n');
  const withoutSpacedLetters = collapseSpacedLetters(normalizedNewlines);

  return normalizeLines(withoutSpacedLetters)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const splitTextIntoChunks = (
  text: string,
  chunkSize = 800,
  overlap = 150
): string[] => {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    const chunk = text.slice(start, end).trim();

    if (chunk.length >= 80) {
      chunks.push(chunk);
    }

    start += chunkSize - overlap;
  }

  return chunks;
};