import { useCallback, useRef, useState } from "react";

export interface SpamProtectionOptions {
  /** Cooldown period in milliseconds (default: 300ms) */
  cooldown?: number;
  /** Debounce delay in milliseconds (default: 0 - no debouncing) */
  debounce?: number;
  /** Whether to disable button during cooldown (default: false) */
  disableDuringCooldown?: boolean;
}

export function useSpamProtection(
  callback: (...args: any[]) => void | Promise<void>,
  options: SpamProtectionOptions = {},
) {
  const {
    cooldown = 300,
    debounce = 0,
    disableDuringCooldown = false,
  } = options;

  const [isDisabled, setIsDisabled] = useState(false);
  const lastCallTime = useRef<number>(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isExecuting = useRef(false);

  const protectedCallback = useCallback(
    async (...args: any[]) => {
      const now = Date.now();

      // Check if we're in cooldown period
      if (now - lastCallTime.current < cooldown) {
        return;
      }

      // Clear any existing debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // If debouncing is enabled, delay execution
      if (debounce > 0) {
        debounceTimer.current = setTimeout(async () => {
          await executeCallback(args);
        }, debounce);
      } else {
        await executeCallback(args);
      }

      async function executeCallback(args: any[]) {
        // Prevent concurrent executions
        if (isExecuting.current) {
          return;
        }

        isExecuting.current = true;
        lastCallTime.current = Date.now();

        if (disableDuringCooldown) {
          setIsDisabled(true);
        }

        try {
          await callback(...args);
        } catch (error) {
          console.error("Protected callback error:", error);
        } finally {
          isExecuting.current = false;

          if (disableDuringCooldown) {
            // Re-enable after cooldown
            setTimeout(() => {
              setIsDisabled(false);
            }, cooldown);
          }
        }
      }
    },
    [callback, cooldown, debounce, disableDuringCooldown],
  );

  return {
    protectedCallback,
    isDisabled,
    /** Manually reset the protection state */
    reset: () => {
      lastCallTime.current = 0;
      isExecuting.current = false;
      setIsDisabled(false);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    },
  };
}

// Preset configurations for different button types
export const SPAM_PROTECTION_PRESETS = {
  // Fast interactions (theme toggles, navigation)
  fast: { cooldown: 200, debounce: 0 },

  // Standard interactions (menu items, form buttons)
  standard: { cooldown: 300, debounce: 50 },

  // Heavy operations (API calls, navigation)
  heavy: { cooldown: 500, debounce: 100, disableDuringCooldown: true },

  // Critical actions (submit forms, external links)
  critical: { cooldown: 1000, debounce: 200, disableDuringCooldown: true },
} as const;
