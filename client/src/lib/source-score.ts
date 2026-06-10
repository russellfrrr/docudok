export const getSourceScoreLabel = (relevanceScore?: number): string => {
  if (relevanceScore === undefined) {
    return 'match';
  }

  if (relevanceScore >= 0.9) {
    return 'best match';
  }

  if (relevanceScore >= 0.65) {
    return 'supporting match';
  }

  return 'loose match';
};

export const formatSourceScore = (
  score: number,
  relevanceScore?: number,
  rerankScore?: number
): string => {
  const rawScore = `raw ${score.toFixed(3)}`;

  if (rerankScore !== undefined) {
    return `${Math.round(rerankScore * 100)}% reranked - ${rawScore}`;
  }

  if (relevanceScore !== undefined) {
    return `${Math.round(relevanceScore * 100)}% relevance - ${rawScore}`;
  }

  return rawScore;
};
