import { useState, useEffect, useCallback } from "react";
import { DeviceDetector, getDeviceInfo } from "@/lib/device-detection";
import { useUnifiedNotifications } from "@/components/ui/unified-notification";

interface PerformanceSettings {
  reduceAnimations: boolean;
  lowerQuality: boolean;
  disableParticles: boolean;
  reducedEffects: boolean;
  lowEndMode: boolean;
  deviceCategory: 'high-end' | 'mid-range' | 'low-end';
}

export const usePerformanceOptimization = () => {
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    reduceAnimations: false,
    lowerQuality: false,
    disableParticles: false,
    reducedEffects: false,
    lowEndMode: false,
    deviceCategory: 'high-end'
  });
  
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const notifications = useUnifiedNotifications();

  // Initialize device detection and performance settings
  useEffect(() => {
    const initializePerformanceSettings = async () => {
      try {
        const info = await getDeviceInfo();
        setDeviceInfo(info);
        
        const settings: PerformanceSettings = {
          reduceAnimations: info.recommendations.reduceAnimations,
          lowerQuality: info.recommendations.lowerQuality,
          disableParticles: info.recommendations.disableParticles,
          reducedEffects: info.recommendations.reducedEffects,
          lowEndMode: info.capabilities.isLowEnd,
          deviceCategory: info.category
        };
        
        setPerformanceSettings(settings);
        
        // Show warning for low-end devices (only once per session)
        if (info.capabilities.isLowEnd && !hasShownWarning && !sessionStorage.getItem('lowEndWarningShown')) {
          showLowEndDeviceWarning(info);
          setHasShownWarning(true);
          sessionStorage.setItem('lowEndWarningShown', 'true');
        }
        
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    initializePerformanceSettings();
  }, [hasShownWarning]);

  // Inject performance CSS once and keep it available for toggling
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("kor-performance-css")) return;
    const style = document.createElement("style");
    style.id = "kor-performance-css";
    style.innerHTML = PERFORMANCE_CSS;
    document.head.appendChild(style);
    return () => {
      // keep style in DOM for subsequent mounts (no-op)
    };
  }, []);

  // (moved below to avoid referencing getPerformanceClasses before declaration)

  // Show warning notification for low-end devices
  const showLowEndDeviceWarning = useCallback((info: any) => {
    const deviceTypeText = info.capabilities.userAgent.toLowerCase().includes('chromebook') 
      ? 'Chromebook' 
      : info.capabilities.platform.toLowerCase().includes('android')
      ? 'Android device'
      : info.capabilities.platform.toLowerCase().includes('ios')
      ? 'iOS device'
      : 'device';

    // Use showWithAction for mobile (with action button) or show for desktop where available
    const n: any = notifications;
    if (typeof n.showWithAction === "function") {
      n.showWithAction(
        "Performance Notice",
        `We've detected you're using a ${deviceTypeText} with limited resources. Some animations may appear slower than intended. You can disable effects in settings if needed.`,
        "Got it",
        () => {},
        "warning"
      );
    } else if (typeof n.show === "function") {
      // For desktop floating notifications
      n.show({
        title: "Performance Notice",
        description: `We've detected you're using a ${deviceTypeText} with limited resources. Some animations may appear slower than intended.`,
        type: "warning",
        duration: 8000,
      });
    } else {
      // Fallback to basic warning
      n.showWarning?.(
        "Performance Notice",
        `We've detected you're using a ${deviceTypeText} with limited resources. Some animations may appear slower than intended.`,
        8000,
      );
    }
  }, [notifications]);

  // Toggle performance mode manually
  const togglePerformanceMode = useCallback((enabled: boolean) => {
    setPerformanceSettings(prev => ({
      ...prev,
      lowEndMode: enabled,
      reduceAnimations: enabled,
      disableParticles: enabled,
      reducedEffects: enabled
    }));
  }, []);

  // Get CSS classes for performance optimization
  const getPerformanceClasses = useCallback(() => {
    const classes: string[] = [];
    
    if (performanceSettings.reduceAnimations) {
      classes.push('reduce-motion');
    }
    
    if (performanceSettings.lowEndMode) {
      classes.push('low-end-mode');
    }
    
    if (performanceSettings.reducedEffects) {
      classes.push('reduced-effects');
    }
    
    return classes.join(' ');
  }, [performanceSettings]);

  // Check if an animation should run
  const shouldRunAnimation = useCallback((priority: 'low' | 'medium' | 'high' = 'medium') => {
    if (performanceSettings.reduceAnimations) {
      return priority === 'high';
    }
    
    if (performanceSettings.reducedEffects && priority === 'low') {
      return false;
    }
    
    return true;
  }, [performanceSettings]);

  // Check if particles should be rendered
  const shouldRenderParticles = useCallback(() => {
    return !performanceSettings.disableParticles;
  }, [performanceSettings]);

  // Get animation duration multiplier
  const getAnimationDuration = useCallback((baseDuration: number) => {
    if (performanceSettings.reduceAnimations) {
      return baseDuration * 0.5; // 50% faster
    }
    
    if (performanceSettings.lowEndMode) {
      return baseDuration * 0.7; // 30% faster
    }
    
    return baseDuration;
  }, [performanceSettings]);

  // Get quality settings for images/effects
  const getQualitySettings = useCallback(() => {
    return {
      imageQuality: performanceSettings.lowerQuality ? 0.7 : 1.0,
      blurRadius: performanceSettings.reducedEffects ? 2 : 4,
      shadowIntensity: performanceSettings.reducedEffects ? 0.5 : 1.0,
      particleCount: performanceSettings.disableParticles ? 0 : performanceSettings.reducedEffects ? 0.5 : 1.0
    };
  }, [performanceSettings]);

  // Toggle performance classes on the document body when settings change
  useEffect(() => {
    if (typeof document === "undefined") return;
    const classes = getPerformanceClasses();
    // Remove any known performance classes first
    document.body.classList.remove("reduce-motion", "low-end-mode", "reduced-effects");
    if (classes) {
      classes.split(" ").forEach((c) => {
        if (c) document.body.classList.add(c);
      });
    }
  }, [getPerformanceClasses]);

  return {
    performanceSettings,
    deviceInfo,
    isLoading,
    togglePerformanceMode,
    getPerformanceClasses,
    shouldRunAnimation,
    shouldRenderParticles,
    getAnimationDuration,
    getQualitySettings,
    isLowEndDevice: performanceSettings.lowEndMode,
    deviceCategory: performanceSettings.deviceCategory
  };
};

// CSS classes that can be used for performance optimization
export const PERFORMANCE_CSS = `
.reduce-motion * {
  animation-duration: 0.3s !important;
  animation-delay: 0s !important;
  transition-duration: 0.2s !important;
}

.low-end-mode {
  --blur-intensity: 2px;
  --shadow-intensity: 0.3;
  --glow-intensity: 0.5;
}

.low-end-mode .gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}

.reduced-effects .backdrop-blur-lg {
  backdrop-filter: blur(4px) !important;
}

.reduced-effects .backdrop-blur-xl {
  backdrop-filter: blur(6px) !important;
}

.reduced-effects [class*="animate-"] {
  animation-iteration-count: 1 !important;
}

.reduced-effects [class*="shadow-glow"] {
  box-shadow: none !important;
}

/* Hide complex animations on low-end devices */
.low-end-mode .complex-animation {
  display: none !important;
}

.low-end-mode .particle-system {
  display: none !important;
}

/* Optimize transforms */
.performance-optimized {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

/* While the user is actively scrolling, reduce heavy paint work to keep scrolling smooth */
.is-scrolling .gpu-accelerated,
.is-scrolling [class*="particle"],
.is-scrolling [style*="filter:"] {
  animation-play-state: paused !important;
  transition: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  box-shadow: none !important;
  will-change: auto !important;
}

.is-scrolling .complex-animation {
  display: none !important;
}
`;
