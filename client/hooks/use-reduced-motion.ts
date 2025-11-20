import { useEffect, useState } from "react";

/**
 * Hook to detect user's motion preferences
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if the user prefers reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for performance-aware animation controls
 * Reduces animation complexity based on device capabilities
 */
export function usePerformanceSettings() {
  const [settings, setSettings] = useState({
    reduceAnimations: false,
    lowPowerMode: false,
    connectionSpeed: "4g" as "slow-2g" | "2g" | "3g" | "4g",
  });

  useEffect(() => {
    // Check device memory (if available)
    const deviceMemory = (navigator as any).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    // Check connection quality
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || "4g";
    
    // Determine if we should reduce animations
    const shouldReduce =
      deviceMemory && deviceMemory <= 4 || // Low memory devices
      hardwareConcurrency <= 2 || // Low-core devices
      effectiveType === "slow-2g" || effectiveType === "2g"; // Slow connections

    setSettings({
      reduceAnimations: shouldReduce,
      lowPowerMode: deviceMemory && deviceMemory <= 2,
      connectionSpeed: effectiveType,
    });
  }, []);

  return settings;
}
