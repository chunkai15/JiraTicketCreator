import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for API caching with TTL (Time To Live)
 * Provides intelligent caching, loading states, and error handling
 */
export function useApiCache(key, ttl = 5 * 60 * 1000) { // Default 5 minutes
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const cacheRef = useRef(new Map());

  // Check if cache is valid
  const isCacheValid = useCallback((cacheKey) => {
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < ttl;
  }, [ttl]);

  // Get cached data
  const getCachedData = useCallback((cacheKey) => {
    if (isCacheValid(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      return cached.data;
    }
    return null;
  }, [isCacheValid]);

  // Set cache data
  const setCacheData = useCallback((cacheKey, newData) => {
    cacheRef.current.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    });
  }, []);

  // Execute API call with caching
  const execute = useCallback(async (apiCall, cacheKey = key, forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log(`🎯 Cache hit for ${cacheKey}`);
        setData(cached);
        setError(null);
        return cached;
      }
    }

    console.log(`🔄 Cache miss for ${cacheKey}, fetching...`);
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      // Cache the result
      setCacheData(cacheKey, result);
      setData(result);
      setLastFetch(Date.now());
      
      console.log(`✅ Cached data for ${cacheKey}`);
      return result;
    } catch (err) {
      console.error(`❌ API call failed for ${cacheKey}:`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, getCachedData, setCacheData]);

  // Clear specific cache
  const clearCache = useCallback((cacheKey = key) => {
    cacheRef.current.delete(cacheKey);
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
  }, [key]);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
    console.log('🗑️ Cleared all cache');
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    const stats = {
      totalEntries: cacheRef.current.size,
      validEntries: 0,
      expiredEntries: 0,
      entries: []
    };

    cacheRef.current.forEach((value, key) => {
      const isValid = isCacheValid(key);
      const entry = {
        key,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp,
        isValid,
        size: JSON.stringify(value.data).length
      };

      stats.entries.push(entry);
      if (isValid) {
        stats.validEntries++;
      } else {
        stats.expiredEntries++;
      }
    });

    return stats;
  }, [isCacheValid]);

  // Auto-cleanup expired entries
  useEffect(() => {
    const cleanup = () => {
      const keysToDelete = [];
      cacheRef.current.forEach((value, key) => {
        if (!isCacheValid(key)) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => {
        cacheRef.current.delete(key);
      });

      if (keysToDelete.length > 0) {
        console.log(`🧹 Auto-cleaned ${keysToDelete.length} expired cache entries`);
      }
    };

    const interval = setInterval(cleanup, ttl); // Cleanup every TTL period
    return () => clearInterval(interval);
  }, [ttl, isCacheValid]);

  return {
    data,
    loading,
    error,
    lastFetch,
    execute,
    clearCache,
    clearAllCache,
    getCacheStats,
    isCacheValid: () => isCacheValid(key)
  };
}

/**
 * Hook for caching project metadata with smart invalidation
 */
export function useProjectMetadataCache(projectKey) {
  const cacheKey = `project-metadata-${projectKey}`;
  const cache = useApiCache(cacheKey, 10 * 60 * 1000); // 10 minutes TTL

  const fetchMetadata = useCallback(async (config, forceRefresh = false) => {
    const apiCall = async () => {
      const response = await fetch('http://localhost:3001/api/jira/project-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: config.url,
          email: config.email,
          token: config.token,
          projectKey: config.projectKey
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    };

    return cache.execute(apiCall, cacheKey, forceRefresh);
  }, [cache, cacheKey]);

  return {
    ...cache,
    fetchMetadata
  };
}

/**
 * Hook for caching Epic search results
 */
export function useEpicSearchCache() {
  const cache = useApiCache('epic-search', 5 * 60 * 1000); // 5 minutes TTL

  const searchEpics = useCallback(async (config, searchTerm, forceRefresh = false) => {
    const cacheKey = `epic-search-${config.projectKey}-${searchTerm}`;
    
    const apiCall = async () => {
      const response = await fetch('http://localhost:3001/api/jira/search-epics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: config.url,
          email: config.email,
          token: config.token,
          projectKey: config.projectKey,
          searchTerm: searchTerm,
          maxResults: 50
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Epic search failed');
      }

      return result.epics || [];
    };

    return cache.execute(apiCall, cacheKey, forceRefresh);
  }, [cache]);

  return {
    ...cache,
    searchEpics
  };
}
