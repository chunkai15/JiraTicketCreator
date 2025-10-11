import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for virtualizing large lists
 * Helps with performance when rendering many items
 */
export function useVirtualization({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      ...item,
      index: visibleRange.startIndex + index,
      offsetY: (visibleRange.startIndex + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = (event) => {
    setScrollTop(event.target.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange
  };
}

/**
 * Hook for implementing intersection observer
 * Useful for lazy loading and infinite scroll
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  enabled = true
}) {
  const [ref, setRef] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    if (!ref || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, rootMargin, enabled]);

  return { ref: setRef, isIntersecting, entry };
}

/**
 * Hook for debouncing values
 * Useful for search inputs and API calls
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing async operations
 * Provides loading, error, and data states
 */
export function useAsync(asyncFunction, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    const runAsync = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const data = await asyncFunction();
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, loading: false, error });
        }
      }
    };

    runAsync();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return state;
}

/**
 * Hook for managing local storage with JSON serialization
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook for managing media queries
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}
