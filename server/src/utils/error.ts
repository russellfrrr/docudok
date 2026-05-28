export const getErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong'
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
