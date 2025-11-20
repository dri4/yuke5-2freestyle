import { useRef, useCallback } from "react";

// Simple RAF throttle hook. Returns a wrapped callback that will be invoked
// at most once per animation frame. Useful for mousemove/scroll handlers.
export const useRafThrottle = <T extends (...args: any[]) => void>(
  fn: T,
) => {
  const frame = useRef<number | null>(null);
  const lastArgs = useRef<any[] | null>(null);

  const invoke = useCallback(() => {
    if (lastArgs.current) {
      fn(...lastArgs.current);
      lastArgs.current = null;
    }
    frame.current = null;
  }, [fn]);

  return useCallback((...args: any[]) => {
    lastArgs.current = args;
    if (frame.current === null) {
      frame.current = window.requestAnimationFrame(invoke);
    }
  }, [invoke]);
};

export default useRafThrottle;
