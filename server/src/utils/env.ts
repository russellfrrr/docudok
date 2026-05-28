export const getNumberEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);

  if (Number.isNaN(value) || value <= 0) {
    return fallback;
  }

  return value;
};
