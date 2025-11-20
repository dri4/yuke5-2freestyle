import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading with Intersection Observer
 */
export function useIntersectionObserver<T extends Element>(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = "50px",
    triggerOnce = true,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);
        
        if (isIntersecting && triggerOnce) {
          setHasTriggered(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref, isVisible, hasTriggered };
}

/**
 * Hook for preloading resources when they're about to come into view
 */
export function usePreloadOnVisible(
  resourceUrl: string,
  resourceType: "image" | "script" | "style" = "image"
) {
  const { ref, isVisible } = useIntersectionObserver({
    rootMargin: "200px", // Preload when 200px away from viewport
    triggerOnce: true,
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && !isLoaded && !isLoading) {
      setIsLoading(true);

      if (resourceType === "image") {
        const img = new Image();
        img.onload = () => {
          setIsLoaded(true);
          setIsLoading(false);
        };
        img.onerror = () => {
          setIsLoading(false);
        };
        img.src = resourceUrl;
      } else if (resourceType === "script") {
        const script = document.createElement("script");
        script.src = resourceUrl;
        script.onload = () => {
          setIsLoaded(true);
          setIsLoading(false);
        };
        script.onerror = () => {
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else if (resourceType === "style") {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = resourceUrl;
        link.onload = () => {
          setIsLoaded(true);
          setIsLoading(false);
        };
        link.onerror = () => {
          setIsLoading(false);
        };
        document.head.appendChild(link);
      }
    }
  }, [isVisible, resourceUrl, resourceType, isLoaded, isLoading]);

  return { ref, isLoaded, isLoading };
}
