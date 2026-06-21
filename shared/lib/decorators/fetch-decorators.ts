type FetchLike = typeof fetch;

export function withTimeout(fetcher: FetchLike, timeoutMs: number): FetchLike {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetcher(input, { ...init, signal: init?.signal || controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };
}

export function withRetry(fetcher: FetchLike, attempts = 2): FetchLike {
  return async (input, init) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetcher(input, init);
        if (response.ok || attempt === attempts - 1) return response;
      } catch (error) {
        lastError = error;
        if (attempt === attempts - 1) throw error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Request failed.");
  };
}
