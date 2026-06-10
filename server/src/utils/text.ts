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

const looksLikeCodeLine = (line: string): boolean => {
  return (
    /[{}();=<>]/.test(line) ||
    /^\s*(const|let|var|function|return|if|else|for|while|import|export)\b/.test(line)
  );
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

    if (looksLikeCodeLine(trimmedLine)) {
      if (currentLines.length > 0) {
        paragraphs.push(currentLines.join(' '));
        currentLines = [];
      }

      paragraphs.push(trimmedLine);
      return;
    }

    currentLines.push(trimmedLine);
  });

  if (currentLines.length > 0) {
    paragraphs.push(currentLines.join(' '));
  }

  return paragraphs.join('\n\n');
};

const normalizeCommonPdfArtifacts = (text: string): string => {
  return text
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\ufb01/g, 'fi')
    .replace(/\ufb02/g, 'fl')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ');
};

const removePdfArtifacts = (text: string): string => {
  return text
    .split('\n')
    .filter((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return true;
      }

      if (/^[-\u2013\u2014]*\s*\d+\s+of\s+\d+\s*[-\u2013\u2014]*$/i.test(trimmedLine)) {
        return false;
      }

      if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(trimmedLine)) {
        return false;
      }

      if (/^\d+\s*$/.test(trimmedLine)) {
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
    .replace(/^[\s.,;:!?\u2022\-\u2013\u2014]+/g, '')
    .replace(/^\d+\s+(?=[A-Z])/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const cleanText = (text: string): string => {
  const normalizedArtifacts = normalizeCommonPdfArtifacts(text);
  const normalizedNewlines = normalizedArtifacts.replace(/\r/g, '\n');
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

export const splitTextIntoChunks = async (text: string): Promise<string[]> => {
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
