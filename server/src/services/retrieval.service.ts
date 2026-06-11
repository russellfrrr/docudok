import { createEmbedding } from './embedding.service';
import { SearchResult, searchDocumentChunks } from './vector.service';
import { rerankSources } from './rerank.service';
import { getNumberEnv } from '../utils/env';

interface RetrieveDocumentSourcesInput {
  question: string;
  userId: string;
  documentId: string;
  sourceLimit?: number;
  candidateLimit?: number;
}

interface RetrievalDebugConfig {
  sourceLimit: number;
  candidateLimit: number;
  minSourceCount: number;
  relativeScoreCutoff: number;
}

const getRetrievalConfig = () => {
  return {
    minSourceCount: getNumberEnv('RETRIEVAL_MIN_SOURCES', 3),
    sourceLimit: getNumberEnv('RETRIEVAL_SOURCE_LIMIT', 5),
    candidateLimit: getNumberEnv('RETRIEVAL_CANDIDATE_LIMIT', 12),
    relativeScoreCutoff: getNumberEnv('RETRIEVAL_SCORE_CUTOFF', 0.7),
    rerankingEnabled: process.env.RERANKING_ENABLED === 'true',
    rerankingCandidateLimit: getNumberEnv('RERANKING_CANDIDATE_LIMIT', 15),
    rerankingSourceLimit: getNumberEnv('RERANKING_SOURCE_LIMIT', 5),
  };
};

const normalizeForDedupe = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by',
  'for', 'from', 'has', 'have', 'he', 'her', 'his', 'i',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'she', 'that',
  'the', 'their', 'this', 'to', 'was', 'what', 'when', 'where',
  'who', 'why', 'with', 'you', 'your',
]);

const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
};

const getKeywordScore = (question: string, chunkText: string): number => {
  const questionWords = Array.from(new Set(tokenize(question)));
  const chunkWords = new Set(tokenize(chunkText));

  if (questionWords.length === 0) {
    return 0;
  }

  const matchedWords = questionWords.filter((word) => chunkWords.has(word));

  return matchedWords.length / questionWords.length;
};

const addHybridScores = (
  question: string,
  sources: SearchResult[]
): SearchResult[] => {
  const topVectorScore = sources[0]?.score || 0;

  return sources
    .map((source) => {
      const vectorScore = topVectorScore > 0 ? source.score / topVectorScore : 0;
      const keywordScore = getKeywordScore(question, source.chunkText);

      const finalScore = Number(
        (vectorScore * 0.75 + keywordScore * 0.25).toFixed(3)
      );

      return {
        ...source,
        keywordScore: Number(keywordScore.toFixed(3)),
        finalScore,
      };
    })
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
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
  sourceLimit: number,
  minSourceCount: number,
  relativeScoreCutoff: number
): SearchResult[] => {
  if (sources.length <= sourceLimit) {
    return sources;
  }

  const topScore = sources[0]?.finalScore || sources[0]?.score || 0;
  const minimumScore = topScore * relativeScoreCutoff;

  const strongSources = sources.filter((source) => {
    const sourceScore = source.finalScore || source.score;

    return sourceScore >= minimumScore;
  });

  const selectedSources =
    strongSources.length >= minSourceCount
      ? strongSources
      : sources.slice(0, minSourceCount);

  return selectedSources.slice(0, sourceLimit);
};

const addRelativeRelevanceScores = (sources: SearchResult[]): SearchResult[] => {
  const topScore = sources[0]?.finalScore || sources[0]?.score || 0;

  return sources.map((source) => {
    const sourceScore = source.finalScore || source.score;

    if (topScore <= 0) {
      return {
        ...source,
        relevanceScore: 0,
      };
    }

    return {
      ...source,
      relevanceScore: Number((sourceScore / topScore).toFixed(3)),
    };
  });
};

const logRetrievalDebug = (
  question: string,
  candidates: SearchResult[],
  sources: SearchResult[],
  config: RetrievalDebugConfig
) => {
  if (process.env.RETRIEVAL_DEBUG !== 'true') {
    return;
  }

  console.log('Retrieval debug:', {
    question,
    config,
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
  sourceLimit,
  candidateLimit,
}: RetrieveDocumentSourcesInput): Promise<SearchResult[]> => {
  const config = getRetrievalConfig();
  const finalSourceLimit = sourceLimit || config.sourceLimit;
  const finalCandidateLimit =
    candidateLimit ||
    (config.rerankingEnabled
      ? config.rerankingCandidateLimit
      : config.candidateLimit);
  const questionVector = await createEmbedding(question);

  const candidates = await searchDocumentChunks(
    questionVector,
    userId,
    documentId,
    finalCandidateLimit
  );

  const usefulSources = candidates.filter(isUsefulSource);
  const dedupedSources = removeDuplicateSources(
    usefulSources.length > 0 ? usefulSources : candidates
  );
  const hybridScoredSources = addHybridScores(question, dedupedSources);
  const selectedSources = selectBestSources(
    hybridScoredSources,
    finalSourceLimit,
    config.minSourceCount,
    config.relativeScoreCutoff
  );
  const rerankedSources = config.rerankingEnabled
    ? await rerankSources(
        question,
        hybridScoredSources.slice(0, finalCandidateLimit),
        config.rerankingSourceLimit
      )
    : selectedSources;

  const scoredSources = addRelativeRelevanceScores(
    rerankedSources.slice(0, finalSourceLimit)
  );

  logRetrievalDebug(question, candidates, scoredSources, {
    sourceLimit: finalSourceLimit,
    candidateLimit: finalCandidateLimit,
    minSourceCount: config.minSourceCount,
    relativeScoreCutoff: config.relativeScoreCutoff,
  });

  return scoredSources;
};
