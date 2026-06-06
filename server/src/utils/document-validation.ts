export class DocumentValidationError extends Error {}

export const maxDocumentTitleLength = 120;
export const maxQuestionLength = 2000;

export const validateDocumentTitle = (
  title: unknown,
  fallbackTitle: string
): string => {
  const cleanTitle =
    typeof title === 'string' && title.trim() ? title.trim() : fallbackTitle;

  if (cleanTitle.length > maxDocumentTitleLength) {
    throw new DocumentValidationError(
      `Document title must be ${maxDocumentTitleLength} characters or fewer`
    );
  }

  return cleanTitle;
};

export const validateQuestion = (body: unknown): string => {
  const input = body as { question?: unknown };
  const question = typeof input.question === 'string' ? input.question.trim() : '';

  if (!question) {
    throw new DocumentValidationError('Question is required');
  }

  if (question.length > maxQuestionLength) {
    throw new DocumentValidationError(
      `Question must be ${maxQuestionLength} characters or fewer`
    );
  }

  return question;
};
