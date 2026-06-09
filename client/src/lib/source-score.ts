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

export const formatSourceScore = (score: number, relevanceScore?: number): string => {
  const rawScore = `raw ${score.toFixed(3)}`;

  if (relevanceScore === undefined) {
    return rawScore;
  }

  return `${Math.round(relevanceScore * 100)}% relevance - ${rawScore}`;
};
