import { useEffect, useRef, useState } from 'react';

/**
 * Hook for managing focus trap within a component
 * Useful for modals, dropdowns, and other overlay components
 */
export function useFocusTrap(isActive = true) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    // Focus first element when trap becomes active
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing ARIA live regions
 * Useful for announcing dynamic content changes to screen readers
 */
export function useAriaLive() {
  const [announcement, setAnnouncement] = useState('');
  const [politeness, setPoliteness] = useState('polite');

  const announce = (message, level = 'polite') => {
    setAnnouncement(''); // Clear first to ensure re-announcement
    setTimeout(() => {
      setPoliteness(level);
      setAnnouncement(message);
    }, 10);
  };

  const LiveRegion = () => (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );

  return { announce, LiveRegion };
}

/**
 * Hook for managing keyboard navigation
 * Provides arrow key navigation for lists and grids
 */
export function useKeyboardNavigation({
  items = [],
  orientation = 'vertical',
  loop = true,
  onSelect
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e) => {
      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      switch (e.key) {
        case nextKey:
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev + 1;
            return next >= items.length ? (loop ? 0 : prev) : next;
          });
          break;

        case prevKey:
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev - 1;
            return next < 0 ? (loop ? items.length - 1 : prev) : next;
          });
          break;

        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setActiveIndex(items.length - 1);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(items[activeIndex], activeIndex);
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [items, orientation, loop, onSelect, activeIndex]);

  return {
    containerRef,
    activeIndex,
    setActiveIndex
  };
}

/**
 * Hook for managing skip links
 * Helps keyboard users skip to main content
 */
export function useSkipLinks() {
  const skipLinksRef = useRef(null);

  const SkipLinks = ({ links = [] }) => (
    <div ref={skipLinksRef} className="sr-only focus-within:not-sr-only">
      <div className="fixed top-0 left-0 z-50 bg-primary text-primary-foreground p-2 space-x-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector(link.href);
              target?.focus();
              target?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );

  return { SkipLinks };
}

/**
 * Hook for managing reduced motion preferences
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for managing high contrast mode
 */
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (e) => setPrefersHighContrast(e.matches);
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  return prefersHighContrast;
}

/**
 * Hook for managing focus visible state
 * Helps distinguish between mouse and keyboard focus
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let hadKeyboardEvent = false;

    const onKeyDown = (e) => {
      if (e.metaKey || e.altKey || e.ctrlKey) return;
      hadKeyboardEvent = true;
    };

    const onPointerDown = () => {
      hadKeyboardEvent = false;
    };

    const onFocus = () => {
      setIsFocusVisible(hadKeyboardEvent);
    };

    const onBlur = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    element.addEventListener('focus', onFocus);
    element.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      element.removeEventListener('focus', onFocus);
      element.removeEventListener('blur', onBlur);
    };
  }, []);

  return { ref, isFocusVisible };
}

/**
 * Hook for generating unique IDs for accessibility
 */
export function useId(prefix = 'id') {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
}

/**
 * Hook for managing disclosure state (collapsible content)
 */
export function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);

  const open = () => {
    setIsAnimating(true);
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const close = () => {
    setIsAnimating(true);
    setIsOpen(false);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  return {
    isOpen,
    isAnimating,
    open,
    close,
    toggle
  };
}
