import { createEmbedding } from './embedding.service';
import { SearchResult, searchDocumentChunks } from './vector.service';

interface RetrieveDocumentSourcesInput {
  question: string;
  userId: string;
  documentId: string;
  sourceLimit?: number;
  candidateLimit?: number;
}

const MIN_SOURCE_COUNT = 3;
const DEFAULT_SOURCE_LIMIT = 5;
const DEFAULT_CANDIDATE_LIMIT = 12;
const RELATIVE_SCORE_CUTOFF = 0.7;

const normalizeForDedupe = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
};

const isUsefulSource = (source: SearchResult): boolean => {
  const text = source.chunkText.trim();
  const letterCount = text.match(/[A-Za-z]/g)?.length || 0;
  const letterRatio = letterCount / Math.max(text.length, 1);

  return text.length >= 80 && letterRatio >= 0.35;
};

const removeDuplicateSources = (sources: SearchResult[]): SearchResult[] => {
  const seen = new Set<string>();

  return sources.filter((source) => {
    const dedupeKey = normalizeForDedupe(source.chunkText);

    if (seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
};

const selectBestSources = (
  sources: SearchResult[],
  sourceLimit: number
): SearchResult[] => {
  if (sources.length <= sourceLimit) {
    return sources;
  }

  const topScore = sources[0]?.score || 0;
  const minimumScore = topScore * RELATIVE_SCORE_CUTOFF;

  const strongSources = sources.filter((source) => {
    return source.score >= minimumScore;
  });

  const selectedSources =
    strongSources.length >= MIN_SOURCE_COUNT
      ? strongSources
      : sources.slice(0, MIN_SOURCE_COUNT);

  return selectedSources.slice(0, sourceLimit);
};

const logRetrievalDebug = (
  question: string,
  candidates: SearchResult[],
  sources: SearchResult[]
) => {
  if (process.env.RETRIEVAL_DEBUG !== 'true') {
    return;
  }

  console.log('Retrieval debug:', {
    question,
    candidateScores: candidates.map((source) => ({
      chunkIndex: source.chunkIndex,
      score: Number(source.score.toFixed(3)),
    })),
    selectedScores: sources.map((source) => ({
      chunkIndex: source.chunkIndex,
      score: Number(source.score.toFixed(3)),
    })),
  });
};

export const retrieveDocumentSources = async ({
  question,
  userId,
  documentId,
  sourceLimit = DEFAULT_SOURCE_LIMIT,
  candidateLimit = DEFAULT_CANDIDATE_LIMIT,
}: RetrieveDocumentSourcesInput): Promise<SearchResult[]> => {
  const questionVector = await createEmbedding(question);

  const candidates = await searchDocumentChunks(
    questionVector,
    userId,
    documentId,
    candidateLimit
  );

  const usefulSources = candidates.filter(isUsefulSource);
  const dedupedSources = removeDuplicateSources(
    usefulSources.length > 0 ? usefulSources : candidates
  );
  const selectedSources = selectBestSources(dedupedSources, sourceLimit);

  logRetrievalDebug(question, candidates, selectedSources);

  return selectedSources;
};
