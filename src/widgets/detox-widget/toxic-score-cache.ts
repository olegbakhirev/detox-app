import { ToxicAnalysisResponse } from './toxic-score';

// Global cache for toxic scores to avoid repeated API calls
export interface ToxicScoreCache {
  cache: Record<string, ToxicAnalysisResponse>;
  isReady: boolean;
}

export const toxicScoreCache: ToxicScoreCache = {
  cache: {},
  isReady: false
};

// Function to set the cache ready state
export const setToxicScoreCacheReady = (ready: boolean) => {
  toxicScoreCache.isReady = ready;
};

// Function to get a value from the cache
export const getToxicScoreCacheValue = async (key: string, maxWaitTime: number = 20000, dontWaitForCache: boolean = false): Promise<ToxicAnalysisResponse | undefined> => {
  // If the cache is already ready, return the value immediately
  if (toxicScoreCache.isReady) {
    return toxicScoreCache.cache[key];
  }

  // If dontWaitForCache is true, return undefined immediately
  if (dontWaitForCache) {
    return undefined;
  }

  // Wait for the cache to be ready with a timeout
  const startTime = Date.now();
  return new Promise((resolve) => {
    const checkCache = () => {
      // If the cache is ready, resolve with the value
      if (toxicScoreCache.isReady) {
        resolve(toxicScoreCache.cache[key]);
        return;
      }

      // If we've waited too long, resolve with undefined
      if (Date.now() - startTime > maxWaitTime) {
        console.warn(`Cache not ready after ${maxWaitTime}ms, returning undefined for key: ${key}`);
        resolve(undefined);
        return;
      }

      // Check again after a short delay
      setTimeout(checkCache, 100);
    };

    // Start checking
    checkCache();
  });
};

// Function to set a value in the cache
export const setToxicScoreCacheValue = (key: string, value: ToxicAnalysisResponse) => {
  toxicScoreCache.cache[key] = value;
};

// Function to check if the cache is ready
export const isToxicScoreCacheReady = (): boolean => {
  return toxicScoreCache.isReady;
};

// Function to clear the cache
export const clearToxicScoreCache = () => {
  toxicScoreCache.cache = {};
  toxicScoreCache.isReady = false;
};
