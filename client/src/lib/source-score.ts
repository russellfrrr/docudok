export const getSourceScoreLabel = (score: number): string => {
  if (score >= 0.75) {
    return 'strong match';
  }

  if (score >= 0.5) {
    return 'possible match';
  }

  return 'weak match';
};
