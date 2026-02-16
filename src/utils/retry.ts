export const exponentialBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  factor = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return exponentialBackoff(fn, retries - 1, delay * factor, factor);
  }
};
