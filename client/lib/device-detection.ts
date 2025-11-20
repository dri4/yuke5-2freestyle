export interface DeviceCapabilities {
  isLowEnd: boolean;
  memoryGB: number;
  cores: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  connectionType: string;
  effectiveType: string;
  platform: string;
  userAgent: string;
}

export interface PerformanceMetrics {
  renderTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  devicePixelRatio: number;
}

/**
 * Detects if the current device is likely a low-end device
 * Based on hardware specs, network conditions, and performance metrics
 */
export class DeviceDetector {
  private static instance: DeviceDetector;
  private capabilities: DeviceCapabilities | null = null;
  private performanceMetrics: PerformanceMetrics | null = null;

  static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector();
    }
    return DeviceDetector.instance;
  }

  /**
   * Gets device capabilities and performance metrics
   */
  async getDeviceCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    // Get hardware information
    const navigator = window.navigator as any;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    // Memory detection (approximate)
    const deviceMemory = navigator.deviceMemory || this.estimateMemory();
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    
    // Platform and user agent analysis
    const platform = navigator.platform || '';
    const userAgent = navigator.userAgent || '';
    
    // Connection info
    const connectionType = connection?.type || 'unknown';
    const effectiveType = connection?.effectiveType || 'unknown';
    
    // Calculate if device is low-end
    const isLowEnd = this.calculateIsLowEnd({
      deviceMemory,
      hardwareConcurrency,
      platform,
      userAgent,
      connectionType,
      effectiveType
    });

    this.capabilities = {
      isLowEnd,
      memoryGB: deviceMemory,
      cores: hardwareConcurrency,
      deviceMemory,
      hardwareConcurrency,
      connectionType,
      effectiveType,
      platform,
      userAgent
    };

    return this.capabilities;
  }

  /**
   * Gets performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.performanceMetrics) {
      return this.performanceMetrics;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const firstPaint = paint.find(p => p.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    
    this.performanceMetrics = {
      renderTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0,
      firstPaint,
      firstContentfulPaint,
      devicePixelRatio: window.devicePixelRatio || 1
    };

    return this.performanceMetrics;
  }

  /**
   * Estimates memory when navigator.deviceMemory is not available
   */
  private estimateMemory(): number {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Chromebook detection
    if (userAgent.includes('chromebook') || userAgent.includes('cros')) {
      return 4; // Most Chromebooks have 4GB or less
    }
    
    // Mobile device detection
    if (/mobile|android|ios|iphone|ipad/.test(userAgent)) {
      return 3; // Assume mobile devices have limited memory
    }
    
    // Old browser versions
    if (userAgent.includes('chrome/') && parseInt(userAgent.split('chrome/')[1]) < 80) {
      return 4; // Older Chrome versions
    }
    
    // Default assumption for unknown devices
    return 8;
  }

  /**
   * Calculates if device is low-end based on multiple factors
   */
  private calculateIsLowEnd(specs: {
    deviceMemory: number;
    hardwareConcurrency: number;
    platform: string;
    userAgent: string;
    connectionType: string;
    effectiveType: string;
  }): boolean {
    let lowEndScore = 0;

    // Memory score (most important factor)
    if (specs.deviceMemory <= 2) lowEndScore += 4;
    else if (specs.deviceMemory <= 4) lowEndScore += 3;
    else if (specs.deviceMemory <= 6) lowEndScore += 1;

    // CPU cores score
    if (specs.hardwareConcurrency <= 2) lowEndScore += 2;
    else if (specs.hardwareConcurrency <= 4) lowEndScore += 1;

    // Platform/device specific checks
    const userAgent = specs.userAgent.toLowerCase();
    const platform = specs.platform.toLowerCase();

    // Chromebook detection (usually low-end)
    if (userAgent.includes('chromebook') || userAgent.includes('cros') || platform.includes('cros')) {
      lowEndScore += 3;
    }

    // Mobile device detection
    if (/mobile|android|ios|iphone|ipad/.test(userAgent)) {
      lowEndScore += 1;
    }

    // Older browser versions
    if (userAgent.includes('chrome/')) {
      const chromeVersion = parseInt(userAgent.split('chrome/')[1]);
      if (chromeVersion < 80) lowEndScore += 2;
      else if (chromeVersion < 90) lowEndScore += 1;
    }

    // Connection quality
    if (specs.effectiveType === 'slow-2g' || specs.effectiveType === '2g') {
      lowEndScore += 2;
    } else if (specs.effectiveType === '3g') {
      lowEndScore += 1;
    }

    // Connection type
    if (specs.connectionType === 'cellular') {
      lowEndScore += 1;
    }

    // Performance metrics check (if available)
    if (this.performanceMetrics) {
      if (this.performanceMetrics.renderTime > 3000) lowEndScore += 2;
      else if (this.performanceMetrics.renderTime > 2000) lowEndScore += 1;
      
      if (this.performanceMetrics.firstContentfulPaint > 2000) lowEndScore += 1;
    }

    // Threshold: score >= 5 indicates low-end device
    return lowEndScore >= 5;
  }

  /**
   * Gets a human-readable device category
   */
  getDeviceCategory(capabilities: DeviceCapabilities): 'high-end' | 'mid-range' | 'low-end' {
    if (capabilities.isLowEnd) return 'low-end';
    if (capabilities.deviceMemory <= 8 && capabilities.hardwareConcurrency <= 4) return 'mid-range';
    return 'high-end';
  }

  /**
   * Gets optimization recommendations for the device
   */
  getOptimizationRecommendations(capabilities: DeviceCapabilities): {
    reduceAnimations: boolean;
    lowerQuality: boolean;
    disableParticles: boolean;
    reducedEffects: boolean;
    prefersReducedMotion: boolean;
  } {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    return {
      reduceAnimations: capabilities.isLowEnd || prefersReducedMotion,
      lowerQuality: capabilities.deviceMemory <= 4,
      disableParticles: capabilities.isLowEnd,
      reducedEffects: capabilities.isLowEnd || capabilities.deviceMemory <= 6,
      prefersReducedMotion
    };
  }
}

/**
 * Convenience function to quickly check if device is low-end
 */
export async function isLowEndDevice(): Promise<boolean> {
  const detector = DeviceDetector.getInstance();
  const capabilities = await detector.getDeviceCapabilities();
  return capabilities.isLowEnd;
}

/**
 * Convenience function to get device info
 */
export async function getDeviceInfo() {
  const detector = DeviceDetector.getInstance();
  const capabilities = await detector.getDeviceCapabilities();
  const performanceMetrics = detector.getPerformanceMetrics();
  const category = detector.getDeviceCategory(capabilities);
  const recommendations = detector.getOptimizationRecommendations(capabilities);

  return {
    capabilities,
    performanceMetrics,
    category,
    recommendations
  };
}
