import { useState, useEffect } from "react";

export interface BrowserInfo {
  isSafari: boolean;
  isIOS: boolean;
  isMobileSafari: boolean;
  userAgent: string;
}

export function useBrowserDetection(): BrowserInfo {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isSafari: false,
    isIOS: false,
    isMobileSafari: false,
    userAgent: "",
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isMobileSafari = isSafari && isIOS;

    setBrowserInfo({
      isSafari,
      isIOS,
      isMobileSafari,
      userAgent,
    });
  }, []);

  return browserInfo;
}
