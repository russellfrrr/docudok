import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getNumberEnv } from './env';

const getChunkingConfig = () => {
  return {
    chunkSize: getNumberEnv('CHUNK_SIZE', 1000),
    chunkOverlap: getNumberEnv('CHUNK_OVERLAP', 150),
    minChunkLength: getNumberEnv('CHUNK_MIN_LENGTH', 120),
  };
};

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

const normalizeParagraphs = (text: string): string => {
  const paragraphs: string[] = [];
  let currentLines: string[] = [];

  text.split('\n').forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (currentLines.length > 0) {
        paragraphs.push(currentLines.join(' '));
        currentLines = [];
      }

      return;
    }

    currentLines.push(trimmedLine);
  });

  if (currentLines.length > 0) {
    paragraphs.push(currentLines.join(' '));
  }

  return paragraphs.join('\n\n');
};

const removePdfArtifacts = (text: string): string => {
  return text
    .split('\n')
    .filter((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return true;
      }

      if (/^[-–—]*\s*\d+\s+of\s+\d+\s*[-–—]*$/i.test(trimmedLine)) {
        return false;
      }

      if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(trimmedLine)) {
        return false;
      }

      if (/^[\W_]+$/.test(trimmedLine)) {
        return false;
      }

      return true;
    })
    .join('\n');
};

const cleanChunkText = (text: string): string => {
  return text
    .replace(/^[\s.,;:!?•\-–—]+/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const cleanText = (text: string): string => {
  const normalizedNewlines = text.replace(/\r/g, '\n');
  const withoutSpacedLetters = collapseSpacedLetters(normalizedNewlines);
  const withoutHyphenLineBreaks = withoutSpacedLetters.replace(
    /([A-Za-z])-\n([A-Za-z])/g,
    '$1$2'
  );

  const withoutPdfArtifacts = removePdfArtifacts(withoutHyphenLineBreaks);

  return normalizeParagraphs(withoutPdfArtifacts)
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const splitTextIntoChunks = async (
  text: string
): Promise<string[]> => {
  const config = getChunkingConfig();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: ['\n\n', '\n', '. ', '? ', '! ', ' ', ''],
  });

  const chunks = await splitter.splitText(text);

  return chunks
    .map(cleanChunkText)
    .filter((chunk) => chunk.length >= config.minChunkLength || chunks.length === 1);
};
