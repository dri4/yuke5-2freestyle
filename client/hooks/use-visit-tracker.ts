import { useEffect } from 'react';
import { useDeviceType } from './use-device-type';

export function useVisitTracker(path = window.location.pathname) {
  // No-op in the client by default. Visit tracking is now performed server-side
  // via middleware. If you need to manually report additional client-side data,
  // call `reportVisit` which will POST to a configurable endpoint.

  const reportVisit = async (extra: Record<string, any> = {}) => {
    try {
      const payload = {
        path,
        screen: { width: window.innerWidth, height: window.innerHeight },
        referrer: document.referrer || null,
        language: navigator.language,
        timestamp: Date.now(),
        ...extra,
      };

      // Optional endpoint - disabled by default to avoid duplicate tracking
      const endpoint = (window as any).__REPORT_VISIT_ENDPOINT__ || null;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // ignore errors
    }
  };

  return { reportVisit };
}