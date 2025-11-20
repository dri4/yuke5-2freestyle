import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

// Breakpoints aligned with Tailwind CSS
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px
const MOBILE_MAX = 640;
const TABLET_MAX = 1023; // Just below lg breakpoint (1024px)

export function useDeviceType(): DeviceType {
  // Initialize with correct device type to prevent initial mismatch
  const getInitialDeviceType = (): DeviceType => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width <= MOBILE_MAX) return "mobile";
    if (width <= TABLET_MAX) return "tablet";
    return "desktop";
  };

  const [deviceType, setDeviceType] = useState<DeviceType>(
    getInitialDeviceType(),
  );

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;

      if (width <= MOBILE_MAX) {
        setDeviceType("mobile");
      } else if (width <= TABLET_MAX) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    // Check on mount
    checkDeviceType();

    // Listen for resize events
    const handleResize = () => {
      checkDeviceType();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}

export function useIsMobileOrTablet(): boolean {
  const deviceType = useDeviceType();
  return deviceType === "mobile" || deviceType === "tablet";
}
