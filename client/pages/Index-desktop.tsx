import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useReducedMotion,
} from "framer-motion";
import { useRafThrottle } from "../hooks/use-raf-throttle";
// import { RetroToggle } from "../components/ui/retro-toggle";
import { SimpleViewToggle } from "../components/ui/simple-view-toggle";
import { useTheme } from "../hooks/use-theme";
import { useRetroMode } from "../hooks/use-retro-mode";
import { useUnifiedNotifications } from "../components/ui/unified-notification";
import { useBrowserDetection } from "../hooks/use-browser-detection";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Send,
  Star,
  Code,
  Palette,
  Zap,
  Smartphone,
  Globe,
  Users,
  Shield,
  Cloud,
  Database,
  HelpCircle,
  X,
} from "lucide-react";
import {
  useSpamProtection,
  SPAM_PROTECTION_PRESETS,
} from "../hooks/use-spam-protection";
import { useHelpModal } from "../hooks/use-help-modal.tsx";
import { usePerformanceOptimization } from "../hooks/use-performance-optimization";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Section data (module scope so helper components can reference it)
const sections = [
  { id: "home", title: "Home", component: "home" },
  { id: "about", title: "About Us", component: "about" },
  { id: "what-we-do", title: "Our Process", component: "what-we-do" },
  { id: "services", title: "Services", component: "services" },
  { id: "portfolio", title: "Portfolio", component: "portfolio" },
  { id: "pricing", title: "Pricing", component: "pricing" },
  { id: "contact", title: "Contact Us", component: "contact" },
];

const getSectionIndex = (idOrTitle: string) =>
  sections.findIndex((s) => s.id === idOrTitle || s.title === idOrTitle);

export default function Index() {
  const { theme, setTheme } = useTheme();
  const { mode, toggleMode } = useRetroMode();
  const isPinkActive = false;
  const { showSuccess, showError, showWarning, showInfo } =
    useUnifiedNotifications();
  const { isSafari, isMobileSafari, isIOS } = useBrowserDetection();

  // Performance optimizations and device detection
  const {
    performanceSettings,
    getPerformanceClasses,
    shouldRunAnimation,
    shouldRenderParticles,
    getAnimationDuration,
    isLowEndDevice,
    deviceCategory,
  } = usePerformanceOptimization();

  // Motion preferences
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [badgeMousePosition, setBadgeMousePosition] = useState({
    x: 0,
    y: 0,
    isNear: false,
  });
  const [isLoaded, setIsLoaded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [animationStep, setAnimationStep] = useState(6); // Skip to complete state

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previousMode, setPreviousMode] = useState(mode);
  const { isHelpModalOpen, setIsHelpModalOpen } = useHelpModal();
  const [showNavigationHints, setShowNavigationHints] = useState(true);
  const [initialLoadingComplete, setInitialLoadingComplete] = useState(false);
  const [hasInteractedWithHelp, setHasInteractedWithHelp] = useState(false);
  const hasShownWelcomeRef = useRef(false);

  // Result Modal state
  const [showResultModal, setShowResultModal] = useState<{
    open: boolean;
    success: boolean;
    message?: string | null;
  }>({ open: false, success: false, message: null });

  // Navbar state
  const [navbarMousePosition, setNavbarMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [isNavbarHovered, setIsNavbarHovered] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  const badgeRef = useRef<HTMLDivElement>(null);

  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // On smaller viewports (mobile/tablet) use a stacked flow so users can
  // naturally scroll between sections. Desktop keeps the single-section view.
  const [initialDeepLink, setInitialDeepLink] = useState(false);
  const [isStackedFlow, setIsStackedFlow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 991 : false,
  );

  // Keep stacked flow active during initial deep-link loads so content above/below
  // is available for natural scrolling. We'll clear this flag once the user
  // performs a navigation action.

  const [isScrollingActive, setIsScrollingActive] = useState(false);

  // Black transition animation state
  const [isBlackTransition, setIsBlackTransition] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [transitioningSectionIndex, setTransitioningSectionIndex] = useState(0);

  // Welcome notification removed
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "Type 'help' to see list of available commands.",
  ]);
  const [systemStats, setSystemStats] = useState({
    networkUp: 1.2,
    networkDown: 847,
  });

  // Optimized Framer Motion animation variants for 60fps
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.15,
        delayChildren: 0.05,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const fadeInScale = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const slideInFromSide = (direction: "left" | "right") => ({
    hidden: {
      opacity: 0,
      x: direction === "left" ? -60 : 60,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  });

  const staggeredLetters = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const triggerLoadingSequence = () => {
    setIsLoading(true);
    setIsLoaded(false);
    setAnimationStep(0);

    // YouTube intro-style animation sequence - more dynamic and professional
    const animationSequence = [
      { delay: 200, step: 1 }, // Particles and background elements burst in
      { delay: 600, step: 2 }, // Central orb explodes into view with energy rings
      { delay: 1000, step: 3 }, // Text slides in with shine effects
      { delay: 1400, step: 4 }, // Buttons cascade in with bounce
      { delay: 1800, step: 5 }, // Navigation elements slide in
      { delay: 2200, step: 6 }, // Final polish - everything locks into place
    ];

    const timeouts = animationSequence.map(({ delay, step }) =>
      setTimeout(() => {
        setAnimationStep(step);
        if (step === 6) {
          setIsLoading(false);
          setTimeout(() => setIsLoaded(true), 300);
        }
      }, delay),
    );

    return timeouts;
  };

  // Optimized loading sequence for better performance
  const triggerOptimizedLoadingSequence = () => {
    setIsLoading(true);
    setIsLoaded(false);
    setAnimationStep(0);

    // Faster, optimized animation sequence with smoother transitions
    const optimizedSequence = [
      { delay: 100, step: 1 }, // Background elements (faster)
      { delay: 300, step: 2 }, // Central elements
      { delay: 500, step: 3 }, // Text animations
      { delay: 700, step: 4 }, // Buttons with smooth scaling
      { delay: 900, step: 5 }, // Navigation elements
      { delay: 1100, step: 6 }, // Final state
    ];

    const timeouts = optimizedSequence.map(({ delay, step }) =>
      setTimeout(() => {
        setAnimationStep(step);
        if (step === 6) {
          setIsLoading(false);
          setTimeout(() => setIsLoaded(true), 200); // Faster completion
        }
      }, delay),
    );

    return timeouts;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Disabled mouse tracking to prevent twinkling effects
      // setMousePosition({
      //   x: e.clientX / window.innerWidth,
      //   y: e.clientY / window.innerHeight,
      // });
    };

    // Commented out to disable mouse tracking
    // window.addEventListener("mousemove", handleMouseMove);

    // Always start at the top of the page
    window.scrollTo(0, 0);

    return () => {
      // Commented out since we disabled the event listener
      // window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Trigger loading animation when switching to retro mode
  useEffect(() => {
    if (previousMode !== mode) {
      setPreviousMode(mode);
      // Only trigger loading for retro mode
      if (mode === "retro" && previousMode !== null) {
        triggerLoadingSequence();
      }
    }
  }, [mode, previousMode]);

  // Dynamic network stats updates
  useEffect(() => {
    const updateStats = () => {
      setSystemStats({
        networkUp: Math.round((Math.random() * 0.8 + 0.8) * 10) / 10, // 0.8-1.6 GB/s
        networkDown: Math.floor(Math.random() * 300) + 700, // 700-1000 MB/s
      });
    };

    const interval = setInterval(updateStats, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const rawBadgeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disabled: avoid changing any visual properties based on mouse movement
    // (keeps particles/background static regardless of cursor motion)
    return;
  };

  const handleBadgeMouseMove = useRafThrottle(rawBadgeMouseMove);

  const handleBadgeMouseLeave = () => {
    // Keep static on mouse leave
    // setBadgeMousePosition({ x: 0, y: 0, isNear: false });
  };

  // Navbar mouse tracking handlers
  const rawNavbarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disabled: intentionally do not capture navbar mouse position so
    // background/particle effects don't react to cursor movement.
    return;
  };

  const handleNavbarMouseMove = useRafThrottle(rawNavbarMouseMove);

  const handleNavbarMouseEnter = () => {
    setIsNavbarHovered(true);
  };

  const handleNavbarMouseLeave = () => {
    setIsNavbarHovered(false);
  };

  // Central orb mouse handling (throttled & low-sensitivity to avoid violent motion)
  const rawOrbMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLElement;
    if (!target) return;
    // Disabled orbital parallax: don't change transform on mouse move
    return;
  };

  const handleOrbMouseMove = useRafThrottle(rawOrbMouseMove);

  const handleOrbMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLElement;
    if (!target) return;
    target.style.transform = "translate3d(0px, 0px, 0) scale(1)";
  };

  // ========================================
  // SHINE ANIMATION CONFIGURATION
  // ========================================
  const SHINE_CONFIG = {
    direction: "right-to-left", // 'left-to-right' or 'right-to-left'
    duration: "4s", // Animation duration - slower consistent shine
    delay: "1s", // Initial delay
    interval: "8s", // Time between shine sweeps (total cycle time)
    intensity: 0.9, // Brightness of the shine (0-1)
    width: 30, // Width of the shine effect (percentage)
    showSparkles: true, // Enable/disable sparkles
    sparkleCount: 7, // Precise positioning like Figma design
  };

  // ...existing code...

  // Add debouncing for navigation
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNavigationTime = useRef(0);

  // Scroll to section function with black transition
  const scrollToSection = (index: number) => {
    // Prevent rapid successive calls
    const now = Date.now();
    if (now - lastNavigationTime.current < 100) return; // 100ms debounce

    if (isScrolling || !containerRef.current) return;

    // Clear any pending navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    lastNavigationTime.current = now;
    setIsScrolling(true);
    setIsScrollingActive(true);
    setTransitioningSectionIndex(index);

    // Enhanced timing for desktop vs mobile
    const isDesktopTransition = window.innerWidth > 1024;
    const fadeToBlackTime = isDesktopTransition ? 250 : 350; // Faster on desktop
    const contentRevealDelay = isDesktopTransition ? 50 : 100; // Faster on desktop
    const visibilityDelay = isDesktopTransition ? 100 : 150; // Faster on desktop
    const completionDelay = isDesktopTransition ? 600 : 900; // Faster on desktop

    // Start black transition animation
    setIsBlackTransition(true);
    setIsContentVisible(false);

    // Wait for fade to black, then change section
    setTimeout(() => {
      setCurrentSection(index);

      // Reset scroll position to top for non-home sections IMMEDIATELY
      if (index !== 0 && containerRef.current) {
        containerRef.current.scrollTop = 0;
        // Enhanced smooth reset for desktop
        if (isDesktopTransition) {
          containerRef.current.style.scrollBehavior = "auto";
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.style.scrollBehavior = "smooth";
            }
          }, 50);
        }
      }

      // Don't update URL anymore - we want a clean single-page experience

      const targetSection = sectionsRef.current[index];
      if (targetSection && containerRef.current) {
        // For desktop, perform a smooth, eased scroll to reduce choppiness
        if (isDesktopTransition) {
          const container = containerRef.current;
          const start = container.scrollTop;
          const rect = targetSection.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const targetTop = start + (rect.top - containerRect.top);

          // Easing helper
          const easeInOutCubic = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          const duration = 420; // ms - tuned for smooth desktop feel
          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = Math.min(1, (now - startTime) / duration);
            const eased = easeInOutCubic(elapsed);
            container.scrollTop = Math.round(
              start + (targetTop - start) * eased,
            );
            if (elapsed < 1) requestAnimationFrame(tick);
            else {
              // If this navigation was triggered from an initial deep-link
              // load, disable stacked flow now to resume cinematic single-
              // section behavior on desktop.

            }
          };

          requestAnimationFrame(tick);
        } else {
          // Mobile/tablet: instant scroll while black screen
          targetSection.scrollIntoView({ behavior: "auto", block: "start" });
        }
      }

      // If returning to home section (index 0), trigger loading animation
      if (index === 0) {
        triggerOptimizedLoadingSequence();
      }

      // Start revealing new content after a cinematic pause
      setTimeout(() => {
        setIsBlackTransition(false);

        // Delay content visibility for dramatic effect
        setTimeout(() => {
          setIsContentVisible(true);

          // Complete the transition
          navigationTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
            setIsScrollingActive(false);
            navigationTimeoutRef.current = null;
          }, completionDelay); // Responsive timing based on device
        }, visibilityDelay); // Responsive delay
      }, contentRevealDelay); // Responsive reveal delay
    }, fadeToBlackTime); // Responsive fade timing
  };

  // Enhanced spam protection for scroll navigation
  const { protectedCallback: protectedScrollToSection } = useSpamProtection(
    scrollToSection,
    SPAM_PROTECTION_PRESETS.standard,
  );

  // Spam protection for external links
  const { protectedCallback: protectedOpenLink } = useSpamProtection(
    (url: string) => {
      window.open(url, "_blank");
    },
    SPAM_PROTECTION_PRESETS.critical,
  );

  // Spam protection for help modal
  const { protectedCallback: protectedToggleHelpModal } = useSpamProtection(
    (isOpen: boolean) => setIsHelpModalOpen(isOpen),
    SPAM_PROTECTION_PRESETS.fast,
  );

  // Spam protection for form interactions
  const { protectedCallback: protectedFormInteraction } = useSpamProtection(
    (callback: () => void) => callback(),
    SPAM_PROTECTION_PRESETS.standard,
  );

  // Desktop scroll optimization variables
  const scrollAccumulator = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const scrollMomentum = useRef(0);
  const isDesktop = useRef(window.innerWidth > 1024);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll progress for visual indicators
  useEffect(() => {
    const updateScrollProgress = () => {
      if (containerRef.current && currentSection > 0) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const progress = scrollTop / Math.max(scrollHeight - clientHeight, 1);
        setScrollProgress(progress * 100);
      }
    };

    const container = containerRef.current;
    if (container && currentSection > 0) {
      container.addEventListener("scroll", updateScrollProgress, {
        passive: true,
      });
      return () =>
        container.removeEventListener("scroll", updateScrollProgress);
    }
  }, [currentSection]);

  // Reduce heavy painting during active scrolls by toggling a short-lived body class
  useEffect(() => {
    let ticking = false;
    let scrollTimer: number | undefined;

    const setScrolling = (isScrolling: boolean) => {
      if (typeof document === "undefined") return;
      if (isScrolling) {
        document.body.classList.add("is-scrolling");
      } else {
        document.body.classList.remove("is-scrolling");
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolling(true);
          ticking = false;
        });
        ticking = true;
      }

      // Debounce removing the class shortly after scrolling stops
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        setScrolling(false);
      }, 180); // 180ms after the last scroll event
    };

    const container = containerRef.current || window;
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (scrollTimer) window.clearTimeout(scrollTimer);
      setScrolling(false);
    };
  }, []);

  // Disabled automatic scroll transitions - now using navigation buttons only
  useEffect(() => {
    // Update desktop detection on resize
    const updateIsDesktop = () => {
      isDesktop.current = window.innerWidth > 1024;
      setIsStackedFlow(window.innerWidth <= 991);
    };
    window.addEventListener("resize", updateIsDesktop);

    // No wheel event handler - allow natural scrolling within sections
    return () => {
      window.removeEventListener("resize", updateIsDesktop);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // Auto-dismiss navigation hints after 10 seconds
  useEffect(() => {
    if (showNavigationHints && currentSection > 0) {
      const timer = setTimeout(() => {
        setShowNavigationHints(false);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [showNavigationHints, currentSection]);

  // Track initial loading completion and automatically show help modal
  useEffect(() => {
    // Set initial loading as complete after all animations settle
    const timer = setTimeout(() => {
      setInitialLoadingComplete(true);
    }, 3000); // 3 seconds to allow for initial animations

    return () => clearTimeout(timer);
  }, []);

  // Automatically show help modal once initial loading is complete (first-time users only)
  useEffect(() => {
    if (initialLoadingComplete && !isHelpModalOpen && !hasInteractedWithHelp) {
      // Small delay to ensure user sees the page first
      const timer = setTimeout(() => {
        setIsHelpModalOpen(true);
      }, 1000); // 1 second after loading complete

      return () => clearTimeout(timer);
    }
  }, [initialLoadingComplete, isHelpModalOpen, hasInteractedWithHelp]);

  // Keyboard navigation for sections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling || mode === "retro") return;

      // Only trigger on specific key combinations to avoid interfering with normal usage
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "ArrowUp" && currentSection > 0) {
          e.preventDefault();
          scrollToSection(currentSection - 1);
          setShowNavigationHints(false); // Dismiss hints when user uses navigation
        } else if (
          e.key === "ArrowDown" &&
          currentSection < sections.length - 1
        ) {
          e.preventDefault();
          scrollToSection(currentSection + 1);
          setShowNavigationHints(false); // Dismiss hints when user uses navigation
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSection, isScrolling, sections.length, mode]);

  // Disabled touch scroll section transitions - allow natural scrolling within sections

  // Listen for scroll events from buttons
  useEffect(() => {
    const handleScrollToSection = (e: CustomEvent) => {
      scrollToSection(e.detail);
    };

    window.addEventListener(
      "scrollToSection",
      handleScrollToSection as EventListener,
    );
    return () => {
      window.removeEventListener(
        "scrollToSection",
        handleScrollToSection as EventListener,
      );
      // Cleanup navigation timeout on unmount
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // If retro mode is enabled, show retro version
  if (mode === "retro") {
    return (
      <div className="retro-container min-h-screen max-h-screen overflow-y-auto overflow-x-hidden">
        {/* Retro Loading Screen */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
              initial={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 1, ease: "easeInOut" },
              }}
            >
              {/* Matrix-style background - reduced for performance */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={`matrix-${i}`}
                    className="absolute text-green-400 font-mono text-xs opacity-20"
                    style={{
                      left: `${(i * 100) / 15}%`,
                      fontSize: "8px",
                      willChange: "transform",
                      backfaceVisibility: "hidden",
                    }}
                    animate={{
                      y: [-20, window.innerHeight + 20],
                    }}
                    transition={{
                      duration: 4 + (i % 2),
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "linear",
                    }}
                  >
                    {Array.from({ length: 20 }, () =>
                      String.fromCharCode(0x30a0 + Math.random() * 96),
                    ).join("\n")}
                  </motion.div>
                ))}
              </div>

              {/* Central loading area */}
              <div className="relative z-10 text-center">
                {/* Loading KOR text in ASCII style */}
                <div className="mb-8">
                  <motion.div
                    className="font-mono text-4xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl kor-text-large font-bold text-green-400"
                    style={{
                      textShadow: "0 0 10px #00ff41, 0 0 20px #00ff41",
                    }}
                  >
                    {/* K */}
                    <motion.span
                      className="inline-block"
                      initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                      animate={
                        animationStep >= 1
                          ? {
                              opacity: 1,
                              scale: 1,
                              rotateY: 0,
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                    >
                      K
                    </motion.span>

                    {/* o */}
                    <motion.span
                      className="inline-block"
                      initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                      animate={
                        animationStep >= 2
                          ? {
                              opacity: 1,
                              scale: 1,
                              rotateY: 0,
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                        delay: 0.1,
                      }}
                    >
                      o
                    </motion.span>

                    {/* r */}
                    <motion.span
                      className="inline-block"
                      initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                      animate={
                        animationStep >= 3
                          ? {
                              opacity: 1,
                              scale: 1,
                              rotateY: 0,
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                        delay: 0.2,
                      }}
                    >
                      r
                    </motion.span>
                  </motion.div>
                </div>

                {/* Loading subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={animationStep >= 3 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="font-mono text-sm md:text-lg text-amber-400"
                  style={{
                    textShadow: "0 0 5px #ffaa00",
                  }}
                >
                  INITIALIZING SYSTEMS...
                </motion.div>

                {/* Terminal loading indicator */}
                <motion.div
                  className="mt-8 flex justify-center items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <span className="text-green-400 font-mono text-sm">[</span>
                  {[...Array(10)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="text-green-400 font-mono text-sm"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    >
                      ...
                    </motion.span>
                  ))}
                  <span className="text-green-400 font-mono text-sm">]</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Retro Main Content - Only show after loading */}
        {!isLoading && (
          <>
            {/* Toggle Buttons Container - HIDDEN */}
            <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] pointer-events-auto hidden">
              <div className="group relative">
                {/* Container for existing toggles */}
                <div
                  className="rounded-xl sm:rounded-2xl border-2 backdrop-blur-2xl p-2 sm:p-4 border-green-300/30 bg-green-400/5"
                  style={{
                    background: `linear-gradient(135deg, rgba(0,255,65,0.1) 0%, rgba(0,255,65,0.05) 50%, transparent 100%)`,
                    boxShadow:
                      "0 0 25px rgba(0, 255, 65, 0.4), 0 0 50px rgba(0, 255, 65, 0.2)",
                  }}
                >
                  {/* Original Toggle Buttons */}
                  <div className="flex flex-col gap-2 sm:gap-3">
                    {/* <RetroToggle /> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="retro-main">
              {/* ASCII Logo */}
              <motion.div
                className="retro-logo-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 2 }}
              >
                {prefersReducedMotion || !shouldRunAnimation ? (
                  <pre
                    className="ascii-logo text-center mb-4 text-green-400 terminal-glow"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      letterSpacing: "0.05em",
                      lineHeight: "1",
                      fontSize: "1.2rem",
                    }}
                  >
                    {`KOR`}
                  </pre>
                ) : (
                  <motion.pre
                    className="ascii-logo text-center mb-4 text-green-400 terminal-glow"
                    variants={staggeredLetters}
                    initial="hidden"
                    animate={isLoaded ? "visible" : "hidden"}
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      letterSpacing: "0.05em",
                      lineHeight: "1",
                      fontSize: "1.2rem",
                    }}
                  >
                    <motion.span
                      className="inline-block"
                      variants={letterVariants}
                      aria-hidden={false}
                    >
                      K
                    </motion.span>
                    <motion.span
                      className="inline-block mx-1"
                      variants={letterVariants}
                      aria-hidden={false}
                    >
                      O
                    </motion.span>
                    <motion.span
                      className="inline-block"
                      variants={letterVariants}
                      aria-hidden={false}
                    >
                      R
                    </motion.span>
                  </motion.pre>
                )}
                <div className="retro-subtitle">RETRO SYSTEMS</div>
              </motion.div>

              {/* Terminal Window */}
              <motion.div
                className="terminal-window"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
              >
                <div className="terminal-header">
                  <span>TERMINAL</span>
                </div>
                <div className="terminal-content">
                  <div className="text-amber-400 font-bold mb-1">
                    <span className="text-gray-500">$</span> system-info
                    --status
                  </div>
                  <div className="text-amber-400 font-bold mb-3 mt-2">
                    SYSTEM STATUS:{" "}
                    <span className="text-green-400 terminal-glow">
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="terminal-line">
                    <span className="text-green-400">[ACTIVE]</span>&nbsp;CUSTOM
                    SOFTWARE SOLUTIONS
                  </div>
                  <div className="terminal-line">
                    <span className="text-green-400">[ACTIVE]</span>&nbsp;
                    <span className="text-cyan-400">
                      WEB APPLICATION DEVELOPMENT
                    </span>
                  </div>
                  <div className="terminal-line">
                    <span className="text-green-400">[ACTIVE]</span>&nbsp;AI/ML
                    INTEGRATION SERVICES
                  </div>
                  <div className="terminal-line mb-2">
                    <span className="text-green-400">[ACTIVE]</span>&nbsp;CLOUD
                    INFRASTRUCTURE DESIGN
                  </div>
                  <div className="terminal-line mb-2">
                    <span className="text-yellow-400">[PRIORITY]</span>&nbsp;
                    <span className="text-red-400 font-bold">
                      LEGACY SYSTEM MODERNIZATION
                    </span>
                  </div>
                  <div className="terminal-line mb-2">
                    <span className="text-green-400">[ACTIVE]</span>&nbsp;
                    <span className="text-purple-400">
                      ENTERPRISE AUTOMATION
                    </span>
                  </div>

                  <div className="terminal-line mb-4">
                    <span className="text-green-400 blink">█</span>
                  </div>
                  <div className="memory-section">
                    <div className="text-xs mb-2 text-cyan-400">
                      SYSTEM RESOURCES:
                    </div>
                    <div
                      className="text-xs text-green-400 mb-1"
                      style={{ lineHeight: "1.2", fontFamily: "monospace" }}
                    >
                      CPU: ██��███████░░ 60%
                    </div>
                    <div
                      className="text-xs text-amber-400 mb-1"
                      style={{ lineHeight: "1.2", fontFamily: "monospace" }}
                    >
                      RAM: ██���█████░░ 50%
                    </div>
                    <div className="text-xs text-green-400 mt-1">
                      NETWORK: {systemStats.networkUp}GB/s ↑ |{" "}
                      {systemStats.networkDown}MB/s ↓
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Navigation Buttons */}
              <motion.div
                className="button-grid-single"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
              >
                <button
                  className="pixel-button button-120hz performance-optimized"
                  onClick={() => setShowTerminal(true)}
                >
                  TERMINAL
                </button>
              </motion.div>

              {/* Social Media Buttons */}
              <motion.div
                className="social-button-grid"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
              >
                <button
                  className="pixel-button social-button button-120hz performance-optimized"
                  onClick={() =>
                    protectedOpenLink("https://instagram.com/kor_services")
                  }
                >
                  INSTAGRAM
                </button>
                <button
                  className="pixel-button social-button button-120hz performance-optimized"
                  onClick={() =>
                    protectedOpenLink(
                      "https://discord.com/users/1111172734416850974",
                    )
                  }
                >
                  DISCORD
                </button>
                {/* TELEGRAM - Hidden for future use */}
                <button
                  className="pixel-button social-button button-120hz performance-optimized"
                  style={{ display: 'none' }}
                  onClick={() => protectedOpenLink("https://telegram.org")}
                >
                  TELEGRAM
                </button>
              </motion.div>

              {/* Status Bar */}
              <motion.div
                className="status-bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 1 }}
              >
                <div className="status-indicators">
                  <span className="status-dot text-red-400">●</span>
                  <span>READY</span>
                  <span className="status-dot text-amber-400">����</span>
                  <span>CONNECTED</span>
                  <span className="status-dot text-green-400 terminal-glow">
                    ●
                  </span>
                  <span>ONLINE</span>
                </div>

                <div className="continue-prompt">
                  <span className="text-cyan-400">[SYSTEM READY]</span>
                  <span className="text-green-400 ml-4">◆◆◆</span>
                </div>

                <div className="loading-indicators">
                  <span>█▒░</span>
                  <span className="text-amber-400">PROCESSING...</span>
                  <span>░▒█</span>
                </div>
              </motion.div>

              {/* Dimmed Background Overlay */}
              {showTerminal && (
                <motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setShowTerminal(false)}
                />
              )}

              {/* Interactive Terminal */}
              {showTerminal && (
                <motion.div
                  className="interactive-terminal"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="terminal-header">
                    <span>TERMINAL</span>
                    <button
                      className="close-terminal"
                      onClick={() => setShowTerminal(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="terminal-body">
                    <div className="terminal-output">
                      {terminalOutput.map((line, index) => (
                        <div key={index} className="terminal-line">
                          {line.startsWith(">") ? (
                            <>
                              <span className="prompt">&gt;</span>
                              <span className="command">{line.slice(1)}</span>
                            </>
                          ) : (
                            <span className="output">{line}</span>
                          )}
                        </div>
                      ))}
                      <div className="terminal-input-line">
                        <span className="prompt">&gt;</span>
                        <input
                          type="text"
                          className="terminal-input"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const command = terminalInput
                                .trim()
                                .toLowerCase();
                              const newOutput = [
                                ...terminalOutput,
                                `>${terminalInput}`,
                              ];

                              if (command === "help") {
                                newOutput.push("");
                                newOutput.push(
                                  "Switch back to the main website theme to explore",
                                );
                                newOutput.push(
                                  "my projects, services, and portfolio.",
                                );
                                newOutput.push(
                                  "Type 'help' to see list of available commands.",
                                );
                                newOutput.push("");
                              } else if (command === "clear") {
                                setTerminalOutput([
                                  "Type 'help' to see list of available commands.",
                                ]);
                                setTerminalInput("");
                                return;
                              } else if (command !== "") {
                                newOutput.push(
                                  `Command '${command}' not found.`,
                                );
                                newOutput.push("");
                                newOutput.push(
                                  "Type 'help' to see list of available commands.",
                                );
                              }
                              setTerminalOutput(newOutput);
                              setTerminalInput("");
                            }
                          }}
                          placeholder="Type command..."
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="retro-footer">
              <div className="text-green-400">
                COPYRIGHT (C) 2024 KOR SYSTEMS - ALL RIGHTS RESERVED
              </div>
              <div className="text-amber-400">
                TERMINAL EMULATION MODE - PHOSPHOR DISPLAY ACTIVE
              </div>
              <div className="text-red-400 blink">
                WARNING: RETRO MODE ENGAGED
              </div>
            </div>

            {/* Retro Styles */}
            <style>{`
          .retro-container {
            background: #0a0a0a;
            color: #00ff41;
            font-family: "JetBrains Mono", "Fira Code", monospace;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: unset;
            position: relative;
            border: 4px solid #00ff41;
            margin: 8px;
            box-shadow:
              inset 0 0 50px rgba(0, 255, 65, 0.1),
              0 0 50px rgba(0, 255, 65, 0.3);
            height: calc(100vh - 16px);
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
          }

          .retro-container::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 65, 0.03) 2px,
              rgba(0, 255, 65, 0.03) 4px
            );
            pointer-events: none;
            animation: scanlines 0.2s linear infinite;
            will-change: transform;
            transform: translateZ(0);
            z-index: 100;
          }

          @keyframes scanlines {
            0% {
              transform: translateY(0px);
            }
            100% {
              transform: translateY(4px);
            }
          }

          .retro-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 2px solid #00ff41;
            background: #0a0a0a;
            position: relative;
            z-index: 110;
          }

          .pixel-dot {
            width: 12px;
            height: 12px;
            border-radius: 0;
          }

          .retro-main {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            min-height: calc(100vh - 160px);
            padding: 32px;
            position: relative;
            z-index: 105;
            padding-bottom: 100px;
          }

          .retro-logo-container {
            text-align: center;
            margin-bottom: 32px;
          }

          .ascii-logo {
            font-family: "JetBrains Mono", "Courier New", monospace;
            font-weight: 700;
            font-size: clamp(8px, 2.5vw, 18px);
            line-height: 1;
            color: #00ff41;
            text-shadow:
              0 0 8px #00ff41,
              0 0 15px #00ff41;
            margin: 0;
            white-space: pre;
            letter-spacing: 1px;
            position: relative;
          }

          .ascii-logo::after {
            content: "█";
            color: #00ff41;
            animation: terminal-cursor 1s infinite;
            margin-left: 8px;
          }

          @keyframes terminal-cursor {
            0%,
            50% {
              opacity: 1;
            }
            51%,
            100% {
              opacity: 0;
            }
          }

          .retro-subtitle {
            color: #ffaa00;
            font-size: clamp(12px, 3vw, 18px);
            font-weight: bold;
            margin-top: 12px;
            text-shadow:
              0 0 10px #ffaa00,
              0 0 20px #ffaa00,
              0 0 30px #ffaa00;
            letter-spacing: 2px;
          }

          .terminal-window {
            background: #0a0a0a;
            border: 2px solid #00ff41;
            width: 100%;
            max-width: 600px;
            margin-bottom: 32px;
            box-shadow:
              0 0 20px rgba(0, 255, 65, 0.3),
              inset 0 0 20px rgba(0, 255, 65, 0.1);
            position: relative;
            z-index: 106;
          }

          .terminal-header {
            background: #00ff41;
            color: #0a0a0a;
            padding: 6px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: 12px;
          }

          .terminal-content {
            padding: 16px;
            font-size: 14px;
            line-height: 1.4;
          }

          .terminal-line {
            margin-bottom: 4px;
            display: flex;
            align-items: center;
          }

          .prompt {
            color: #00ff41;
            font-weight: bold;
            margin-right: 8px;
          }

          .cursor-text {
            color: #00ff41;
          }

          .typewriter {
            overflow: hidden;
            white-space: nowrap;
            border-right: 2px solid #00ff41;
            animation:
              typewriter 2s steps(40) 1s both,
              blink 1s step-end infinite;
          }

          @keyframes typewriter {
            from {
              width: 0;
            }
            to {
              width: 100%;
            }
          }

          .memory-section {
            border-top: 1px solid #333;
            padding-top: 12px;
          }

          .loading-bar {
            background: #333;
            border: 1px solid #00ff41;
            height: 12px;
            position: relative;
            overflow: hidden;
          }

          .loading-bar::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: #00ff41;
            animation: random-memory-usage 8s ease-in-out infinite;
          }

          @keyframes random-memory-usage {
            0% {
              width: 25%;
            }
            10% {
              width: 28%;
            }
            20% {
              width: 35%;
            }
            30% {
              width: 32%;
            }
            40% {
              width: 45%;
            }
            50% {
              width: 42%;
            }
            60% {
              width: 38%;
            }
            70% {
              width: 55%;
            }
            80% {
              width: 48%;
            }
            90% {
              width: 30%;
            }
            100% {
              width: 48%;
            }
          }

          .button-grid-single {
            display: flex;
            justify-content: center;
            margin: 32px auto 16px;
            max-width: 600px;
            position: relative;
            z-index: 106;
          }

          .social-button-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            max-width: 500px;
            margin: 0 auto 32px;
            position: relative;
            z-index: 106;
          }

          @media (max-width: 640px) {
            .social-button-grid {
              grid-template-columns: repeat(1, 1fr);
              max-width: 300px;
            }
          }

          .pixel-button {
            background: #0a0a0a;
            border: 2px solid #00ff41;
            color: #00ff41;
            padding: 12px 16px;
            font-family: "JetBrains Mono", monospace;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            border-radius: 0;
            transition: background-color 0.2s ease;
            position: relative;
          }

          .pixel-button:hover {
            background: #00ff41;
            color: #0a0a0a;
          }

          .pixel-button:active {
            background: #00cc33;
          }

          .social-button {
            border: 2px solid #00ff41 !important;
            color: #00ff41 !important;
          }

          .social-button:hover {
            background: #00ff41 !important;
            color: #0a0a0a !important;
          }

          .interactive-terminal {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90% !important;
            max-width: 800px !important;
            height: 70% !important;
            max-height: 600px !important;
            background: #0a0a0a !important;
            border: 3px solid #00ff41 !important;
            box-shadow: 0 0 30px rgba(0, 255, 65, 0.4) !important;
            z-index: 9999 !important;
            overflow: hidden !important;
            margin: 0 !important;
          }

          .interactive-terminal .terminal-header {
            background: #00ff41;
            color: #0a0a0a;
            padding: 8px 16px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: "JetBrains Mono", monospace;
          }

          .close-terminal {
            background: none;
            border: none;
            color: #0a0a0a;
            font-size: 18px;
            cursor: pointer;
            font-weight: bold;
            padding: 4px 8px;
          }

          .close-terminal:hover {
            background: rgba(10, 10, 10, 0.2);
          }

          .terminal-body {
            height: calc(100% - 40px);
            padding: 16px;
            overflow-y: auto;
            background: #0a0a0a;
          }

          .terminal-output {
            margin-bottom: 16px;
            font-family: "JetBrains Mono", monospace;
            font-size: 14px;
            line-height: 1.4;
            min-height: 200px;
          }

          .terminal-output .terminal-line {
            margin-bottom: 4px;
          }

          .terminal-output .prompt {
            color: #00ff41;
            margin-right: 8px;
          }

          .terminal-output .command {
            color: #ffffff;
          }

          .terminal-output .output {
            color: #ffaa00;
          }

          .terminal-input-line {
            display: flex;
            align-items: center;
            font-family: "JetBrains Mono", monospace;
            font-size: 14px;
          }

          .terminal-input-line .prompt {
            color: #00ff41;
            margin-right: 8px;
          }

          .terminal-input {
            background: transparent;
            border: none;
            color: #ffffff;
            font-family: "JetBrains Mono", monospace;
            font-size: 14px;
            outline: none;
            flex: 1;
            caret-color: #00ff41;
          }

          .terminal-input::placeholder {
            color: #666;
          }

          .status-bar {
            text-align: center;
            space-y: 16px;
            position: relative;
            z-index: 106;
          }

          .status-indicators {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            font-size: 14px;
            margin-bottom: 16px;
          }

          .status-dot {
            font-size: 16px;
          }

          .continue-prompt {
            font-size: 12px;
            color: #ffaa00;
            margin-bottom: 16px;
          }

          .loading-indicators {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
          }

          .retro-footer {
            border-top: 2px solid #00ff41;
            padding: 16px;
            text-align: center;
            font-size: 10px;
            line-height: 1.4;
            background: #0a0a0a;
            position: relative;
            z-index: 110;
          }

          .retro-footer > div {
            margin-bottom: 4px;
          }

          .power-button {
            background: #ff4444;
            border: 2px solid #ff4444;
            color: white;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            cursor: pointer;
            border-radius: 0;
            font-size: 14px;
          }

          .power-button:hover {
            animation: blink 0.5s infinite;
            background: white;
            color: #ff4444;
          }

          @keyframes blink {
            0%,
            50% {
              opacity: 1;
            }
            51%,
            100% {
              opacity: 0;
            }
          }

          .blink {
            animation: blink 1s infinite;
          }

          @keyframes terminal-glow {
            0%,
            100% {
              text-shadow: 0 0 10px currentColor;
            }
            50% {
              text-shadow:
                0 0 20px currentColor,
                0 0 30px currentColor;
            }
          }

          .terminal-glow {
            animation: terminal-glow 2s ease-in-out infinite;
          }

          @keyframes pixel-float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-4px);
            }
          }

          @keyframes scanlines {
            0% {
              transform: translateY(-100%);
            }
            100% {
              transform: translateY(100vh);
            }
          }

          .retro-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 65, 0.03) 2px,
              rgba(0, 255, 65, 0.03) 4px
            );
            pointer-events: none;
            opacity: 0.8;
          }

          .retro-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(0, 255, 65, 0.1) 1px,
              rgba(0, 255, 65, 0.1) 2px,
              transparent 2px,
              transparent 8px
            );
            animation: scanlines 6s linear infinite;
            will-change: transform;
            transform: translateZ(0);
            pointer-events: none;
            opacity: 0.3;
          }
        `}</style>
          </>
        )}

        {/* Custom Scrollbar Styling with Desktop Optimizations */}
        <style>{`
        /* Remove header text outlines/borders on desktop non-home sections */
        @media (min-width: 1025px) {
          div[data-section]:not([data-section="home"]) h1,
          div[data-section]:not([data-section="home"]) h2,
          div[data-section]:not([data-section="home"]) h3,
          div[data-section]:not([data-section="home"]) .warm-glow-text {
            outline: none !important;
            border: none !important;
          }
        }

        /* Custom scrollbar for sections with content overflow */
        div[data-section]:not([data-section="home"]) {
          scrollbar-width: thin;
          scrollbar-color: ${theme === "light" ? "rgba(59, 130, 246, 0.6)" : "rgba(73, 146, 255, 0.8)"} ${theme === "light" ? "rgba(243, 244, 246, 0.3)" : "rgba(17, 24, 39, 0.3)"};
          scroll-padding-top: 20px;
          scroll-padding-bottom: 20px;
        }

        /* Enhanced webkit scrollbar styling for desktop */
        div[data-section]:not([data-section="home"])::-webkit-scrollbar {
          width: 10px;
          transition: width 0.2s ease;
        }

        @media (max-width: 1024px) {
          div[data-section]:not([data-section="home"])::-webkit-scrollbar {
            width: 6px;
          }
        }

        div[data-section]:not([data-section="home"])::-webkit-scrollbar-track {
          background: ${theme === "light" ? "rgba(243, 244, 246, 0.3)" : "rgba(17, 24, 39, 0.3)"};
          border-radius: 6px;
          margin: 5px 0;
        }

        div[data-section]:not([data-section="home"])::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg,
            ${theme === "light" ? "rgba(59, 130, 246, 0.7)" : "rgba(73, 146, 255, 0.9)"} 0%,
            ${theme === "light" ? "rgba(59, 130, 246, 0.5)" : "rgba(73, 146, 255, 0.7)"} 100%);
          border-radius: 6px;
          border: 1px solid ${theme === "light" ? "rgba(59, 130, 246, 0.2)" : "rgba(73, 146, 255, 0.3)"};
          transition: all 0.3s ease;
          box-shadow:
            0 0 10px ${theme === "light" ? "rgba(59, 130, 246, 0.3)" : "rgba(73, 146, 255, 0.4)"},
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        div[data-section]:not([data-section="home"])::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg,
            ${theme === "light" ? "rgba(59, 130, 246, 0.9)" : "rgba(73, 146, 255, 1)"} 0%,
            ${theme === "light" ? "rgba(59, 130, 246, 0.7)" : "rgba(73, 146, 255, 0.8)"} 100%);
          box-shadow:
            0 0 15px ${theme === "light" ? "rgba(59, 130, 246, 0.5)" : "rgba(73, 146, 255, 0.6)"},
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: scale(1.02);
        }

        div[data-section]:not([data-section="home"])::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg,
            ${theme === "light" ? "rgba(59, 130, 246, 1)" : "rgba(73, 146, 255, 1)"} 0%,
            ${theme === "light" ? "rgba(59, 130, 246, 0.8)" : "rgba(73, 146, 255, 0.9)"} 100%);
        }

        /* Smooth scrolling performance optimizations */
        div[data-section]:not([data-section="home"]) {
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          perspective: 1000px;
          will-change: scroll-position;
        }

        /* Hide horizontal scrollbar completely */
        div[data-section]::-webkit-scrollbar:horizontal {
          display: none;
        }

        /* Desktop scroll snap for smoother experience */
        @media (min-width: 1025px) {
          div[data-section]:not([data-section="home"]) {
            scroll-snap-type: y proximity;
            scroll-padding: 20px;
          }

          div[data-section]:not([data-section="home"]) > * {
            scroll-snap-align: start;
          }
        }

        /* Enhanced responsive fixes for smaller desktop screens */
        @media (min-width: 768px) and (max-width: 1024px) {
          /* Ensure navigation elements stay visible and accessible */
          .fixed {
            position: fixed !important;
          }

          /* Prevent content from overlapping navigation */
          div[data-section]:not([data-section="home"]) {
            padding-right: 60px;
            padding-left: 30px;
            box-sizing: border-box;
          }

          /* Ensure proper section heights on smaller desktop screens */
          div[data-section] {
            min-height: 100vh;
            max-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
          }
        }

        /* Small desktop screen fixes */
        @media (min-width: 1025px) and (max-width: 1280px) {
          /* Prevent navigation overlap */
          div[data-section]:not([data-section="home"]) {
            padding-right: 80px;
            padding-left: 40px;
          }
        }

        /* Ensure fixed elements stay in viewport on all screen sizes */
        @media (min-width: 768px) {
          .fixed[style*="right"] {
            right: clamp(8px, 2vw, 32px) !important;
          }

          .fixed[style*="left"] {
            left: clamp(8px, 2vw, 24px) !important;
          }
        }

        /* Comprehensive horizontal scrollbar prevention */
        * {
          max-width: 100vw;
        }

        html, body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Ensure root container fills full width */
        #root {
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Prevent any child elements from causing horizontal overflow */
        div, section, main, article, aside, nav, header, footer {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Enforce full width for section containers */
        .section-container {
          width: 100% !important;
          max-width: 100vw !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }

        /* Hide horizontal scrollbars completely on all elements */
        ::-webkit-scrollbar:horizontal {
          display: none !important;
        }

        /* Firefox horizontal scrollbar hiding */
        * {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }

        /* Ensure no element can exceed viewport width */
        [data-section] {
          max-width: 100vw !important;
          width: 100vw !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          left: 0 !important;
          right: 0 !important;
        }

        /* Specific services section overflow prevention */
        [data-section="services"] {
          contain: layout style paint !important;
          overflow: hidden !important;
          max-width: 100vw !important;
          position: relative !important;
        }

        [data-section="services"] * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        [data-section="services"] .absolute {
          max-width: 100vw !important;
          contain: layout !important;
        }

        /* Force containment for all animated elements in services */
        [data-section="services"] [style*="left"],
        [data-section="services"] [style*="right"],
        [data-section="services"] [style*="transform"] {
          will-change: auto !important;
          contain: layout style paint !important;
        }

        /* Prevent scroll-triggered overflow */
        [data-section="services"]::-webkit-scrollbar {
          width: 0 !important;
          display: none !important;
        }

        [data-section="services"] {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        /* Prevent transform animations from causing overflow */
        [data-section="services"] motion-div,
        [data-section="services"] [class*="motion"],
        [data-section="services"] [style*="transform"] {
          transform-box: fill-box !important;
          overflow: visible !important;
        }

        /* Remove clipping to avoid rectangular glow edges */
        [data-section="services"] > * {
          clip-path: none !important;
        }
      `}</style>
      </div>
    );
  }

  // Modern mode - original design
  // First-run coach modal state
  const [showCoach, setShowCoach] = useState(() => {
    try {
      return localStorage.getItem("kor_coach_shown") !== "true";
    } catch (e) {
      return false;
    }
  });

  const dismissCoach = () => {
    try {
      localStorage.setItem("kor_coach_shown", "true");
    } catch (e) {
      // ignore
    }
    setShowCoach(false);
  };

  return (
      <>
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[99999] bg-white/90 text-gray-900 px-3 py-2 rounded shadow"
        >
          Skip to main content
        </a>


        {/* Result Modal - Rendered at root level for proper centering */}
        {showResultModal.open &&
          createPortal(
            <div className="fixed inset-0 z-[20000] flex items-center justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={() =>
                  setShowResultModal({
                    open: false,
                    success: false,
                    message: null,
                  })
                }
              />

              {/* Modal */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-full max-w-md mx-4 p-8 rounded-3xl border backdrop-blur-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)`,
                  borderColor: "rgba(255,255,255,0.15)",
                  boxShadow:
                    "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
              >
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                {/* Close Button */}
                <button
                  onClick={() =>
                    setShowResultModal({
                      open: false,
                      success: false,
                      message: null,
                    })
                  }
                  className="absolute top-4 right-4 p-2 rounded-full transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/15 z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="text-center space-y-6 relative z-10">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1,
                    }}
                  >
                    {showResultModal.success ? (
                      <div
                        className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center backdrop-blur-sm"
                        style={{
                          boxShadow:
                            "0 0 24px rgba(52, 211, 153, 0.2), inset 0 1px 1px rgba(255,255,255,0.2)",
                        }}
                      >
                        <motion.svg
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", delay: 0.3 }}
                          className="w-8 h-8 text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </motion.svg>
                      </div>
                    ) : (
                      <div
                        className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-400/30 flex items-center justify-center backdrop-blur-sm"
                        style={{
                          boxShadow:
                            "0 0 24px rgba(239, 68, 68, 0.2), inset 0 1px 1px rgba(255,255,255,0.2)",
                        }}
                      >
                        <motion.svg
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", delay: 0.3 }}
                          className="w-8 h-8 text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </motion.svg>
                      </div>
                    )}
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      {showResultModal.success ? "Success!" : "Error"}
                    </h2>
                  </motion.div>

                  {/* Message */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {showResultModal.message ||
                        (showResultModal.success
                          ? "Your request has been successfully sent. We'll be in touch soon!"
                          : "There was an error submitting your request. Please try again.")}
                    </p>
                  </motion.div>

                  {/* Close Button */}
                  <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setShowResultModal({
                        open: false,
                        success: false,
                        message: null,
                      })
                    }
                    className="w-full py-2.5 px-4 text-white rounded-xl font-medium transition-all duration-200 border border-blue-400/40 backdrop-blur-sm relative overflow-hidden group"
                    style={{
                      background: `linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.1) 100%)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative">Got it</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>,
            document.body,
          )}

        {/* FIXED NAVIGATION ELEMENTS - OUTSIDE SCROLLING CONTAINER */}

        {/* Section Navigation Buttons */}
        <div
          className="fixed right-6 sm:right-8 md:right-10 lg:right-12 xl:right-16 top-1/2 -translate-y-1/2 z-[9999] flex flex-col space-y-2 sm:space-y-3"
          style={{ position: "fixed" }}
        >
          {/* Previous Section Button */}
          {currentSection > 0 && !isHelpModalOpen && !isMobileMenuOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isScrolling) return;
                    protectedScrollToSection(currentSection - 1);
                    setShowNavigationHints(false);
                  }}
                  disabled={isScrolling || isMobileMenuOpen}
                  className={`group relative p-2 sm:p-2.5 md:p-2.5 lg:p-3 w-10 h-10 sm:w-11 sm:h-11 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full border-2 backdrop-blur-lg hover-120hz performance-optimized flex items-center justify-center ${
                    isScrolling || isMobileMenuOpen
                      ? "pointer-events-none opacity-60"
                      : ""
                  } ${
                    theme === "light"
                      ? "border-blue-400/40 bg-white/80 hover:bg-white/90"
                      : "border-blue-300/30 bg-blue-400/10 hover:bg-blue-400/20"
                  }`}
                  style={{
                    background:
                      theme === "light"
                        ? `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`
                        : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                    boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
                  }}
                >
                  <ChevronUp
                    className={`w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 transition-colors duration-300 ${
                      theme === "light"
                        ? "text-blue-600 group-hover:text-blue-700"
                        : "text-white group-hover:text-blue-300"
                    }`}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span>Go to previous section</span>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Next Section Button */}
          {currentSection < sections.length - 1 &&
            !isHelpModalOpen &&
            !isMobileMenuOpen &&
            (currentSection === 0 ? (
              // On home section: button without tooltip
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isScrolling) return;
                  protectedScrollToSection(currentSection + 1);
                  setShowNavigationHints(false);
                }}
                disabled={isScrolling || isMobileMenuOpen}
                className={`group relative p-2 sm:p-2.5 md:p-2.5 lg:p-3 w-10 h-10 sm:w-11 sm:h-11 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full border-2 backdrop-blur-lg hover-120hz performance-optimized flex items-center justify-center ${
                  isScrolling || isMobileMenuOpen
                    ? "pointer-events-none opacity-60"
                    : ""
                } ${
                  theme === "light"
                    ? "border-blue-400/40 bg-white/80 hover:bg-white/90"
                    : "border-blue-300/30 bg-blue-400/10 hover:bg-blue-400/20"
                }`}
                style={{
                  background:
                    theme === "light"
                      ? `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`
                      : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                  boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
                }}
              >
                <ChevronDown
                  className={`w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 transition-colors duration-300 ${
                    theme === "light"
                      ? "text-blue-600 group-hover:text-blue-700"
                      : "text-white group-hover:text-blue-300"
                  }`}
                />
              </button>
            ) : (
              // On other sections: button with tooltip
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isScrolling) return;
                      protectedScrollToSection(currentSection + 1);
                      setShowNavigationHints(false);
                    }}
                    disabled={isScrolling || isMobileMenuOpen}
                    className={`group relative p-2 sm:p-2.5 md:p-2.5 lg:p-3 w-10 h-10 sm:w-11 sm:h-11 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full border-2 backdrop-blur-lg hover-120hz performance-optimized flex items-center justify-center ${
                      isScrolling || isMobileMenuOpen
                        ? "pointer-events-none opacity-60"
                        : ""
                    } ${
                      theme === "light"
                        ? "border-blue-400/40 bg-white/80 hover:bg-white/90"
                        : "border-blue-300/30 bg-blue-400/10 hover:bg-blue-400/20"
                    }`}
                    style={{
                      background:
                        theme === "light"
                          ? `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`
                          : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                      boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
                    }}
                  >
                    <ChevronDown
                      className={`w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 transition-colors duration-300 ${
                        theme === "light"
                          ? "text-blue-600 group-hover:text-blue-700"
                          : "text-white group-hover:text-blue-300"
                      }`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <span>Go to next section</span>
                </TooltipContent>
              </Tooltip>
            ))}

          {/* Always-visible navigation hint for home page - to the right of the down button */}
          {currentSection === 0 && !isHelpModalOpen && !isMobileMenuOpen && (
            <div
              className="absolute right-16 top-[-8px] sm:top-[-7px] md:top-[-7px] lg:top-[-6px] z-[9998] animate-nav-hint-bounce"
              style={{
                position: "absolute",
                pointerEvents: "none",
              }}
            >
              <div
                className={`px-4 py-2.5 rounded-lg border backdrop-blur-lg font-medium whitespace-nowrap shadow-xl relative ${
                  theme === "light"
                    ? "bg-white/90 text-blue-600 border-blue-400/40"
                    : "bg-blue-400/10 text-white border-blue-300/30"
                }`}
                style={{
                  boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
                }}
              >
                Click to scroll down
                {/* Speech bubble tail pointing left */}
                <div
                  className={`absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 border-b border-l ${
                    theme === "light"
                      ? "bg-white/90 border-blue-400/40"
                      : "bg-blue-400/10 border-blue-300/30"
                  }`}
                />
                {/* Chevron icon */}
                <span
                  className={`absolute right-2 top-1/2 -translate-y-1/2 font-bold text-lg ${
                    theme === "light" ? "text-blue-600/80" : "text-white/80"
                  }`}
                >
                  ›
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Help Button - Positioned at bottom right corner */}
        <div
          className={`fixed right-6 sm:right-8 md:right-10 lg:right-12 xl:right-16 z-[99999] transition-all duration-300 ${
            isMobileSafari || isSafari
              ? ""
              : "bottom-6 sm:bottom-8 md:bottom-10 lg:bottom-12"
          }`}
          style={{
            position: "fixed",
            bottom: isMobileSafari || isSafari ? "120px" : undefined,
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  protectedToggleHelpModal(true);
                  setHasInteractedWithHelp(true);
                }}
                disabled={isScrolling}
                className={`group relative p-2 sm:p-2.5 md:p-2.5 lg:p-3 w-10 h-10 sm:w-11 sm:h-11 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full border-2 backdrop-blur-lg hover-120hz performance-optimized flex items-center justify-center ${
                  isScrolling ? "pointer-events-none opacity-60" : ""
                } ${
                  theme === "light"
                    ? "border-blue-400/40 bg-white/80 hover:bg-white/90"
                    : "border-blue-300/30 bg-blue-400/10 hover:bg-blue-400/20"
                }`}
                style={{
                  background:
                    theme === "light"
                      ? `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`
                      : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                  boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
                }}
              >
                <HelpCircle
                  className={`w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 transition-colors duration-300 ${
                    theme === "light"
                      ? "text-blue-600 group-hover:text-blue-700"
                      : "text-white group-hover:text-blue-300"
                  }`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <span>
                {isScrolling
                  ? "Help disabled while scrolling"
                  : "Open help and information"}
              </span>
            </TooltipContent>
          </Tooltip>
        </div>

        <div
          id="main-content"
          ref={containerRef}
          className={`relative transition-all duration-500 gpu-accelerated composite-layer scroll-optimized overflow-x-hidden ${
            isScrollingActive ? "scroll-simplified" : ""
          } ${
            theme === "light"
              ? "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
              : "bg-black"
          }`}
          style={{
            width: "100vw", // Ensure full viewport width
            overflowY: currentSection === 0 ? "hidden" : "auto", // Allow vertical scrolling on content sections
            overflowX: "hidden", // Always disable horizontal scrolling
            maxWidth: "100vw",
            minHeight: "100vh", // Ensure minimum height
            willChange: isScrollingActive ? "auto" : "transform",
            scrollBehavior: "smooth", // Native smooth scrolling for content
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
            margin: 0,
            padding: 0,
            position: "relative",
          }}
        >
          {/* Navigation Hints for New Users */}
          {showNavigationHints && currentSection > 0 && (
            <div className="fixed right-20 top-1/2 -translate-y-1/2 z-40 animate-pulse">
              <div
                className={`px-3 py-2 rounded-lg border backdrop-blur-sm text-sm font-medium whitespace-nowrap ${
                  theme === "light"
                    ? "border-blue-400/40 bg-white/90 text-gray-800"
                    : "border-blue-300/30 bg-black/80 text-white"
                }`}
                style={{
                  boxShadow: "0 0 15px rgba(73, 146, 255, 0.3)",
                }}
              >
                Click to navigate sections →
                <button
                  onClick={() => setShowNavigationHints(false)}
                  className="ml-2 text-xs opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Section Position Indicator Hint removed per request */}

          {/* Help Modal */}
          {isHelpModalOpen && (
            <div className="fixed inset-0 z-[20000] flex items-center justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setHasInteractedWithHelp(true);
                }}
              />

              {/* Modal */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`relative w-full max-w-md mx-4 p-6 rounded-3xl border backdrop-blur-2xl overflow-hidden ${
                  theme === "light"
                    ? "border-blue-400/20"
                    : "border-blue-300/20"
                }`}
                style={{
                  background:
                    theme === "light"
                      ? `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)`
                      : `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)`,
                  boxShadow:
                    "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
              >
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsHelpModalOpen(false);
                    setHasInteractedWithHelp(true);
                  }}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-10 ${
                    theme === "light"
                      ? "text-gray-500 hover:text-gray-700 hover:bg-white/30"
                      : "text-gray-400 hover:text-white hover:bg-white/15"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="mb-6 relative z-10">
                  <h2
                    className={`text-xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
                      theme === "light"
                        ? "from-gray-900 to-gray-700"
                        : "from-white to-gray-200"
                    }`}
                  >
                    Navigation Help
                  </h2>
                  <p
                    className={`text-sm ${
                      theme === "light" ? "text-gray-600" : "text-gray-300"
                    }`}
                  >
                    Learn how to navigate through the website sections
                  </p>
                </div>

                {/* Navigation Instructions */}
                <div className="space-y-4 relative z-10">
                  {/* Section Buttons */}
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col space-y-1 mt-1">
                      <div
                        className="w-8 h-8 rounded-full border border-blue-400/50 flex items-center justify-center backdrop-blur-sm"
                        style={{ background: "rgba(59,130,246,0.1)" }}
                      >
                        <ChevronUp className="w-4 h-4 text-blue-400" />
                      </div>
                      <div
                        className="w-8 h-8 rounded-full border border-blue-400/50 flex items-center justify-center backdrop-blur-sm"
                        style={{ background: "rgba(59,130,246,0.1)" }}
                      >
                        <ChevronDown className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                    <div>
                      <h3
                        className={`font-semibold text-sm mb-1 ${
                          theme === "light" ? "text-gray-900" : "text-white"
                        }`}
                      >
                        Section Navigation Buttons
                      </h3>
                      <p
                        className={`text-xs ${
                          theme === "light" ? "text-gray-600" : "text-gray-300"
                        }`}
                      >
                        Use the up/down arrow buttons on the right side to move
                        between sections
                      </p>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts */}
                  <div className="flex items-start space-x-3">
                    <div className="flex space-x-1 mt-1">
                      <kbd
                        className={`px-2 py-1 text-xs rounded border backdrop-blur-sm ${
                          theme === "light"
                            ? "border-gray-300/30 text-gray-700 bg-white/20"
                            : "border-gray-400/20 text-gray-300 bg-white/10"
                        }`}
                      >
                        Ctrl
                      </kbd>
                      <span className="text-xs">+</span>
                      <kbd
                        className={`px-2 py-1 text-xs rounded border backdrop-blur-sm ${
                          theme === "light"
                            ? "border-gray-300/30 text-gray-700 bg-white/20"
                            : "border-gray-400/20 text-gray-300 bg-white/10"
                        }`}
                      >
                        ↑↓
                      </kbd>
                    </div>
                    <div>
                      <h3
                        className={`font-semibold text-sm mb-1 ${
                          theme === "light" ? "text-gray-900" : "text-white"
                        }`}
                      >
                        Keyboard Shortcuts
                      </h3>
                      <p
                        className={`text-xs ${
                          theme === "light" ? "text-gray-600" : "text-gray-300"
                        }`}
                      >
                        Hold Ctrl and use arrow keys to navigate between
                        sections
                      </p>
                    </div>
                  </div>

                  {/* Content Scrolling */}
                  <div className="flex items-start space-x-3">
                    <div
                      className="w-8 h-12 border border-blue-400/50 rounded mt-1 relative backdrop-blur-sm"
                      style={{ background: "rgba(59,130,246,0.1)" }}
                    >
                      <div className="absolute right-0 top-1 bottom-1 w-1 bg-blue-400 rounded opacity-70" />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold text-sm mb-1 ${
                          theme === "light" ? "text-gray-900" : "text-white"
                        }`}
                      >
                        Content Scrolling
                      </h3>
                      <p
                        className={`text-xs ${
                          theme === "light" ? "text-gray-600" : "text-gray-300"
                        }`}
                      >
                        Scroll naturally within each section to view all
                        content. Section changes only happen via buttons.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="mt-6 pt-4 border-t relative z-10"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <button
                    onClick={() => {
                      setIsHelpModalOpen(false);
                      setShowNavigationHints(false);
                      setHasInteractedWithHelp(true);
                    }}
                    className={`w-full py-2 px-4 rounded-xl font-medium transition-all duration-200 border backdrop-blur-sm relative overflow-hidden group ${
                      theme === "light"
                        ? "text-gray-900 border-blue-400/20"
                        : "text-white border-blue-300/20"
                    }`}
                    style={{
                      background:
                        theme === "light"
                          ? `linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)`
                          : `linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.1) 100%)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative">Got it, dismiss hints</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Mobile Hamburger Menu - Only show in home section */}
          {currentSection === 0 && (
            <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
              <div className="relative pointer-events-auto">
                <MobileHamburgerMenu
                  isOpen={isMobileMenuOpen}
                  setIsOpen={setIsMobileMenuOpen}
                  theme={theme}
                  isHomePage={true}
                />
              </div>
            </div>
          )}

          {/* Black Transition Overlay with Cinematic Effects */}
          <AnimatePresence>
            {isBlackTransition && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="fixed inset-0 z-[9999] pointer-events-none black-overlay-enhanced"
                style={{
                  willChange: "opacity",
                  transform: "translateZ(0)",
                }}
              >
                {/* Simple black overlay */}
                <div className="absolute inset-0 bg-black" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sections Container */}
          <div className={`h-full ${getPerformanceClasses()}`}>
            {/* Home Section */}
            <motion.div
              ref={(el) => (sectionsRef.current[0] = el!)}
              data-section="home"
              className={`relative min-h-screen overflow-hidden transition-all duration-500 ${
                isMobileMenuOpen ? "blur-sm" : ""
              } ${
                theme === "light"
                  ? "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
                  : "bg-black"
              }`}
              style={{
                display: currentSection === 0 ? "block" : "none",
              }}
            >
              {/* Main Content - Always visible with orchestrated animations */}
              {/* Enhanced Mobile Visual Elements */}
              <div className="fixed top-6 left-6 z-40 block sm:hidden">
                {/* Animated mobile corner orbs */}
                <div className="relative">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`mobile-corner-orb-${i}`}
                      className="absolute rounded-full opacity-60"
                      style={{
                        width: `${8 + i * 3}px`,
                        height: `${8 + i * 3}px`,
                        left: `${i * 12}px`,
                        top: `${i * 8}px`,
                        background: [
                          "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, transparent 70%)",
                          "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%)",
                          "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, transparent 70%)",
                        ][i],
                        filter: `blur(${1 + i * 0.5}px)`,
                      }}
                      animate={{
                        y: [0, -8, 0],
                        x: [0, 4, 0],
                        scale: [1, 1.1, 1],
                        opacity: [0.6, 0.9, 0.6],
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Theme container removed per request (top-right theme toggle) */}

              {/* Enhanced Background Elements - Performance optimized */}

              {/* Animated Noise Texture - Now on all devices */}
              <div
                className="absolute inset-0 opacity-10 sm:opacity-8 lg:opacity-5 animate-noise gpu-accelerated"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Background effects container */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                {/* Simple background element */}
                <div
                  className="absolute"
                  style={{
                    top: "30%",
                    left: "10%",
                    right: "10%",
                    height: "40%",
                    background:
                      "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1), transparent)",
                    filter: "blur(60px)",
                  }}
                />

                {/* NEW DESKTOP EYE CANDY - Enhanced Effects */}

                {/* Floating Energy Orbs - Desktop Only */}
                <div className="absolute inset-0">
                  {!performanceSettings.disableParticles &&
                    [...Array(12)].map((_, i) => (
                      <div
                        key={`desktop-orb-${i}`}
                        className="absolute rounded-full"
                        style={{
                          left: `${8 + ((i * 7) % 84)}%`,
                          top: `${12 + ((i * 11) % 76)}%`,
                          width: `${6 + (i % 4) * 2}px`,
                          height: `${6 + (i % 4) * 2}px`,
                          background: [
                            "radial-gradient(circle, rgba(34, 197, 94, 0.9) 0%, rgba(34, 197, 94, 0.2) 60%, transparent 80%)",
                            "radial-gradient(circle, rgba(59, 130, 246, 0.9) 0%, rgba(59, 130, 246, 0.2) 60%, transparent 80%)",
                            "radial-gradient(circle, rgba(147, 51, 234, 0.9) 0%, rgba(147, 51, 234, 0.2) 60%, transparent 80%)",
                            "radial-gradient(circle, rgba(236, 72, 153, 0.9) 0%, rgba(236, 72, 153, 0.2) 60%, transparent 80%)",
                            "radial-gradient(circle, rgba(6, 182, 212, 0.9) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 80%)",
                            "radial-gradient(circle, rgba(245, 158, 11, 0.9) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%)",
                          ][i % 6],
                          animation: `desktop-float-${(i % 4) + 1} ${4 + (i % 3)}s ease-in-out infinite ${i * 0.3}s`,
                          filter: `blur(${1 + (i % 2) * 0.5}px)`,
                          boxShadow: `0 0 ${12 + (i % 3) * 6}px currentColor`,
                        }}
                      />
                    ))}
                </div>

                {/* Pulsing Corner Accents - Desktop Enhanced */}
                <div className="absolute top-8 left-8 w-24 h-24 rounded-full opacity-40">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(59, 130, 246, 0.6) 40%, rgba(147, 51, 234, 0.3) 70%, transparent 90%)",
                      animation: "desktop-pulse-corner 4s ease-in-out infinite",
                      filter: "blur(6px)",
                    }}
                  />
                </div>
                <div className="absolute top-8 right-8 w-20 h-20 rounded-full opacity-35">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(236, 72, 153, 0.6) 40%, rgba(59, 130, 246, 0.3) 70%, transparent 90%)",
                      animation:
                        "desktop-pulse-corner 3.5s ease-in-out infinite 0.7s",
                      filter: "blur(5px)",
                    }}
                  />
                </div>
                <div className="absolute bottom-8 left-8 w-28 h-28 rounded-full opacity-45">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(34, 197, 94, 0.6) 40%, rgba(6, 182, 212, 0.3) 70%, transparent 90%)",
                      animation:
                        "desktop-pulse-corner 4.5s ease-in-out infinite 1.2s",
                      filter: "blur(7px)",
                    }}
                  />
                </div>
                <div className="absolute bottom-8 right-8 w-22 h-22 rounded-full opacity-38">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(245, 158, 11, 0.6) 40%, rgba(34, 197, 94, 0.3) 70%, transparent 90%)",
                      animation:
                        "desktop-pulse-corner 3.8s ease-in-out infinite 0.4s",
                      filter: "blur(4px)",
                    }}
                  />
                </div>

                {/* Animated Wave Patterns - Desktop Only */}
                <div className="absolute inset-0">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={`desktop-wave-${i}`}
                      className="absolute w-full h-40 opacity-30"
                      style={{
                        top: `${15 + i * 20}%`,
                        background: `linear-gradient(120deg,
                        transparent 0%,
                        rgba(34, 197, 94, ${0.25 + i * 0.08}) 20%,
                        rgba(59, 130, 246, ${0.35 + i * 0.08}) 40%,
                        rgba(147, 51, 234, ${0.3 + i * 0.08}) 60%,
                        rgba(236, 72, 153, ${0.25 + i * 0.08}) 80%,
                        transparent 100%)`,
                        borderRadius: `${50 + i * 15}% ${70 - i * 8}% ${40 + i * 12}% ${80 - i * 12}% / ${60 + i * 10}% ${30 - i * 4}% ${50 + i * 8}% ${70 - i * 15}%`,
                        filter: `blur(${10 + i * 3}px)`,
                        animation: `desktop-wave-${i + 1} ${8 + i * 2}s ease-in-out infinite`,
                        transform: `skewY(${-1.5 + i * 0.5}deg) rotate(${i * 1.5}deg)`,
                      }}
                    />
                  ))}
                </div>

                {/* Desktop shimmer scanlines removed */}
              </div>

              {/* Pink Theme Exclusive Background Effects */}
              {isPinkActive && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Pink Aurora Curtains - Desktop */}
                  <div className="opacity-80 sm:opacity-70 lg:opacity-70">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={`pink-aurora-${i}`}
                        className="absolute"
                        style={{
                          top: `${15 + i * 20}%`,
                          left: "-20%",
                          right: "-20%",
                          height: `${100 + i * 20}px`,
                          background: `linear-gradient(90deg,
                        transparent 0%,
                        rgba(236, 72, 153, ${0.4 + i * 0.1}) 20%,
                        rgba(244, 114, 182, ${0.5 + i * 0.1}) 40%,
                        rgba(251, 113, 133, ${0.6 + i * 0.1}) 60%,
                        rgba(190, 24, 93, ${0.4 + i * 0.1}) 80%,
                        transparent 100%)`,
                          borderRadius: `${40 + i * 15}% ${80 - i * 10}% ${60 + i * 12}% ${30 - i * 8}% / ${70 + i * 8}% ${40 - i * 5}% ${50 + i * 10}% ${90 - i * 15}%`,
                          filter: `blur(${12 + i * 4}px)`,
                          animation: `pink-floating-orbs ${25 + i * 5}s ease-in-out infinite ${i * 2}s`,
                          transform: `skewY(${-2 + i * 0.8}deg) rotate(${i * 2}deg)`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Pink Floating Hearts - All Devices */}
                  <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`pink-heart-bg-${i}`}
                        className="absolute"
                        style={{
                          left: `${10 + ((i * 80) % 85)}%`,
                          top: `${15 + ((i * 60) % 70)}%`,
                          width: `${12 + (i % 4) * 4}px`,
                          height: `${12 + (i % 4) * 4}px`,
                          animation: `pink-heartbeat ${3 + (i % 3)}s ease-in-out infinite ${i * 0.7}s`,
                          transform: "translateZ(0)",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: `rgba(236, 72, 153, ${0.6 + (i % 3) * 0.1})`,
                            clipPath:
                              "polygon(50% 10%, 83% 25%, 100% 60%, 50% 100%, 0% 60%, 17% 25%)",
                            boxShadow: "0 0 8px rgba(236, 72, 153, 0.5)",
                            filter: "blur(1px)",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pink Sparkle Effects */}
                  <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => (
                      <div
                        key={`pink-sparkle-${i}`}
                        className="absolute rounded-full"
                        style={{
                          left: `${5 + ((i * 70) % 90)}%`,
                          top: `${10 + ((i * 50) % 80)}%`,
                          width: `${2 + (i % 3)}px`,
                          height: `${2 + (i % 3)}px`,
                          background: [
                            "rgba(236, 72, 153, 0.9)",
                            "rgba(244, 114, 182, 0.8)",
                            "rgba(251, 113, 133, 0.7)",
                            "rgba(190, 24, 93, 0.9)",
                          ][i % 4],
                          animation: `pink-pulse ${2 + (i % 3)}s ease-in-out infinite ${i * 0.3}s`,
                          boxShadow: "0 0 6px currentColor",
                          filter: "blur(0.5px)",
                          transform: "translateZ(0)",
                        }}
                      />
                    ))}
                  </div>

                  {/* Pink Mobile/Tablet Wave Effects */}
                  <div className="lg:hidden absolute inset-0 opacity-60">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={`pink-mobile-wave-${i}`}
                        className="absolute w-full"
                        style={{
                          top: `${20 + i * 25}%`,
                          height: "100px",
                          background: `linear-gradient(90deg,
                        transparent 0%,
                        rgba(236, 72, 153, ${0.3 + i * 0.1}) 30%,
                        rgba(244, 114, 182, ${0.4 + i * 0.1}) 50%,
                        rgba(251, 113, 133, ${0.3 + i * 0.1}) 70%,
                        transparent 100%)`,
                          borderRadius: `${50 + i * 10}% ${70 - i * 5}% ${40 + i * 8}% ${80 - i * 12}% / ${60 + i * 15}% ${30 - i * 3}% ${50 + i * 7}% ${70 - i * 10}%`,
                          filter: `blur(${8 + i * 2}px)`,
                          animation: `pink-floating-particles ${15 + i * 3}s linear infinite ${i * 1.5}s`,
                          transform: `skewY(${-1.5 + i * 0.5}deg)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Screen Edge Effects */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden sm:hidden">
                {/* Mobile screen edge glow effects */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse" />
                <div
                  className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse"
                  style={{ animationDelay: "1s" }}
                />
                <div
                  className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-green-400/30 to-transparent animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                />
                <div
                  className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-pink-400/30 to-transparent animate-pulse"
                  style={{ animationDelay: "1.5s" }}
                />
              </div>

              {/* Mobile-Specific Floating Elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden sm:hidden">
                {/* Mobile floating bubbles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`mobile-bubble-${i}`}
                    className="absolute rounded-full opacity-40"
                    style={{
                      left: `${15 + ((i * 65) % 70)}%`,
                      top: `${20 + ((i * 45) % 60)}%`,
                      width: `${6 + (i % 3) * 2}px`,
                      height: `${6 + (i % 3) * 2}px`,
                      background: [
                        "radial-gradient(circle, rgba(34, 197, 94, 0.7) 0%, transparent 80%)",
                        "radial-gradient(circle, rgba(59, 130, 246, 0.7) 0%, transparent 80%)",
                        "radial-gradient(circle, rgba(147, 51, 234, 0.7) 0%, transparent 80%)",
                        "radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, transparent 80%)",
                      ][i % 4],
                      filter: `blur(${0.5 + (i % 2) * 0.5}px)`,
                    }}
                    animate={{
                      y: [0, -15, 0],
                      x: [0, 8, 0],
                      scale: [0.8, 1.2, 0.8],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 4 + (i % 3),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3,
                    }}
                  />
                ))}

                {/* Mobile swipe indicators */}
                <motion.div
                  className="absolute top-1/2 right-4 transform -translate-y-1/2"
                  animate={{
                    x: [0, -10, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="flex flex-col space-y-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={`swipe-dot-${i}`}
                        className="w-1 h-1 bg-blue-400 rounded-full opacity-60"
                        animate={{
                          scale: [1, 1.5, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Optimized Floating Ambient Particles - Reduced count for 60fps */}
              {!performanceSettings.disableParticles && (
                <motion.div
                  className="absolute inset-0 pointer-events-none overflow-hidden will-change-transform"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute rounded-full opacity-70 gpu-accelerated"
                      style={{
                        left: `${5 + ((i * 60) % 95)}%`,
                        top: `${10 + ((i * 35) % 85)}%`,
                        width: `${3 + (i % 4)}px`,
                        height: `${3 + (i % 4)}px`,
                        background: (() => {
                          if (isPinkActive) {
                            const pinkPalettes = [
                              `radial-gradient(circle, rgba(236, 72, 153, 0.9) 0%, rgba(244, 114, 182, 0.5) 70%, transparent 90%)`, // Pink
                              `radial-gradient(circle, rgba(244, 114, 182, 0.8) 0%, rgba(251, 113, 133, 0.4) 70%, transparent 90%)`, // Light Pink
                              `radial-gradient(circle, rgba(251, 113, 133, 0.8) 0%, rgba(236, 72, 153, 0.4) 70%, transparent 90%)`, // Rose Pink
                              `radial-gradient(circle, rgba(190, 24, 93, 0.8) 0%, rgba(244, 114, 182, 0.4) 70%, transparent 90%)`, // Dark Pink
                              `radial-gradient(circle, rgba(236, 72, 153, 0.9) 0%, rgba(190, 24, 93, 0.5) 70%, transparent 90%)`, // Pink-Dark Pink
                              `radial-gradient(circle, rgba(244, 114, 182, 0.8) 0%, rgba(236, 72, 153, 0.4) 70%, transparent 90%)`, // Light-Pink Mix
                            ];
                            return pinkPalettes[i % pinkPalettes.length];
                          } else {
                            const colorPalettes = [
                              `radial-gradient(circle, rgba(255, 100, 200, 0.8) 0%, rgba(255, 150, 100, 0.4) 70%, transparent 90%)`, // Pink-Orange
                              `radial-gradient(circle, rgba(100, 255, 150, 0.8) 0%, rgba(100, 200, 255, 0.4) 70%, transparent 90%)`, // Green-Blue
                              `radial-gradient(circle, rgba(200, 100, 255, 0.8) 0%, rgba(255, 200, 100, 0.4) 70%, transparent 90%)`, // Purple-Yellow
                              `radial-gradient(circle, rgba(100, 200, 255, 0.8) 0%, rgba(200, 255, 150, 0.4) 70%, transparent 90%)`, // Blue-Green
                              `radial-gradient(circle, rgba(255, 200, 100, 0.8) 0%, rgba(200, 100, 255, 0.4) 70%, transparent 90%)`, // Orange-Purple
                              `radial-gradient(circle, rgba(255, 150, 200, 0.8) 0%, rgba(150, 255, 200, 0.4) 70%, transparent 90%)`, // Pink-Mint
                            ];
                            return colorPalettes[i % colorPalettes.length];
                          }
                        })(),
                        animation: isScrollingActive
                          ? "none"
                          : `gentleFloat ${4 + (i % 3)}s ease-in-out infinite ${i * 0.4}s, sparkle ${8 + (i % 4)}s ease-in-out infinite ${i * 0.5}s`,
                        willChange: isScrollingActive ? "auto" : "transform",
                        transform: `translateZ(0) scale(${0.8 + (i % 2) * 0.4})`,
                        filter: `drop-shadow(0 0 4px currentColor) blur(0.5px)`,
                        boxShadow: `0 0 ${4 + (i % 3) * 2}px rgba(255, 255, 255, 0.3)`,
                      }}
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.05,
                        ease: "backOut",
                        type: "spring",
                        stiffness: 200,
                      }}
                    />
                  ))}
                </motion.div>
              )}

              {/* Animated Geometric Patterns - Now on all devices */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <svg
                  className="absolute w-full h-full gpu-accelerated"
                  viewBox="0 0 1200 800"
                >
                  {/* Animated hexagon grid - Reduced count */}
                  {[...Array(4)].map((_, i) => (
                    <polygon
                      key={`hex-${i}`}
                      points="100,20 140,40 140,80 100,100 60,80 60,40"
                      fill="none"
                      stroke="rgba(73, 146, 255, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="10 5"
                      style={{
                        transform: `translate(${100 + i * 250}px, ${100 + (i % 2) * 150}px)`,
                        animation: `geometric-pulse ${10 + i * 2}s ease-in-out infinite ${i * 0.8}s`,
                      }}
                    />
                  ))}
                  {/* Animated connecting lines - Reduced count */}
                  {[...Array(2)].map((_, i) => (
                    <line
                      key={`line-${i}`}
                      x1={50 + i * 400}
                      y1={200}
                      x2={300 + i * 400}
                      y2={400}
                      stroke="rgba(63, 186, 255, 0.2)"
                      strokeWidth="1"
                      strokeDasharray="15 10"
                      style={{
                        animation: `geometric-pulse ${12 + i * 3}s ease-in-out infinite ${i * 1}s`,
                      }}
                    />
                  ))}
                </svg>
              </div>

              {/* Optimized Breathing Orbs - Reduced count for performance - Responsive for mobile/tablet */}
              {!performanceSettings.disableParticles && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden scale-75 sm:scale-85 lg:scale-100">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`breath-orb-${i}`}
                      className="absolute rounded-full gpu-accelerated"
                      style={{
                        left: `${15 + ((i * 80) % 70)}%`,
                        top: `${20 + ((i * 60) % 60)}%`,
                        width: `${25 + (i % 2) * 15}px`,
                        height: `${25 + (i % 2) * 15}px`,
                        background: `radial-gradient(circle, rgba(${73 + i * 15}, ${146 + i * 8}, 255, 0.4) 0%, transparent 70%)`,
                        animation: `breath ${8 + (i % 3)}s ease-in-out infinite ${i * 0.6}s`,
                        filter: `blur(${3 + (i % 2)}px)`,
                        willChange: "transform, opacity",
                        transform: "translateZ(0)",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Dynamic Background Waves */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `
              radial-gradient(circle at 20% 80%, rgba(73, 146, 255, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(63, 186, 255, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(57, 135, 227, 0.1) 0%, transparent 50%)
            `,
                    animation: "subtle-glow 12s ease-in-out infinite alternate",
                  }}
                />
              </div>

              {/* Aurora-like Moving Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Large circles removed */}
              </div>

              {/* Interactive Glass Badge at Top */}
              <div
                className="absolute top-8 sm:top-28 left-0 right-0 flex justify-center z-20 animate-gentleBounce scale-75 sm:scale-100"
                style={{
                  marginTop: "var(--badge-margin-top, 140px)",
                }}
              >
                <div
                  ref={badgeRef}
                  className="inline-flex items-center gap-2 px-3 py-2 md:py-3 rounded-full backdrop-blur-xs hover:bg-white/15 transition-all duration-500 hover:scale-105 relative overflow-hidden"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid transparent",
                    backgroundClip: "padding-box",
                  }}
                  onMouseMove={handleBadgeMouseMove}
                  onMouseLeave={handleBadgeMouseLeave}
                >
                  {/* Dynamic Border Effect */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
                    style={{
                      // Static subtle border - no mouse-driven gradient
                      background:
                        "conic-gradient(from 0deg, rgba(255, 255, 255, 0.08) 0deg, rgba(255, 255, 255, 0.04) 360deg)",
                      padding: "2px",
                      borderRadius: "inherit",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      WebkitMask:
                        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                    }}
                  />
                  {/* Animated Sparkle Icon */}
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 animate-sparkle sparkle-120hz performance-optimized"
                    viewBox="0 0 24 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 3.5L10.088 9.313C9.99015 9.61051 9.82379 9.88088 9.60234 10.1023C9.38088 10.3238 9.11051 10.4901 8.813 10.588L3 12.5L8.813 14.412C9.11051 14.5099 9.38088 14.6762 9.60234 14.8977C9.82379 15.1191 9.99015 15.3895 10.088 15.687L12 21.5L13.912 15.687C14.0099 15.3895 14.1762 15.1191 14.3977 14.8977C14.6191 14.6762 14.8895 14.5099 15.187 14.412L21 12.5L15.187 10.588C14.8895 10.4901 14.6191 10.3238 14.3977 10.1023C14.1762 9.88088 14.0099 9.61051 13.912 9.313L12 3.5Z"
                      stroke={theme === "light" ? "#3B82F6" : "#22D3EE"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 3.5V7.5"
                      stroke={theme === "light" ? "#3B82F6" : "#22D3EE"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19 17.5V21.5"
                      stroke={theme === "light" ? "#3B82F6" : "#22D3EE"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 5.5H7"
                      stroke={theme === "light" ? "#3B82F6" : "#22D3EE"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 19.5H21"
                      stroke={theme === "light" ? "#3B82F6" : "#22D3EE"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className={`font-inter text-xs sm:text-xs md:text-sm font-normal text-center animate-textGlow ${
                      theme === "light" ? "text-gray-700" : "text-white/80"
                    }`}
                  >
                    Future-Ready Solutions, Custom-Built
                  </span>
                </div>
              </div>

              {/* Main Content Container - Simplified and Focused */}
              <div className="relative flex items-center justify-center min-h-screen px-4">
                {/* Simplified central orb */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-72 h-72 rounded-full opacity-50"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(73, 146, 255, 0.4) 0%, rgba(73, 146, 255, 0.1) 40%, transparent 70%)",
                      filter: "blur(30px)",
                    }}
                  />
                </div>

                {/* Optimized Rotating Light Beams */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div
                    className="absolute w-1 h-96 bg-gradient-to-t from-transparent via-blue-400/25 to-transparent gpu-accelerated"
                    style={{
                      animation: "spin 15s linear infinite",
                      transformOrigin: "center 50%",
                      willChange: "transform",
                      transform: "translateZ(0)",
                    }}
                  />
                  <div
                    className="absolute w-1 h-96 bg-gradient-to-t from-transparent via-cyan-400/20 to-transparent gpu-accelerated"
                    style={{
                      animation: "spin 20s linear infinite reverse",
                      transformOrigin: "center 50%",
                      willChange: "transform",
                      transform: "translateZ(0)",
                    }}
                  />
                </div>

                {/* Left Side Visual Balance Elements */}
                <div className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  {/* Floating geometric indicators */}
                  <div className="space-y-4 sm:space-y-8">
                    {/* Primary indicator */}
                    <motion.div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-400/30 animate-gentle-pulse"
                      initial={{ opacity: 0, x: -50, scale: 0 }}
                      animate={
                        animationStep >= 4 ? { opacity: 1, x: 0, scale: 1 } : {}
                      }
                      transition={{
                        delay: 0.2,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200,
                      }}
                    />
                    {/* Secondary indicators */}
                    <motion.div
                      className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-blue-300/20 animate-gentle-pulse"
                      initial={{ opacity: 0, x: -50, scale: 0 }}
                      animate={
                        animationStep >= 4 ? { opacity: 1, x: 0, scale: 1 } : {}
                      }
                      transition={{
                        delay: 0.4,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200,
                      }}
                      style={{ animationDelay: "1s" }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-200/25 animate-gentle-pulse"
                      initial={{ opacity: 0, x: -50, scale: 0 }}
                      animate={
                        animationStep >= 4 ? { opacity: 1, x: 0, scale: 1 } : {}
                      }
                      transition={{
                        delay: 0.6,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200,
                      }}
                      style={{ animationDelay: "2s" }}
                    />
                  </div>

                  {/* Vertical progress line */}
                  <motion.div
                    className={`absolute left-1/2 -translate-x-1/2 top-12 sm:top-16 w-px h-16 sm:h-24 ${
                      isPinkActive
                        ? "bg-gradient-to-b from-pink-400/50 via-pink-300/25 to-transparent"
                        : "bg-gradient-to-b from-blue-400/40 via-blue-300/20 to-transparent"
                    }`}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={
                      animationStep >= 1 ? { opacity: 1, scaleY: 1 } : {}
                    }
                    transition={{ delay: 3, duration: 1.5 }}
                  />

                  {/* Connecting line to center (desktop only) */}
                  <motion.div
                    className={`hidden sm:block absolute top-8 left-4 w-32 h-px ${
                      isPinkActive
                        ? "bg-gradient-to-r from-pink-400/40 to-transparent"
                        : "bg-gradient-to-r from-blue-400/30 to-transparent"
                    }`}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={
                      animationStep >= 1 ? { opacity: 1, scaleX: 1 } : {}
                    }
                    transition={{ delay: 3.5, duration: 1 }}
                  />
                </div>

                {/* Right Side Balance Elements */}
                <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  {/* Floating geometric indicators mirrored */}
                  <div className="space-y-4 sm:space-y-8">
                    <motion.div
                      className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-400/25 animate-gentle-pulse"
                      initial={{ opacity: 0, x: 20 }}
                      animate={animationStep >= 1 ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 2.2, duration: 1 }}
                      style={{ animationDelay: "0.5s" }}
                    />
                    <motion.div
                      className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-purple-300/20 animate-gentle-pulse"
                      initial={{ opacity: 0, x: 20 }}
                      animate={animationStep >= 1 ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 2.5, duration: 1 }}
                      style={{ animationDelay: "1.5s" }}
                    />
                    <motion.div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-purple-200/30 animate-gentle-pulse"
                      initial={{ opacity: 0, x: 20 }}
                      animate={animationStep >= 1 ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 2.8, duration: 1 }}
                      style={{ animationDelay: "2.5s" }}
                    />
                  </div>
                </div>

                {/* Central Glowing Orb - SVG Based with Magnetic Effect - YouTube Intro Style */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className={`relative animate-float cursor-pointer group pointer-events-none gpu-accelerated will-change-transform ${
                      animationStep >= 2 ? "filter-blur-in" : "filter-blur-out"
                    }`}
                    initial={{
                      opacity: 0,
                      scale: 0,
                      y: -100,
                    }}
                    animate={
                      animationStep >= 2
                        ? {
                            opacity: 1,
                            scale: 1,
                            y: 0,
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 120,
                      damping: 15,
                    }}
                    onMouseMove={handleOrbMouseMove}
                    onMouseLeave={handleOrbMouseLeave}
                    style={{
                      transition: "transform 0.3s ease-out",
                    }}
                  >
                    <svg
                      width="292"
                      height="308"
                      viewBox="0 0 1284 810"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-[58rem] h-[58rem] sm:w-[78rem] sm:h-[78rem] md:w-[75rem] md:h-[75rem] lg:w-[90rem] lg:h-[90rem] pointer-events-none"
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <defs>
                        <filter
                          id="orbFilter"
                          x="0.820007"
                          y="-259.18"
                          width="1282.36"
                          height="1298.36"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood
                            floodOpacity="0"
                            result="BackgroundImageFix"
                          />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="11.79" />
                          <feColorMatrix
                            type="matrix"
                            values={
                              isPinkActive
                                ? "0 0 0 0 0.925 0 0 0 0 0.282 0 0 0 0 0.596 0 0 0 1 0"
                                : "0 0 0 0 0.286275 0 0 0 0 0.572549 0 0 0 0 1 0 0 0 1 0"
                            }
                          />
                          <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow"
                          />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="41.265" />
                          <feColorMatrix
                            type="matrix"
                            values={
                              isPinkActive
                                ? "0 0 0 0 0.925 0 0 0 0 0.282 0 0 0 0 0.596 0 0 0 1 0"
                                : "0 0 0 0 0.286275 0 0 0 0 0.572549 0 0 0 0 1 0 0 0 1 0"
                            }
                          />
                          <feBlend
                            mode="normal"
                            in2="effect1_dropShadow"
                            result="effect2_dropShadow"
                          />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="82.53" />
                          <feColorMatrix
                            type="matrix"
                            values={
                              isPinkActive
                                ? "0 0 0 0 0.925 0 0 0 0 0.282 0 0 0 0 0.596 0 0 0 1 0"
                                : "0 0 0 0 0.286275 0 0 0 0 0.572549 0 0 0 0 1 0 0 0 1 0"
                            }
                          />
                          <feBlend
                            mode="normal"
                            in2="effect2_dropShadow"
                            result="effect3_dropShadow"
                          />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="141.48" />
                          <feColorMatrix
                            type="matrix"
                            values={
                              isPinkActive
                                ? "0 0 0 0 0.925 0 0 0 0 0.282 0 0 0 0 0.596 0 0 0 1 0"
                                : "0 0 0 0 0.286275 0 0 0 0 0.572549 0 0 0 0 1 0 0 0 1 0"
                            }
                          />
                          <feBlend
                            mode="normal"
                            in2="effect3_dropShadow"
                            result="effect4_dropShadow"
                          />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="247.59" />
                          <feColorMatrix
                            type="matrix"
                            values={
                              isPinkActive
                                ? "0 0 0 0 0.925 0 0 0 0 0.282 0 0 0 0 0.596 0 0 0 1 0"
                                : "0 0 0 0 0.286275 0 0 0 0 0.572549 0 0 0 0 1 0 0 0 1 0"
                            }
                          />
                          <feBlend
                            mode="normal"
                            in2="effect4_dropShadow"
                            result="effect5_dropShadow"
                          />
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect5_dropShadow"
                            result="shape"
                          />
                          <feGaussianBlur
                            stdDeviation="17.5"
                            result="effect6_foregroundBlur"
                          />
                        </filter>
                        <linearGradient
                          id="orbGradient"
                          x1="496"
                          y1="449.231"
                          x2="853.699"
                          y2="451.438"
                          gradientUnits="userSpaceOnUse"
                        >
                          {isPinkActive ? (
                            <>
                              <stop stopColor="#F472B6" />
                              <stop offset="0.493374" stopColor="#EC4899" />
                              <stop offset="1" stopColor="#BE185D" />
                            </>
                          ) : (
                            <>
                              <stop stopColor="#3FBAFF" />
                              <stop offset="0.493374" stopColor="#4992FF" />
                              <stop offset="1" stopColor="#3987E3" />
                            </>
                          )}
                        </linearGradient>
                      </defs>
                      <g filter="url(#orbFilter)">
                        <ellipse
                          cx="642"
                          cy="390"
                          rx="146"
                          ry="154"
                          fill="url(#orbGradient)"
                        />
                        <ellipse
                          cx="642"
                          cy="390"
                          rx="146"
                          ry="154"
                          stroke="black"
                        />
                      </g>
                    </svg>
                  </motion.div>
                </div>

                {/* Text Content - YouTube Intro Style */}
                <motion.div
                  className="relative z-10 px-4 -mt-16 gpu-accelerated will-change-transform"
                  initial={{
                    opacity: 0,
                  }}
                  animate={
                    animationStep >= 3
                      ? {
                          opacity: 1,
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.2,
                    ease: "easeOut",
                    delay: 0.3,
                  }}
                >
                  {/* Kor - mobile: 50px left + 30px down + bigger, desktop: moved further to the left */}
                  <div
                    className="text-center transform -translate-x-[50px] translate-y-[30px] sm:-translate-x-6 sm:translate-y-0 lg:-translate-x-16 xl:-translate-x-20 kor-tablet-positioning"
                    style={{ marginLeft: "-5px" }}
                  >
                    <h1
                      className={`font-poppins text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight relative mobile-lively-text ${
                        isPinkActive
                          ? "text-pink-300 animate-pink-neon-glow"
                          : theme === "light"
                            ? "text-gray-900"
                            : "text-white"
                      }`}
                      style={
                        isPinkActive
                          ? {
                              textShadow:
                                "0 0 10px rgba(236, 72, 153, 0.8), 0 0 20px rgba(244, 114, 182, 0.6), 0 0 30px rgba(251, 113, 133, 0.4)",
                              filter:
                                "drop-shadow(0 0 15px rgba(236, 72, 153, 0.5))",
                            }
                          : {}
                      }
                    >
                      <span className="inline-block relative warm-glow-text animate-warm-glow-pulse animate-wavy-text">
                        K
                      </span>
                      <span
                        className="inline-block relative warm-glow-text animate-warm-glow-pulse animate-wavy-text"
                        style={{
                          animationDelay: "0.3s",
                        }}
                      >
                        o
                      </span>
                      <span
                        className="inline-block relative warm-glow-text animate-warm-glow-pulse animate-wavy-text"
                        style={{
                          animationDelay: "0.6s",
                        }}
                      >
                        r
                      </span>
                    </h1>
                  </div>

                  {/* Development services - Fade in second with delay */}
                  <motion.div
                    className="text-center transform translate-x-[10px] translate-y-[10px] sm:translate-x-8 sm:translate-y-0 md:translate-x-12 lg:translate-x-16 mt-2 md:mt-4"
                    style={{ marginLeft: "5px", marginTop: "-5px" }}
                    initial={{ opacity: 0 }}
                    animate={
                      animationStep >= 3 ? { opacity: 1 } : { opacity: 0 }
                    }
                    transition={{
                      duration: 1.2,
                      ease: "easeOut",
                      delay: 1.5,
                    }}
                  >
                    <div className="relative">
                      {/* Background glow effect */}
                      <div
                        className="absolute inset-0 blur-3xl opacity-30 animate-pulse-glow"
                        style={{
                          background: isPinkActive
                            ? "radial-gradient(ellipse, rgba(236, 72, 153, 0.4) 0%, rgba(244, 114, 182, 0.3) 50%, transparent 70%)"
                            : theme === "light"
                              ? "radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.3) 50%, transparent 70%)"
                              : "radial-gradient(ellipse, rgba(73, 146, 255, 0.6) 0%, rgba(34, 211, 238, 0.4) 50%, transparent 70%)",
                          transform: "scale(1.5)",
                        }}
                      />

                      {/* Removed floating energy particles */}

                      {/* Pink Theme Floating Bubbles with Pink Outlines */}
                      {isPinkActive &&
                        [...Array(12)].map((_, i) => (
                          <div
                            key={`pink-bubble-${i}`}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              left: `${10 + ((i * 70) % 180)}%`,
                              top: `${20 + ((i * 60) % 80)}%`,
                              width: `${6 + (i % 4) * 2}px`,
                              height: `${6 + (i % 4) * 2}px`,
                              background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(236, 72, 153, 0.2) 40%, rgba(236, 72, 153, 0.1))`,
                              border: "1px solid rgba(236, 72, 153, 0.6)",
                              animation: `gentle-float ${4 + (i % 3)}s ease-in-out infinite ${i * 0.5}s`,
                              boxShadow:
                                "0 0 12px rgba(236, 72, 153, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                              willChange: "transform, opacity",
                              transform: "translateZ(0)",
                              backdropFilter: "blur(1px)",
                            }}
                          />
                        ))}

                      {/* Pink Theme Heart Shapes */}
                      {isPinkActive &&
                        [...Array(6)].map((_, i) => (
                          <div
                            key={`pink-heart-${i}`}
                            className="absolute pointer-events-none"
                            style={{
                              left: `${15 + ((i * 90) % 170)}%`,
                              top: `${25 + ((i * 45) % 70)}%`,
                              width: "8px",
                              height: "8px",
                              animation: `pink-heartbeat ${2 + (i % 2)}s ease-in-out infinite ${i * 0.6}s`,
                              willChange: "transform",
                              transform: "translateZ(0)",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background: "rgba(236, 72, 153, 0.9)",
                                transform: "rotate(45deg)",
                                borderRadius: "0 50% 50% 50%",
                                boxShadow: "0 0 6px rgba(236, 72, 153, 0.7)",
                              }}
                            />
                          </div>
                        ))}

                      <div className="font-poppins text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold relative z-10">
                        <span
                          className={`relative inline-block mobile-lively-glow ${
                            isPinkActive
                              ? "text-pink-200"
                              : theme === "light"
                                ? "text-gray-900"
                                : "text-white"
                          } ${isPinkActive ? "animate-pink-neon-glow" : "animate-text-pop"}`}
                          style={
                            isPinkActive
                              ? {
                                  filter:
                                    "drop-shadow(0 0 12px rgba(236, 72, 153, 0.7)) drop-shadow(0 0 25px rgba(244, 114, 182, 0.5))",
                                  textShadow: "0 0 8px rgba(236, 72, 153, 0.6)",
                                }
                              : {
                                  filter:
                                    theme === "light"
                                      ? `drop-shadow(0 0 15px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 30px rgba(147, 51, 234, 0.4))`
                                      : `drop-shadow(0 0 20px rgba(73, 146, 255, 0.8)) drop-shadow(0 0 40px rgba(34, 211, 238, 0.5))`,
                                }
                          }
                        >
                          {/* Warm glow text with iOS-inspired styling */}
                          <span
                            aria-label="Development services"
                            role="text"
                            className="inline-block"
                          >
                            {"Development services".split("").map((ch, i) => (
                              <span
                                key={i}
                                aria-hidden="true"
                                className="inline-block relative warm-glow-text animate-warm-glow-pulse animate-wavy-text"
                                style={{
                                  animationDelay: `${i * 0.06}s`,
                                  animationDuration: "2s",
                                }}
                              >
                                {ch === " " ? "\u00A0" : ch}
                              </span>
                            ))}
                          </span>

                          {/* Optimized sparkles for better performance */}
                          {SHINE_CONFIG.showSparkles &&
                            [
                              { x: 95, y: -35, size: 0.8, type: "star" },
                              { x: 75, y: -10, size: 0.6, type: "diamond" },
                              { x: 120, y: 50, size: 0.7, type: "plus" },
                              { x: 90, y: 80, size: 0.9, type: "star" },
                              { x: 25, y: 85, size: 0.5, type: "diamond" },
                              { x: -40, y: 60, size: 0.6, type: "plus" },
                              { x: 165, y: 15, size: 1.0, type: "star" },
                              { x: -20, y: -20, size: 0.7, type: "diamond" },
                            ].map((sparkle, i) => (
                              <div
                                key={`enhanced-sparkle-${i}`}
                                className="absolute pointer-events-none gpu-accelerated"
                                style={{
                                  left: `calc(50% + ${sparkle.x}px)`,
                                  top: `calc(50% + ${sparkle.y}px)`,
                                  animation: `sparkle-enhanced ${6 + (i % 3)}s ease-in-out infinite ${i * 0.5}s`,
                                  transform: `translateZ(0) scale(${sparkle.size})`,
                                  opacity: 0.6,

                                  zIndex: -1,
                                  willChange: "transform, opacity",
                                }}
                              >
                                {sparkle.type === "star" && (
                                  <div
                                    className="w-6 h-6"
                                    style={{
                                      background:
                                        "radial-gradient(circle, rgba(73, 146, 255, 0.8) 0%, rgba(34, 211, 238, 0.5) 70%, transparent 90%)",
                                      clipPath:
                                        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                                      animation:
                                        "spin-slow 15s linear infinite",
                                      filter:
                                        "drop-shadow(0 0 8px currentColor)",
                                    }}
                                  />
                                )}
                                {sparkle.type === "diamond" && (
                                  <div
                                    className="w-4 h-4"
                                    style={{
                                      background:
                                        "linear-gradient(45deg, rgba(73, 146, 255, 0.7), rgba(34, 211, 238, 0.6))",
                                      clipPath:
                                        "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                                      animation:
                                        "gentle-pulse 4s ease-in-out infinite",
                                      filter:
                                        "drop-shadow(0 0 6px currentColor)",
                                    }}
                                  />
                                )}
                                {sparkle.type === "plus" && (
                                  <div
                                    className="w-5 h-5"
                                    style={{
                                      background:
                                        "conic-gradient(from 0deg, rgba(73, 146, 255, 0.7), rgba(34, 211, 238, 0.6), rgba(57, 135, 227, 0.7), rgba(63, 186, 255, 0.6))",
                                      clipPath:
                                        "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                                      animation:
                                        "rotate-slow 12s linear infinite",
                                      filter:
                                        "drop-shadow(0 0 10px currentColor)",
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Floating Decorative Elements */}
              <motion.div
                className={`absolute inset-0 pointer-events-none overflow-hidden ${
                  animationStep >= 4 ? "filter-blur-in" : "filter-blur-out"
                }`}
                initial={{
                  opacity: 0,
                }}
                animate={
                  animationStep >= 4
                    ? {
                        opacity: 1,
                      }
                    : {}
                }
                transition={{
                  duration: 1.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.4,
                }}
              >
                {/* Top corner accent lights */}
                <div
                  className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-30"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(73, 146, 255, 0.2) 0%, transparent 70%)",
                    animation: "gentle-glow 8s ease-in-out infinite",
                  }}
                />
                <div
                  className="absolute top-20 right-16 w-24 h-24 rounded-full opacity-25"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(63, 186, 255, 0.3) 0%, transparent 70%)",
                    animation: "gentle-glow 10s ease-in-out infinite 2s",
                  }}
                />

                {/* Bottom corner lights */}
                <div
                  className="absolute bottom-16 left-20 w-28 h-28 rounded-full opacity-20"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(57, 135, 227, 0.4) 0%, transparent 70%)",
                    animation: "gentle-glow 14s ease-in-out infinite 4s",
                  }}
                />
                <div
                  className="absolute bottom-12 right-12 w-20 h-20 rounded-full opacity-35"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(73, 146, 255, 0.3) 0%, transparent 70%)",
                    animation: "gentle-glow 12s ease-in-out infinite 1s",
                  }}
                />
              </motion.div>

              {/* Down arrow indicator removed per user request */}
            </motion.div>

            {/* About Us Section */}
            <motion.div
              data-section="about"
              className={`${isMobileMenuOpen ? "blur-sm" : ""} overflow-y-auto h-screen`}
              style={{
                display: isStackedFlow
                  ? "block"
                  : currentSection === 1
                    ? "block"
                    : "none",
              }}
            >
              <AboutUsSection
                ref={(el) => (sectionsRef.current[1] = el!)}
                theme={theme}
                isVisible={currentSection === 1}
              />
            </motion.div>

            {/* What we do Section */}
            <motion.div
              data-section="what-we-do"
              className={`${isMobileMenuOpen ? "blur-sm" : ""} overflow-y-auto h-screen`}
              style={{
                display: isStackedFlow
                  ? "block"
                  : currentSection === 2
                    ? "block"
                    : "none",
              }}
            >
              <WhatWeDoSection
                ref={(el) => (sectionsRef.current[2] = el!)}
                theme={theme}
                isVisible={currentSection === 2}
              />
            </motion.div>

            {/* Services Section */}
            <motion.div
              data-section="services"
              className={`${isMobileMenuOpen ? "blur-sm" : ""} overflow-y-auto h-screen`}
              style={{
                display: isStackedFlow
                  ? "block"
                  : currentSection === 3
                    ? "block"
                    : "none",
              }}
            >
              <ServicesSection
                ref={(el) => (sectionsRef.current[3] = el!)}
                theme={theme}
                isVisible={currentSection === 3}
              />
            </motion.div>

            {/* Portfolio Section */}
            <motion.div
              data-section="portfolio"
              className={`${isMobileMenuOpen ? "blur-sm" : ""} overflow-y-auto h-screen`}
              style={{
                display: isStackedFlow
                  ? "block"
                  : currentSection === 4
                    ? "block"
                    : "none",
              }}
            >
              <PortfolioSection
                ref={(el) => (sectionsRef.current[4] = el!)}
                theme={theme}
                isVisible={currentSection === 4}
              />
            </motion.div>

            {/* Pricing Section */}
            <motion.div
              data-section="pricing"
              className={`${isMobileMenuOpen ? "blur-sm" : ""} overflow-y-auto h-screen`}
              style={{
                display: isStackedFlow
                  ? "block"
                  : currentSection === 5
                    ? "block"
                    : "none",
              }}
            >
              <PricingSection
                ref={(el) => (sectionsRef.current[5] = el!)}
                theme={theme}
                isVisible={currentSection === 5}
              />
            </motion.div>

            {/* Contact Us Section */}
            <motion.div
              data-section="contact"
              className={`${isMobileMenuOpen ? "blur-sm" : ""} overflow-y-auto h-screen`}
              style={{
                display: isStackedFlow
                  ? "block"
                  : currentSection === 6
                    ? "block"
                    : "none",
              }}
            >
              <ContactUsSection
                ref={(el) => (sectionsRef.current[6] = el!)}
                theme={theme}
                isVisible={currentSection === 6}
                setShowResultModal={setShowResultModal}
              />
            </motion.div>
          </div>

          {/* Futuristic Navbar */}
          <motion.div
            className="fixed top-4 z-50 w-full flex justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div
              ref={navbarRef}
              className="relative flex items-center gap-3 md:gap-2 lg:gap-4 px-4 py-2 md:px-3 md:py-1.5 lg:px-6 lg:py-3 rounded-full backdrop-blur-xs hover:bg-white/15 transition-all duration-500 hover:scale-105 overflow-hidden max-w-fit mx-auto"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid transparent",
                backgroundClip: "padding-box",
              }}
              onMouseMove={handleNavbarMouseMove}
              onMouseEnter={handleNavbarMouseEnter}
              onMouseLeave={handleNavbarMouseLeave}
            >
              {/* Dynamic Border Effect - cursor following glow */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
                style={{
                  // Static subtle border - no mouse-driven gradient
                  background:
                    "conic-gradient(from 0deg, rgba(255, 255, 255, 0.06) 0deg, rgba(255, 255, 255, 0.03) 360deg)",
                  padding: "2px",
                  borderRadius: "inherit",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "xor",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                }}
              />
              {/* KOR Logo */}
              <img
                src="/kor-logo.png"
                alt="KOR Logo"
                className="w-8 h-8 object-contain"
              />

              {/* Navigation Pills */}
              <div className="hidden md:flex items-center gap-2 lg:gap-2">
                {sections.map((section, index) => (
                  <motion.button
                    key={section.id}
                    onClick={() => scrollToSection(index)}
                    className={`px-2 md:px-2.5 lg:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium transition-all duration-300 relative overflow-hidden animate-textGlow ${
                      currentSection === index
                        ? "text-white"
                        : theme === "light"
                          ? "text-gray-700"
                          : "text-white/80"
                    } ${currentSection === index ? "bg-white/20" : "hover:bg-white/10"}`}
                    whileHover={{
                      scale: 1.05,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {section.title}
                  </motion.button>
                ))}
              </div>

              {/* Mobile Menu Indicator */}
              <div className="md:hidden flex items-center gap-2">
                <div className="text-xs text-gray-300 font-medium">
                  {sections[currentSection]?.title}
                </div>
                <div className="flex gap-1">
                  {sections.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        currentSection === index ? "bg-blue-500" : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Hamburger Menu - Top right corner for non-home pages */}
          {currentSection !== 0 && (
            <div className="fixed top-6 right-6 z-[9999] pointer-events-none sm:hidden">
              <div className="relative pointer-events-auto">
                <MobileHamburgerMenu
                  isOpen={isMobileMenuOpen}
                  setIsOpen={setIsMobileMenuOpen}
                  theme={theme}
                  isHomePage={false}
                />
              </div>
            </div>
          )}

          {/* Back to Top Button - Shows on home page with "scroll down" functionality */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => scrollToSection(0)}
                className={`group absolute z-[99999] p-2 sm:p-2.5 md:p-2.5 lg:p-3 w-10 h-10 sm:w-11 sm:h-11 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full border-2 backdrop-blur-lg hover-120hz performance-optimized flex items-center justify-center ${
                  isMobileSafari || isIOS
                    ? "bottom-20 left-6 sm:left-8 md:left-10 lg:left-12" // Above Safari search bar, matching nav positioning
                    : "bottom-6 sm:bottom-8 md:bottom-10 lg:bottom-12 left-6 sm:left-8 md:left-10 lg:left-12" // Normal position, matching nav positioning
                } ${
                  theme === "light"
                    ? "border-blue-400/40 bg-white/80 hover:bg-white/90"
                    : "border-blue-300/30 bg-blue-400/10 hover:bg-blue-400/20"
                }`}
                style={{
                  position: "fixed",
                  pointerEvents: "auto",
                  background:
                    theme === "light"
                      ? `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`
                      : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                  boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: currentSection === 0 ? 0 : 1, // Hidden on home section
                  scale: currentSection === 0 ? 0 : 1, // Hidden on home section
                }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* Always show up arrow since this is only visible when not on home */}
                {
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 transition-colors duration-300 ${
                      theme === "light"
                        ? "text-blue-600 group-hover:text-blue-700"
                        : "text-white group-hover:text-blue-300"
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Vertical stem */}
                    <line x1="12" y1="19" x2="12" y2="7" />
                    {/* Arrow head */}
                    <polyline points="5,12 12,5 19,12" />
                  </svg>
                }
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span>Back to top</span>
            </TooltipContent>
          </Tooltip>

          {/* Enhanced Background Animations */}
          <style>{`
        :root {
          --badge-margin-top: 140px;
        }
        @media (min-width: 640px) {
          :root {
            --badge-margin-top: 10px;
          }
        }
        @keyframes backgroundShift {
          0%,
          100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(10px) translateY(-5px);
          }
          50% {
            transform: translateX(-5px) translateY(10px);
          }
          75% {
            transform: translateX(15px) translateY(5px);
          }
        }

        @keyframes float-particle {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-20px) translateX(10px) scale(1.2);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-40px) translateX(-15px) scale(0.8);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-20px) translateX(20px) scale(1.1);
            opacity: 0.3;
          }
        }



        @keyframes noise {
          0%,
          100% {
            opacity: 0.05;
            transform: translateX(0) translateY(0);
          }
          50% {
            opacity: 0.1;
            transform: translateX(2px) translateY(1px);
          }
        }

        @keyframes gentle-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
          }
        }


        .animate-float-particle {
          animation: float-particle linear infinite;
        }



        .animate-noise {
          animation: noise 3s ease-in-out infinite;
        }

        @keyframes shine-left-to-right {
          0% {
            background: linear-gradient(
              90deg,
              rgba(178, 227, 255, 0.7) 0%,
              rgba(178, 227, 255, 0.7) 20%,
              rgba(255, 255, 255, 1) 35%,
              rgba(255, 255, 255, 1) 40%,
              rgba(255, 255, 255, 1) 45%,
              rgba(255, 255, 255, 1) 50%,
              rgba(255, 255, 255, 1) 55%,
              rgba(255, 255, 255, 1) 60%,
              rgba(255, 255, 255, 1) 65%,
              rgba(178, 227, 255, 0.7) 80%,
              rgba(178, 227, 255, 0.7) 100%
            );
            background-size: 400% 100%;
            background-position: -150% 0;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          100% {
            background-position: 250% 0;
          }
        }

        @keyframes shine-right-to-left {
          0% {
            background: linear-gradient(
              90deg,
              rgba(178, 227, 255, 0.7) 0%,
              rgba(178, 227, 255, 0.7) 20%,
              rgba(255, 255, 255, 1) 35%,
              rgba(255, 255, 255, 1) 40%,
              rgba(255, 255, 255, 1) 45%,
              rgba(255, 255, 255, 1) 50%,
              rgba(255, 255, 255, 1) 55%,
              rgba(255, 255, 255, 1) 60%,
              rgba(255, 255, 255, 1) 65%,
              rgba(178, 227, 255, 0.7) 80%,
              rgba(178, 227, 255, 0.7) 100%
            );
            background-size: 400% 100%;
            background-position: 250% 0;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          100% {
            background-position: -150% 0;
          }
        }

        @keyframes sparkle-twinkle {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(0.9) rotate(0deg);
          }
          25% {
            opacity: 0.8;
            transform: scale(1.1) rotate(90deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) rotate(180deg);
          }
          75% {
            opacity: 0.8;
            transform: scale(1.1) rotate(270deg);
          }
        }

        @keyframes text-reveal {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
            text-shadow: 0 0 0px rgba(73, 146, 255, 0);
          }
          50% {
            text-shadow: 0 0 30px rgba(73, 146, 255, 0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
            text-shadow: 0 0 20px rgba(73, 146, 255, 0.4);
          }
        }

        @keyframes text-bounce {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.05);
          }
        }

        @keyframes type-writer {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0px);
          }
        }

        @keyframes fade-in-word {
          0% {
            opacity: 0;
            transform: translateY(10px) blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) blur(0px);
          }
        }

        .shine-text-base {
          background: linear-gradient(
            90deg,
            rgba(178, 227, 255, 0.7) 0%,
            rgba(178, 227, 255, 0.7) 20%,
            rgba(255, 255, 255, 1) 35%,
            rgba(255, 255, 255, 1) 40%,
            rgba(255, 255, 255, 1) 45%,
            rgba(255, 255, 255, 1) 50%,
            rgba(255, 255, 255, 1) 55%,
            rgba(255, 255, 255, 1) 60%,
            rgba(255, 255, 255, 1) 65%,
            rgba(178, 227, 255, 0.7) 80%,
            rgba(178, 227, 255, 0.7) 100%
          );
          background-size: 400% 100%;
          background-position: 0% 0;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))
            drop-shadow(0 0 40px rgba(34, 211, 238, 0.4));
        }

        .animate-sparkle-twinkle {
          animation: sparkle-twinkle ease-in-out infinite;
        }

        .animate-text-reveal {
          animation: text-reveal 1.5s ease-out forwards;
        }

        .animate-text-bounce {
          animation: text-bounce 2s ease-in-out infinite;
        }

        @keyframes energy-pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes aurora {
          0%,
          100% {
            opacity: 0.4;
            transform: translateX(-50%) translateY(-50%) rotate(0deg) scale(1);
          }
          33% {
            opacity: 0.7;
            transform: translateX(-45%) translateY(-55%) rotate(120deg)
              scale(1.2);
          }
          66% {
            opacity: 0.5;
            transform: translateX(-55%) translateY(-45%) rotate(240deg)
              scale(0.9);
          }
        }

        @keyframes ambient-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(73, 146, 255, 0.3);
          }
          50% {
            box-shadow:
              0 0 40px rgba(73, 146, 255, 0.6),
              0 0 60px rgba(63, 186, 255, 0.3);
          }
        }

        @keyframes energy-ripple {
          0% {
            transform: scale(0.8);
            opacity: 0;
            border-width: 3px;
          }
          30% {
            transform: scale(1);
            opacity: 0.6;
            border-width: 2px;
          }
          70% {
            transform: scale(1.1);
            opacity: 0.3;
            border-width: 1px;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes subtle-glow {
          0%,
          100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
        }

        @keyframes gentle-glow {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.35;
          }
        }

        .animate-type-writer {
          animation: type-writer 1s ease-out forwards;
        }

        .animate-fade-in-word {
          opacity: 0;
          animation: fade-in-word 0.8s ease-out forwards;
        }

        /* Line clamping utilities */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Mobile responsive utilities */
        @media (max-width: 640px) {
          .mobile-responsive-text {
            font-size: 0.875rem;
            line-height: 1.25rem;
          }

          .mobile-responsive-title {
            font-size: 2rem;
            line-height: 2.5rem;
          }

          .mobile-card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
            padding: 0 1rem;
          }
        }

        /* Ensure content doesn't overflow on small screens */
        @media (max-width: 768px) {
          .section-container {
            padding-left: 1rem;
            padding-right: 1rem;
            max-width: 100vw;
            overflow-x: hidden;
          }

          .responsive-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
        }

        /* Fix text overflow on all sections */
        .section-content {
          max-width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Ensure viewport doesn't overflow */
        html, body {
          max-width: 100vw;
          overflow-x: hidden;
        }

        /* Prevent horizontal scrolling */
        * {
          box-sizing: border-box;
        }

        /* Performance optimizations */
        .gpu-accelerated {
          transform: translateZ(0);
          will-change: transform;
        }

        /* Respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .animate-spin {
            animation: none !important;
          }

          .animate-pulse {
            animation: none !important;
          }

          .animate-bounce {
            animation: none !important;
          }
        }

        /* Optimize rendering with layer hints */
        .ocean-element {
          transform: translateZ(0);
          will-change: transform, opacity;
          contain: layout style paint;
        }

        /* Performance optimizations applied:
           - Reduced animation counts on mobile
           - GPU acceleration for smooth animations
           - Respect for reduced motion preferences
           - Optimized bubble and fish counts
           - Layer hints for better rendering
        */

        /* NEW SPECTACULAR ANIMATIONS FOR EYE CANDY */

        @keyframes desktop-float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotateZ(0deg); }
          25% { transform: translateY(-15px) translateX(8px) rotateZ(2deg); }
          50% { transform: translateY(-25px) translateX(-5px) rotateZ(-1deg); }
          75% { transform: translateY(-10px) translateX(12px) rotateZ(3deg); }
        }

        @keyframes desktop-float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotateZ(0deg); }
          25% { transform: translateY(-12px) translateX(-10px) rotateZ(-2deg); }
          50% { transform: translateY(-30px) translateX(8px) rotateZ(1deg); }
          75% { transform: translateY(-8px) translateX(-15px) rotateZ(-3deg); }
        }

        @keyframes desktop-float-3 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotateZ(0deg); }
          25% { transform: translateY(-20px) translateX(6px) rotateZ(1deg); }
          50% { transform: translateY(-15px) translateX(-12px) rotateZ(-2deg); }
          75% { transform: translateY(-25px) translateX(10px) rotateZ(2deg); }
        }

        @keyframes desktop-float-4 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotateZ(0deg); }
          25% { transform: translateY(-18px) translateX(-8px) rotateZ(-1deg); }
          50% { transform: translateY(-22px) translateX(15px) rotateZ(3deg); }
          75% { transform: translateY(-12px) translateX(-6px) rotateZ(-2deg); }
        }

        @keyframes mobile-float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotateZ(0deg); }
          50% { transform: translateY(-10px) translateX(5px) rotateZ(1deg); }
        }

        @keyframes mobile-float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotateZ(0deg); }
          50% { transform: translateY(-8px) translateX(-3px) rotateZ(-1deg); }
        }

        @keyframes mobile-float-3 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotateZ(0deg); }
          50% { transform: translateY(-12px) translateX(4px) rotateZ(2deg); }
        }

        @keyframes desktop-pulse-corner {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.4; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 0.7; }
        }

        @keyframes mobile-pulse-corner {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
          50% { transform: scale(1.1) rotate(90deg); opacity: 0.8; }
        }

        @keyframes mobile-wave-1 {
          0%, 100% { transform: translateX(0px) translateY(0px) skewY(-2deg) rotate(0deg); }
          50% { transform: translateX(10px) translateY(-5px) skewY(-1deg) rotate(1deg); }
        }

        @keyframes mobile-wave-2 {
          0%, 100% { transform: translateX(0px) translateY(0px) skewY(-1deg) rotate(1deg); }
          50% { transform: translateX(-8px) translateY(8px) skewY(0deg) rotate(2deg); }
        }

        @keyframes mobile-wave-3 {
          0%, 100% { transform: translateX(0px) translateY(0px) skewY(0deg) rotate(2deg); }
          50% { transform: translateX(12px) translateY(-3px) skewY(1deg) rotate(3deg); }
        }

        /* Mobile Touch Feedback Animations */
        @keyframes mobile-touch-ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes mobile-bounce-in {
          0% {
            transform: scale(0.3) translateY(20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) translateY(-5px);
            opacity: 0.8;
          }
          70% {
            transform: scale(0.9) translateY(2px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0px);
            opacity: 1;
          }
        }

        @keyframes mobile-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1deg) scale(1.01); }
          75% { transform: rotate(-1deg) scale(1.01); }
        }

        @keyframes mobile-pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.3);
            transform: scale(1.02);
          }
        }

        .animate-wiggle {
          animation: mobile-wiggle 3s ease-in-out infinite;
        }

        @keyframes aurora-wave-subtle-1 {
          0%, 100% { transform: translateX(-15%) translateY(0%) skewY(-1deg) scale(1); }
          25% { transform: translateX(-12%) translateY(-2%) skewY(-0.5deg) scale(1.05); }
          50% { transform: translateX(-10%) translateY(1%) skewY(0deg) scale(1.1); }
          75% { transform: translateX(-13%) translateY(-1%) skewY(-0.8deg) scale(1.02); }
        }

        @keyframes aurora-wave-subtle-2 {
          0%, 100% { transform: translateX(-20%) translateY(0%) skewY(0.5deg) scale(1); }
          25% { transform: translateX(-18%) translateY(1%) skewY(1deg) scale(1.03); }
          50% { transform: translateX(-15%) translateY(-1%) skewY(0.2deg) scale(1.08); }
          75% { transform: translateX(-22%) translateY(0.5%) skewY(0.8deg) scale(1.01); }
        }

        @keyframes aurora-wave-subtle-3 {
          0%, 100% { transform: translateX(-25%) translateY(0%) skewY(-0.5deg) scale(1); }
          25% { transform: translateX(-20%) translateY(-1%) skewY(0deg) scale(1.02); }
          50% { transform: translateX(-28%) translateY(1%) skewY(-1deg) scale(1.06); }
          75% { transform: translateX(-23%) translateY(-0.5%) skewY(-0.3deg) scale(1.01); }
        }

        @keyframes aurora-base-flow-subtle {
          0%, 100% { transform: translateX(-30%) translateY(0%) skewY(0.3deg) scale(1); }
          25% { transform: translateX(-25%) translateY(-1%) skewY(0.6deg) scale(1.04); }
          50% { transform: translateX(-35%) translateY(0.5%) skewY(0deg) scale(1.08); }
          75% { transform: translateX(-28%) translateY(-0.3%) skewY(0.4deg) scale(1.02); }
        }

        @keyframes desktop-wave-1 {
          0%, 100% { transform: translateX(0px) translateY(0px) skewY(-1.5deg) rotate(0deg); }
          50% { transform: translateX(15px) translateY(-8px) skewY(-1deg) rotate(1.5deg); }
        }

        @keyframes desktop-wave-2 {
          0%, 100% { transform: translateX(0px) translateY(0px) skewY(-1deg) rotate(1.5deg); }
          50% { transform: translateX(-12px) translateY(10px) skewY(-0.5deg) rotate(3deg); }
        }

        @keyframes desktop-wave-3 {
          0%, 100% { transform: translateX(0px) translateY(0px) skewY(-0.5deg) rotate(3deg); }
          50% { transform: translateX(20px) translateY(-5px) skewY(0deg) rotate(4.5deg); }
        }

        @keyframes desktop-wave-4 {
          0%, 100% { transform: translateX(0px) translateY(0px) skewY(0deg) rotate(4.5deg); }
          50% { transform: translateX(-18px) translateY(12px) skewY(0.5deg) rotate(6deg); }
        }

        @keyframes color-shift {
          0%, 100% { filter: hue-rotate(0deg) brightness(1) saturate(1); }
          25% { filter: hue-rotate(90deg) brightness(1.2) saturate(1.3); }
          50% { filter: hue-rotate(180deg) brightness(1.1) saturate(1.1); }
          75% { filter: hue-rotate(270deg) brightness(1.3) saturate(1.2); }
        }

        @keyframes energy-float {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0.6; }
          25% { transform: translateY(-8px) scale(1.1) rotate(90deg); opacity: 0.8; }
          50% { transform: translateY(-12px) scale(1.2) rotate(180deg); opacity: 1; }
          75% { transform: translateY(-6px) scale(1.05) rotate(270deg); opacity: 0.9; }
        }

        @keyframes breath {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
          50% { transform: scale(1.3) rotate(180deg); opacity: 0.6; }
        }

        @keyframes geometric-pulse {
          0%, 100% { opacity: 0.3; stroke-dashoffset: 0; }
          50% { opacity: 0.8; stroke-dashoffset: 15; }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        @keyframes warm-glow-pulse {
          0%, 100% { text-shadow: 0 0 10px rgba(73, 146, 255, 0.4), 0 0 20px rgba(34, 211, 238, 0.3); }
          50% { text-shadow: 0 0 20px rgba(73, 146, 255, 0.8), 0 0 40px rgba(34, 211, 238, 0.6), 0 0 60px rgba(147, 51, 234, 0.4); }
        }

        @keyframes letter-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(1deg); }
        }

        @keyframes dev-services-text {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-2px) scale(1.02); }
        }

        @keyframes wavy-text {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @keyframes text-pop {
          0% { transform: scale(0.95); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        @keyframes sparkle-enhanced {
          0%, 100% { opacity: 0.4; transform: scale(0.8) rotate(0deg); }
          25% { opacity: 0.8; transform: scale(1.1) rotate(90deg); }
          50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
          75% { opacity: 0.8; transform: scale(1.1) rotate(270deg); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes gentle-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes bubble-pop-in {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { opacity: 0.8; transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0px); }
        }

        @keyframes button-drift {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(3px) translateY(-2px); }
          50% { transform: translateX(-2px) translateY(4px); }
          75% { transform: translateX(4px) translateY(1px); }
        }

        /* Mobile fixes for service cards - fill gaps in corners */
        @media (max-width: 640px) {
          .responsive-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.25rem !important;
            width: 100% !important;
            padding: 0 !important;
          }

          .responsive-grid > div {
            width: 100% !important;
            height: 100% !important;
          }

          .responsive-grid > div > div {
            width: 100% !important;
            height: 100% !important;
            min-height: 200px !important;
            border-radius: 0.75rem !important;
          }

          /* iPhone 14 specific optimizations */
          .section-container {
            min-height: 100vh !important;
            padding-top: 3rem !important;
            padding-bottom: 5rem !important;
          }

          .section-content {
            padding-top: 1.5rem !important;
            padding-bottom: 4rem !important;
          }

          /* Reduce vertical spacing on small screens */
          h1 {
            margin-bottom: 1.5rem !important;
          }

          /* Optimize text sizing for readability */
          .warm-glow-text {
            line-height: 1.2 !important;
          }
        }

        /* Improve button tap targets on mobile */
        @media (max-width: 768px) {
          button {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Performance optimizations for animations */
        .gpu-accelerated {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform;
        }

        .composite-layer {
          transform: translateZ(0);
        }

        .scroll-optimized {
          overflow-scrolling: touch;
          -webkit-overflow-scrolling: touch;
        }

        .scroll-simplified * {
          will-change: auto !important;
          animation-play-state: paused !important;
        }

        /* Ensure fixed navigation elements stay truly fixed to viewport */
        .fixed {
          position: fixed !important;
        }

        /* Specific overrides for navigation elements to ensure viewport-relative positioning */
        .help-button,
        .help-button *,
        [class*="fixed right-"],
        [class*="fixed left-"] {
          position: fixed !important;
          z-index: 9999 !important;
        }

        /* Force navigation buttons to be viewport-relative */
        div[class*="fixed right-"][class*="top-1/2"] {
          position: fixed !important;
          top: 50vh !important;
          transform: translateY(-50%) !important;
          z-index: 9999 !important;
        }

        div[class*="fixed left-"][class*="top-1/2"] {
          position: fixed !important;
          top: 50vh !important;
          transform: translateY(-50%) !important;
          z-index: 9999 !important;
        }

        div[class*="help-button"][class*="fixed"] {
          position: fixed !important;
          z-index: 9999 !important;
        }

        .warm-glow-text {
          animation: warm-glow-pulse 4s ease-in-out infinite;
        }

        .animate-warm-glow-pulse {
          animation: warm-glow-pulse 4s ease-in-out infinite;
        }

        .animate-letter-float {
          animation: letter-float 3s ease-in-out infinite;
        }

        .animate-dev-services-text {
          animation: dev-services-text 2s ease-in-out infinite;
        }

        .animate-wavy-text {
          animation: wavy-text 2s ease-in-out infinite;
        }

        .animate-text-pop {
          animation: text-pop 0.6s ease-out;
        }

        /* Enhanced sparkle animations for section headers */
        .section-header-sparkle {
          animation: sparkle-enhanced ease-in-out infinite;
          transform-origin: center;
          backface-visibility: hidden;
          perspective: 1000px;
        }

        /* Enhanced text glow effects for section headers */
        .section-header-text {
          text-shadow: 0 0 10px rgba(73, 146, 255, 0.4), 0 0 20px rgba(34, 211, 238, 0.3);
          transition: text-shadow 0.3s ease;
        }

        .section-header-text:hover {
          text-shadow: 0 0 15px rgba(73, 146, 255, 0.6), 0 0 30px rgba(34, 211, 238, 0.5), 0 0 45px rgba(147, 51, 234, 0.3);
        }

        /* Performance optimizations for sparkles */
        @media (prefers-reduced-motion: reduce) {
          .section-header-sparkle {
            animation: none !important;
            opacity: 0.3 !important;
          }
        }

        /* Smooth text rendering for subtitle elements */
        .warm-glow-text span.inline-block {
          transition: transform 0.2s ease;
          will-change: auto;
          backface-visibility: hidden;
        }

        /* Prevent animation conflicts in subtitles */
        .warm-glow-text .inline-block:not(.animate-letter-float) {
          transform: translateZ(0);
        }
      `}</style>
        </div>
      </>
    // </TooltipProvider>
  );
}

// Contact Section Specific Animations CSS
const contactAnimationsCSS = `
  @keyframes contact-signal-wave {
    0%, 100% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(2);
      opacity: 0.2;
    }
  }

  @keyframes contact-data-flow {
    0% {
      offset-distance: 0%;
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      offset-distance: 100%;
      opacity: 0;
    }
  }

  @keyframes contact-card-hover {
    0%, 100% {
      transform: translateY(0) rotateX(0);
      opacity: 0.3;
    }
    50% {
      transform: translateY(-10px) rotateX(5deg);
      opacity: 0.8;
    }
  }

  @keyframes contact-frequency {
    0%, 100% {
      height: 10px;
    }
    50% {
      height: 30px;
    }
  }

  @keyframes contact-status-blink {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes contact-network-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.5);
      opacity: 1;
    }
  }

  @keyframes contact-message-bubble {
    0% {
      transform: translateY(20px) scale(0.8);
      opacity: 0;
    }
    25%, 75% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-20px) scale(0.8);
      opacity: 0;
    }
  }

  @keyframes contact-social-preview {
    0% {
      transform: rotateY(90deg) scale(0.8);
      opacity: 0;
    }
    25%, 75% {
      transform: rotateY(0deg) scale(1);
      opacity: 0.4;
    }
    100% {
      transform: rotateY(-90deg) scale(0.8);
      opacity: 0;
    }
  }

  @keyframes contact-comm-icon-float {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    25% {
      transform: translateY(-10px) rotate(5deg);
    }
    50% {
      transform: translateY(-5px) rotate(-3deg);
    }
    75% {
      transform: translateY(-8px) rotate(2deg);
    }
  }

  .animate-contact-signal-wave {
    animation: contact-signal-wave 4s ease-in-out infinite;
  }

  .animate-contact-data-flow {
    animation: contact-data-flow 5s ease-in-out infinite;
  }

  .animate-contact-card-hover {
    animation: contact-card-hover 8s ease-in-out infinite;
  }

  .animate-contact-frequency {
    animation: contact-frequency 1.5s ease-in-out infinite;
  }

  .animate-contact-status-blink {
    animation: contact-status-blink 3s ease-in-out infinite;
  }

  .animate-contact-network-pulse {
    animation: contact-network-pulse 3s ease-in-out infinite;
  }

  .animate-contact-message-bubble {
    animation: contact-message-bubble 4s ease-in-out infinite;
  }

  .animate-contact-social-preview {
    animation: contact-social-preview 6s ease-in-out infinite;
  }

  .animate-contact-comm-icon-float {
    animation: contact-comm-icon-float 6s ease-in-out infinite;
  }

  /* Mobile and Tablet Performance Optimizations */
  @media (max-width: 991px) {
    .animate-noise {
      animation: none !important;
      opacity: 0.02 !important;
    }

    .animate-aurora-wave-subtle,
    .animate-aurora-wave-subtle-1,
    .animate-aurora-wave-subtle-2 {
      animation-duration: 60s !important;
      opacity: 0.3 !important;
    }

    .animate-geometric-pulse {
      animation-duration: 12s !important;
    }

    .animate-gentleFloat {
      animation-duration: 8s !important;
    }

    .animate-sparkle {
      animation: none !important;
    }

    /* Keep GPU acceleration for background elements, disable only for content */
    [data-section]:not([data-section="home"]) .gpu-accelerated {
      transform: none !important;
      will-change: auto !important;
    }
  }

  @media (max-width: 640px) {
    .animate-breath {
      animation-duration: 10s !important;
    }

    .animate-subtle-glow {
      animation-duration: 20s !important;
    }

    /* Further reduce animations on mobile */
    .animate-aurora,
    .animate-aurora-1,
    .animate-aurora-2 {
      animation: none !important;
      opacity: 0.05 !important;
    }
  }

  @keyframes bubble-bounce-enhanced {
    0% {
      transform: translateY(30px) scale(0) rotate(-45deg);
      opacity: 0;
      filter: blur(4px);
    }
    15% {
      transform: translateY(-10px) scale(1.2) rotate(5deg);
      opacity: 1;
      filter: blur(0px);
    }
    30% {
      transform: translateY(5px) scale(0.9) rotate(-2deg);
    }
    45% {
      transform: translateY(-5px) scale(1.1) rotate(0deg);
    }
    85% {
      transform: translateY(-5px) scale(1) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(30px) scale(0) rotate(45deg);
      opacity: 0;
      filter: blur(4px);
    }
  }

  @keyframes bubble-typewriter-enhanced {
    0% {
      transform: translateX(-20px) scale(0.5) rotate(-30deg);
      opacity: 0;
      filter: blur(3px);
    }
    20% {
      transform: translateX(5px) scale(1) rotate(0deg);
      opacity: 1;
      filter: blur(0px);
    }
    80% {
      transform: translateX(0px) scale(1) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateX(20px) scale(0.5) rotate(30deg);
      opacity: 0;
      filter: blur(3px);
    }
  }

  @keyframes bubble-pulse-enhanced {
    0% {
      transform: scale(0.3);
      opacity: 0;
      filter: blur(5px);
    }
    25% {
      transform: scale(0.9);
      opacity: 0.8;
      filter: blur(1px);
    }
    50% {
      transform: scale(1.3);
      opacity: 1;
      filter: blur(0px);
    }
    75% {
      transform: scale(1);
      opacity: 0.8;
      filter: blur(1px);
    }
    100% {
      transform: scale(0.3);
      opacity: 0;
      filter: blur(5px);
    }
  }

  @keyframes bubble-rocket-enhanced {
    0% {
      transform: translateX(-30px) translateY(50px) scale(0.2) rotate(-90deg);
      opacity: 0;
      filter: blur(6px);
    }
    20% {
      transform: translateX(10px) translateY(-15px) scale(1) rotate(-15deg);
      opacity: 1;
      filter: blur(0px);
    }
    40% {
      transform: translateX(-5px) translateY(5px) scale(1) rotate(5deg);
    }
    60% {
      transform: translateX(0px) translateY(-10px) scale(1) rotate(15deg);
    }
    80% {
      transform: translateX(0px) translateY(-10px) scale(1) rotate(15deg);
      opacity: 1;
    }
    100% {
      transform: translateX(30px) translateY(50px) scale(0.2) rotate(90deg);
      opacity: 0;
      filter: blur(6px);
    }
  }

  @keyframes shimmer-effect {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(200%);
    }
  }

  @keyframes particle-trail {
    0% {
      opacity: 0;
      transform: translateX(-10px) scale(0);
    }
    50% {
      opacity: 1;
      transform: translateX(-20px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateX(-30px) scale(0);
    }
  }

  @keyframes glow-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0;
    }
    50% {
      transform: scale(1.5);
      opacity: 0.3;
    }
  }

  .animate-bubble-bounce-enhanced {
    animation: bubble-bounce-enhanced 5s ease-out infinite;
  }

  .animate-bubble-typewriter-enhanced {
    animation: bubble-typewriter-enhanced 5s ease-in-out infinite;
  }

  .animate-bubble-pulse-enhanced {
    animation: bubble-pulse-enhanced 3.5s ease-in-out infinite;
  }

  .animate-bubble-rocket-enhanced {
    animation: bubble-rocket-enhanced 5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  }

  .animate-shimmer-effect {
    animation: shimmer-effect 2s ease-in-out infinite;
  }

  .animate-particle-trail {
    animation: particle-trail 1s ease-out infinite;
  }

  .animate-glow-pulse {
    animation: glow-pulse 2s ease-in-out infinite;
  }
`;

// Inject the CSS into the document head
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = contactAnimationsCSS;
  document.head.appendChild(style);
}

// ========================================
// MOBILE HAMBURGER MENU COMPONENT
// ========================================

interface MobileHamburgerMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  theme: "light" | "dark";
  isHomePage: boolean;
}

function MobileHamburgerMenu({
  isOpen,
  setIsOpen,
  theme,
  isHomePage,
}: MobileHamburgerMenuProps) {
  const isPinkActive = false; // Pink theme removed
  const [menuPosition, setMenuPosition] = useState({ left: 70, top: -80 });

  // Spam protection for menu toggle
  const { protectedCallback: protectedToggleMenu } = useSpamProtection(
    () => setIsOpen(!isOpen),
    SPAM_PROTECTION_PRESETS.fast,
  );

  // Spam protection for menu close
  const { protectedCallback: protectedCloseMenu } = useSpamProtection(
    () => setIsOpen(false),
    SPAM_PROTECTION_PRESETS.fast,
  );

  // Spam protection for menu item navigation
  const { protectedCallback: protectedNavigateFromMenu } = useSpamProtection(
    (itemText: string) => {
      setIsOpen(false);
      const sectionMap: { [key: string]: number } = {
        "About us": 1,
        "What we do?": 2,
        Pricing: 4,
        Services: 3,
        Portfolio: 4,
        "Contact us": 5,
      };
      const sectionIndex = sectionMap[itemText];
      if (sectionIndex) {
        const event = new CustomEvent("scrollToSection", {
          detail: sectionIndex,
        });
        window.dispatchEvent(event);
      }
    },
    SPAM_PROTECTION_PRESETS.standard,
  );

  const menuItems = [
    { text: "Home" },
    { text: "About us" },
    { text: "What we do?" },
    { text: "Pricing" },
    { text: "Services" },
    { text: "Portfolio" },
    { text: "Contact us" },
  ];

  // Calculate safe menu position to avoid screen overflow
  const calculateMenuPosition = () => {
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 320; // Increased height for button-style items (now with Home button)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonX = viewportWidth / 2 + 70; // Button position
    const buttonY = viewportHeight / 2 - 130; // Button position

    let left = 70;
    let top = -80; // Closer to button

    // Check right boundary
    if (buttonX + menuWidth > viewportWidth - 20) {
      left = 70 - (menuWidth + 40); // Move menu to left of button
    }

    // Check bottom boundary
    if (buttonY + menuHeight > viewportHeight - 20) {
      top = -menuHeight - 20; // Move menu above button
    }

    // Check top boundary
    if (buttonY + top < 20) {
      top = 20 - buttonY; // Move menu down to stay in view
    }

    // Check left boundary
    if (buttonX + left < 20) {
      left = 20 - viewportWidth / 2; // Adjust to stay in view
    }

    return { left, top };
  };

  useEffect(() => {
    if (isOpen) {
      const position = calculateMenuPosition();
      setMenuPosition(position);
    }
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button - MOBILE ONLY */}
      <div
        className={`pointer-events-auto z-50 sm:hidden ${
          isHomePage
            ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            : "relative"
        }`}
        style={
          isHomePage
            ? {
                marginLeft: "40px", // Mobile: moved left 30px from 70px
                marginTop: "-100px", // Mobile: moved down 30px from -130px
                animationDelay: "0.2s",
                animation:
                  "gentleFloat 4s ease-in-out infinite 0.2s, button-drift 8s ease-in-out infinite 0.3s, bubble-pop-in 0.6s ease-out forwards",
              }
            : {
                // For non-home pages, ensure proper positioning
                position: "static",
                transform: "none",
                animation: "none",
              }
        }
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={protectedToggleMenu}
              whileTap={{
                scale: 0.9,
                rotate: 5,
                transition: { duration: 0.1 },
              }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              animate={{
                scale: isOpen ? 1.05 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                duration: 0.2,
              }}
              className={`group relative px-3 py-3 rounded-xl border-2 backdrop-blur-2xl hover:backdrop-blur-3xl transition-all duration-700 hover:shadow-2xl overflow-hidden ${
                isPinkActive
                  ? "border-pink-400/50 bg-pink-500/10 hover:border-pink-500/70"
                  : theme === "light"
                    ? "border-blue-400/40 bg-white/30 hover:border-blue-500/60"
                    : "border-blue-300/30 bg-blue-400/5 hover:border-white/40"
              }`}
              style={{
                background:
                  theme === "light"
                    ? `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`
                    : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
              }}
            >
              {/* Animated background layers */}
              <div
                className={`absolute inset-0 rounded-xl opacity-50 group-hover:opacity-70 transition-all duration-500 ${
                  isPinkActive
                    ? "bg-gradient-to-br from-pink-400/30 via-pink-300/15 to-transparent"
                    : "bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-transparent"
                }`}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tl from-white/20 via-transparent to-white/10 opacity-30 group-hover:opacity-50 transition-all duration-500" />

              {/* Hamburger Icon */}
              <div className="relative w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <div
                  className={`w-5 h-0.5 bg-current ${
                    isOpen ? "rotate-45 translate-y-1.5" : ""
                  } ${theme === "light" ? "text-gray-800" : "text-white/90"}`}
                />
                <div
                  className={`w-5 h-0.5 bg-current ${
                    isOpen ? "opacity-0" : ""
                  } ${theme === "light" ? "text-gray-800" : "text-white/90"}`}
                />
                <div
                  className={`w-5 h-0.5 bg-current ${
                    isOpen ? "-rotate-45 -translate-y-1.5" : ""
                  } ${theme === "light" ? "text-gray-800" : "text-white/90"}`}
                />
              </div>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>
              {isOpen ? "Close navigation menu" : "Open navigation menu"}
            </span>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Enhanced Backdrop overlay with synchronized menu content */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 mobile-menu-backdrop"
            onClick={protectedCloseMenu}
            style={{
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              willChange: "opacity",
            }}
          >
            {/* Mobile Menu Content - Synchronized with backdrop */}
            <div
              className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 mobile-menu-content"
              style={{
                marginLeft: `${menuPosition.left}px`,
                marginTop: `${menuPosition.top}px`,
                willChange: "transform, opacity",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`relative rounded-2xl border-2 p-4 w-[200px] max-w-[90vw] will-change-transform ${
                  theme === "light"
                    ? "border-blue-400/40 bg-white/30"
                    : "border-blue-300/30 bg-blue-400/5"
                }`}
                style={{
                  background:
                    theme === "light"
                      ? `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`
                      : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                  boxShadow:
                    "0 0 25px rgba(73, 146, 255, 0.4), 0 0 50px rgba(73, 146, 255, 0.2)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                {/* Simple background for performance */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/15 to-transparent opacity-40" />

                {/* Menu Items - Optimized for performance */}
                <div className="relative space-y-2">
                  {menuItems.map((item, index) => (
                    <button
                      key={item.text}
                      className={`group w-full px-4 py-3 rounded-xl border-2 hover:shadow-xl overflow-hidden relative mobile-menu-item ${
                        theme === "light"
                          ? "border-blue-400/40 bg-white/30 hover:border-blue-500/60 text-gray-800 hover:text-gray-900"
                          : "border-blue-300/30 bg-blue-400/5 hover:border-white/40 text-white/90 hover:text-white"
                      }`}
                      style={{
                        background:
                          theme === "light"
                            ? `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`
                            : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                      }}
                      onClick={() => protectedNavigateFromMenu(item.text)}
                    >
                      {/* Simplified background layers for performance */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-200" />

                      {/* Button text */}
                      <span className="relative font-poppins font-semibold text-sm tracking-wide">
                        {item.text}
                      </span>

                      {/* Subtle highlight */}
                      <div className="absolute top-0.5 left-0.5 right-0.5 h-1/3 rounded-xl bg-gradient-to-b from-white/15 via-white/5 to-transparent opacity-0 group-hover:opacity-50" />
                    </button>
                  ))}
                </div>

                {/* Simple top highlight for visual appeal */}
                <div className="absolute top-0.5 left-0.5 right-0.5 h-px rounded-2xl bg-white/20" />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ========================================
// BUTTON POSITIONING CONFIGURATION
// ========================================
// Edit these values to easily adjust button positions

const ORB_BUTTON_CONFIG = {
  global: {
    mobileRadiusMultiplier: 0.35,
    tabletRadiusMultiplier: 0.5,
    desktopRadiusMultiplier: 0.7,
    animationDuration: "600ms",
    hoverScale: 1.15,
  },
  buttons: [
    {
      text: "About us",
      targetId: "about",
      angle: -30,
      radius: 280,
      position: "top-right",
      animationDelay: 0.3,
      size: "medium",
      accent: "blue",
      xOffset: 0,
      yOffset: -20,
      customRadiusMultiplier: null,
    },
    {
      text: "What we do?",
      targetId: "what-we-do",
      angle: 0,
      radius: 280,
      position: "center-right",
      animationDelay: 0.45,
      size: "medium",
      accent: "blue",
      xOffset: 70,
      yOffset: 0,
      customRadiusMultiplier: null,
    },
    {
      text: "Pricing",
      targetId: "pricing",
      angle: -30,
      radius: 280,
      position: "top-center",
      animationDelay: 0.55,
      size: "medium",
      accent: "blue",
      xOffset: -80,
      yOffset: -10,
      customRadiusMultiplier: null,
    },
    {
      text: "Services",
      targetId: "services",
      angle: 30,
      radius: 280,
      position: "bottom-right",
      animationDelay: 0.6,
      size: "medium",
      accent: "blue",
      xOffset: 0,
      yOffset: 10,
      customRadiusMultiplier: null,
    },
    {
      text: "Portfolio",
      targetId: "portfolio",
      angle: 150,
      radius: 280,
      position: "bottom-left",
      animationDelay: 0.9,
      size: "medium",
      accent: "blue",
      xOffset: 0,
      yOffset: 15,
      customRadiusMultiplier: null,
    },
    {
      text: "Contact us",
      targetId: "contact",
      angle: -150,
      radius: 280,
      position: "top-left",
      animationDelay: 1.2,
      size: "medium",
      accent: "blue",
      xOffset: -20,
      yOffset: -75,
      customRadiusMultiplier: null,
    },
  ],
};

// ========================================
// QUICK POSITIONING GUIDE:
// ========================================
//
// ANGLES (degrees around circle):
// -90 or 270 = Top
// 0 = Right
// 90 = Bottom
// 180 or -180 = Left
//
// RADIUS: Distance from center (try values 150-300)
//
// OFFSETS: Fine-tune positioning in pixels
// xOffset: negative = left, positive = right
// yOffset: negative = up, positive = down
//
// SCREEN SIZE MULTIPLIERS:
// 0.5 = half distance, 1.0 = full distance, 1.5 = 50% further
//
// ========================================
// USAGE EXAMPLES:
// ========================================
//
// To move "Services" button 50px to the right:
// Change: xOffset: 0  →  xOffset: 50
//
// To move "About us" button 30px up:
// Change: yOffset: 0  ����  yOffset: -30
//
// To make all buttons closer to center on mobile:
// Change: mobileRadiusMultiplier: 0.5  →  mobileRadiusMultiplier: 0.3
//
// To make "Portfolio" button appear at the top:
// Change: angle: 125  →  angle: -90
//
// To make buttons grow more on hover:
// Change: hoverScale: 1.05  ————��——→  hoverScale: 1.15
//
// ========================================

function OrbFloatingButtons({ animationStep }: { animationStep: number }) {
  const { theme } = useTheme();

  // Access the parent component's scrollToSection function
  const scrollToSection = (index: number) => {
    const event = new CustomEvent("scrollToSection", { detail: index });
    window.dispatchEvent(event);
  };

  // Button configuration with access to scrollToSection
  const buttonConfig = {
    global: ORB_BUTTON_CONFIG.global,
    buttons: [
      // Map each configured button to its section index dynamically
      ...ORB_BUTTON_CONFIG.buttons.map((b) => ({
        ...b,
        onClick: () => {
          const idx = getSectionIndex(b.targetId ?? b.text);
          if (idx !== -1) scrollToSection(idx);
        },
      })),
    ],
  };
  return (
    <>
      {buttonConfig.buttons.map((button) => (
        <OrbFloatingButton
          key={button.text}
          text={button.text}
          angle={button.angle}
          position={button.position}
          radius={button.radius}
          delay={button.animationDelay}
          xOffset={button.xOffset}
          yOffset={button.yOffset}
          customRadiusMultiplier={button.customRadiusMultiplier}
          size={button.size}
          accent={button.accent}
          theme={theme}
          animationStep={animationStep}
          onClick={() => {
            if (button.text === "About us") scrollToSection(1);
            else if (button.text === "What we do?") scrollToSection(2);
            else if (button.text === "Pricing") scrollToSection(5);
            else if (button.text === "Services") scrollToSection(3);
            else if (button.text === "Portfolio") scrollToSection(4);
            else if (button.text === "Contact us") scrollToSection(6);
            else button.onClick?.();
          }}
        />
      ))}
    </>
  );
}

interface OrbFloatingButtonProps {
  text: string;
  angle: number;
  position: string;
  radius: number;
  delay: number;
  xOffset: number;
  yOffset: number;
  customRadiusMultiplier: number | null;
  size: string;
  accent: string;
  theme: "light" | "dark";
  animationStep: number;
  onClick?: () => void;
}

function OrbFloatingButton({
  text,
  angle,
  position,
  radius,
  delay,
  xOffset,
  yOffset,
  customRadiusMultiplier,
  size,
  accent,
  theme,
  animationStep,
  onClick,
}: OrbFloatingButtonProps) {
  // Only render button if animation step is 4 or higher
  if (animationStep < 4) {
    return null;
  }
  // Calculate base position from angle
  const radian = (angle * Math.PI) / 180;
  const x = Math.cos(radian);
  const y = Math.sin(radian);

  // Get radius multipliers from config or use custom override
  const mobileMultiplier =
    customRadiusMultiplier || ORB_BUTTON_CONFIG.global.mobileRadiusMultiplier;
  const tabletMultiplier =
    customRadiusMultiplier || ORB_BUTTON_CONFIG.global.tabletRadiusMultiplier;
  const desktopMultiplier =
    customRadiusMultiplier || ORB_BUTTON_CONFIG.global.desktopRadiusMultiplier;

  // Size configurations for different button variants - mobile-optimized
  const sizeConfig = {
    small: {
      padding: "px-2 py-1 sm:px-4 sm:py-2 md:px-5 md:py-2.5",
      text: "text-xs sm:text-sm md:text-sm",
      radius: "rounded-md sm:rounded-xl md:rounded-2xl",
      scale: 0.75, // Smaller on mobile
    },
    medium: {
      padding: "px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-3",
      text: "text-xs sm:text-sm md:text-base",
      radius: "rounded-lg sm:rounded-xl md:rounded-3xl",
      scale: 0.8, // Appropriately sized for mobile
    },
    large: {
      padding: "px-3 py-1.5 sm:px-6 sm:py-3 md:px-8 md:py-4",
      text: "text-sm sm:text-lg md:text-xl",
      radius: "rounded-lg sm:rounded-3xl md:rounded-3xl",
      scale: 0.95, // Smaller on mobile
    },
  };

  // Accent color configurations
  const accentConfig = {
    cyan: {
      glow: "rgba(34, 211, 238, 0.6)",
      gradient: "from-cyan-400/20 via-cyan-300/10 to-transparent",
      shadow:
        "0 0 25px rgba(34, 211, 238, 0.4), 0 0 50px rgba(34, 211, 238, 0.2)",
      border: "border-cyan-300/30",
      bg: "bg-cyan-400/5",
    },
    purple: {
      glow: "rgba(147, 51, 234, 0.6)",
      gradient: "from-purple-400/20 via-purple-300/10 to-transparent",
      shadow:
        "0 0 25px rgba(147, 51, 234, 0.4), 0 0 50px rgba(147, 51, 234, 0.2)",
      border: "border-purple-300/30",
      bg: "bg-purple-400/5",
    },
    blue: {
      glow: "rgba(59, 130, 246, 0.6)",
      gradient: "from-blue-400/20 via-blue-300/10 to-transparent",
      shadow:
        "0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2)",
      border: "border-blue-300/30",
      bg: "bg-blue-400/5",
    },
    green: {
      glow: "rgba(34, 197, 94, 0.6)",
      gradient: "from-green-400/20 via-green-300/10 to-transparent",
      shadow:
        "0 0 25px rgba(34, 197, 94, 0.4), 0 0 50px rgba(34, 197, 94, 0.2)",
      border: "border-green-300/30",
      bg: "bg-green-400/5",
    },
  };

  const currentSize =
    sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.medium;
  const currentAccent =
    accentConfig[accent as keyof typeof accentConfig] || accentConfig.cyan;

  return (
    <div
      className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] animate-gentleFloat hidden sm:block"
      style={
        {
          "--mobile-x": `${Math.max(-120, Math.min(120, x * radius * mobileMultiplier + xOffset))}px`,
          "--mobile-y": `${Math.max(-120, Math.min(120, y * radius * mobileMultiplier + yOffset))}px`,
          "--tablet-x": `${Math.max(-180, Math.min(180, x * radius * tabletMultiplier + xOffset))}px`,
          "--tablet-y": `${Math.max(-150, Math.min(150, y * radius * tabletMultiplier + yOffset))}px`,
          "--desktop-x": `${x * radius * desktopMultiplier + xOffset}px`,
          "--desktop-y": `${y * radius * desktopMultiplier + yOffset}px`,
          marginLeft: "var(--mobile-x)",
          marginTop: "var(--mobile-y)",
          animationDelay: `${delay}s`,
          transform: `scale(${currentSize.scale})`,
          animation: `gentleFloat 4s ease-in-out infinite ${delay}s, button-drift ${8 + delay * 2}s ease-in-out infinite ${delay * 1.5}s, bubble-pop-in 0.5s ease-out ${0.2 + delay}s both`,
        } as React.CSSProperties
      }
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media (min-width: 640px) and (max-width: 767px) {
            [style*="--mobile-x"] {
              margin-left: var(--tablet-x) !important;
              margin-top: var(--tablet-y) !important;
            }
          }
          @media (min-width: 768px) {
            [style*="--mobile-x"] {
              margin-left: var(--desktop-x) !important;
              margin-top: var(--desktop-y) !important;
            }
          }
        `,
        }}
      />
      <button
        className={`group relative cursor-pointer ${currentSize.padding} ${currentSize.radius} border-2 backdrop-blur-2xl hover:backdrop-blur-3xl transition-all duration-700 hover:shadow-2xl active:scale-95 overflow-hidden ${
          theme === "light"
            ? "border-blue-400/40 bg-white/30 hover:border-blue-500/60"
            : "border-blue-300/30 bg-blue-400/5 hover:border-white/40"
        }`}
        style={{
          transitionDuration: ORB_BUTTON_CONFIG.global.animationDuration,
          transform: `scale(1)`,
          background:
            theme === "light"
              ? `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`
              : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
        }}
        onClick={onClick}
        aria-label={`Go to ${text} section`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = `scale(${ORB_BUTTON_CONFIG.global.hoverScale}) rotateY(5deg)`;
          e.currentTarget.style.boxShadow =
            "0 0 25px rgba(73, 146, 255, 0.4), 0 0 50px rgba(73, 146, 255, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = `scale(1) rotateY(0deg)`;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Animated background layers */}
        <div
          className={`absolute inset-0 ${currentSize.radius} bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-transparent opacity-50 group-hover:opacity-70 transition-all duration-500`}
        />
        <div
          className={`absolute inset-0 ${currentSize.radius} bg-gradient-to-tl from-white/20 via-transparent to-white/10 opacity-30 group-hover:opacity-50 transition-all duration-500`}
        />

        {/* Futuristic circuit-like patterns */}
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-all duration-500">
          <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full" />
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/40 rounded-full" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Holographic scanning line effect */}
        <div className="absolute inset-0 overflow-hidden rounded-inherit">
          <div
            className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
            style={{ animationDelay: "0.2s", left: "-50px" }}
          />
        </div>

        {/* Pulsing border effect */}
        <div
          className={`absolute inset-0 ${currentSize.radius} border border-white/10 group-hover:border-white/30 transition-all duration-500 opacity-30`}
          style={{ left: "-50px" }}
        />

        {/* Button text with enhanced styling and glow animation */}
        <span
          className={`relative ${currentSize.text} font-semibold transition-all duration-500 drop-shadow-lg whitespace-nowrap tracking-wide font-poppins ${
            theme === "light"
              ? "text-gray-800 group-hover:text-gray-900"
              : "text-white/90 group-hover:text-white"
          }`}
          style={{
            textShadow:
              theme === "light"
                ? `0 0 10px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)`
                : `0 0 10px rgba(73, 146, 255, 0.6), 0 0 20px rgba(73, 146, 255, 0.4)`,
          }}
        >
          {text}
        </span>

        {/* Enhanced 3D depth effect */}
        <div
          className={`absolute inset-0 ${currentSize.radius} opacity-0 group-hover:opacity-100 transition-all duration-700`}
          style={{
            background: `linear-gradient(145deg, transparent 0%, rgba(73, 146, 255, 0.2) 50%, transparent 100%)`,
            transform: "translateZ(10px)",
          }}
        />

        {/* Holographic shimmer effect */}
        <div
          className={`absolute top-0.5 left-0.5 right-0.5 h-1/3 ${currentSize.radius} bg-gradient-to-b from-white/25 via-white/10 to-transparent opacity-40 group-hover:opacity-70 transition-all duration-500`}
        />

        {/* Bottom reflection */}
        <div
          className={`absolute bottom-0.5 left-0.5 right-0.5 h-1/4 ${currentSize.radius} bg-gradient-to-t from-white/15 to-transparent opacity-30 group-hover:opacity-50 transition-all duration-500`}
        />
      </button>
    </div>
  );
}

// ========================================
// ABOUT US SECTION COMPONENT
// ========================================

interface SectionProps {
  theme: "light" | "dark";
  isVisible: boolean;
  setShowResultModal?: (state: {
    open: boolean;
    success: boolean;
    message?: string | null;
  }) => void;
}

const AboutUsSection = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ theme, isVisible }, ref) => {
    const [screenSize, setScreenSize] = useState<
      "mobile" | "tablet" | "desktop"
    >("desktop");

    useEffect(() => {
      const updateScreenSize = () => {
        const width = window.innerWidth;
        if (width <= 640) {
          setScreenSize("mobile");
        } else if (width <= 991) {
          setScreenSize("tablet");
        } else {
          setScreenSize("desktop");
        }
      };

      updateScreenSize();
      window.addEventListener("resize", updateScreenSize);
      return () => window.removeEventListener("resize", updateScreenSize);
    }, []);

    const isMobileOrTablet = screenSize !== "desktop";

    return (
      <motion.div
        ref={ref}
        className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
          theme === "light"
            ? "bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
            : "bg-gradient-to-br from-gray-900 via-blue-900 to-black"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {/* Enhanced Background Elements - Complete Visual Package */}

        {/* JARRING CYBERPUNK MATRIX BACKGROUND */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated Matrix Grid */}
          <div className="absolute inset-0">
            {[...Array(isMobileOrTablet ? 10 : 20)].map((_, i) => (
              <motion.div
                key={`matrix-line-${i}`}
                className="absolute w-px h-full opacity-30"
                style={{
                  left: `${i * (isMobileOrTablet ? 10 : 5)}%`,
                  background:
                    "linear-gradient(180deg, transparent 0%, #0080ff 20%, #0080ff 80%, transparent 100%)",
                  filter: "blur(0.5px)",
                }}
                animate={{
                  opacity: [0.1, 0.6, 0.1],
                  scaleY: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Glowing Geometric Shapes */}
          <div className="absolute inset-0">
            {[...Array(isMobileOrTablet ? 5 : 8)].map((_, i) => (
              <motion.div
                key={`shape-${i}`}
                className="absolute border-2 border-cyan-400"
                style={{
                  left: `${10 + i * (isMobileOrTablet ? 18 : 11)}%`,
                  top: `${15 + ((i * 13) % 70)}%`,
                  width: `${30 + (i % 3) * (isMobileOrTablet ? 10 : 20)}px`,
                  height: `${30 + (i % 3) * (isMobileOrTablet ? 10 : 20)}px`,
                  borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "0" : "20%",
                  boxShadow:
                    "0 0 20px rgba(34, 211, 238, 0.5), inset 0 0 20px rgba(34, 211, 238, 0.1)",
                  background:
                    "linear-gradient(45deg, rgba(34, 211, 238, 0.1), rgba(168, 85, 247, 0.1))",
                }}
                animate={{
                  rotateZ: [0, 360],
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 8 + (i % 4),
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>

          {/* Pulsing Circuit Board Pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 1000 1000">
              {[...Array(isMobileOrTablet ? 4 : 6)].map((_, i) => (
                <g key={`circuit-${i}`}>
                  <motion.path
                    d={`M${100 + i * 150},${200 + i * 50} L${200 + i * 150},${200 + i * 50} L${200 + i * 150},${300 + i * 50} L${300 + i * 150},${300 + i * 50}`}
                    stroke="#00ff41"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="10 5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  />
                  <motion.circle
                    cx={200 + i * 150}
                    cy={200 + i * 50}
                    r="4"
                    fill="#00ff41"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                </g>
              ))}
            </svg>
          </div>

          {/* Floating Holographic Panels */}
          <div className="absolute inset-0">
            {[...Array(isMobileOrTablet ? 4 : 6)].map((_, i) => (
              <motion.div
                key={`holo-panel-${i}`}
                className="absolute border border-cyan-400 rounded-lg backdrop-blur-sm"
                style={{
                  left: `${5 + i * (isMobileOrTablet ? 20 : 15)}%`,
                  top: `${10 + ((i * 20) % 70)}%`,
                  width: `${60 + (i % 2) * (isMobileOrTablet ? 20 : 40)}px`,
                  height: `${40 + (i % 2) * (isMobileOrTablet ? 15 : 30)}px`,
                  background:
                    "linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(168, 85, 247, 0.1))",
                  boxShadow: "0 0 30px rgba(34, 211, 238, 0.3)",
                }}
                animate={{
                  rotateY: [-15, 15, -15],
                  rotateX: [-10, 10, -10],
                  y: [-10, 10, -10],
                }}
                transition={{
                  duration: 6 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.7,
                }}
              >
                <div className="p-1 sm:p-2 space-y-1">
                  {[...Array(3)].map((_, lineIndex) => (
                    <motion.div
                      key={lineIndex}
                      className="h-0.5 sm:h-1 bg-cyan-400 rounded opacity-60"
                      style={{ width: `${50 + lineIndex * 25}%` }}
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: lineIndex * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Animated Noise Texture - Desktop Only */}
          {screenSize === "desktop" && (
            <div
              className="absolute inset-0 opacity-10 animate-noise gpu-accelerated"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")`,
              }}
            />
          )}
        </div>

        {/* SPECTACULAR ABOUT SECTION ENHANCEMENTS */}

        {/* Floating Code Blocks with Syntax Highlighting Effect - Desktop Only for Performance */}
        {screenSize === "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`code-block-${i}`}
                className="absolute"
                style={{
                  left: `${10 + ((i * 75) % 80)}%`,
                  top: `${15 + ((i * 45) % 70)}%`,
                  width: `${60 + (i % 3) * 20}px`,
                  height: `${30 + (i % 2) * 15}px`,
                  opacity: 0.3,
                }}
                animate={{
                  y: [-10, 10, -10],
                  x: [-5, 5, -5],
                  rotateZ: [-2, 2, -2],
                }}
                transition={{
                  duration: 4 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              >
                <div
                  className="w-full h-full rounded-lg border-2 backdrop-blur-sm"
                  style={{
                    background: "rgba(30, 30, 50, 0.6)",
                    border: "2px solid rgba(73, 146, 255, 0.3)",
                    boxShadow: "0 0 15px rgba(73, 146, 255, 0.2)",
                  }}
                >
                  {/* Simulated code lines */}
                  <div className="p-2 space-y-1">
                    {[...Array(2 + (i % 2))].map((_, lineIndex) => (
                      <div
                        key={lineIndex}
                        className="h-1 rounded-full opacity-80"
                        style={{
                          width: `${50 + (((lineIndex + i) * 30) % 50)}%`,
                          background: [
                            "linear-gradient(90deg, #22d3ee, #60a5fa)",
                            "linear-gradient(90deg, #10b981, #22d3ee)",
                            "linear-gradient(90deg, #f59e0b, #ef4444)",
                            "linear-gradient(90deg, #8b5cf6, #ec4899)",
                          ][lineIndex % 4],
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Floating UI Components Preview - Desktop Only for Performance */}
        {screenSize === "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              {
                type: "button",
                x: 20,
                y: 25,
                color: "from-blue-500 to-purple-500",
              },
              {
                type: "card",
                x: 75,
                y: 40,
                color: "from-green-500 to-blue-500",
              },
              ...(window.innerWidth >= 992
                ? [
                    {
                      type: "input",
                      x: 15,
                      y: 70,
                      color: "from-purple-500 to-pink-500",
                    },
                    {
                      type: "toggle",
                      x: 80,
                      y: 20,
                      color: "from-orange-500 to-red-500",
                    },
                  ]
                : []),
            ].map((component, i) => (
              <motion.div
                key={`ui-component-${i}`}
                className="absolute"
                style={{
                  left: `${component.x}%`,
                  top: `${component.y}%`,
                }}
                animate={
                  window.innerWidth < 992
                    ? {
                        y: [-4, 4, -4],
                      }
                    : {
                        y: [-8, 8, -8],
                        rotateZ: [-1, 1, -1],
                        scale: [0.9, 1.1, 0.9],
                      }
                }
                transition={{
                  duration: window.innerWidth < 992 ? 5 + i : 3 + i,
                  repeat: Infinity,
                  delay: i * 1,
                }}
              >
                <div
                  className={`w-16 h-8 rounded-lg bg-gradient-to-r ${component.color} opacity-40 backdrop-blur-sm border border-white/20`}
                  style={{
                    boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
                  }}
                >
                  {component.type === "button" && (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                      BTN
                    </div>
                  )}
                  {component.type === "card" && (
                    <div className="p-1">
                      <div className="h-1 bg-white/40 rounded mb-0.5" />
                      <div className="h-0.5 bg-white/30 rounded w-3/4" />
                    </div>
                  )}
                  {component.type === "input" && (
                    <div className="w-full h-full border-2 border-white/30 rounded-lg bg-white/10" />
                  )}
                  {component.type === "toggle" && (
                    <div className="w-full h-full flex items-center justify-between px-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full" />
                      <div className="w-2 h-2 bg-white/30 rounded-full" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Animated Data Streams - Desktop Only for Performance */}
        {screenSize === "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`data-stream-${i}`}
                className="absolute"
                style={{
                  left: `${10 + ((i * 80) % 80)}%`,
                  top: "0%",
                  height: "100%",
                  width: window.innerWidth < 992 ? "1px" : "2px",
                }}
              >
                <motion.div
                  className="w-full rounded-full"
                  style={{
                    height: window.innerWidth < 992 ? "30px" : "40px",
                    opacity: window.innerWidth < 992 ? 0.4 : 0.6,
                    background: `linear-gradient(180deg,
                    rgba(73, 146, 255, 0.8) 0%,
                    rgba(34, 211, 238, 0.6) 50%,
                    transparent 100%)`,
                    boxShadow:
                      window.innerWidth < 992
                        ? "0 0 5px rgba(73, 146, 255, 0.3)"
                        : "0 0 10px rgba(73, 146, 255, 0.4)",
                  }}
                  animate={{
                    y: [-50, window.innerHeight + 50],
                  }}
                  transition={{
                    duration:
                      window.innerWidth < 992 ? 5 + (i % 2) : 3 + (i % 3),
                    repeat: Infinity,
                    delay: i * 1,
                    ease: "linear",
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Interactive Holographic Stats Display */}
        <div className="absolute top-20 right-4 sm:right-6 lg:right-10 hidden sm:block pointer-events-none">
          <motion.div
            className="relative"
            animate={{
              rotateY: [0, 5, 0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
            }}
          >
            <div
              className="w-32 h-24 rounded-xl backdrop-blur-lg border opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30, 30, 50, 0.7), rgba(10, 10, 30, 0.7))",
                border: "2px solid rgba(73, 146, 255, 0.3)",
                boxShadow: "0 0 30px rgba(73, 146, 255, 0.2)",
              }}
            >
              <div className="p-3">
                <div className="text-xs text-cyan-400 font-mono mb-1">
                  PERFORMANCE
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Speed</span>
                    <span className="text-green-400">99.9%</span>
                  </div>
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 0.99 }}
                      style={{ transformOrigin: "left" }}
                      transition={{ duration: 2, delay: 1 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Quality</span>
                    <span className="text-blue-400">100%</span>
                  </div>
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      style={{ transformOrigin: "left" }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 2, delay: 1.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Desktop Aurora Curtains */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-70 sm:opacity-60 lg:opacity-60">
          <div
            className="absolute aurora-curtain-1"
            style={{
              top: "20%",
              left: "-15%",
              right: "-15%",
              height: "120px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.4) 15%, rgba(20, 184, 166, 0.5) 30%, rgba(34, 197, 94, 0.4) 50%, rgba(6, 182, 212, 0.5) 70%, rgba(20, 184, 166, 0.4) 85%, transparent 100%)",
              borderRadius: "40% 60% 80% 20% / 60% 40% 80% 20%",
              filter: "blur(15px)",
              animation: "aurora-wave-subtle-1 28s ease-in-out infinite",
              transform: "skewY(-1deg)",
            }}
          />
          <div
            className="absolute aurora-curtain-2"
            style={{
              top: "45%",
              left: "-20%",
              right: "-20%",
              height: "140px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.35) 10%, rgba(6, 182, 212, 0.45) 25%, rgba(16, 185, 129, 0.4) 40%, rgba(20, 184, 166, 0.45) 60%, rgba(34, 197, 94, 0.4) 75%, rgba(6, 182, 212, 0.35) 90%, transparent 100%)",
              borderRadius: "30% 70% 40% 60% / 70% 30% 60% 40%",
              filter: "blur(18px)",
              animation: "aurora-wave-subtle-2 34s ease-in-out infinite",
              transform: "skewY(0.5deg)",
            }}
          />

          {/* Desktop Floating Energy Orbs */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={`about-desktop-orb-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${8 + ((i * 7) % 84)}%`,
                  top: `${12 + ((i * 11) % 76)}%`,
                  width: `${6 + (i % 4) * 2}px`,
                  height: `${6 + (i % 4) * 2}px`,
                  background: [
                    "radial-gradient(circle, rgba(34, 197, 94, 0.9) 0%, rgba(34, 197, 94, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(59, 130, 246, 0.9) 0%, rgba(59, 130, 246, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(147, 51, 234, 0.9) 0%, rgba(147, 51, 234, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(236, 72, 153, 0.9) 0%, rgba(236, 72, 153, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(6, 182, 212, 0.9) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(245, 158, 11, 0.9) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%)",
                  ][i % 6],
                  animation: `desktop-float-${(i % 4) + 1} ${4 + (i % 3)}s ease-in-out infinite ${i * 0.3}s`,
                  filter: `blur(${1 + (i % 2) * 0.5}px)`,
                  boxShadow: `0 0 ${12 + (i % 3) * 6}px currentColor`,
                }}
              />
            ))}
          </div>

          {/* Desktop Pulsing Corner Accents */}
          <div className="absolute top-8 left-8 w-24 h-24 rounded-full opacity-40">
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(59, 130, 246, 0.6) 40%, rgba(147, 51, 234, 0.3) 70%, transparent 90%)",
                animation: "desktop-pulse-corner 4s ease-in-out infinite",
                filter: "blur(6px)",
              }}
            />
          </div>
          <div className="absolute top-8 right-8 w-20 h-20 rounded-full opacity-35">
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(236, 72, 153, 0.6) 40%, rgba(59, 130, 246, 0.3) 70%, transparent 90%)",
                animation:
                  "desktop-pulse-corner 3.5s ease-in-out infinite 0.7s",
                filter: "blur(5px)",
              }}
            />
          </div>
          <div className="absolute bottom-8 left-8 w-28 h-28 rounded-full opacity-45">
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(34, 197, 94, 0.6) 40%, rgba(6, 182, 212, 0.3) 70%, transparent 90%)",
                animation:
                  "desktop-pulse-corner 4.5s ease-in-out infinite 1.2s",
                filter: "blur(7px)",
              }}
            />
          </div>
          <div className="absolute bottom-8 right-8 w-22 h-22 rounded-full opacity-38">
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(245, 158, 11, 0.6) 40%, rgba(34, 197, 94, 0.3) 70%, transparent 90%)",
                animation:
                  "desktop-pulse-corner 3.8s ease-in-out infinite 0.4s",
                filter: "blur(4px)",
              }}
            />
          </div>
        </div>

        {/* Mobile/Tablet Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden lg:hidden">
          {/* Animated Gradient Waves */}
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={`about-mobile-wave-${i}`}
                className="absolute w-full h-32 opacity-40"
                style={{
                  top: `${20 + i * 25}%`,
                  background: `linear-gradient(90deg,
                    transparent 0%,
                    rgba(34, 197, 94, ${0.3 + i * 0.1}) 25%,
                    rgba(59, 130, 246, ${0.4 + i * 0.1}) 50%,
                    rgba(147, 51, 234, ${0.3 + i * 0.1}) 75%,
                    transparent 100%)`,
                  borderRadius: `${60 + i * 10}% ${40 - i * 5}% ${30 + i * 15}% ${70 - i * 10}% / ${50 + i * 20}% ${30 - i * 5}% ${40 + i * 10}% ${60 - i * 15}%`,
                  filter: `blur(${8 + i * 2}px)`,
                  animation: `mobile-wave-${i + 1} ${4 + i}s ease-in-out infinite`,
                  transform: `skewY(${-2 + i}deg) rotate(${i * 2}deg)`,
                }}
              />
            ))}
          </div>

          {/* Mobile Floating Energy Dots */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={`about-mobile-dot-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${10 + ((i * 11) % 80)}%`,
                  top: `${15 + ((i * 13) % 70)}%`,
                  width: `${4 + (i % 3)}px`,
                  height: `${4 + (i % 3)}px`,
                  background: [
                    "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, transparent 70%)",
                    "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%)",
                    "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, transparent 70%)",
                    "radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, transparent 70%)",
                  ][i % 4],
                  animation: `mobile-float-${(i % 3) + 1} ${3 + (i % 2)}s ease-in-out infinite ${i * 0.2}s`,
                  filter: `blur(${0.5 + (i % 2) * 0.5}px)`,
                  boxShadow: `0 0 ${8 + (i % 3) * 4}px currentColor`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Floating Ambient Particles with Color Shifting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full opacity-60"
              style={{
                left: `${5 + ((i * 60) % 95)}%`,
                top: `${10 + ((i * 35) % 85)}%`,
                width: `${1 + (i % 4)}px`,
                height: `${1 + (i % 4)}px`,
                background: `rgba(${73 + ((i * 20) % 50)}, ${146 + ((i * 10) % 30)}, 255, ${0.2 + (i % 4) * 0.15})`,
                animation: `gentleFloat ${3 + (i % 4)}s ease-in-out infinite ${i * 0.3}s, color-shift ${12 + (i % 5)}s ease-in-out infinite ${i * 0.2}s`,
                filter: "blur(0.3px)",
                transform: `scale(${0.5 + (i % 3) * 0.3})`,
              }}
            />
          ))}
        </div>

        {/* Animated Geometric Patterns */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <svg className="absolute w-full h-full" viewBox="0 0 1200 800">
            {/* Animated hexagon grid */}
            {[...Array(4)].map((_, i) => (
              <polygon
                key={`hex-${i}`}
                points="100,20 140,40 140,80 100,100 60,80 60,40"
                fill="none"
                stroke="rgba(73, 146, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="10 5"
                style={{
                  transform: `translate(${100 + i * 200}px, ${100 + (i % 2) * 150}px)`,
                  animation: `geometric-pulse ${8 + i}s ease-in-out infinite ${i * 0.5}s`,
                }}
              />
            ))}
            {/* Animated connecting lines */}
            {[...Array(4)].map((_, i) => (
              <line
                key={`line-${i}`}
                x1={50 + i * 300}
                y1={200}
                x2={250 + i * 300}
                y2={400}
                stroke="rgba(63, 186, 255, 0.2)"
                strokeWidth="1"
                strokeDasharray="15 10"
                style={{
                  animation: `geometric-pulse ${10 + i * 2}s ease-in-out infinite ${i * 0.7}s`,
                }}
              />
            ))}
          </svg>
        </div>

        {/* Main Content Container */}
        <div className="relative min-h-screen py-0 sm:py-0 lg:py-0 section-container flex items-center justify-center">
          {/* Text Content */}
          <motion.div
            className={`relative z-10 px-6 sm:px-8 lg:px-10 text-center max-w-4xl mx-auto section-content min-h-[60vh] py-12 flex flex-col items-center justify-center ${isVisible ? "filter-blur-in" : "filter-blur-out"}`}
            initial={{
              opacity: 0,
              y: 80,
            }}
            animate={
              isVisible
                ? {
                    opacity: 1,
                    y: 0,
                  }
                : {}
            }
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
          >
            {/* About Us Title - matching home style */}
            <div className="text-center mb-6 sm:mb-8 lg:mb-10">
              <h1
                className={`font-poppins text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight relative ${
                  theme === "light" ? "text-gray-900" : "text-white"
                }`}
              >
                <span className="warm-glow-text animate-warm-glow-pulse">
                  About Us
                </span>

                {/* Optimized sparkles for better performance */}
                {[
                  { x: 85, y: -30, size: 0.7, type: "star" },
                  { x: 65, y: -8, size: 0.5, type: "diamond" },
                  { x: 110, y: 45, size: 0.6, type: "plus" },
                  { x: 80, y: 75, size: 0.8, type: "star" },
                  { x: 20, y: 80, size: 0.4, type: "diamond" },
                  { x: -35, y: 55, size: 0.5, type: "plus" },
                ].map((sparkle, i) => (
                  <div
                    key={`about-sparkle-${i}`}
                    className="absolute pointer-events-none gpu-accelerated"
                    style={{
                      left: `calc(50% + ${sparkle.x}px)`,
                      top: `calc(50% + ${sparkle.y}px)`,
                      animation: `sparkle-enhanced ${5 + (i % 3)}s ease-in-out infinite ${i * 0.4}s`,
                      transform: `translateZ(0) scale(${sparkle.size})`,
                      opacity: 0.5,
                      zIndex: -1,
                      willChange: "transform, opacity",
                    }}
                  >
                    {sparkle.type === "star" && (
                      <div
                        className="w-5 h-5"
                        style={{
                          background: [
                            "radial-gradient(circle, rgba(255, 120, 180, 0.8) 0%, rgba(255, 160, 120, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(120, 255, 200, 0.8) 0%, rgba(120, 180, 255, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(180, 120, 255, 0.8) 0%, rgba(255, 140, 180, 0.5) 70%, transparent 90%)",
                          ][i % 3],
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                          animation: "spin-slow 12s linear infinite",
                          filter: "drop-shadow(0 0 6px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "diamond" && (
                      <div
                        className="w-3 h-3"
                        style={{
                          background: [
                            "linear-gradient(45deg, rgba(255, 120, 200, 0.7), rgba(120, 255, 150, 0.6))",
                            "linear-gradient(45deg, rgba(150, 120, 255, 0.7), rgba(255, 180, 120, 0.6))",
                            "linear-gradient(45deg, rgba(120, 180, 255, 0.7), rgba(255, 140, 120, 0.6))",
                          ][i % 3],
                          clipPath:
                            "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                          animation: "gentle-pulse 3s ease-in-out infinite",
                          filter: "drop-shadow(0 0 4px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "plus" && (
                      <div
                        className="w-4 h-4"
                        style={{
                          background: [
                            "conic-gradient(from 0deg, rgba(255, 140, 120, 0.7), rgba(120, 255, 180, 0.6), rgba(180, 120, 255, 0.7), rgba(255, 180, 140, 0.6))",
                            "conic-gradient(from 90deg, rgba(120, 255, 140, 0.7), rgba(255, 120, 180, 0.6), rgba(140, 180, 255, 0.7), rgba(255, 160, 120, 0.6))",
                            "conic-gradient(from 180deg, rgba(180, 140, 255, 0.7), rgba(255, 180, 120, 0.6), rgba(120, 255, 160, 0.7), rgba(255, 140, 180, 0.6))",
                          ][i % 3],
                          clipPath:
                            "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                          animation: "rotate-slow 10s linear infinite",
                          filter: "drop-shadow(0 0 8px currentColor)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </h1>
            </div>

            {/* Our Mission - matching development services style */}
            <div className="text-center mb-4 sm:mb-8">
              <div className="relative">
                <div className="font-poppins text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold relative z-10">
                  <span
                    className={`relative inline-block ${
                      theme === "light" ? "text-gray-900" : "text-white"
                    }`}
                    style={{}}
                  >
                    <span className="warm-glow-text animate-warm-glow-pulse text-smooth glow-120hz">
                      Crafting Digital Excellence
                    </span>

                    {/* Sparkles for subtitle */}
                    {[
                      { x: 120, y: -25, size: 0.6, type: "star" },
                      { x: 90, y: 35, size: 0.5, type: "diamond" },
                      { x: -50, y: 25, size: 0.4, type: "plus" },
                      { x: 140, y: 10, size: 0.7, type: "star" },
                    ].map((sparkle, i) => (
                      <div
                        key={`about-subtitle-sparkle-${i}`}
                        className="absolute pointer-events-none gpu-accelerated"
                        style={{
                          left: `calc(50% + ${sparkle.x}px)`,
                          top: `calc(50% + ${sparkle.y}px)`,
                          animation: `sparkle-enhanced ${5 + (i % 2)}s ease-in-out infinite ${i * 0.4}s`,
                          transform: `translateZ(0) scale(${sparkle.size})`,
                          opacity: 0.4,
                          zIndex: -1,
                          willChange: "transform, opacity",
                        }}
                      >
                        {sparkle.type === "star" && (
                          <div
                            className="w-4 h-4"
                            style={{
                              background:
                                "radial-gradient(circle, rgba(120, 200, 255, 0.8) 0%, rgba(200, 120, 255, 0.5) 70%, transparent 90%)",
                              clipPath:
                                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                              animation: "spin-slow 10s linear infinite",
                              filter: "drop-shadow(0 0 4px currentColor)",
                            }}
                          />
                        )}
                        {sparkle.type === "diamond" && (
                          <div
                            className="w-3 h-3"
                            style={{
                              background:
                                "linear-gradient(45deg, rgba(255, 140, 180, 0.7), rgba(140, 255, 200, 0.6))",
                              clipPath:
                                "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                              animation: "gentle-pulse 3s ease-in-out infinite",
                              filter: "drop-shadow(0 0 3px currentColor)",
                            }}
                          />
                        )}
                        {sparkle.type === "plus" && (
                          <div
                            className="w-3 h-3"
                            style={{
                              background:
                                "conic-gradient(from 45deg, rgba(180, 255, 140, 0.7), rgba(255, 180, 140, 0.6), rgba(140, 180, 255, 0.7), rgba(255, 200, 180, 0.6))",
                              clipPath:
                                "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                              animation: "rotate-slow 8s linear infinite",
                              filter: "drop-shadow(0 0 5px currentColor)",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center mt-6 sm:mt-8">
              {/* Left Content */}
              <motion.div
                className="space-y-4 sm:space-y-6 lg:space-y-8 text-left"
                initial={{ x: -50, opacity: 0 }}
                animate={
                  isVisible ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }
                }
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="space-y-4 sm:space-y-6">
                  <p
                    className={`text-sm sm:text-lg leading-relaxed ${
                      theme === "light" ? "text-gray-600" : "text-gray-300"
                    }`}
                    style={{
                      textShadow:
                        theme === "dark"
                          ? "0 0 10px rgba(255, 255, 255, 0.1)"
                          : "none",
                    }}
                  >
                    We are a cutting-edge software development company dedicated
                    to transforming innovative ideas into powerful digital
                    solutions. Our team of expert developers, designers, and
                    strategists work collaboratively to deliver exceptional
                    results.
                  </p>
                  <p
                    className={`text-sm sm:text-lg leading-relaxed ${
                      theme === "light" ? "text-gray-600" : "text-gray-300"
                    }`}
                    style={{
                      textShadow:
                        theme === "dark"
                          ? "0 0 10px rgba(255, 255, 255, 0.1)"
                          : "none",
                    }}
                  >
                    With years of experience in modern web development, mobile
                    applications, and AI integration, we bring your vision to
                    life with precision and creativity.
                  </p>
                </div>

                {/* Stats - matching floating button style */}
                <div className="grid grid-cols-3 gap-1 sm:gap-4 lg:gap-6 mt-4 sm:mt-8 lg:mt-12 max-w-4xl mx-auto">
                  {[
                    { number: "100+", label: "Projects" },
                    { number: "50+", label: "Clients" },
                    { number: "5+", label: "Years" },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="text-center group cursor-pointer"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={
                        isVisible
                          ? { scale: 1, opacity: 1 }
                          : { scale: 0, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div
                        className="relative p-2 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl backdrop-blur-lg border border-white/20 hover:border-blue-400/40 transition-all duration-500"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          boxShadow: "0 0 20px rgba(73, 146, 255, 0.1)",
                        }}
                      >
                        <div
                          className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 warm-glow-text"
                          style={{
                            textShadow: "0 0 15px rgba(73, 146, 255, 0.6)",
                          }}
                        >
                          {stat.number}
                        </div>
                        <div
                          className={`text-xs sm:text-sm font-medium ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}
                        >
                          {stat.label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right Content - Modern Software Development Visualization */}
              <motion.div
                className="flex justify-center lg:justify-end lg:pl-8"
                initial={{ x: 50, opacity: 0 }}
                animate={
                  isVisible ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 }
                }
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="relative w-full max-w-md h-72 sm:h-80 lg:h-96 lg:ml-12">
                  {/* Main Glass Container */}
                  <div
                    className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl border border-white/30"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                      boxShadow:
                        "0 8px 32px rgba(0,0,0,0.1), 0 0 60px rgba(73, 146, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    {/* Glassmorphism overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/10" />

                    {/* Code Editor Interface */}
                    <div className="absolute inset-0 p-3 sm:p-6 lg:p-8">
                      {/* Browser-like Header */}
                      <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                        <div className="flex space-x-1.5">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400/80" />
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400/80" />
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400/80" />
                        </div>
                        <div className="flex-1 h-6 sm:h-8 bg-white/10 rounded-md ml-3 flex items-center px-2 sm:px-3">
                          <div className="w-2 h-2 bg-blue-400/60 rounded-full animate-pulse" />
                          <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-white/60 font-mono truncate">
                            <span className="hidden xs:inline">
                              Building amazing software...
                            </span>
                            <span className="xs:hidden">Building...</span>
                          </span>
                        </div>
                      </div>

                      {/* Code Lines Visualization */}
                      <div className="space-y-2 sm:space-y-3 mb-8 sm:mb-12 lg:mb-16">
                        {[
                          {
                            width: "w-3/4",
                            color: "from-blue-400 to-cyan-400",
                            delay: 0,
                          },
                          {
                            width: "w-1/2",
                            color: "from-purple-400 to-pink-400",
                            delay: 0.2,
                          },
                          {
                            width: "w-5/6",
                            color: "from-cyan-400 to-blue-500",
                            delay: 0.4,
                          },
                          {
                            width: "w-2/3",
                            color: "from-green-400 to-blue-400",
                            delay: 0.6,
                          },
                          {
                            width: "w-1/2 sm:w-4/5",
                            color: "from-indigo-400 to-purple-400",
                            delay: 0.8,
                          },
                        ].map((line, i) => (
                          <motion.div
                            key={i}
                            className="flex items-center space-x-2 sm:space-x-3"
                            initial={{ x: -30, opacity: 0 }}
                            animate={
                              isVisible
                                ? { x: 0, opacity: 1 }
                                : { x: -30, opacity: 0 }
                            }
                            transition={{
                              duration: 0.6,
                              delay: 1 + line.delay,
                            }}
                          >
                            <div className="w-4 sm:w-6 text-center">
                              <span className="text-xs text-white/40 font-mono">
                                {i + 1}
                              </span>
                            </div>
                            <div
                              className={`h-2 sm:h-2.5 ${line.width} bg-gradient-to-r ${line.color} rounded-full opacity-80`}
                              style={{
                                boxShadow: "0 0 10px rgba(73, 146, 255, 0.3)",
                              }}
                            />
                          </motion.div>
                        ))}
                      </div>

                      {/* Modern Tech Stack Icons */}
                      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                        <div className="grid grid-cols-4 gap-2 sm:gap-3">
                          {[
                            {
                              Icon: Code,
                              label: "React",
                              color: "text-blue-400",
                            },
                            {
                              Icon: Smartphone,
                              label: "Mobile",
                              color: "text-green-400",
                            },
                            {
                              Icon: Zap,
                              label: "AI/ML",
                              color: "text-yellow-400",
                            },
                            {
                              Icon: Globe,
                              label: "Cloud",
                              color: "text-purple-400",
                            },
                          ].map((tech, index) => (
                            <motion.div
                              key={index}
                              className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10"
                              initial={{ y: 20, opacity: 0, scale: 0.8 }}
                              animate={
                                isVisible
                                  ? { y: 0, opacity: 1, scale: 1 }
                                  : { y: 20, opacity: 0, scale: 0.8 }
                              }
                              transition={{
                                duration: 0.5,
                                delay: 1.2 + index * 0.1,
                              }}
                              whileHover={{ scale: 1.05, y: -2 }}
                            >
                              <tech.Icon
                                className={`w-4 h-4 sm:w-6 sm:h-6 ${tech.color} mb-1`}
                                style={{
                                  filter: "drop-shadow(0 0 8px currentColor)",
                                }}
                              />
                              <span className="text-[10px] sm:text-xs text-white/70 font-medium">
                                {tech.label}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Floating Particles */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={`particle-${i}`}
                          className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400/40 rounded-full"
                          style={{
                            left: `${20 + ((i * 60) % 60)}%`,
                            top: `${15 + ((i * 45) % 70)}%`,
                            boxShadow: "0 0 6px rgba(73, 146, 255, 0.6)",
                          }}
                          animate={{
                            y: [-5, 5, -5],
                            x: [-3, 3, -3],
                            opacity: [0.3, 1, 0.3],
                            scale: [0.8, 1.2, 0.8],
                          }}
                          transition={{
                            duration: 3 + (i % 3),
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </div>

                    {/* Glass Reflection */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  },
);

// ========================================
// WHAT WE DO SECTION COMPONENT
// ========================================

interface WhatWeDoSectionProps {
  theme: "light" | "dark";
  isVisible: boolean;
}

const WhatWeDoSection = React.forwardRef<HTMLDivElement, WhatWeDoSectionProps>(
  ({ theme, isVisible }, ref) => {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const sectionRef = useRef<HTMLDivElement>(null);

    const processSteps = [
      {
        number: "01",
        title: "Discovery & Strategy",
        description:
          "We conduct comprehensive analysis of your business requirements, market position, and technical needs to develop a strategic roadmap that ensures project success from day one.",
        icon: Code,
        category: "ANALYZE",
        features: [
          "Business Analysis",
          "Market Research",
          "Technical Planning",
          "Strategy Development",
        ],
        metrics: ["100%", "Requirements", "Clarity"],
      },
      {
        number: "02",
        title: "Design & Innovation",
        description:
          "Our design team creates intuitive, user-centered interfaces that balance aesthetic excellence with functional efficiency, ensuring optimal user experience across all platforms.",
        icon: Palette,
        category: "CREATE",
        features: [
          "UI/UX Design",
          "Brand Integration",
          "Prototype Development",
          "User Testing",
        ],
        metrics: ["99%", "User Satisfaction", "Rate"],
      },
      {
        number: "03",
        title: "Development & Engineering",
        description:
          "We build robust, scalable solutions using industry-leading technologies and best practices, ensuring your application performs flawlessly under any load conditions.",
        icon: Zap,
        category: "BUILD",
        features: [
          "Full-Stack Development",
          "Cloud Architecture",
          "Performance Optimization",
          "Security Implementation",
        ],
        metrics: ["<0.5s", "Load Time", "Average"],
      },
      {
        number: "04",
        title: "Launch & Support",
        description:
          "We ensure seamless deployment and provide ongoing maintenance, monitoring, and optimization services to keep your solution running at peak performance as your business grows.",
        icon: Globe,
        category: "DEPLOY",
        features: [
          "Production Deployment",
          "Performance Monitoring",
          "24/7 Technical Support",
          "Continuous Optimization",
        ],
        metrics: ["99.9%", "Uptime", "Guarantee"],
      },
    ];

    return (
      <motion.div
        ref={(el) => {
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
          sectionRef.current = el;
        }}
        className="relative min-h-screen overflow-hidden bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {/* Noise Overlay - exactly like home page */}
        <div
          className="absolute inset-0 opacity-10 sm:opacity-8 lg:opacity-5 animate-noise gpu-accelerated"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Aurora Curtains - exactly like home page */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-70 sm:opacity-60 lg:opacity-60">
          <div
            className="absolute aurora-curtain-1"
            style={{
              top: "20%",
              left: "-15%",
              right: "-15%",
              height: "120px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.4) 15%, rgba(20, 184, 166, 0.5) 30%, rgba(34, 197, 94, 0.4) 50%, rgba(6, 182, 212, 0.5) 70%, rgba(20, 184, 166, 0.4) 85%, transparent 100%)",
              borderRadius: "40% 60% 80% 20% / 60% 40% 80% 20%",
              filter: "blur(15px)",
              animation:
                "28s ease-in-out 0s infinite normal none running aurora-wave-subtle-1",
              transform: "skewY(-1deg)",
            }}
          />
          <div
            className="absolute aurora-curtain-2"
            style={{
              top: "45%",
              left: "-20%",
              right: "-20%",
              height: "140px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.35) 10%, rgba(6, 182, 212, 0.45) 25%, rgba(16, 185, 129, 0.4) 40%, rgba(20, 184, 166, 0.45) 60%, rgba(34, 197, 94, 0.4) 75%, rgba(6, 182, 212, 0.35) 90%, transparent 100%)",
              borderRadius: "30% 70% 40% 60% / 70% 30% 60% 40%",
              filter: "blur(18px)",
              animation:
                "34s ease-in-out 0s infinite normal none running aurora-wave-subtle-2",
              transform: "skewY(0.5deg)",
            }}
          />
          <div
            className="absolute aurora-curtain-3"
            style={{
              top: "70%",
              left: "-25%",
              right: "-25%",
              height: "100px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(20, 184, 166, 0.3) 20%, rgba(34, 197, 94, 0.4) 35%, rgba(6, 182, 212, 0.35) 50%, rgba(16, 185, 129, 0.4) 65%, rgba(20, 184, 166, 0.3) 80%, transparent 100%)",
              borderRadius: "60% 40% 80% 20% / 40% 60% 20% 80%",
              filter: "blur(20px)",
              animation:
                "40s ease-in-out 0s infinite normal none running aurora-wave-subtle-3",
              transform: "skewY(-0.5deg)",
            }}
          />
        </div>

        {/* Floating Particles - exactly like home page */}
        <div className="absolute inset-0">
          {[
            {
              left: "8%",
              top: "12%",
              size: "6px",
              color: "rgba(34, 197, 94, 0.9)",
              blur: "1px",
              shadow: "0px 0px 12px",
              animation:
                "4s ease-in-out 0s infinite normal none running desktop-float-1",
            },
            {
              left: "15%",
              top: "23%",
              size: "8px",
              color: "rgba(59, 130, 246, 0.9)",
              blur: "1.5px",
              shadow: "0px 0px 18px",
              animation:
                "5s ease-in-out 0.3s infinite normal none running desktop-float-2",
            },
            {
              left: "22%",
              top: "34%",
              size: "10px",
              color: "rgba(147, 51, 234, 0.9)",
              blur: "1px",
              shadow: "0px 0px 24px",
              animation:
                "6s ease-in-out 0.6s infinite normal none running desktop-float-3",
            },
            {
              left: "29%",
              top: "45%",
              size: "12px",
              color: "rgba(236, 72, 153, 0.9)",
              blur: "1.5px",
              shadow: "0px 0px 12px",
              animation:
                "4s ease-in-out 0.9s infinite normal none running desktop-float-4",
            },
            {
              left: "36%",
              top: "56%",
              size: "6px",
              color: "rgba(6, 182, 212, 0.9)",
              blur: "1px",
              shadow: "0px 0px 18px",
              animation:
                "5s ease-in-out 1.2s infinite normal none running desktop-float-1",
            },
            {
              left: "43%",
              top: "67%",
              size: "8px",
              color: "rgba(245, 158, 11, 0.9)",
              blur: "1.5px",
              shadow: "0px 0px 24px",
              animation:
                "6s ease-in-out 1.5s infinite normal none running desktop-float-2",
            },
            {
              left: "50%",
              top: "78%",
              size: "10px",
              color: "rgba(34, 197, 94, 0.9)",
              blur: "1px",
              shadow: "0px 0px 12px",
              animation:
                "4s ease-in-out 1.8s infinite normal none running desktop-float-3",
            },
            {
              left: "57%",
              top: "13%",
              size: "12px",
              color: "rgba(59, 130, 246, 0.9)",
              blur: "1.5px",
              shadow: "0px 0px 18px",
              animation:
                "5s ease-in-out 2.1s infinite normal none running desktop-float-4",
            },
            {
              left: "64%",
              top: "24%",
              size: "6px",
              color: "rgba(147, 51, 234, 0.9)",
              blur: "1px",
              shadow: "0px 0px 24px",
              animation:
                "6s ease-in-out 2.4s infinite normal none running desktop-float-1",
            },
            {
              left: "71%",
              top: "35%",
              size: "8px",
              color: "rgba(236, 72, 153, 0.9)",
              blur: "1.5px",
              shadow: "0px 0px 12px",
              animation:
                "4s ease-in-out 2.7s infinite normal none running desktop-float-2",
            },
            {
              left: "78%",
              top: "46%",
              size: "10px",
              color: "rgba(6, 182, 212, 0.9)",
              blur: "1px",
              shadow: "0px 0px 18px",
              animation:
                "5s ease-in-out 3s infinite normal none running desktop-float-3",
            },
            {
              left: "85%",
              top: "57%",
              size: "12px",
              color: "rgba(245, 158, 11, 0.9)",
              blur: "1.5px",
              shadow: "0px 0px 24px",
              animation:
                "6s ease-in-out 3.3s infinite normal none running desktop-float-4",
            },
          ].map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                background: `radial-gradient(circle, ${particle.color} 0%, ${particle.color.replace("0.9", "0.2")} 60%, transparent 80%)`,
                animation: particle.animation,
                filter: `blur(${particle.blur})`,
                boxShadow: `${particle.color} ${particle.shadow}`,
              }}
            />
          ))}
        </div>

        {/* Crystal Formations */}
        <div className="absolute top-16 left-16 w-32 h-40 opacity-45">
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(6, 182, 212, 0.3) 50%, rgba(34, 197, 94, 0.2) 100%)",
              clipPath:
                "polygon(50% 0%, 80% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 20% 30%)",
              animation: "18s ease-in-out infinite running crystal-growth-1",
              filter: "blur(8px)",
              transform: "rotate(15deg)",
            }}
          />
        </div>
        <div className="absolute top-12 right-20 w-28 h-36 opacity-40">
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(45deg, rgba(59, 130, 246, 0.5) 0%, rgba(147, 51, 234, 0.3) 50%, rgba(99, 102, 241, 0.2) 100%)",
              clipPath:
                "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
              animation: "22s ease-in-out 3s infinite running crystal-growth-2",
              filter: "blur(6px)",
              transform: "rotate(-20deg)",
            }}
          />
        </div>
        <div className="absolute bottom-20 left-12 w-36 h-32 opacity-50">
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(236, 72, 153, 0.4) 0%, rgba(219, 39, 119, 0.3) 50%, rgba(190, 24, 93, 0.2) 100%)",
              clipPath:
                "polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)",
              animation: "20s ease-in-out 6s infinite running crystal-growth-3",
              filter: "blur(10px)",
              transform: "rotate(45deg)",
            }}
          />
        </div>
        <div className="absolute bottom-16 right-16 w-30 h-38 opacity-35">
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(225deg, rgba(245, 158, 11, 0.4) 0%, rgba(251, 191, 36, 0.3) 50%, rgba(252, 211, 77, 0.2) 100%)",
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
              animation: "16s ease-in-out 9s infinite running crystal-growth-1",
              filter: "blur(7px)",
              transform: "rotate(-30deg)",
            }}
          />
        </div>

        {/* Prismatic Light Refractions */}
        <div className="absolute inset-0 opacity-20">
          {/* Geometric prism shapes */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`prism-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 90 + 5}%`,
                top: `${Math.random() * 90 + 5}%`,
                width: `${8 + Math.random() * 16}px`,
                height: `${12 + Math.random() * 24}px`,
                background: `linear-gradient(${Math.random() * 360}deg,
                  rgba(${i % 4 === 0 ? "16, 185, 129" : i % 4 === 1 ? "59, 130, 246" : i % 4 === 2 ? "236, 72, 153" : "245, 158, 11"}, 0.6) 0%,
                  transparent 100%)`,
                clipPath:
                  i % 3 === 0
                    ? "polygon(50% 0%, 100% 100%, 0% 100%)"
                    : i % 3 === 1
                      ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                      : "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)",
                animation: `${4 + Math.random() * 6}s ease-in-out ${Math.random() * 3}s infinite running prismatic-refraction`,
                transform: `rotate(${Math.random() * 360}deg)`,
                filter: "blur(1px)",
              }}
            />
          ))}

          {/* Crystal lattice pattern */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient
                id="crystalGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style={{
                    stopColor: "rgba(16, 185, 129, 0.3)",
                    stopOpacity: 1,
                  }}
                />
                <stop
                  offset="33%"
                  style={{
                    stopColor: "rgba(59, 130, 246, 0.2)",
                    stopOpacity: 1,
                  }}
                />
                <stop
                  offset="66%"
                  style={{
                    stopColor: "rgba(236, 72, 153, 0.2)",
                    stopOpacity: 1,
                  }}
                />
                <stop
                  offset="100%"
                  style={{
                    stopColor: "rgba(245, 158, 11, 0.1)",
                    stopOpacity: 1,
                  }}
                />
              </linearGradient>
            </defs>
            <polygon
              points="15,25 25,15 35,25 25,35"
              stroke="url(#crystalGrad)"
              strokeWidth="1"
              fill="none"
              opacity="0.4"
            />
            <polygon
              points="65,20 75,10 85,20 85,30 75,40 65,30"
              stroke="url(#crystalGrad)"
              strokeWidth="1"
              fill="none"
              opacity="0.3"
            />
            <polygon
              points="20,75 30,65 40,75 30,85"
              stroke="url(#crystalGrad)"
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />
            <polygon
              points="70,70 85,70 92,85 78,92 63,85 70,70"
              stroke="url(#crystalGrad)"
              strokeWidth="1"
              fill="none"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Faceted Light Beams */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`lightbeam-${i}`}
            className="absolute opacity-30"
            style={{
              left: `${10 + i * 15}%`,
              top: `${5 + i * 10}%`,
              width: "3px",
              height: `${60 + Math.random() * 40}px`,
              background: `linear-gradient(180deg,
                rgba(${i % 4 === 0 ? "16, 185, 129" : i % 4 === 1 ? "59, 130, 246" : i % 4 === 2 ? "236, 72, 153" : "245, 158, 11"}, 0.8) 0%,
                rgba(${i % 4 === 0 ? "16, 185, 129" : i % 4 === 1 ? "59, 130, 246" : i % 4 === 2 ? "236, 72, 153" : "245, 158, 11"}, 0.4) 50%,
                transparent 100%)`,
              transform: `rotate(${-30 + i * 15}deg)`,
              filter: "blur(2px)",
            }}
            animate={{
              scaleY: [0.8, 1, 0.9, 1],
              opacity: [0.1, 0.3, 0.2, 0.3],
            }}
            transition={{
              duration: 12 + i * 2,
              repeat: Infinity,
              delay: i * 3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Crystal Resonance Waves - Fixed with layered approach */}
        <div className="absolute inset-0 opacity-15">
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 25% 30%, rgba(16, 185, 129, 0.3) 0%, transparent 70%)",
            }}
            animate={{ opacity: [1, 0, 0] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 75% 60%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
            }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 30% at 50% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 80%)",
            }}
            animate={{ opacity: [0, 0, 1] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Wave Animations - exactly like home page */}
        <div className="absolute inset-0">
          {[
            {
              top: "15%",
              animation:
                "8s ease-in-out 0s infinite normal none running desktop-wave-1",
              transform: "skewY(-1.5deg) rotate(0deg)",
            },
            {
              top: "35%",
              animation:
                "10s ease-in-out 0s infinite normal none running desktop-wave-2",
              transform: "skewY(-1deg) rotate(1.5deg)",
            },
            {
              top: "55%",
              animation:
                "12s ease-in-out 0s infinite normal none running desktop-wave-3",
              transform: "skewY(-0.5deg) rotate(3deg)",
            },
          ].map((wave, i) => (
            <div
              key={i}
              className="absolute w-full h-40 opacity-30"
              style={{
                top: wave.top,
                background:
                  "linear-gradient(120deg, transparent 0%, rgba(34, 197, 94, 0.25) 20%, rgba(59, 130, 246, 0.35) 40%, rgba(147, 51, 234, 0.3) 60%, rgba(236, 72, 153, 0.25) 80%, transparent 100%)",
                borderRadius: "50% 70% 40% 80% / 60% 30% 50% 70%",
                filter: "blur(10px)",
                animation: wave.animation,
                transform: wave.transform,
              }}
            />
          ))}
        </div>

        {/* Floating Crystal Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating Crystal Shards */}
          {[
            { left: 15, top: 20, width: 18, height: 24, rotation: 45 },
            { left: 75, top: 15, width: 22, height: 30, rotation: 120 },
            { left: 30, top: 60, width: 16, height: 28, rotation: 200 },
            { left: 85, top: 70, width: 20, height: 26, rotation: 300 },
            { left: 10, top: 80, width: 14, height: 22, rotation: 60 },
            { left: 60, top: 40, width: 24, height: 32, rotation: 180 },
            { left: 40, top: 25, width: 16, height: 20, rotation: 270 },
            { left: 90, top: 45, width: 18, height: 26, rotation: 90 },
            { left: 25, top: 85, width: 20, height: 24, rotation: 150 },
            { left: 70, top: 75, width: 22, height: 28, rotation: 330 },
          ].map((shard, i) => (
            <motion.div
              key={`shard-${i}`}
              className="absolute"
              style={{
                left: `${shard.left}%`,
                top: `${shard.top}%`,
                width: `${shard.width}px`,
                height: `${shard.height}px`,
                background: `linear-gradient(${120 + i * 30}deg,
                  rgba(${i % 4 === 0 ? "16, 185, 129" : i % 4 === 1 ? "59, 130, 246" : i % 4 === 2 ? "236, 72, 153" : "245, 158, 11"}, 0.4) 0%,
                  rgba(${i % 4 === 0 ? "16, 185, 129" : i % 4 === 1 ? "59, 130, 246" : i % 4 === 2 ? "236, 72, 153" : "245, 158, 11"}, 0.1) 100%)`,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                transform: `rotate(${shard.rotation}deg)`,
                filter: "blur(1px)",
              }}
              animate={{
                x: [0, 5, -3, 0],
                y: [0, -3, 5, 0],
                rotate: [0, 15, 30, 45, 60],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 25 + i * 3,
                repeat: Infinity,
                delay: i * 2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Crystalline Geometric Patterns */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-20 h-20 opacity-35"
            animate={{
              rotate: [0, 60, 120, 180],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="w-full h-full"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(16, 185, 129, 0.5) 0%, transparent 33%, rgba(59, 130, 246, 0.4) 66%, transparent 100%)",
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                filter: "blur(2px)",
              }}
            />
          </motion.div>

          <motion.div
            className="absolute top-2/3 right-1/5 w-24 h-24 opacity-30"
            animate={{
              rotate: [180, 120, 60, 0],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 45,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="w-full h-full"
              style={{
                background:
                  "linear-gradient(45deg, rgba(236, 72, 153, 0.4) 0%, rgba(245, 158, 11, 0.3) 100%)",
                clipPath:
                  "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                filter: "blur(3px)",
              }}
            />
          </motion.div>

          {/* Crystal Growth Nodes */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 opacity-20"
            animate={{ rotate: [0, 180] }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            <div
              className="absolute top-2 left-1/2 w-3 h-3 -translate-x-1/2 bg-emerald-400 opacity-60"
              style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
            />
            <div
              className="absolute bottom-2 right-1/2 w-4 h-4 translate-x-1/2 bg-blue-400 opacity-50"
              style={{
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              }}
            />
            <div
              className="absolute left-2 top-1/2 w-2 h-2 -translate-y-1/2 bg-pink-400 opacity-70"
              style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
            />
          </motion.div>

          {/* Professional Ambient Text */}
          <motion.div
            className="absolute top-1/3 right-1/6 text-emerald-300 font-light text-sm opacity-25"
            animate={{
              y: [0, -2, 0],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            precision • innovation
          </motion.div>

          <motion.div
            className="absolute bottom-1/3 left-1/6 text-blue-300 font-light text-sm opacity-20"
            animate={{
              x: [0, 1, -1, 0],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            excellence → delivery
          </motion.div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20 pt-32">
          {/* Header Section */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <h1
              className={`font-poppins text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight relative mobile-lively-text mb-8 ${
                theme === "light" ? "text-gray-900" : "text-white"
              }`}
            >
              <span className="warm-glow-text animate-warm-glow-pulse">
                Our Process
              </span>
            </h1>

            <motion.div
              className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium ${
                theme === "light" ? "text-gray-600" : "text-gray-400"
              } max-w-5xl mx-auto font-poppins`}
              style={{
                filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1))",
                textShadow: "none",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <span className="warm-glow-text animate-warm-glow-pulse text-smooth glow-120hz">
                We deliver comprehensive digital solutions through strategic
                innovation, cutting-edge technology, and meticulous execution,
                transforming your business vision into powerful, scalable
                applications that drive measurable results and sustainable
                growth
              </span>
            </motion.div>
          </motion.div>

          {/* Process Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
            {processSteps.map((step, index) => {
              const IconComponent = step.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.number}
                  className="relative"
                  initial={{ opacity: 0, x: isEven ? -50 : 50, y: 50 }}
                  animate={{
                    opacity: isVisible ? 1 : 0,
                    x: isVisible ? 0 : isEven ? -50 : 50,
                    y: isVisible ? 0 : 50,
                  }}
                  transition={{ duration: 0.8, delay: 0.8 + index * 0.2 }}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Cosmic Stellar Card */}
                  <motion.div
                    className="relative p-8 rounded-3xl backdrop-blur-xl border bg-white/5 border-white/10 shadow-2xl overflow-hidden group"
                    whileHover={{
                      scale: 1.02,
                      y: -8,
                      transition: { duration: 0.3, ease: "easeOut" },
                    }}
                    style={{
                      boxShadow:
                        hoveredCard === index
                          ? `0 25px 50px -12px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(6, 182, 212, 0.2), 0 0 20px rgba(34, 197, 94, 0.15)`
                          : "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    {/* Crystal Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/3 to-emerald-500/5 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

                    {/* Stellar Constellation Overlay */}
                    <div className="absolute inset-0 opacity-8 group-hover:opacity-15 transition-opacity duration-500">
                      {/* Floating stars */}
                      {[
                        {
                          left: 20,
                          top: 15,
                          size: 1.5,
                          opacity: 0.4,
                          duration: 3,
                        },
                        {
                          left: 32,
                          top: 23,
                          size: 1,
                          opacity: 0.5,
                          duration: 4,
                        },
                        {
                          left: 44,
                          top: 31,
                          size: 2,
                          opacity: 0.3,
                          duration: 2.5,
                        },
                        {
                          left: 56,
                          top: 39,
                          size: 1.5,
                          opacity: 0.6,
                          duration: 3.5,
                        },
                        {
                          left: 68,
                          top: 47,
                          size: 1,
                          opacity: 0.4,
                          duration: 4.5,
                        },
                        {
                          left: 80,
                          top: 55,
                          size: 2,
                          opacity: 0.5,
                          duration: 3,
                        },
                        {
                          left: 26,
                          top: 63,
                          size: 1.5,
                          opacity: 0.3,
                          duration: 2.5,
                        },
                        {
                          left: 38,
                          top: 71,
                          size: 1,
                          opacity: 0.6,
                          duration: 4,
                        },
                      ].map((star, starIndex) => (
                        <div
                          key={starIndex}
                          className="absolute rounded-full bg-white"
                          style={{
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: star.opacity,
                            animation: `${star.duration}s ease-in-out ${starIndex * 0.3}s infinite running stellar-twinkle`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Static Crystal Glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-15 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-emerald-500/5 transition-opacity duration-500" />

                    {/* Step Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        {/* Crystal Faceted Badge */}
                        <motion.div
                          className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-lg"
                          whileHover={{ rotate: 5, scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            boxShadow:
                              "0 10px 30px rgba(59, 130, 246, 0.4), 0 0 20px rgba(6, 182, 212, 0.3)",
                            border: "1px solid rgba(34, 197, 94, 0.2)",
                          }}
                        >
                          {step.number}
                          <motion.div
                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-30"
                            transition={{ duration: 0.3 }}
                          />
                          {/* Crystal Facet Effect */}
                          <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{
                              background:
                                "conic-gradient(from 0deg, transparent 0%, rgba(16, 185, 129, 0.3) 25%, transparent 50%, rgba(59, 130, 246, 0.2) 75%, transparent 100%)",
                            }}
                            animate={{ rotate: [0, 360] }}
                            transition={{
                              duration: 12,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        </motion.div>

                        {/* Professional Category Badge */}
                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-500/20">
                          {step.category}
                        </div>
                      </div>

                      {/* Animated Icon */}
                      <motion.div
                        className="p-3 rounded-xl bg-blue-900/20 text-blue-400"
                        animate={{
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.5,
                        }}
                      >
                        <IconComponent size={24} />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-white">
                        {step.title}
                      </h3>

                      <p className="text-base leading-relaxed text-gray-300">
                        {step.description}
                      </p>

                      {/* Features List */}
                      <div className="grid grid-cols-2 gap-2 mt-6">
                        {step.features.map((feature, featureIndex) => (
                          <motion.div
                            key={featureIndex}
                            className="flex items-center space-x-2 p-2 rounded-lg bg-blue-900/10 text-blue-300"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{
                              opacity: isVisible ? 1 : 0,
                              x: isVisible ? 0 : -10,
                            }}
                            transition={{
                              delay: 1.2 + index * 0.2 + featureIndex * 0.1,
                            }}
                          >
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <span className="text-sm font-medium">
                              {feature}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Metrics */}
                      <motion.div
                        className="mt-6 p-4 rounded-xl border bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-800/30"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {step.metrics[0]}
                          </div>
                          <div className="text-sm text-blue-400/70">
                            {step.metrics[1]} {step.metrics[2]}
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Hover Border Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl border-2 border-blue-400/0 group-hover:border-blue-400/20 pointer-events-none"
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  },
);

WhatWeDoSection.displayName = "WhatWeDoSection";

// ========================================
// SERVICES SECTION COMPONENT
// ========================================

// Service Card Component
const ServiceCard = ({
  service,
  index,
  isVisible,
}: {
  service: any;
  index: number;
  isVisible: boolean;
}) => (
  <motion.div
    className="group relative h-full"
    initial={{ y: 40, opacity: 0, scale: 0.9 }}
    animate={
      isVisible
        ? { y: 0, opacity: 1, scale: 1 }
        : { y: 40, opacity: 0, scale: 0.9 }
    }
    transition={{
      duration: 0.6,
      delay: 0.05 + index * 0.05,
      type: "spring",
      stiffness: 120,
    }}
    whileHover={{
      scale: 1.01,
      y: -3,
      transition: { duration: 0.2 },
    }}
  >
    {/* Main Card Container */}
    <div className="relative h-full min-h-[150px] sm:min-h-[170px] lg:min-h-[190px]">
      {/* Outer Glow Effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"
        style={{
          background: `linear-gradient(135deg, ${service.color.replace("from-", "").replace(" to-", ", ").replace("-500", "")})`,
          transform: "scale(1.05)",
        }}
      />

      {/* Card Body */}
      <div
        className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Animated Gradient Overlay */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-700 bg-gradient-to-br ${service.color}`}
        />

        {/* Dynamic Light Effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
          {/* Top Light */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          {/* Side Lights */}
          <div className="absolute top-8 left-0 w-px h-16 bg-gradient-to-b from-white/30 to-transparent" />
          <div className="absolute top-8 right-0 w-px h-16 bg-gradient-to-b from-white/30 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col p-3 sm:p-3.5 lg:p-4">
          {/* Icon Section */}
          <div className="flex justify-center mb-3">
            <motion.div
              className="relative"
              whileHover={{
                rotate: [0, -5, 5, 0],
                scale: 1.05,
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Icon Background */}
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${service.color} shadow-md`}
                style={{
                  boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
              >
                <service.icon className="w-6 h-6 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white drop-shadow-md" />
              </div>

              {/* Icon Glow */}
              <div
                className={`absolute inset-0 rounded-lg bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-sm -z-10`}
              />
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center mb-3">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent leading-tight">
              {service.title}
            </h3>
          </div>

          {/* Description */}
          <div className="flex-1 flex items-center">
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed text-center opacity-95 group-hover:opacity-100 transition-opacity duration-300">
              {service.description}
            </p>
          </div>

          {/* Bottom Accent */}
          <div className="mt-2 flex justify-center">
            <div
              className={`w-10 h-0.5 rounded-full bg-gradient-to-r ${service.color} opacity-60 group-hover:opacity-100 group-hover:w-12 transition-all duration-300`}
            />
          </div>
        </div>

        {/* Interactive Particles */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div
            className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full"
            style={{
              animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) 0s infinite",
            }}
          />
          <div
            className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full"
            style={{
              animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) 0.5s infinite",
            }}
          />
          <div
            className="absolute top-1/2 left-3/4 w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) 1s infinite",
            }}
          />
        </div>
      </div>
    </div>
  </motion.div>
);

const ServicesSection = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ theme, isVisible }, ref) => {
    const [screenSize, setScreenSize] = useState<
      "mobile" | "tablet" | "desktop"
    >("desktop");

    useEffect(() => {
      const updateScreenSize = () => {
        const width = window.innerWidth;
        if (width <= 640) {
          setScreenSize("mobile");
        } else if (width <= 991) {
          setScreenSize("tablet");
        } else {
          setScreenSize("desktop");
        }
      };

      updateScreenSize();
      window.addEventListener("resize", updateScreenSize);
      return () => window.removeEventListener("resize", updateScreenSize);
    }, []);

    const [currentServicesPage, setCurrentServicesPage] = useState(0);

    const services = [
      // Page 1
      {
        icon: Globe,
        title: "Web Development",
        description:
          "Modern, responsive websites built with cutting-edge technologies",
        color: "from-blue-500 to-cyan-500",
      },
      {
        icon: Smartphone,
        title: "Mobile Apps",
        description: "Native and cross-platform mobile applications",
        color: "from-purple-500 to-pink-500",
      },
      {
        icon: Palette,
        title: "UI/UX Design",
        description: "Beautiful, intuitive designs that engage and convert",
        color: "from-green-500 to-emerald-500",
      },
      {
        icon: Zap,
        title: "AI Integration",
        description: "Smart solutions powered by artificial intelligence",
        color: "from-orange-500 to-red-500",
      },
      {
        icon: Globe,
        title: "SEO Optimization",
        description: "Boost your search rankings and drive organic traffic",
        color: "from-indigo-500 to-purple-500",
      },
      {
        icon: Code,
        title: "Custom Solutions",
        description: "Tailored software solutions for unique business needs",
        color: "from-teal-500 to-blue-500",
      },
      // Page 2
      {
        icon: Users,
        title: "Consulting Services",
        description:
          "Strategic technology consulting and digital transformation",
        color: "from-pink-500 to-rose-500",
      },
      {
        icon: Shield,
        title: "Cybersecurity",
        description:
          "Comprehensive security solutions to protect your digital assets",
        color: "from-red-500 to-orange-500",
      },
      {
        icon: Cloud,
        title: "Cloud Solutions",
        description: "Scalable cloud infrastructure and migration services",
        color: "from-blue-400 to-blue-600",
      },
      {
        icon: Database,
        title: "Data Analytics",
        description: "Transform raw data into actionable business insights",
        color: "from-violet-500 to-purple-500",
      },
      {
        icon: Zap,
        title: "API Development",
        description: "Robust APIs for seamless system integrations",
        color: "from-cyan-500 to-blue-500",
      },
      {
        icon: Code,
        title: "DevOps & CI/CD",
        description: "Streamlined development and deployment pipelines",
        color: "from-emerald-500 to-green-500",
      },
    ];

    const servicesPerPage = 6;
    const totalServicesPages = Math.ceil(services.length / servicesPerPage);

    const getCurrentPageServices = () => {
      if (screenSize === "desktop") {
        const startIndex = currentServicesPage * servicesPerPage;
        return services.slice(startIndex, startIndex + servicesPerPage);
      }
      return services; // Show all services on mobile/tablet
    };

    const nextServicesPage = () => {
      if (currentServicesPage < totalServicesPages - 1) {
        setCurrentServicesPage(currentServicesPage + 1);
      }
    };

    const prevServicesPage = () => {
      if (currentServicesPage > 0) {
        setCurrentServicesPage(currentServicesPage - 1);
      }
    };

    return (
      <motion.div
        ref={ref}
        className={`relative w-full min-h-screen overflow-hidden ${
          theme === "light"
            ? "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700"
            : "bg-gradient-to-br from-gray-900 via-blue-900 to-black"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1 }}
        style={{
          maxWidth: "100vw",
          overflowX: "hidden",
          contain: "layout style paint",
        }}
      >
        {/* SPECTACULAR SERVICES SECTION ENHANCEMENTS - BLUE VOLCANIC THEME */}

        {/* Blue Volcanic Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Blue Volcanos */}
          <div className="absolute inset-0">
            {[
              ...Array(
                screenSize === "mobile" ? 2 : screenSize === "tablet" ? 3 : 4,
              ),
            ].map((_, i) => (
              <div key={`volcano-${i}`} className="absolute">
                {/* Volcano Shape */}
                <div
                  className="absolute"
                  style={{
                    left: `${15 + i * (screenSize === "mobile" ? 35 : 25)}%`,
                    bottom: "0px",
                    width: `${screenSize === "mobile" ? 60 : 100}px`,
                    height: `${screenSize === "mobile" ? 80 : 120}px`,
                    background:
                      "linear-gradient(45deg, rgba(30, 58, 138, 0.8) 0%, rgba(59, 130, 246, 0.6) 100%)",
                    clipPath: "polygon(40% 100%, 0% 0%, 100% 0%, 60% 100%)",
                    filter: "drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))",
                  }}
                />

                {/* Erupting Blue Fire */}
                <div
                  className="absolute"
                  style={{
                    left: `${15 + i * (screenSize === "mobile" ? 35 : 25) + (screenSize === "mobile" ? 7 : 12)}%`,
                    bottom: `${screenSize === "mobile" ? 80 : 120}px`,
                    width: `${screenSize === "mobile" ? 40 : 60}px`,
                    height: `${screenSize === "mobile" ? 60 : 100}px`,
                  }}
                >
                  {[...Array(screenSize === "mobile" ? 8 : 15)].map((_, j) => (
                    <motion.div
                      key={`fire-particle-${i}-${j}`}
                      className="absolute rounded-full"
                      style={{
                        left: `${20 + (j % 5) * 8}%`,
                        bottom: "0px",
                        width: `${3 + (j % 3)}px`,
                        height: `${4 + (j % 4)}px`,
                        background: [
                          "radial-gradient(ellipse, #3b82f6 0%, #1d4ed8 50%, transparent 80%)",
                          "radial-gradient(ellipse, #60a5fa 0%, #2563eb 50%, transparent 80%)",
                          "radial-gradient(ellipse, #93c5fd 0%, #3b82f6 50%, transparent 80%)",
                        ][j % 3],
                        boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)",
                      }}
                      animate={{
                        y: [
                          0,
                          -(screenSize === "mobile" ? 40 : 80) - (j % 3) * 20,
                        ],
                        x: [j % 2 === 0 ? -5 : 5, j % 2 === 0 ? -15 : 15],
                        opacity: [1, 0.8, 0],
                        scale: [1, 1.2, 0.5],
                      }}
                      transition={{
                        duration: 2 + (j % 3) * 0.5,
                        repeat: Infinity,
                        delay: (j * 0.1 + i * 0.5) % 4,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Blue Flame Wisps */}
          <div className="absolute inset-0">
            {[
              ...Array(
                screenSize === "mobile"
                  ? 12
                  : screenSize === "tablet"
                    ? 20
                    : 30,
              ),
            ].map((_, i) => (
              <motion.div
                key={`flame-wisp-${i}`}
                className="absolute"
                style={{
                  left: `${(i * 3.33) % 100}%`,
                  bottom: "-10px",
                  width: `${screenSize === "mobile" ? 8 : 15}px`,
                  height: `${screenSize === "mobile" ? 20 : 35}px`,
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.8) 30%, rgba(147, 197, 253, 0.9) 70%, rgba(219, 234, 254, 0.6) 100%)",
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  filter: "blur(1px)",
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
                }}
                animate={{
                  y: [0, -(screenSize === "mobile" ? 30 : 60)],
                  x: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20],
                  scaleY: [1, 1.5, 0.8],
                  scaleX: [1, 0.8, 1.2],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 3 + (i % 4) * 0.5,
                  repeat: Infinity,
                  delay: (i * 0.15) % 5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Animated Noise Texture */}
          <div
            className="absolute inset-0 opacity-15 animate-noise"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating Service Icons with Orbit Animation - Desktop Only for Performance */}
        {screenSize === "desktop" && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ clipPath: "inset(0)" }}
          >
            {[
              {
                Icon: Globe,
                color: "from-blue-500 to-cyan-500",
                x: 75, // Reduced from 85 to prevent overflow
                y: 20,
                delay: 0,
              },
              {
                Icon: Smartphone,
                color: "from-purple-500 to-pink-500",
                x: 20, // Increased from 15 to prevent overflow
                y: 30,
                delay: 1,
              },
              ...(window.innerWidth >= 992
                ? [
                    {
                      Icon: Palette,
                      color: "from-green-500 to-emerald-500",
                      x: 70, // Reduced from 80
                      y: 65,
                      delay: 2,
                    },
                    {
                      Icon: Zap,
                      color: "from-orange-500 to-red-500",
                      x: 20, // Increased from 10
                      y: 70,
                      delay: 3,
                    },
                    {
                      Icon: Users,
                      color: "from-indigo-500 to-purple-500",
                      x: 75, // Reduced from 85
                      y: 85,
                      delay: 4,
                    },
                    {
                      Icon: Code,
                      color: "from-teal-500 to-blue-500",
                      x: 20, // Increased from 15
                      y: 15,
                      delay: 5,
                    },
                  ]
                : [
                    {
                      Icon: Palette,
                      color: "from-green-500 to-emerald-500",
                      x: 65, // Reduced from 75
                      y: 75,
                      delay: 2,
                    },
                  ]),
            ].map((service, i) => (
              <motion.div
                key={`floating-service-${i}`}
                className="absolute"
                style={{
                  left: `${service.x}%`,
                  top: `${service.y}%`,
                }}
                animate={
                  window.innerWidth < 992
                    ? {
                        y: [-6, 6, -6],
                      }
                    : {
                        y: [-12, 12, -12],
                        x: [-4, 4, -4], // Reduced from [-8, 8, -8] to prevent overflow
                        rotateZ: [-8, 8, -8], // Reduced rotation
                        scale: [0.9, 1.1, 0.9], // Reduced scale range
                      }
                }
                transition={{
                  duration: window.innerWidth < 992 ? 6 + (i % 2) : 4 + (i % 3),
                  repeat: Infinity,
                  delay: service.delay * (window.innerWidth < 992 ? 1 : 0.5),
                }}
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} opacity-40 backdrop-blur-sm border border-white/30 flex items-center justify-center`}
                  style={{
                    boxShadow: "0 0 30px rgba(73, 146, 255, 0.4)",
                  }}
                >
                  <service.Icon className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Rotating Skill Rings - Desktop Only for Performance */}
        {screenSize === "desktop" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`skill-ring-${i}`}
                className="absolute rounded-full border-2"
                style={{
                  width:
                    window.innerWidth < 992
                      ? `${250 + i * 80}px`
                      : `${300 + i * 100}px`,
                  height:
                    window.innerWidth < 992
                      ? `${250 + i * 80}px`
                      : `${300 + i * 100}px`,
                  border: `${window.innerWidth < 992 ? "1px" : "2px"} solid rgba(73, 146, 255, ${0.4 - i * 0.1})`,
                  opacity: window.innerWidth < 992 ? 0.15 : 0.2,
                }}
                animate={{
                  rotateZ: i % 2 === 0 ? [0, 360] : [360, 0],
                }}
                transition={{
                  duration: window.innerWidth < 992 ? 30 + i * 15 : 20 + i * 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {/* Skill indicators on the ring - Reduced for mobile */}
                {[...Array(window.innerWidth < 992 ? 4 : 6)].map(
                  (_, skillIndex) => (
                    <motion.div
                      key={`skill-indicator-${i}-${skillIndex}`}
                      className="absolute rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                      style={{
                        width: window.innerWidth < 992 ? "2px" : "12px",
                        height: window.innerWidth < 992 ? "2px" : "12px",
                        left: `${50 + 45 * Math.cos((skillIndex * (window.innerWidth < 992 ? 90 : 60) * Math.PI) / 180)}%`,
                        top: `${50 + 45 * Math.sin((skillIndex * (window.innerWidth < 992 ? 90 : 60) * Math.PI) / 180)}%`,
                        transform: "translate(-50%, -50%)",
                        boxShadow:
                          window.innerWidth < 992
                            ? "0 0 5px rgba(73, 146, 255, 0.4)"
                            : "0 0 10px rgba(73, 146, 255, 0.6)",
                      }}
                      animate={
                        window.innerWidth < 992
                          ? {
                              opacity: [0.6, 1, 0.6],
                            }
                          : {
                              scale: [0.8, 1.2, 0.8],
                              opacity: [0.4, 1, 0.4],
                            }
                      }
                      transition={{
                        duration: window.innerWidth < 992 ? 3 : 2,
                        repeat: Infinity,
                        delay:
                          skillIndex * (window.innerWidth < 992 ? 0.5 : 0.3),
                      }}
                    />
                  ),
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Floating Digital Elements */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ clipPath: "inset(0)" }}
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`digital-element-${i}`}
              className="absolute opacity-30"
              style={{
                left: `${10 + ((i * 60) % 75)}%`, // Constrained from 5-95% to 10-85%
                top: `${15 + ((i * 30) % 70)}%`, // Adjusted for better distribution
              }}
              animate={{
                y: [-15, 15, -15], // Reduced animation range
                x: [-5, 5, -5], // Significantly reduced horizontal movement
                rotateZ: [-12, 12, -12], // Reduced rotation
              }}
              transition={{
                duration: 5 + (i % 3),
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              <div
                className="w-8 h-8 border-2 border-blue-400/50 backdrop-blur-sm"
                style={{
                  clipPath: [
                    "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", // Diamond
                    "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)", // Octagon
                    "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)", // Star
                  ][i % 3],
                  background: `linear-gradient(135deg, rgba(73, 146, 255, 0.3), rgba(34, 211, 238, 0.3))`,
                  boxShadow: "0 0 15px rgba(73, 146, 255, 0.2)",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Colorful Floating Orbs for Mobile/Tablet (replacing heavy particles) */}
        {screenSize !== "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(screenSize === "tablet" ? 6 : 4)].map((_, i) => (
              <div
                key={`mobile-orb-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${10 + ((i * 70) % 80)}%`,
                  top: `${15 + ((i * 50) % 70)}%`,
                  width: `${screenSize === "tablet" ? 8 + (i % 3) * 2 : 6 + (i % 2)}px`,
                  height: `${screenSize === "tablet" ? 8 + (i % 3) * 2 : 6 + (i % 2)}px`,
                  background: [
                    "radial-gradient(circle, rgba(34, 197, 94, 0.7) 0%, rgba(34, 197, 94, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(59, 130, 246, 0.7) 0%, rgba(59, 130, 246, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(147, 51, 234, 0.7) 0%, rgba(147, 51, 234, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, rgba(236, 72, 153, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(6, 182, 212, 0.7) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(245, 158, 11, 0.7) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%)",
                  ][i % 6],
                  animation: `gentleFloat ${4 + (i % 3)}s ease-in-out infinite ${i * 0.5}s`,
                  filter: `blur(${1 + (i % 2) * 0.5}px)`,
                  boxShadow: `0 0 ${8 + (i % 2) * 4}px currentColor`,
                }}
              />
            ))}
          </div>
        )}

        {/* Animated Geometric Patterns - Desktop Only */}
        {screenSize === "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <svg className="absolute w-full h-full" viewBox="0 0 1200 800">
              {/* Animated hexagon grid */}
              {[...Array(4)].map((_, i) => (
                <polygon
                  key={`hex-${i}`}
                  points="100,20 140,40 140,80 100,100 60,80 60,40"
                  fill="none"
                  stroke="rgba(73, 146, 255, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="10 5"
                  style={{
                    transform: `translate(${100 + i * 200}px, ${100 + (i % 2) * 150}px)`,
                    animation: `geometric-pulse ${8 + i}s ease-in-out infinite ${i * 0.5}s`,
                  }}
                />
              ))}
              {/* Animated connecting lines */}
              {[...Array(4)].map((_, i) => (
                <line
                  key={`line-${i}`}
                  x1={50 + i * 300}
                  y1={200}
                  x2={250 + i * 300}
                  y2={400}
                  stroke="rgba(63, 186, 255, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="15 10"
                  style={{
                    animation: `geometric-pulse ${10 + i * 2}s ease-in-out infinite ${i * 0.7}s`,
                  }}
                />
              ))}
            </svg>
          </div>
        )}

        {/* Breathing Orbs - Desktop Only */}
        {screenSize === "desktop" && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ clipPath: "inset(0)" }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={`breath-orb-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${20 + ((i * 60) % 60)}%`, // Constrained from 15-85% to 20-80%
                  top: `${25 + ((i * 50) % 50)}%`, // Constrained positioning
                  width: `${20 + (i % 3) * 15}px`,
                  height: `${20 + (i % 3) * 15}px`,
                  background: `radial-gradient(circle, rgba(${73 + i * 10}, ${146 + i * 5}, 255, 0.3) 0%, transparent 70%)`,
                  animation: `breath ${6 + (i % 4)}s ease-in-out infinite ${i * 0.4}s`,
                  filter: `blur(${2 + (i % 3)}px)`,
                }}
              />
            ))}
          </div>
        )}

        {/* Dynamic Background Waves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                radial-gradient(circle at 20% 80%, rgba(73, 146, 255, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(63, 186, 255, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(57, 135, 227, 0.1) 0%, transparent 50%)
              `,
              animation: "subtle-glow 12s ease-in-out infinite alternate",
            }}
          />
        </div>

        {/* Aurora-like Moving Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden"></div>

        {/* Main Content Container */}
        <div className="relative w-full py-4 sm:py-6 lg:py-8 section-container">
          {/* Text Content */}
          <motion.div
            className={`relative z-10 px-4 sm:px-6 lg:px-8 text-center max-w-6xl mx-auto section-content min-h-[65vh] pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16 ${isVisible ? "filter-blur-in" : "filter-blur-out"}`}
            initial={{
              opacity: 0,
              y: 80,
            }}
            animate={
              isVisible
                ? {
                    opacity: 1,
                    y: 0,
                  }
                : {}
            }
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
          >
            {/* Services Title - matching home style */}
            <div className="text-center mb-2">
              <h1
                className={`font-poppins text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight relative mobile-lively-text ${
                  theme === "light" ? "text-gray-900" : "text-white"
                }`}
              >
                <span className="warm-glow-text animate-warm-glow-pulse">
                  Services
                </span>

                {/* Optimized sparkles for better performance */}
                {[
                  { x: 75, y: -35, size: 0.8, type: "star" },
                  { x: 55, y: -12, size: 0.6, type: "diamond" },
                  { x: 95, y: 40, size: 0.7, type: "plus" },
                  { x: 70, y: 70, size: 0.9, type: "star" },
                  { x: 15, y: 75, size: 0.5, type: "diamond" },
                  { x: -30, y: 50, size: 0.6, type: "plus" },
                ].map((sparkle, i) => (
                  <div
                    key={`services-sparkle-${i}`}
                    className="absolute pointer-events-none gpu-accelerated"
                    style={{
                      left: `calc(50% + ${sparkle.x}px)`,
                      top: `calc(50% + ${sparkle.y}px)`,
                      animation: `sparkle-enhanced ${6 + (i % 3)}s ease-in-out infinite ${i * 0.3}s`,
                      transform: `translateZ(0) scale(${sparkle.size})`,
                      opacity: 0.6,
                      zIndex: -1,
                      willChange: "transform, opacity",
                    }}
                  >
                    {sparkle.type === "star" && (
                      <div
                        className="w-5 h-5"
                        style={{
                          background: [
                            "radial-gradient(circle, rgba(100, 255, 150, 0.8) 0%, rgba(150, 200, 255, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(255, 100, 200, 0.8) 0%, rgba(100, 255, 180, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(200, 150, 255, 0.8) 0%, rgba(255, 100, 150, 0.5) 70%, transparent 90%)",
                          ][i % 3],
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                          animation: "spin-slow 14s linear infinite",
                          filter: "drop-shadow(0 0 7px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "diamond" && (
                      <div
                        className="w-4 h-4"
                        style={{
                          background: [
                            "linear-gradient(45deg, rgba(100, 255, 200, 0.7), rgba(255, 150, 100, 0.6))",
                            "linear-gradient(45deg, rgba(200, 100, 255, 0.7), rgba(100, 255, 150, 0.6))",
                            "linear-gradient(45deg, rgba(255, 200, 100, 0.7), rgba(100, 150, 255, 0.6))",
                          ][i % 3],
                          clipPath:
                            "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                          animation: "gentle-pulse 4s ease-in-out infinite",
                          filter: "drop-shadow(0 0 5px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "plus" && (
                      <div
                        className="w-4 h-4"
                        style={{
                          background: [
                            "conic-gradient(from 45deg, rgba(100, 255, 180, 0.7), rgba(255, 100, 150, 0.6), rgba(150, 200, 255, 0.7), rgba(255, 180, 100, 0.6))",
                            "conic-gradient(from 135deg, rgba(255, 150, 100, 0.7), rgba(100, 200, 255, 0.6), rgba(200, 100, 255, 0.7), rgba(100, 255, 150, 0.6))",
                            "conic-gradient(from 225deg, rgba(150, 255, 100, 0.7), rgba(255, 100, 200, 0.6), rgba(100, 150, 255, 0.7), rgba(255, 200, 100, 0.6))",
                          ][i % 3],
                          clipPath:
                            "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                          animation: "rotate-slow 11s linear infinite",
                          filter: "drop-shadow(0 0 9px currentColor)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </h1>
            </div>

            {/* Subtitle - matching development services style */}
            <div className="text-center mb-2">
              <div className="relative">
                {/* Background glow effect */}
                <div
                  className="absolute inset-0 blur-3xl opacity-30 animate-pulse-glow"
                  style={{
                    background:
                      theme === "light"
                        ? "radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.3) 50%, transparent 70%)"
                        : "radial-gradient(ellipse, rgba(73, 146, 255, 0.6) 0%, rgba(34, 211, 238, 0.4) 50%, transparent 70%)",
                    transform: "scale(1.5)",
                  }}
                />

                {/* Floating energy particles around text - Desktop Only */}
                {screenSize === "desktop" &&
                  [...Array(8)].map((_, i) => (
                    <div
                      key={`energy-${i}`}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        left: `${20 + ((i * 60) % 160)}%`,
                        top: `${30 + ((i * 40) % 60)}%`,
                        width: `${3 + (i % 2)}px`,
                        height: `${3 + (i % 2)}px`,
                        background:
                          theme === "light"
                            ? `rgba(${59 + ((i * 30) % 60)}, ${130 + ((i * 20) % 50)}, 246, ${0.6 + (i % 3) * 0.2})`
                            : `rgba(${73 + ((i * 20) % 50)}, ${146 + ((i * 10) % 30)}, 255, ${0.6 + (i % 3) * 0.2})`,
                        animation: `energy-float ${3 + (i % 3)}s ease-in-out infinite ${i * 0.3}s`,
                        filter: "blur(0.5px)",

                        animationTimingFunction: "ease-in-out",
                      }}
                    />
                  ))}

                <div className="font-poppins text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold relative z-10">
                  <span
                    className={`relative inline-block ${
                      theme === "light" ? "text-gray-900" : "text-white"
                    }`}
                    style={{}}
                  >
                    <span className="warm-glow-text animate-warm-glow-pulse text-smooth glow-120hz">
                      Services we provide
                    </span>

                    {/* Sparkles for subtitle */}
                    {[
                      { x: 130, y: -20, size: 0.6, type: "star" },
                      { x: 95, y: 30, size: 0.5, type: "diamond" },
                      { x: -45, y: 20, size: 0.4, type: "plus" },
                      { x: 150, y: 5, size: 0.7, type: "star" },
                    ].map((sparkle, i) => (
                      <div
                        key={`services-subtitle-sparkle-${i}`}
                        className="absolute pointer-events-none gpu-accelerated"
                        style={{
                          left: `calc(50% + ${sparkle.x}px)`,
                          top: `calc(50% + ${sparkle.y}px)`,
                          animation: `sparkle-enhanced ${5 + (i % 2)}s ease-in-out infinite ${i * 0.3}s`,
                          transform: `translateZ(0) scale(${sparkle.size})`,
                          opacity: 0.4,
                          zIndex: -1,
                          willChange: "transform, opacity",
                        }}
                      >
                        {sparkle.type === "star" && (
                          <div
                            className="w-4 h-4"
                            style={{
                              background:
                                "radial-gradient(circle, rgba(200, 120, 255, 0.8) 0%, rgba(120, 255, 180, 0.5) 70%, transparent 90%)",
                              clipPath:
                                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                              animation: "spin-slow 12s linear infinite",
                              filter: "drop-shadow(0 0 4px currentColor)",
                            }}
                          />
                        )}
                        {sparkle.type === "diamond" && (
                          <div
                            className="w-3 h-3"
                            style={{
                              background:
                                "linear-gradient(45deg, rgba(120, 255, 160, 0.7), rgba(255, 120, 200, 0.6))",
                              clipPath:
                                "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                              animation:
                                "gentle-pulse 3.5s ease-in-out infinite",
                              filter: "drop-shadow(0 0 3px currentColor)",
                            }}
                          />
                        )}
                        {sparkle.type === "plus" && (
                          <div
                            className="w-3 h-3"
                            style={{
                              background:
                                "conic-gradient(from 90deg, rgba(255, 160, 120, 0.7), rgba(120, 255, 160, 0.6), rgba(160, 120, 255, 0.7), rgba(255, 180, 160, 0.6))",
                              clipPath:
                                "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                              animation: "rotate-slow 9s linear infinite",
                              filter: "drop-shadow(0 0 5px currentColor)",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Services Container */}
            {screenSize === "desktop" ? (
              // Desktop: Slider with navigation
              <div className="relative mt-6 lg:mt-8 px-4">
                {/* Desktop Navigation */}
                <div className="flex justify-center items-center mb-6">
                  <div
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl backdrop-blur-lg border"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: "0 0 15px rgba(73, 146, 255, 0.1)",
                    }}
                  >
                    {/* Left Navigation */}
                    <motion.button
                      onClick={prevServicesPage}
                      disabled={currentServicesPage === 0}
                      className={`group relative p-1.5 rounded-lg transition-all duration-300 ${
                        currentServicesPage === 0
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:scale-110 cursor-pointer hover:bg-white/5"
                      }`}
                      whileHover={
                        currentServicesPage === 0 ? {} : { scale: 1.1 }
                      }
                      whileTap={currentServicesPage === 0 ? {} : { scale: 0.9 }}
                    >
                      <ChevronLeft
                        className={`w-4 h-4 transition-colors ${
                          currentServicesPage === 0
                            ? "text-gray-500"
                            : `${theme === "light" ? "text-gray-700" : "text-white/80"} group-hover:text-blue-400`
                        }`}
                      />
                    </motion.button>

                    {/* Page Indicators */}
                    <div className="flex items-center gap-2 px-2">
                      {[...Array(totalServicesPages)].map((_, i) => (
                        <motion.button
                          key={i}
                          onClick={() => setCurrentServicesPage(i)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            i === currentServicesPage
                              ? "bg-blue-400 scale-125"
                              : "bg-white/30 hover:bg-white/50"
                          }`}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        />
                      ))}
                    </div>

                    {/* Right Navigation */}
                    <motion.button
                      onClick={nextServicesPage}
                      disabled={currentServicesPage === totalServicesPages - 1}
                      className={`group relative p-1.5 rounded-lg transition-all duration-300 ${
                        currentServicesPage === totalServicesPages - 1
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:scale-110 cursor-pointer hover:bg-white/5"
                      }`}
                      whileHover={
                        currentServicesPage === totalServicesPages - 1
                          ? {}
                          : { scale: 1.1 }
                      }
                      whileTap={
                        currentServicesPage === totalServicesPages - 1
                          ? {}
                          : { scale: 0.9 }
                      }
                    >
                      <ChevronRight
                        className={`w-4 h-4 transition-colors ${
                          currentServicesPage === totalServicesPages - 1
                            ? "text-gray-500"
                            : `${theme === "light" ? "text-gray-700" : "text-white/80"} group-hover:text-blue-400`
                        }`}
                      />
                    </motion.button>
                  </div>
                </div>

                {/* Desktop Services Grid */}
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl xl:max-w-5xl">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentServicesPage}
                        className="grid grid-cols-3 grid-rows-2 gap-6"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                      >
                        {getCurrentPageServices().map((service, index) => (
                          <ServiceCard
                            key={`${currentServicesPage}-${index}`}
                            service={service}
                            index={index}
                            isVisible={isVisible}
                          />
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ) : (
              // Mobile/Tablet: Stacked layout
              <div className="flex justify-center mt-4 sm:mt-6 px-4">
                <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-xl sm:max-w-2xl overflow-hidden">
                  {getCurrentPageServices().map((service, index) => (
                    <ServiceCard
                      key={index}
                      service={service}
                      index={index}
                      isVisible={isVisible}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  },
);

// ========================================
// PRICING SECTION COMPONENT
// ========================================

const PricingSection = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ theme, isVisible }, ref) => {
    const [screenSize, setScreenSize] = useState<
      "mobile" | "tablet" | "desktop"
    >("desktop");
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
      const updateScreenSize = () => {
        const width = window.innerWidth;
        if (width <= 640) {
          setScreenSize("mobile");
        } else if (width <= 991) {
          setScreenSize("tablet");
        } else {
          setScreenSize("desktop");
        }
      };

      updateScreenSize();
      window.addEventListener("resize", updateScreenSize);
      return () => window.removeEventListener("resize", updateScreenSize);
    }, []);

    const pricingPlans = [
      {
        title: "Custom Software/Tools",
        price: "$100",
        maxPrice: "Unlimited",
        icon: Code,
        color: "from-blue-500 to-cyan-500",
        accentColor: "blue",
        perks: [
          "Tailored to your needs",
          "Full source code",
          "Documentation included",
          "Testing & debugging",
          "Performance optimized",
          "Support & maintenance",
        ],
        popular: false,
      },
      {
        title: "Websites",
        price: "$150",
        maxPrice: "Unlimited",
        icon: Globe,
        color: "from-purple-500 to-pink-500",
        accentColor: "purple",
        perks: [
          "Fully built & deployed",
          "Professional design",
          "Mobile responsive",
          "SEO optimized",
          "Fast loading times",
          "Contact forms",
        ],
        popular: true,
      },
      {
        title: "Discord Bots",
        price: "$50",
        maxPrice: "$500",
        icon: Zap,
        color: "from-emerald-500 to-teal-500",
        accentColor: "emerald",
        perks: [
          "Custom commands",
          "Database integration",
          "Moderation features",
          "Auto-responses",
          "Activity tracking",
          "24/7 hosting setup",
        ],
        popular: false,
      },
    ];

    return (
      <motion.div
        ref={ref}
        className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
          theme === "light"
            ? "bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900"
            : "bg-gradient-to-br from-gray-900 via-indigo-900 to-black"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {/* SPECTACULAR PRICING SECTION ENHANCEMENTS - CYBER GRID THEME */}

        {/* Animated Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Digital Grid Lines */}
          <div className="absolute inset-0">
            {/* Vertical Lines */}
            {[
              ...Array(
                screenSize === "mobile" ? 6 : screenSize === "tablet" ? 8 : 12,
              ),
            ].map((_, i) => (
              <motion.div
                key={`grid-v-${i}`}
                className="absolute w-px h-full opacity-20"
                style={{
                  left: `${(i + 1) * (100 / ((screenSize === "mobile" ? 6 : screenSize === "tablet" ? 8 : 12) + 1))}%`,
                  background:
                    "linear-gradient(180deg, transparent 0%, #3b82f6 20%, #3b82f6 80%, transparent 100%)",
                  filter: "blur(0.5px)",
                }}
                animate={
                  !prefersReducedMotion
                    ? {
                        opacity: [0.1, 0.3, 0.1],
                        scaleY: [1, 1.05, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}

            {/* Horizontal Lines */}
            {[
              ...Array(
                screenSize === "mobile" ? 4 : screenSize === "tablet" ? 6 : 8,
              ),
            ].map((_, i) => (
              <motion.div
                key={`grid-h-${i}`}
                className="absolute w-full h-px opacity-15"
                style={{
                  top: `${(i + 1) * (100 / ((screenSize === "mobile" ? 4 : screenSize === "tablet" ? 6 : 8) + 1))}%`,
                  background:
                    "linear-gradient(90deg, transparent 0%, #3b82f6 20%, #3b82f6 80%, transparent 100%)",
                  filter: "blur(0.5px)",
                }}
                animate={
                  !prefersReducedMotion
                    ? {
                        opacity: [0.1, 0.25, 0.1],
                        scaleX: [1, 1.02, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 4 + (i % 2),
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Floating Data Particles */}
          <div className="absolute inset-0">
            {[
              ...Array(
                screenSize === "mobile"
                  ? 15
                  : screenSize === "tablet"
                    ? 25
                    : 40,
              ),
            ].map((_, i) => {
              // Fixed positions for particles to prevent mouse movement effects
              const positions = [
                { x: 12, y: 15 },
                { x: 88, y: 22 },
                { x: 25, y: 78 },
                { x: 75, y: 85 },
                { x: 45, y: 12 },
                { x: 18, y: 65 },
                { x: 82, y: 35 },
                { x: 55, y: 90 },
                { x: 8, y: 45 },
                { x: 92, y: 55 },
                { x: 35, y: 25 },
                { x: 65, y: 75 },
                { x: 22, y: 42 },
                { x: 78, y: 18 },
                { x: 48, y: 68 },
                { x: 15, y: 82 },
                { x: 85, y: 28 },
                { x: 38, y: 58 },
                { x: 62, y: 38 },
                { x: 72, y: 72 },
                { x: 28, y: 88 },
                { x: 58, y: 8 },
                { x: 42, y: 52 },
                { x: 68, y: 32 },
                { x: 32, y: 62 },
                { x: 77, y: 47 },
                { x: 23, y: 73 },
                { x: 53, y: 23 },
                { x: 47, y: 77 },
                { x: 67, y: 13 },
                { x: 33, y: 83 },
                { x: 87, y: 43 },
                { x: 13, y: 67 },
                { x: 73, y: 37 },
                { x: 37, y: 53 },
                { x: 63, y: 63 },
                { x: 17, y: 17 },
                { x: 83, y: 87 },
                { x: 43, y: 27 },
                { x: 57, y: 57 },
              ];
              const pos = positions[i] || {
                x: (i * 7.5) % 100,
                y: (i * 13.7) % 100,
              };

              return (
                <motion.div
                  key={`data-particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${1 + (i % 3)}px`,
                    height: `${1 + (i % 3)}px`,
                    background: [
                      "rgba(59, 130, 246, 0.8)",
                      "rgba(147, 51, 234, 0.8)",
                      "rgba(16, 185, 129, 0.8)",
                      "rgba(245, 158, 11, 0.8)",
                    ][i % 4],
                    boxShadow: "0 0 10px currentColor",
                  }}
                  animate={
                    !prefersReducedMotion
                      ? {
                          y: [0, -100, 0],
                          opacity: [0, 1, 0],
                          scale: [0.8, 1.2, 0.8],
                        }
                      : {}
                  }
                  transition={{
                    duration: 8 + (i % 4),
                    repeat: Infinity,
                    delay: (i * 0.3) % 10,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </div>

          {/* Holographic Projection Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute w-96 h-96 rounded-full opacity-10"
              style={{
                left: "10%",
                top: "20%",
                background:
                  "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
                filter: "blur(60px)",
                animation: "pulse 8s ease-in-out infinite",
              }}
            />
            <div
              className="absolute w-80 h-80 rounded-full opacity-10"
              style={{
                right: "15%",
                bottom: "25%",
                background:
                  "radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)",
                filter: "blur(80px)",
                animation: "pulse 12s ease-in-out infinite 2s",
              }}
            />
          </div>
        </div>

        {/* Main Content Container */}
        <div className="relative min-h-screen py-4 sm:py-6 lg:py-8 section-container">
          <motion.div
            className="relative z-10 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto section-content pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-8 flex flex-col justify-center"
            initial={{ opacity: 0, y: 80 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Pricing Title */}
            <div className="text-center mb-4 sm:mb-6">
              <h1
                className={`font-poppins text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight relative mobile-lively-text ${
                  theme === "light" ? "text-gray-900" : "text-white"
                }`}
                style={{ transform: "translateY(-50px)" }}
              >
                <span className="warm-glow-text animate-warm-glow-pulse">
                  Pricing
                </span>

                {/* Optimized sparkles for better performance */}
                {[
                  { x: 70, y: -32, size: 0.7, type: "star" },
                  { x: 50, y: -10, size: 0.5, type: "diamond" },
                  { x: 90, y: 42, size: 0.6, type: "plus" },
                  { x: 65, y: 72, size: 0.8, type: "star" },
                  { x: 12, y: 77, size: 0.4, type: "diamond" },
                  { x: -25, y: 52, size: 0.5, type: "plus" },
                ].map((sparkle, i) => (
                  <div
                    key={`pricing-sparkle-${i}`}
                    className="absolute pointer-events-none gpu-accelerated"
                    style={{
                      left: `calc(50% + ${sparkle.x}px)`,
                      top: `calc(50% + ${sparkle.y}px)`,
                      animation: `sparkle-enhanced ${5.5 + (i % 3)}s ease-in-out infinite ${i * 0.35}s`,
                      transform: `translateZ(0) scale(${sparkle.size})`,
                      opacity: 0.55,
                      zIndex: -1,
                      willChange: "transform, opacity",
                    }}
                  >
                    {sparkle.type === "star" && (
                      <div
                        className="w-5 h-5"
                        style={{
                          background: [
                            "radial-gradient(circle, rgba(255, 200, 100, 0.8) 0%, rgba(100, 255, 150, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(150, 100, 255, 0.8) 0%, rgba(255, 150, 100, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(100, 200, 255, 0.8) 0%, rgba(255, 100, 200, 0.5) 70%, transparent 90%)",
                          ][i % 3],
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                          animation: "spin-slow 13s linear infinite",
                          filter: "drop-shadow(0 0 6px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "diamond" && (
                      <div
                        className="w-3 h-3"
                        style={{
                          background: [
                            "linear-gradient(45deg, rgba(255, 150, 200, 0.7), rgba(150, 255, 100, 0.6))",
                            "linear-gradient(45deg, rgba(100, 150, 255, 0.7), rgba(255, 200, 100, 0.6))",
                            "linear-gradient(45deg, rgba(200, 255, 100, 0.7), rgba(100, 200, 255, 0.6))",
                          ][i % 3],
                          clipPath:
                            "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                          animation: "gentle-pulse 3.5s ease-in-out infinite",
                          filter: "drop-shadow(0 0 4px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "plus" && (
                      <div
                        className="w-4 h-4"
                        style={{
                          background: [
                            "conic-gradient(from 30deg, rgba(255, 180, 100, 0.7), rgba(100, 255, 200, 0.6), rgba(200, 100, 255, 0.7), rgba(255, 150, 180, 0.6))",
                            "conic-gradient(from 120deg, rgba(100, 255, 180, 0.7), rgba(255, 100, 150, 0.6), rgba(180, 200, 255, 0.7), rgba(255, 200, 100, 0.6))",
                            "conic-gradient(from 210deg, rgba(200, 150, 255, 0.7), rgba(255, 180, 100, 0.6), rgba(100, 255, 180, 0.7), rgba(255, 150, 200, 0.6))",
                          ][i % 3],
                          clipPath:
                            "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                          animation: "rotate-slow 9s linear infinite",
                          filter: "drop-shadow(0 0 7px currentColor)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </h1>
            </div>

            {/* Subtitle */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative">
                <div
                  className="absolute inset-0 blur-3xl opacity-30 animate-pulse-glow"
                  style={{
                    background:
                      theme === "light"
                        ? "radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.3) 50%, transparent 70%)"
                        : "radial-gradient(ellipse, rgba(73, 146, 255, 0.6) 0%, rgba(147, 51, 234, 0.4) 50%, transparent 70%)",
                    transform: "scale(1.5)",
                  }}
                />
                <div
                  className="font-poppins text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold relative z-10"
                  style={{ transform: "translateY(-50px)" }}
                >
                  <span
                    className={`relative inline-block ${theme === "light" ? "text-gray-900" : "text-white"}`}
                    style={{}}
                  >
                    <span className="warm-glow-text animate-warm-glow-pulse text-smooth glow-120hz">
                      Choose Your Perfect Plan
                    </span>

                    {/* Sparkles for subtitle */}
                    {[
                      { x: 115, y: -22, size: 0.6, type: "star" },
                      { x: 85, y: 32, size: 0.5, type: "diamond" },
                      { x: -40, y: 22, size: 0.4, type: "plus" },
                      { x: 135, y: 8, size: 0.7, type: "star" },
                    ].map((sparkle, i) => (
                      <div
                        key={`pricing-subtitle-sparkle-${i}`}
                        className="absolute pointer-events-none gpu-accelerated"
                        style={{
                          left: `calc(50% + ${sparkle.x}px)`,
                          top: `calc(50% + ${sparkle.y}px)`,
                          animation: `sparkle-enhanced ${5 + (i % 2)}s ease-in-out infinite ${i * 0.35}s`,
                          transform: `translateZ(0) scale(${sparkle.size})`,
                          opacity: 0.4,
                          zIndex: -1,
                          willChange: "transform, opacity",
                        }}
                      >
                        {sparkle.type === "star" && (
                          <div
                            className="w-4 h-4"
                            style={{
                              background:
                                "radial-gradient(circle, rgba(255, 180, 120, 0.8) 0%, rgba(120, 200, 255, 0.5) 70%, transparent 90%)",
                              clipPath:
                                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                              animation: "spin-slow 11s linear infinite",
                              filter: "drop-shadow(0 0 4px currentColor)",
                            }}
                          />
                        )}
                        {sparkle.type === "diamond" && (
                          <div
                            className="w-3 h-3"
                            style={{
                              background:
                                "linear-gradient(45deg, rgba(255, 200, 120, 0.7), rgba(120, 180, 255, 0.6))",
                              clipPath:
                                "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                              animation:
                                "gentle-pulse 3.2s ease-in-out infinite",
                              filter: "drop-shadow(0 0 3px currentColor)",
                            }}
                          />
                        )}
                        {sparkle.type === "plus" && (
                          <div
                            className="w-3 h-3"
                            style={{
                              background:
                                "conic-gradient(from 135deg, rgba(120, 255, 200, 0.7), rgba(255, 120, 180, 0.6), rgba(200, 180, 255, 0.7), rgba(255, 200, 120, 0.6))",
                              clipPath:
                                "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                              animation: "rotate-slow 7s linear infinite",
                              filter: "drop-shadow(0 0 5px currentColor)",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing Cards Container */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-4 xl:gap-6 max-w-5xl mx-auto">
                {pricingPlans.map((plan, index) => (
                  <motion.div
                    key={plan.title}
                    className={`group relative ${plan.popular ? "lg:scale-105 lg:-mt-4" : ""}`}
                    initial={{ y: 60, opacity: 0, scale: 0.9 }}
                    animate={
                      isVisible
                        ? { y: 0, opacity: 1, scale: plan.popular ? 1.05 : 1 }
                        : { y: 60, opacity: 0, scale: 0.9 }
                    }
                    transition={{
                      duration: 0.8,
                      delay: 0.2 + index * 0.2,
                      type: "spring",
                      stiffness: 120,
                    }}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          Most Popular
                        </div>
                      </div>
                    )}

                    {/* Card Container */}
                    <div className="relative h-full min-h-[400px]">
                      {/* Outer Glow Effect */}
                      <div
                        className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl ${
                          plan.popular ? "opacity-50" : ""
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${plan.color.replace("from-", "").replace(" to-", ", ").replace("-500", "")})`,
                          transform: "scale(1.05)",
                        }}
                      />

                      {/* Card Body */}
                      <div
                        className={`relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl border ${
                          plan.popular
                            ? "border-purple-500/50"
                            : "border-white/10"
                        }`}
                        style={{
                          background: plan.popular
                            ? "linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.05))"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
                          boxShadow: plan.popular
                            ? `0 25px 50px -12px rgba(147, 51, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                            : `0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                        }}
                      >
                        {/* Animated Gradient Overlay */}
                        <div
                          className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-all duration-700 bg-gradient-to-br ${plan.color}`}
                        />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col p-6">
                          {/* Icon Section */}
                          <div className="flex justify-center mb-4">
                            <motion.div
                              className="relative"
                              whileHover={{
                                rotate: [0, -5, 5, 0],
                                scale: 1.1,
                              }}
                              transition={{ duration: 0.4 }}
                            >
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${plan.color} shadow-xl`}
                                style={{
                                  boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                                }}
                              >
                                <plan.icon className="w-6 h-6 text-white drop-shadow-lg" />
                              </div>
                              <div
                                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${plan.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300 blur-lg -z-10`}
                              />
                            </motion.div>
                          </div>

                          {/* Title */}
                          <div className="text-center mb-3">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                              {plan.title}
                            </h3>
                          </div>

                          {/* Price */}
                          <div className="text-center mb-5">
                            <div className="flex items-baseline justify-center">
                              <span
                                className={`text-3xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}
                              >
                                {plan.price}
                              </span>
                              <span className="text-gray-400 ml-2 text-sm">
                                - {plan.maxPrice}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              minimum pricing
                            </p>
                          </div>

                          {/* Perks */}
                          <div className="flex-1">
                            <ul className="space-y-2">
                              {plan.perks.map((perk, perkIndex) => (
                                <motion.li
                                  key={perk}
                                  className="flex items-center text-gray-300"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={
                                    isVisible ? { opacity: 1, x: 0 } : {}
                                  }
                                  transition={{
                                    delay: 0.4 + index * 0.2 + perkIndex * 0.1,
                                    duration: 0.5,
                                  }}
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${plan.color} mr-3 flex-shrink-0`}
                                  />
                                  <span className="text-sm">{perk}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          {/* CTA Button */}
                          <div className="mt-4">
                            <motion.button
                              onClick={() => {
                                // Use the global scroll event for consistency
                                const event = new CustomEvent(
                                  "scrollToSection",
                                  {
                                    detail: 6, // Contact section index
                                  },
                                );
                                window.dispatchEvent(event);
                              }}
                              className={`w-full py-3 px-4 rounded-lg font-bold text-white bg-gradient-to-r ${plan.color} shadow-lg transition-all duration-300 hover:shadow-xl`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Get Started
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Additional Services Card */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 40 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <div className="max-w-4xl mx-auto">
                  <div className="relative group">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

                    {/* Card */}
                    <div className="relative rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 p-6 sm:p-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10" />

                      <div className="relative z-10 text-center">
                        <div className="flex justify-center mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <Star className="w-6 h-6 text-white" />
                          </div>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                          Looking for Something Else?
                        </h3>

                        <p className="text-gray-300 text-sm sm:text-base mb-6 max-w-2xl mx-auto">
                          We offer many more services including API
                          integrations, database design, e-commerce solutions,
                          and custom enterprise applications.
                        </p>

                        <motion.button
                          onClick={() => {
                            const event = new CustomEvent("scrollToSection", {
                              detail: 6, // Contact section index
                            });
                            window.dispatchEvent(event);
                          }}
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Contact Us for More Info
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Pricing Note */}
              <motion.div
                className="text-center mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <p className="text-gray-400 text-sm max-w-3xl mx-auto">
                  <span className="text-yellow-400 font-semibold">*Note:</span>{" "}
                  Final pricing depends on the complexity, features, and
                  specific requirements of your project. Contact us for a
                  detailed quote tailored to your needs.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  },
);

// ========================================
// PORTFOLIO SECTION COMPONENT
// ========================================

const PortfolioSection = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ theme, isVisible }, ref) => {
    const [currentPage, setCurrentPage] = useState(0);
    const prefersReducedMotion = useReducedMotion();

    // ===== PORTFOLIO PROJECTS =====
    // Easy to add more projects - just add them to this array
    // Projects with images - Instagram card appears at the end
    const allProjects = [
      {
        title: "E-Commerce Website",
        description: "Full-featured e-commerce platform with modern design",
        tech: ["React", "Node.js", "Stripe"],
        image: "from-purple-500 to-pink-500",
        imageSrc: "/ecommerce website.png",
        isImage: true,
      },
      {
        title: "Dashboard Panel",
        description: "Comprehensive admin dashboard for data management",
        tech: ["React", "Analytics", "Real-time"],
        image: "from-blue-500 to-cyan-500",
        imageSrc: "/dashboard panel.png",
        isImage: true,
      },
      {
        title: "SaaS Website",
        description: "Professional SaaS landing page with conversion focus",
        tech: ["React", "Next.js", "TailwindCSS"],
        image: "from-green-500 to-emerald-500",
        imageSrc: "/SAAS website.png",
        isImage: true,
      },
    ];

    // Responsive projects per page: 2 on mobile/tablet, 3 on desktop
    const [screenSize, setScreenSize] = useState("desktop");

    useEffect(() => {
      const checkScreenSize = () => {
        if (window.innerWidth <= 640) {
          setScreenSize("mobile");
        } else if (window.innerWidth <= 991) {
          setScreenSize("tablet");
        } else {
          setScreenSize("desktop");
        }
      };
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    const projectsPerPage = screenSize === "desktop" ? 3 : 2;
    const totalPages = Math.ceil(allProjects.length / projectsPerPage);

    // Get current page projects
    const getCurrentPageProjects = () => {
      const startIndex = currentPage * projectsPerPage;
      return allProjects.slice(startIndex, startIndex + projectsPerPage);
    };

    // Navigation functions - only move if there's somewhere to go
    const nextPage = () => {
      if (currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
    };

    const prevPage = () => {
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    };

    return (
      <motion.div
        ref={ref}
        className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
          theme === "light"
            ? "bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800"
            : "bg-gradient-to-br from-gray-900 via-blue-900 to-black"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {/* SPECTACULAR PORTFOLIO SECTION ENHANCEMENTS - UNDERWATER/OCEAN THEME */}

        {/* Ocean Wave Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Flowing Water Layers (hidden on desktop to remove long moving ovals) */}
          {screenSize !== "desktop" && (
            <div className="absolute inset-0">
              {[
                ...Array(
                  screenSize === "mobile" ? 3 : screenSize === "tablet" ? 4 : 6,
                ),
              ].map((_, i) => (
                <motion.div
                  key={`wave-layer-${i}`}
                  className="absolute w-full"
                  style={{
                    height: `${40 + (i % 3) * (screenSize === "mobile" ? 20 : 40)}px`,
                    top: `${10 + i * 15}%`,
                    background: `linear-gradient(90deg,
                    transparent 0%,
                    rgba(59, 130, 246, ${0.3 + (i % 3) * 0.1}) 20%,
                    rgba(96, 165, 250, ${0.4 + (i % 3) * 0.1}) 50%,
                    rgba(6, 182, 212, ${0.3 + (i % 3) * 0.1}) 80%,
                    transparent 100%)`,
                    borderRadius: `${50 + (i % 3) * 20}% ${70 - (i % 2) * 10}% ${40 + (i % 3) * 15}% ${80 - (i % 3) * 10}% / ${60 + (i % 2) * 15}% ${30 - (i % 2) * 5}% ${50 + (i % 3) * 10}% ${70 - (i % 2) * 15}%`,
                    filter: `blur(${3 + (i % 2) * (screenSize === "mobile" ? 1 : 3)}px)`,
                  }}
                  animate={{
                    x: [-window.innerWidth * 0.2, window.innerWidth * 1.2],
                    scaleY: [1, 1.2, 1],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 15 + (i % 4) * 5,
                    repeat: Infinity,
                    delay: i * 2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Enhanced Blue Bubbles removed per request */}

          {/* Swimming Fish Varieties (disabled on desktop) */}
          {screenSize !== "desktop" && (
            <div className="absolute inset-0">
              {/* Clownfish */}
              {[
                ...Array(
                  screenSize === "mobile" ? 1 : screenSize === "tablet" ? 2 : 3,
                ),
              ].map((_, i) => (
                <motion.div
                  key={`clownfish-${i}`}
                  className="absolute ocean-element"
                  style={{
                    left: "-15%",
                    top: `${20 + i * (screenSize === "mobile" ? 20 : 15)}%`,
                  }}
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          x: [0, window.innerWidth * 1.15],
                          y: [
                            0,
                            Math.sin(i) * (screenSize === "mobile" ? 15 : 25),
                            0,
                          ],
                        }
                  }
                  transition={
                    prefersReducedMotion
                      ? {}
                      : {
                          duration: 15 + (i % 3) * 2,
                          repeat: Infinity,
                          delay: i * 3,
                          ease: "linear",
                        }
                  }
                >
                  <div
                    className="relative"
                    style={{
                      width: `${screenSize === "mobile" ? 25 : 35}px`,
                      height: `${screenSize === "mobile" ? 15 : 20}px`,
                    }}
                  >
                    {/* Clownfish Body - Orange with blue tint */}
                    <div
                      className="absolute"
                      style={{
                        left: "0%",
                        width: "75%",
                        height: "100%",
                        background:
                          "linear-gradient(90deg, rgba(255, 165, 0, 0.9) 0%, rgba(59, 130, 246, 0.7) 50%, rgba(255, 140, 0, 0.8) 100%)",
                        borderRadius: "40% 60% 60% 40%",
                        boxShadow: "0 0 6px rgba(59, 130, 246, 0.5)",
                      }}
                    />
                    {/* White Stripes */}
                    <div
                      className="absolute"
                      style={{
                        left: "15%",
                        top: "10%",
                        width: "15%",
                        height: "80%",
                        background: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "20%",
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        left: "40%",
                        top: "15%",
                        width: "12%",
                        height: "70%",
                        background: "rgba(255, 255, 255, 0.8)",
                        borderRadius: "20%",
                      }}
                    />
                    {/* Tail */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2"
                      style={{
                        right: "0px",
                        width: "0",
                        height: "0",
                        borderLeft: `${screenSize === "mobile" ? 10 : 14}px solid rgba(59, 130, 246, 0.8)`,
                        borderTop: `${screenSize === "mobile" ? 8 : 10}px solid transparent`,
                        borderBottom: `${screenSize === "mobile" ? 8 : 10}px solid transparent`,
                      }}
                    />
                    {/* Eye */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: "8%",
                        top: "25%",
                        width: `${screenSize === "mobile" ? 4 : 5}px`,
                        height: `${screenSize === "mobile" ? 4 : 5}px`,
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid rgba(0, 0, 0, 0.4)",
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: "9%",
                        top: "27%",
                        width: `${screenSize === "mobile" ? 2 : 3}px`,
                        height: `${screenSize === "mobile" ? 2 : 3}px`,
                        background: "rgba(0, 0, 0, 0.8)",
                      }}
                    />
                  </div>
                </motion.div>
              ))}

              {/* Blue Tang Fish */}
              {[
                ...Array(
                  screenSize === "mobile" ? 1 : screenSize === "tablet" ? 2 : 3,
                ),
              ].map((_, i) => (
                <motion.div
                  key={`tang-${i}`}
                  className="absolute"
                  style={{
                    left: "-12%",
                    top: `${35 + i * (screenSize === "mobile" ? 18 : 12)}%`,
                  }}
                  animate={{
                    x: [0, window.innerWidth * 1.12],
                    y: [
                      0,
                      -Math.sin(i + 1) * (screenSize === "mobile" ? 20 : 30),
                      0,
                    ],
                  }}
                  transition={{
                    duration: 18 + (i % 4) * 2,
                    repeat: Infinity,
                    delay: i * 4 + 1,
                    ease: "linear",
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      width: `${screenSize === "mobile" ? 22 : 32}px`,
                      height: `${screenSize === "mobile" ? 18 : 25}px`,
                    }}
                  >
                    {/* Tang Body */}
                    <div
                      className="absolute"
                      style={{
                        left: "0%",
                        width: "70%",
                        height: "100%",
                        background:
                          "linear-gradient(90deg, rgba(59, 130, 246, 0.95) 0%, rgba(30, 144, 255, 0.9) 50%, rgba(0, 100, 200, 0.85) 100%)",
                        borderRadius: "30% 50% 50% 30%",
                        boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)",
                      }}
                    />
                    {/* Dorsal Fin */}
                    <div
                      className="absolute"
                      style={{
                        left: "20%",
                        top: "-30%",
                        width: "40%",
                        height: "40%",
                        background:
                          "linear-gradient(45deg, rgba(59, 130, 246, 0.8) 0%, rgba(147, 197, 253, 0.6) 100%)",
                        borderRadius: "50% 50% 20% 20%",
                        transform: "skewX(15deg)",
                      }}
                    />
                    {/* Tail */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2"
                      style={{
                        right: "0px",
                        width: "0",
                        height: "0",
                        borderLeft: `${screenSize === "mobile" ? 12 : 16}px solid rgba(30, 144, 255, 0.8)`,
                        borderTop: `${screenSize === "mobile" ? 10 : 13}px solid transparent`,
                        borderBottom: `${screenSize === "mobile" ? 10 : 13}px solid transparent`,
                      }}
                    />
                    {/* Eye */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: "10%",
                        top: "30%",
                        width: `${screenSize === "mobile" ? 4 : 5}px`,
                        height: `${screenSize === "mobile" ? 4 : 5}px`,
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid rgba(0, 0, 0, 0.3)",
                      }}
                    />
                  </div>
                </motion.div>
              ))}

              {/* Angelfish */}
              {[
                ...Array(
                  screenSize === "mobile" ? 1 : screenSize === "tablet" ? 1 : 2,
                ),
              ].map((_, i) => (
                <motion.div
                  key={`angel-${i}`}
                  className="absolute"
                  style={{
                    left: "-10%",
                    top: `${50 + i * (screenSize === "mobile" ? 25 : 20)}%`,
                  }}
                  animate={{
                    x: [0, window.innerWidth * 1.1],
                    y: [
                      0,
                      Math.cos(i + 2) * (screenSize === "mobile" ? 25 : 35),
                      0,
                    ],
                  }}
                  transition={{
                    duration: 20 + (i % 3) * 3,
                    repeat: Infinity,
                    delay: i * 5 + 2,
                    ease: "linear",
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      width: `${screenSize === "mobile" ? 20 : 28}px`,
                      height: `${screenSize === "mobile" ? 25 : 35}px`,
                    }}
                  >
                    {/* Angelfish Body */}
                    <div
                      className="absolute"
                      style={{
                        left: "15%",
                        top: "25%",
                        width: "60%",
                        height: "50%",
                        background:
                          "linear-gradient(90deg, rgba(173, 216, 230, 0.9) 0%, rgba(59, 130, 246, 0.8) 50%, rgba(25, 118, 210, 0.7) 100%)",
                        borderRadius: "20% 40% 60% 40%",
                        boxShadow: "0 0 6px rgba(59, 130, 246, 0.5)",
                      }}
                    />
                    {/* Top Fin */}
                    <div
                      className="absolute"
                      style={{
                        left: "30%",
                        top: "0%",
                        width: "30%",
                        height: "30%",
                        background:
                          "linear-gradient(45deg, rgba(59, 130, 246, 0.7) 0%, rgba(147, 197, 253, 0.5) 100%)",
                        borderRadius: "0% 100% 0% 0%",
                        transform: "skewX(20deg)",
                      }}
                    />
                    {/* Bottom Fin */}
                    <div
                      className="absolute"
                      style={{
                        left: "30%",
                        bottom: "0%",
                        width: "30%",
                        height: "30%",
                        background:
                          "linear-gradient(-45deg, rgba(59, 130, 246, 0.7) 0%, rgba(147, 197, 253, 0.5) 100%)",
                        borderRadius: "0% 0% 100% 0%",
                        transform: "skewX(-20deg)",
                      }}
                    />
                    {/* Tail */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2"
                      style={{
                        right: "0px",
                        width: "0",
                        height: "0",
                        borderLeft: `${screenSize === "mobile" ? 8 : 11}px solid rgba(59, 130, 246, 0.7)`,
                        borderTop: `${screenSize === "mobile" ? 8 : 11}px solid transparent`,
                        borderBottom: `${screenSize === "mobile" ? 8 : 11}px solid transparent`,
                      }}
                    />
                    {/* Eye */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: "20%",
                        top: "35%",
                        width: `${screenSize === "mobile" ? 3 : 4}px`,
                        height: `${screenSize === "mobile" ? 3 : 4}px`,
                        background: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(0, 0, 0, 0.4)",
                      }}
                    />
                  </div>
                </motion.div>
              ))}

              {/* Small School Fish */}
              {[
                ...Array(
                  screenSize === "mobile"
                    ? 4
                    : screenSize === "tablet"
                      ? 6
                      : 10,
                ),
              ].map((_, i) => (
                <motion.div
                  key={`school-fish-${i}`}
                  className="absolute"
                  style={{
                    left: "-8%",
                    top: `${10 + i * 5}%`,
                  }}
                  animate={{
                    x: [0, window.innerWidth * 1.08],
                    y: [
                      0,
                      Math.sin(i * 0.5) * (screenSize === "mobile" ? 10 : 15),
                      0,
                    ],
                  }}
                  transition={{
                    duration: 10 + (i % 2),
                    repeat: Infinity,
                    delay: (i * 0.3) % 4,
                    ease: "linear",
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      width: `${screenSize === "mobile" ? 12 : 16}px`,
                      height: `${screenSize === "mobile" ? 8 : 10}px`,
                    }}
                  >
                    {/* Small Fish Body */}
                    <div
                      className="absolute"
                      style={{
                        left: "0%",
                        width: "75%",
                        height: "100%",
                        background: `linear-gradient(90deg,
                        rgba(${
                          [
                            "100, 149, 237", // Cornflower blue
                            "65, 105, 225", // Royal blue
                            "30, 144, 255", // Dodger blue
                            "0, 191, 255", // Deep sky blue
                          ][i % 4]
                        }, 0.8) 0%,
                        rgba(59, 130, 246, 0.6) 100%)`,
                        borderRadius: "30% 50% 50% 30%",
                        boxShadow: "0 0 4px rgba(59, 130, 246, 0.4)",
                      }}
                    />
                    {/* Small Tail */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2"
                      style={{
                        right: "0px",
                        width: "0",
                        height: "0",
                        borderLeft: `${screenSize === "mobile" ? 5 : 7}px solid rgba(59, 130, 246, 0.7)`,
                        borderTop: `${screenSize === "mobile" ? 4 : 5}px solid transparent`,
                        borderBottom: `${screenSize === "mobile" ? 4 : 5}px solid transparent`,
                      }}
                    />
                    {/* Small Eye */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: "12%",
                        top: "30%",
                        width: `${screenSize === "mobile" ? 2 : 3}px`,
                        height: `${screenSize === "mobile" ? 2 : 3}px`,
                        background: "rgba(255, 255, 255, 0.9)",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Swaying Seaweed */}
          <div className="absolute inset-0">
            {[
              ...Array(
                screenSize === "mobile" ? 2 : screenSize === "tablet" ? 3 : 5,
              ),
            ].map((_, i) => (
              <motion.div
                key={`seaweed-${i}`}
                className="absolute bottom-0"
                style={{
                  left: `${10 + i * (screenSize === "mobile" ? 25 : 12)}%`,
                  width: `${screenSize === "mobile" ? 6 : 10}px`,
                  height: `${screenSize === "mobile" ? 60 : 100}px`,
                }}
              >
                {/* Seaweed Stem */}
                <div
                  className="absolute bottom-0 w-full"
                  style={{
                    height: "100%",
                    background: `linear-gradient(180deg,
                      rgba(34, 197, 94, 0.7) 0%,
                      rgba(59, 130, 246, 0.8) 30%,
                      rgba(29, 78, 216, 0.9) 100%)`,
                    borderRadius: "50% 50% 20% 20%",
                    transformOrigin: "bottom center",
                  }}
                />
                {/* Seaweed Leaves */}
                {[...Array(screenSize === "mobile" ? 3 : 5)].map((_, j) => (
                  <div
                    key={`leaf-${j}`}
                    className="absolute"
                    style={{
                      left: j % 2 === 0 ? "-50%" : "50%",
                      bottom: `${20 + j * (screenSize === "mobile" ? 12 : 18)}%`,
                      width: `${screenSize === "mobile" ? 8 : 12}px`,
                      height: `${screenSize === "mobile" ? 6 : 10}px`,
                      background: `rgba(59, 130, 246, ${0.6 + j * 0.1})`,
                      borderRadius: "50% 50% 50% 50% / 80% 80% 20% 20%",
                      transformOrigin:
                        j % 2 === 0 ? "right center" : "left center",
                    }}
                  />
                ))}
              </motion.div>
            ))}

            {/* Seaweed Animation */}
            {[
              ...Array(
                screenSize === "mobile" ? 2 : screenSize === "tablet" ? 3 : 5,
              ),
            ].map((_, i) => (
              <motion.div
                key={`seaweed-motion-${i}`}
                className="absolute bottom-0"
                style={{
                  left: `${10 + i * (screenSize === "mobile" ? 25 : 12)}%`,
                  transformOrigin: "bottom center",
                }}
                animate={{
                  rotateZ: [-8, 8, -8],
                  scaleY: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              >
                {/* This will animate the seaweed */}
              </motion.div>
            ))}
          </div>

          {/* Floating Jellyfish (disabled on desktop) */}
          {screenSize !== "desktop" && (
            <div className="absolute inset-0">
              {[
                ...Array(
                  screenSize === "mobile" ? 4 : screenSize === "tablet" ? 6 : 8,
                ),
              ].map((_, i) => (
                <motion.div
                  key={`jellyfish-${i}`}
                  className="absolute"
                  style={{
                    left: `${5 + i * (screenSize === "mobile" ? 20 : 12)}%`,
                    top: `${20 + ((i * 18) % 60)}%`,
                  }}
                  animate={{
                    y: [-20, 20, -20],
                    x: [-10, 10, -10],
                    rotateZ: [-5, 5, -5],
                  }}
                  transition={{
                    duration: 8 + (i % 3),
                    repeat: Infinity,
                    delay: i * 1.5,
                    ease: "easeInOut",
                  }}
                >
                  {/* Jellyfish Bell */}
                  <div
                    className="relative"
                    style={{
                      width: `${20 + (i % 3) * (screenSize === "mobile" ? 8 : 15)}px`,
                      height: `${15 + (i % 3) * (screenSize === "mobile" ? 5 : 10)}px`,
                      background:
                        "radial-gradient(ellipse at center, rgba(34, 211, 238, 0.6) 0%, rgba(16, 185, 129, 0.4) 50%, rgba(6, 182, 212, 0.2) 80%, transparent)",
                      borderRadius: "50% 50% 20% 20%",
                      boxShadow:
                        screenSize === "desktop"
                          ? "0 0 20px rgba(34, 211, 238, 0.4)"
                          : "0 0 10px rgba(34, 211, 238, 0.3)",
                    }}
                  >
                    {/* Tentacles */}
                    {[...Array(screenSize === "mobile" ? 2 : 4)].map(
                      (_, tentacleIndex) => (
                        <motion.div
                          key={`tentacle-${tentacleIndex}`}
                          className="absolute"
                          style={{
                            left: `${20 + tentacleIndex * (screenSize === "mobile" ? 30 : 15)}%`,
                            top: "100%",
                            width: "2px",
                            height: `${10 + (tentacleIndex % 2) * (screenSize === "mobile" ? 5 : 10)}px`,
                            background:
                              "linear-gradient(180deg, rgba(34, 211, 238, 0.8) 0%, rgba(16, 185, 129, 0.4) 50%, transparent 100%)",
                            borderRadius: "0 0 50% 50%",
                          }}
                          animate={{
                            rotateZ: [-10, 10, -10],
                            scaleY: [1, 1.3, 1],
                          }}
                          transition={{
                            duration: 2 + (tentacleIndex % 2),
                            repeat: Infinity,
                            delay: tentacleIndex * 0.2,
                          }}
                        />
                      ),
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Coral Reef Structures */}
          <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 overflow-hidden">
            {[...Array(screenSize === "mobile" ? 5 : 10)].map((_, i) => (
              <motion.div
                key={`coral-${i}`}
                className="absolute bottom-0"
                style={{
                  left: `${i * (screenSize === "mobile" ? 20 : 10)}%`,
                  width: `${15 + (i % 3) * (screenSize === "mobile" ? 8 : 15)}px`,
                  height: `${25 + (i % 4) * (screenSize === "mobile" ? 15 : 30)}px`,
                  background: `linear-gradient(180deg,
                    rgba(16, 185, 129, 0.8) 0%,
                    rgba(34, 211, 238, 0.6) 30%,
                    rgba(6, 182, 212, 0.4) 60%,
                    rgba(20, 184, 166, 0.2) 100%)`,
                  borderRadius: "50% 50% 0 0",
                  filter: "blur(1px)",
                  opacity: 0.6,
                }}
                animate={{
                  scaleY: [1, 1.1, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 4 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>

          {/* Animated Noise Texture - Desktop Only */}
          {screenSize === "desktop" && (
            <div
              className="absolute inset-0 opacity-10 animate-noise"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")`,
              }}
            />
          )}
        </div>

        {/* Desktop Project Screenshots Floating Effect */}
        {screenSize === "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              {
                x: 10,
                y: 20,
                rotation: -15,
                color: "from-purple-500 to-pink-500",
              },
              {
                x: 85,
                y: 25,
                rotation: 12,
                color: "from-blue-500 to-cyan-500",
              },
              {
                x: 15,
                y: 70,
                rotation: -8,
                color: "from-green-500 to-emerald-500",
              },
              {
                x: 80,
                y: 75,
                rotation: 18,
                color: "from-orange-500 to-red-500",
              },
            ].map((project, i) => (
              <motion.div
                key={`floating-project-${i}`}
                className="absolute"
                style={{
                  left: `${project.x}%`,
                  top: `${project.y}%`,
                  transform: `rotate(${project.rotation}deg)`,
                  opacity: 0.4,
                }}
                animate={{
                  y: [-10, 10, -10],
                  rotateZ: [
                    project.rotation - 5,
                    project.rotation + 5,
                    project.rotation - 5,
                  ],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  duration: 4 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              >
                <div
                  className={`w-20 h-16 rounded-lg bg-gradient-to-br ${project.color} backdrop-blur-sm border border-white/30`}
                  style={{
                    boxShadow: "0 0 25px rgba(73, 146, 255, 0.3)",
                  }}
                >
                  {/* Simulated browser interface */}
                  <div className="p-1">
                    <div className="flex space-x-1 mb-1">
                      <div className="w-1 h-1 bg-red-400 rounded-full" />
                      <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                      <div className="w-1 h-1 bg-green-400 rounded-full" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="h-0.5 bg-white/40 rounded w-3/4" />
                      <div className="h-0.5 bg-white/30 rounded w-1/2" />
                      <div className="h-0.5 bg-white/20 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Colorful Floating Orbs for Mobile/Tablet (replacing browser boxes) */}
        {screenSize !== "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(screenSize === "tablet" ? 8 : 6)].map((_, i) => (
              <div
                key={`portfolio-orb-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${5 + ((i * 80) % 90)}%`,
                  top: `${10 + ((i * 60) % 80)}%`,
                  width: `${screenSize === "tablet" ? 10 + (i % 4) * 2 : 8 + (i % 3)}px`,
                  height: `${screenSize === "tablet" ? 10 + (i % 4) * 2 : 8 + (i % 3)}px`,
                  background: [
                    "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(34, 197, 94, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(147, 51, 234, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(236, 72, 153, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(6, 182, 212, 0.8) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 80%)",
                    "radial-gradient(circle, rgba(245, 158, 11, 0.8) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%)",
                  ][i % 6],
                  animation: `gentleFloat ${5 + (i % 4)}s ease-in-out infinite ${i * 0.7}s`,
                  filter: `blur(${1.5 + (i % 2) * 0.5}px)`,
                  boxShadow: `0 0 ${10 + (i % 3) * 5}px currentColor`,
                }}
              />
            ))}
          </div>
        )}

        {/* Code Repository Visualization */}
        <div className="absolute top-10 right-4 sm:right-6 lg:right-10 hidden sm:block pointer-events-none">
          <motion.div
            className="relative"
            animate={{
              rotateY: [0, -10, 0, 10, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
            }}
          >
            <div
              className="w-48 h-36 rounded-xl backdrop-blur-lg border opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30, 30, 50, 0.8), rgba(10, 10, 30, 0.8))",
                border: "2px solid rgba(73, 146, 255, 0.3)",
                boxShadow: "0 0 40px rgba(73, 146, 255, 0.3)",
              }}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-cyan-400 font-mono">
                    REPOSITORY
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <div
                      className="w-1.5 h-1.5 bg-yellow-400 rounded-full"
                      style={{
                        animation:
                          "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 0.5s infinite",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { lang: "JavaScript", percent: 45, color: "bg-yellow-400" },
                    { lang: "TypeScript", percent: 30, color: "bg-blue-400" },
                    { lang: "CSS", percent: 25, color: "bg-green-400" },
                  ].map((lang, langIndex) => (
                    <div
                      key={lang.lang}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-white/70">{lang.lang}</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${lang.color} rounded-full`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: lang.percent / 100 }}
                            style={{ transformOrigin: "left" }}
                            transition={{ duration: 2, delay: langIndex * 0.3 }}
                          />
                        </div>
                        <span className="text-white/50">{lang.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-xs text-white/50 flex justify-between">
                    <span>Commits: 342</span>
                    <span>Stars: 89</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Achievement Badges - Desktop Only */}
        {screenSize === "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              {
                icon: "🏆",
                label: "Award",
                x: 8,
                y: 15,
                color: "from-yellow-500 to-orange-500",
              },
              {
                icon: "⭐",
                label: "Featured",
                x: 88,
                y: 18,
                color: "from-blue-500 to-purple-500",
              },
              {
                icon: "🚀",
                label: "Launch",
                x: 12,
                y: 85,
                color: "from-green-500 to-blue-500",
              },
              {
                icon: "💎",
                label: "Premium",
                x: 85,
                y: 82,
                color: "from-purple-500 to-pink-500",
              },
            ].map((badge, i) => (
              <motion.div
                key={`achievement-${i}`}
                className="absolute"
                style={{
                  left: `${badge.x}%`,
                  top: `${badge.y}%`,
                }}
                animate={{
                  y: [-8, 8, -8],
                  rotateZ: [-5, 5, -5],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  duration: 3 + (i % 2),
                  repeat: Infinity,
                  delay: i * 0.7,
                }}
              >
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${badge.color} opacity-50 backdrop-blur-sm border border-white/30 flex items-center justify-center`}
                  style={{
                    boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
                  }}
                >
                  <span className="text-lg">{badge.icon}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Interactive Network Connections - Desktop Only */}
        {screenSize === "desktop" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg className="absolute w-full h-full opacity-20">
              {/* Dynamic connecting lines between floating elements */}
              {[...Array(6)].map((_, i) => {
                const startX = 20 + ((i * 120) % 80);
                const startY = 30 + ((i * 80) % 60);
                const endX = 40 + (((i + 1) * 130) % 80);
                const endY = 50 + (((i + 1) * 90) % 60);

                return (
                  <motion.line
                    key={`connection-${i}`}
                    x1={`${startX}%`}
                    y1={`${startY}%`}
                    x2={`${endX}%`}
                    y2={`${endY}%`}
                    stroke="rgba(73, 146, 255, 0.4)"
                    strokeWidth="1"
                    strokeDasharray="5 5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* Enhanced Floating Ambient Particles with Color Shifting - Reduced for Mobile/Tablet */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            ...Array(
              screenSize === "desktop" ? 12 : screenSize === "tablet" ? 4 : 2,
            ),
          ].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full opacity-60"
              style={{
                left: `${5 + ((i * 60) % 95)}%`,
                top: `${10 + ((i * 35) % 85)}%`,
                width: `${1 + (i % 4)}px`,
                height: `${1 + (i % 4)}px`,
                background: `rgba(${73 + ((i * 20) % 50)}, ${146 + ((i * 10) % 30)}, 255, ${0.2 + (i % 4) * 0.15})`,
                animation: `gentleFloat ${3 + (i % 4)}s ease-in-out infinite ${i * 0.3}s, color-shift ${12 + (i % 5)}s ease-in-out infinite ${i * 0.2}s`,
                filter: "blur(0.3px)",
                transform: `scale(${0.5 + (i % 3) * 0.3})`,
              }}
            />
          ))}
        </div>

        {/* Animated Geometric Patterns */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <svg className="absolute w-full h-full" viewBox="0 0 1200 800">
            {/* Animated hexagon grid */}
            {[...Array(4)].map((_, i) => (
              <polygon
                key={`hex-${i}`}
                points="100,20 140,40 140,80 100,100 60,80 60,40"
                fill="none"
                stroke="rgba(73, 146, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="10 5"
                style={{
                  transform: `translate(${100 + i * 200}px, ${100 + (i % 2) * 150}px)`,
                  animation: `geometric-pulse ${8 + i}s ease-in-out infinite ${i * 0.5}s`,
                }}
              />
            ))}
            {/* Animated connecting lines */}
            {[...Array(4)].map((_, i) => (
              <line
                key={`line-${i}`}
                x1={50 + i * 300}
                y1={200}
                x2={250 + i * 300}
                y2={400}
                stroke="rgba(63, 186, 255, 0.2)"
                strokeWidth="1"
                strokeDasharray="15 10"
                style={{
                  animation: `geometric-pulse ${10 + i * 2}s ease-in-out infinite ${i * 0.7}s`,
                }}
              />
            ))}
          </svg>
        </div>

        {/* Breathing Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={`breath-orb-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${15 + ((i * 80) % 70)}%`,
                top: `${20 + ((i * 60) % 60)}%`,
                width: `${20 + (i % 3) * 15}px`,
                height: `${20 + (i % 3) * 15}px`,
                background: `radial-gradient(circle, rgba(${73 + i * 10}, ${146 + i * 5}, 255, 0.3) 0%, transparent 70%)`,
                animation: `breath ${6 + (i % 4)}s ease-in-out infinite ${i * 0.4}s`,
                filter: `blur(${2 + (i % 3)}px)`,
              }}
            />
          ))}
        </div>

        {/* Dynamic Background Waves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                radial-gradient(circle at 20% 80%, rgba(73, 146, 255, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(63, 186, 255, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(57, 135, 227, 0.1) 0%, transparent 50%)
              `,
              animation: "subtle-glow 12s ease-in-out infinite alternate",
            }}
          />
        </div>

        {/* Aurora-like Moving Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden"></div>

        {/* Main Content Container */}
        <div className="relative min-h-screen py-4 sm:py-6 lg:py-8 section-container">
          <motion.div
            className="relative z-10 px-3 sm:px-6 lg:px-8 text-center max-w-6xl mx-auto section-content min-h-[65vh] pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 flex flex-col justify-center"
            initial={{ opacity: 0, y: 80 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Portfolio Title */}
            <div className="text-center mb-4 sm:mb-8">
              <h1
                className={`font-poppins text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight relative mobile-lively-text ${theme === "light" ? "text-gray-900" : "text-white"}`}
              >
                <span className="warm-glow-text animate-warm-glow-pulse">
                  Portfolio
                </span>

                {/* Optimized sparkles for better performance */}
                {[
                  { x: 90, y: -35, size: 0.8, type: "star" },
                  { x: 70, y: -12, size: 0.6, type: "diamond" },
                  { x: 110, y: 45, size: 0.7, type: "plus" },
                  { x: 85, y: 75, size: 0.9, type: "star" },
                  { x: 25, y: 80, size: 0.5, type: "diamond" },
                  { x: -40, y: 55, size: 0.6, type: "plus" },
                  { x: 125, y: 18, size: 0.7, type: "star" },
                  { x: -15, y: -18, size: 0.4, type: "diamond" },
                ].map((sparkle, i) => (
                  <div
                    key={`portfolio-sparkle-${i}`}
                    className="absolute pointer-events-none gpu-accelerated"
                    style={{
                      left: `calc(50% + ${sparkle.x}px)`,
                      top: `calc(50% + ${sparkle.y}px)`,
                      animation: `sparkle-enhanced ${6 + (i % 3)}s ease-in-out infinite ${i * 0.25}s`,
                      transform: `translateZ(0) scale(${sparkle.size})`,
                      opacity: 0.6,
                      zIndex: -1,
                      willChange: "transform, opacity",
                    }}
                  >
                    {sparkle.type === "star" && (
                      <div
                        className="w-6 h-6"
                        style={{
                          background: [
                            "radial-gradient(circle, rgba(200, 100, 255, 0.8) 0%, rgba(100, 255, 180, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(100, 180, 255, 0.8) 0%, rgba(255, 120, 200, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(255, 160, 100, 0.8) 0%, rgba(120, 255, 160, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(160, 255, 120, 0.8) 0%, rgba(255, 100, 160, 0.5) 70%, transparent 90%)",
                          ][i % 4],
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                          animation: "spin-slow 15s linear infinite",
                          filter: "drop-shadow(0 0 8px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "diamond" && (
                      <div
                        className="w-4 h-4"
                        style={{
                          background: [
                            "linear-gradient(45deg, rgba(200, 120, 255, 0.7), rgba(120, 255, 140, 0.6))",
                            "linear-gradient(45deg, rgba(120, 200, 255, 0.7), rgba(255, 140, 120, 0.6))",
                            "linear-gradient(45deg, rgba(255, 180, 120, 0.7), rgba(120, 140, 255, 0.6))",
                            "linear-gradient(45deg, rgba(140, 255, 120, 0.7), rgba(255, 120, 180, 0.6))",
                          ][i % 4],
                          clipPath:
                            "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                          animation: "gentle-pulse 4s ease-in-out infinite",
                          filter: "drop-shadow(0 0 6px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "plus" && (
                      <div
                        className="w-5 h-5"
                        style={{
                          background: [
                            "conic-gradient(from 60deg, rgba(200, 140, 255, 0.7), rgba(140, 255, 180, 0.6), rgba(255, 180, 140, 0.7), rgba(180, 140, 255, 0.6))",
                            "conic-gradient(from 150deg, rgba(140, 255, 160, 0.7), rgba(255, 140, 180, 0.6), rgba(160, 180, 255, 0.7), rgba(255, 180, 140, 0.6))",
                            "conic-gradient(from 240deg, rgba(255, 180, 160, 0.7), rgba(160, 255, 180, 0.6), rgba(180, 140, 255, 0.7), rgba(255, 160, 180, 0.6))",
                            "conic-gradient(from 330deg, rgba(180, 255, 140, 0.7), rgba(255, 160, 200, 0.6), rgba(140, 180, 255, 0.7), rgba(255, 200, 160, 0.6))",
                          ][i % 4],
                          clipPath:
                            "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                          animation: "rotate-slow 12s linear infinite",
                          filter: "drop-shadow(0 0 10px currentColor)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </h1>
            </div>

            {/* Subtitle */}
            <div className="text-center mb-10 sm:mb-16">
              <div className="relative">
                <div
                  className="absolute inset-0 blur-3xl opacity-30 animate-pulse-glow"
                  style={{
                    background:
                      theme === "light"
                        ? "radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.3) 50%, transparent 70%)"
                        : "radial-gradient(ellipse, rgba(73, 146, 255, 0.6) 0%, rgba(34, 211, 238, 0.4) 50%, transparent 70%)",
                    transform: "scale(1.5)",
                  }}
                />
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`energy-${i}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: `${20 + ((i * 60) % 160)}%`,
                      top: `${30 + ((i * 40) % 60)}%`,
                      width: `${3 + (i % 2)}px`,
                      height: `${3 + (i % 2)}px`,
                      background:
                        theme === "light"
                          ? `rgba(${59 + ((i * 30) % 60)}, ${130 + ((i * 20) % 50)}, 246, ${0.6 + (i % 3) * 0.2})`
                          : `rgba(${73 + ((i * 20) % 50)}, ${146 + ((i * 10) % 30)}, 255, ${0.6 + (i % 3) * 0.2})`,
                      animation: `energy-float ${3 + (i % 3)}s ease-in-out infinite ${i * 0.3}s`,
                      filter: "blur(0.5px)",
                    }}
                  />
                ))}
                <div className="font-poppins text-lg sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-bold relative z-10">
                  <span
                    className={`relative inline-block ${theme === "light" ? "text-gray-900" : "text-white"}`}
                    style={{}}
                  >
                    <span className="warm-glow-text animate-warm-glow-pulse text-smooth glow-120hz">
                      Our Featured Work
                    </span>

                    {/* Sparkles for subtitle */}
                    {[
                      { x: 105, y: -24, size: 0.6, type: "star" },
                      { x: 80, y: 28, size: 0.5, type: "diamond" },
                      { x: -35, y: 18, size: 0.4, type: "plus" },
                      { x: 125, y: 12, size: 0.7, type: "star" },
                    ].map((sparkle, i) => (
                      <div
                        key={`portfolio-subtitle-sparkle-${i}`}
                        className="absolute pointer-events-none gpu-accelerated"
                        style={{
                          left: `calc(50% + ${sparkle.x}px)`,
                          top: `calc(50% + ${sparkle.y}px)`,
                          animation: `sparkle-enhanced ${5 + (i % 2)}s ease-in-out infinite ${i * 0.25}s`,
                          transform: `translateZ(0) scale(${sparkle.size})`,
                          opacity: 0.4,
                          zIndex: -1,
                          willChange: "transform, opacity",
                        }}
                      >
                        {sparkle.type === "star" && (
                          <div
                            className="w-4 h-4"
                            style={{
                              background:
                                "radial-gradient(circle, rgba(160, 120, 255, 0.8) 0%, rgba(255, 160, 120, 0.5) 70%, transparent 90%)",
                              clipPath:
                                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                              animation: "spin-slow 13s linear infinite",
                              filter: "drop-shadow(0 0 4px currentColor)",
                            }}
                          />
                        )}
                        {sparkle.type === "diamond" && (
                          <div
                            className="w-3 h-3"
                            style={{
                              background:
                                "linear-gradient(45deg, rgba(160, 255, 120, 0.7), rgba(255, 120, 160, 0.6))",
                              clipPath:
                                "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                              animation:
                                "gentle-pulse 3.8s ease-in-out infinite",
                              filter: "drop-shadow(0 0 3px currentColor)",
                            }}
                          />
                        )}
                        {sparkle.type === "plus" && (
                          <div
                            className="w-3 h-3"
                            style={{
                              background:
                                "conic-gradient(from 180deg, rgba(255, 120, 160, 0.7), rgba(160, 255, 120, 0.6), rgba(120, 160, 255, 0.7), rgba(255, 160, 180, 0.6))",
                              clipPath:
                                "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                              animation: "rotate-slow 10s linear infinite",
                              filter: "drop-shadow(0 0 5px currentColor)",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Portfolio Projects Container */}
            <div className="relative mt-10 sm:mt-16 px-3 sm:px-4">
              {/* Simple Page Display */}
              <div className="relative">
                <motion.div
                  key={currentPage}
                  className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {getCurrentPageProjects().map((project, index) => (
                    <motion.div
                      key={`page-${currentPage}-${index}`}
                      className="group relative w-full"
                      initial={{ scale: 0.8, opacity: 0, y: 50 }}
                      animate={
                        isVisible
                          ? { scale: 1, opacity: 1, y: 0 }
                          : { scale: 0.8, opacity: 0, y: 50 }
                      }
                      transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -3 }}
                    >
                      <div
                        className="relative p-2 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl backdrop-blur-lg overflow-hidden transition-all duration-500 h-full mobile-lively-card"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "2px solid rgba(255, 255, 255, 0.1)",
                          boxShadow: "0 0 30px rgba(73, 146, 255, 0.15)",
                        }}
                      >
                        {/* Scanning line effect */}
                        <div className="absolute inset-0 overflow-hidden rounded-2xl">
                          <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </div>

                        {/* Project Visual - Inspired by the provided image */}
                        <div
                          className="w-full h-48 sm:h-56 rounded-xl mb-4 relative overflow-hidden"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(10, 10, 30, 0.9) 100%)",
                            boxShadow: "0 0 15px rgba(73, 146, 255, 0.25)",
                          }}
                        >
                          {project.isImage ? (
                            // Real image display
                            <>
                              <img
                                src={project.imageSrc}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </>
                          ) : (
                            // Gradient fallback
                            <>
                              {/* Dark mesh background similar to provided image */}
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
                                  backgroundSize: "20px 20px",
                                }}
                              />

                              {/* Gradient overlay */}
                              <div
                                className={`absolute inset-0 bg-gradient-to-br ${project.image} opacity-60`}
                              />
                            </>
                          )}

                          {/* Scanning effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: -400 }}
                            animate={isVisible ? { x: 400 } : { x: -400 }}
                            transition={{
                              duration: 1.5,
                              delay: 0.8 + index * 0.2,
                            }}
                          />

                          {/* Content overlay similar to the provided image style */}
                          <div className="absolute inset-0 flex flex-col justify-between p-3">
                            {/* Top indicator */}
                            <div className="flex justify-between items-start">
                              <div
                                className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
                                style={{
                                  boxShadow: "0 0 8px rgba(73, 146, 255, 0.8)",
                                }}
                              />
                              <div className="text-xs text-white/60 font-mono">
                                {String(
                                  currentPage * projectsPerPage + index + 1,
                                ).padStart(2, "0")}
                              </div>
                            </div>

                            {/* Bottom status bar */}
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                                  style={{ transformOrigin: "left" }}
                                  initial={{ scaleX: 0 }}
                                  animate={
                                    isVisible ? { scaleX: 0.75 } : { scaleX: 0 }
                                  }
                                  transition={{
                                    duration: 2,
                                    delay: 1 + index * 0.3,
                                  }}
                                />
                              </div>
                              <div className="text-xs text-white/60 font-mono">
                                LIVE
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Project Info - Compact */}
                        <h3
                          className={`text-base sm:text-lg font-bold mb-2 warm-glow-text ${theme === "light" ? "text-gray-900" : "text-white"} line-clamp-2`}
                          style={{
                            textShadow: "0 0 8px rgba(73, 146, 255, 0.6)",
                          }}
                        >
                          {project.title}
                        </h3>
                        <p
                          className={`text-xs sm:text-sm mb-3 ${theme === "light" ? "text-gray-600" : "text-gray-300"} line-clamp-2`}
                          style={{
                            textShadow:
                              theme === "dark"
                                ? "0 0 5px rgba(255, 255, 255, 0.1)"
                                : "none",
                          }}
                        >
                          {project.description}
                        </p>

                        {/* Tech Stack - Compact */}
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {project.tech.slice(0, 3).map((tech, techIndex) => (
                            <motion.span
                              key={techIndex}
                              className="px-2 py-1 rounded-full text-xs font-medium backdrop-blur-lg border"
                              style={{
                                background: "rgba(73, 146, 255, 0.1)",
                                border: "1px solid rgba(73, 146, 255, 0.3)",
                                color:
                                  theme === "light" ? "#1f2937" : "#e5e7eb",
                                boxShadow: "0 0 6px rgba(73, 146, 255, 0.2)",
                              }}
                              initial={{ scale: 0 }}
                              animate={isVisible ? { scale: 1 } : { scale: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: 1 + techIndex * 0.1,
                              }}
                            >
                              {tech}
                            </motion.span>
                          ))}
                          {project.tech.length > 3 && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium backdrop-blur-lg border"
                              style={{
                                background: "rgba(73, 146, 255, 0.1)",
                                border: "1px solid rgba(73, 146, 255, 0.3)",
                                color:
                                  theme === "light" ? "#1f2937" : "#e5e7eb",
                              }}
                            >
                              +{project.tech.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Circuit decorations */}
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-all duration-500">
                          <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                          <div
                            className="absolute bottom-2 right-2 w-1 h-1 bg-cyan-400 rounded-full"
                            style={{
                              animation:
                                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 0.5s infinite",
                            }}
                          />
                          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Instagram Showcase Card */}
              <motion.div
                className="mt-12 sm:mt-16"
                initial={{ opacity: 0, y: 50 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <motion.button
                  onClick={() => {
                    window.open(
                      "https://instagram.com/kor_services",
                      "_blank",
                    );
                  }}
                  className="group relative w-full max-w-md mx-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="p-6 sm:p-8 rounded-xl sm:rounded-2xl backdrop-blur-lg border transition-all duration-500 cursor-pointer"
                    style={{
                      background: "rgba(255, 105, 180, 0.08)",
                      border: "2px solid rgba(255, 105, 180, 0.2)",
                      boxShadow: "0 0 30px rgba(255, 105, 180, 0.25)",
                    }}
                  >
                    {/* Scanning line effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center">
                      <div className="text-4xl mb-4">📱</div>
                      <h3
                        className={`text-lg sm:text-2xl font-bold mb-3 ${theme === "light" ? "text-gray-900" : "text-white"}`}
                      >
                        Check our Instagram
                      </h3>
                      <p
                        className={`text-sm sm:text-base mb-4 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}
                      >
                        For new showcases, updates, and behind-the-scenes content
                      </p>
                      <div className="flex items-center justify-center gap-2 text-pink-400 font-semibold">
                        <span>Follow us</span>
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                          }}
                        >
                          →
                        </motion.span>
                      </div>
                    </div>

                    {/* Glow effect on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                      style={{
                        background:
                          "radial-gradient(circle at center, rgba(255, 105, 180, 0.5), transparent 70%)",
                      }}
                    />

                    {/* Circuit decorations */}
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-all duration-500">
                      <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
                      <div
                        className="absolute bottom-3 right-3 w-1 h-1 bg-pink-300 rounded-full"
                        style={{
                          animation:
                            "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 0.5s infinite",
                        }}
                      />
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  },
);

// ========================================
// CONTACT US SECTION COMPONENT
// ========================================

const ContactUsSection = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ theme, isVisible, setShowResultModal }, ref) => {
    // Performance hook for conditional decorative rendering
    const { shouldRenderParticles, performanceSettings } =
      usePerformanceOptimization();

    // Assign ID after component mounts
    useEffect(() => {
      if (ref && "current" in ref && ref.current) {
        ref.current.id = "contact-section";
      }
    }, [ref]);
    const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      interest: "",
      budget: "",
      description: "",
    });

    const [selectedInterest, setSelectedInterest] = useState("");
    const [selectedBudget, setSelectedBudget] = useState("");

    const interests = [
      "Web Design",
      "Web Development",
      "Software/App Development",
      "E-commerce Solutions",
      "UI/UX Design",
      "Digital Marketing",
      "Other",
    ];

    const budgets = [
      "$0 - $1K",
      "$1K - $5K",
      "$5K - $10K",
      "$10K - $25K",
      "$25K - $50K",
      "$50K+",
    ];

    const [submitting, setSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    // Client-side cooldown to prevent rapid re-submissions (seconds)
    const [cooldownUntil, setCooldownUntil] = useState<number>(0);
    const COOLDOWN_SECONDS = 60; // 1 minute cooldown

    const isDisposableEmail = (email: string) => {
      try {
        const domain = email.split("@")[1]?.toLowerCase() || "";
        const blacklist = [
          "mailinator.com",
          "10minutemail.com",
          "temp-mail.org",
          "yopmail.com",
          "guerrillamail.com",
          "maildrop.cc",
          "trashmail.com",
          "tempmail.com",
          "dispostable.com",
        ];
        return blacklist.includes(domain);
      } catch (err) {
        return false;
      }
    };

    const isValidEmail = (email: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email) && !isDisposableEmail(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitMessage(null);

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        interest: selectedInterest || formData.interest,
        budget: selectedBudget || formData.budget,
        description: formData.description,
      };

      if (!isValidEmail(payload.email)) {
        setSubmitMessage(
          "Please provide a valid, non-disposable email address.",
        );
        return;
      }

      if (!payload.interest) {
        setSubmitMessage("Please select a service you are interested in.");
        return;
      }

      if (!payload.budget) {
        setSubmitMessage("Please select your project budget.");
        return;
      }

      try {
        setSubmitting(true);
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const serverMessage = await res.text();
          const message = res.status === 403
            ? (serverMessage || "You may not send messages at this time.")
            : "Submission failed. Please try again or contact us on Instagram/Discord if the issue persists.";
          setSubmitMessage(message);
          setShowResultModal({ open: true, success: false, message });
          // start cooldown to avoid spam even on errors
          setCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
          setSubmitting(false);
          return;
        }

        const successMsg = "Thank you for reaching out! We'll review your project details and respond to your email within 24-48 hours with our thoughts and next steps.";
        setSubmitMessage(successMsg);
        setShowResultModal({ open: true, success: true, message: successMsg });
        // set cooldown after successful submission
        setCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          interest: "",
          budget: "",
          description: "",
        });
        setSelectedInterest("");
        setSelectedBudget("");
      } catch (err: any) {
        const message =
          "An error occurred while submitting your request. Please try again or reach out to us on Instagram/Discord if this continues to not work.";
        setSubmitMessage(message);
        setShowResultModal({ open: true, success: false, message });
        setCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
      } finally {
        setSubmitting(false);
      }
    };

    // Spam protection for form interactions
    const { protectedCallback: protectedInterestSelect } = useSpamProtection(
      (interest: string) => {
        setSelectedInterest(interest);
        setFormData({ ...formData, interest });
      },
      SPAM_PROTECTION_PRESETS.fast,
    );

    const { protectedCallback: protectedBudgetSelect } = useSpamProtection(
      (budget: string) => {
        setSelectedBudget(budget);
        setFormData({ ...formData, budget });
      },
      SPAM_PROTECTION_PRESETS.fast,
    );

    // Spam protection for external links in contact section
    const { protectedCallback: protectedOpenLink } = useSpamProtection(
      (url: string) => {
        window.open(url, "_blank");
      },
      SPAM_PROTECTION_PRESETS.critical,
    );

    const handleInterestSelect = (interest: string) => {
      protectedInterestSelect(interest);
    };

    const handleBudgetSelect = (budget: string) => {
      protectedBudgetSelect(budget);
    };

    return (
      <motion.div
        ref={ref}
        className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
          theme === "light"
            ? "bg-gradient-to-br from-blue-800 via-indigo-700 to-blue-800"
            : "bg-gradient-to-br from-gray-900 via-blue-900 to-black"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {/* Enhanced Background Elements - Contact Section Eye Candy - COSMIC/SPACE THEME */}

        {/* Starfield Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Twinkling Stars - Fixed positions */}
          <div className="absolute inset-0">
            {(typeof shouldRenderParticles === "function"
              ? shouldRenderParticles()
              : !performanceSettings.disableParticles) &&
              [...Array(50)].map((_, i) => {
                // Fixed positions for each star based on index
                const positions = [
                  { x: 15, y: 20 },
                  { x: 85, y: 15 },
                  { x: 25, y: 75 },
                  { x: 70, y: 80 },
                  { x: 90, y: 45 },
                  { x: 10, y: 60 },
                  { x: 45, y: 10 },
                  { x: 60, y: 90 },
                  { x: 30, y: 30 },
                  { x: 75, y: 25 },
                  { x: 20, y: 85 },
                  { x: 95, y: 70 },
                  { x: 5, y: 40 },
                  { x: 55, y: 5 },
                  { x: 80, y: 55 },
                  { x: 40, y: 70 },
                  { x: 65, y: 35 },
                  { x: 35, y: 95 },
                  { x: 50, y: 50 },
                  { x: 85, y: 85 },
                  { x: 12, y: 12 },
                  { x: 88, y: 88 },
                  { x: 22, y: 45 },
                  { x: 77, y: 22 },
                  { x: 33, y: 67 },
                  { x: 67, y: 78 },
                  { x: 18, y: 35 },
                  { x: 82, y: 15 },
                  { x: 28, y: 82 },
                  { x: 72, y: 28 },
                  { x: 38, y: 18 },
                  { x: 62, y: 72 },
                  { x: 48, y: 38 },
                  { x: 52, y: 62 },
                  { x: 8, y: 52 },
                  { x: 92, y: 8 },
                  { x: 58, y: 92 },
                  { x: 42, y: 58 },
                  { x: 78, y: 42 },
                  { x: 32, y: 78 },
                  { x: 68, y: 32 },
                  { x: 13, y: 68 },
                  { x: 87, y: 13 },
                  { x: 23, y: 87 },
                  { x: 73, y: 23 },
                  { x: 43, y: 73 },
                  { x: 53, y: 43 },
                  { x: 63, y: 53 },
                  { x: 37, y: 63 },
                  { x: 47, y: 37 },
                ];
                const pos = positions[i] || {
                  x: Math.random() * 100,
                  y: Math.random() * 100,
                };

                return (
                  <motion.div
                    key={`star-${i}`}
                    className="absolute rounded-full"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: `${1 + Math.random() * 3}px`,
                      height: `${1 + Math.random() * 3}px`,
                      background: [
                        "radial-gradient(circle, #ffffff 0%, #dbeafe 50%, transparent 80%)",
                        "radial-gradient(circle, #60a5fa 0%, #3b82f6 50%, transparent 80%)",
                        "radial-gradient(circle, #3b82f6 0%, #1d4ed8 50%, transparent 80%)",
                        "radial-gradient(circle, #93c5fd 0%, #2563eb 50%, transparent 80%)",
                      ][Math.floor(Math.random() * 4)],
                      boxShadow: "0 0 6px currentColor",
                    }}
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 3,
                      repeat: Infinity,
                      delay: Math.random() * 5,
                    }}
                  />
                );
              })}
          </div>

          {/* Floating Planets */}
          <div className="absolute inset-0">
            {(typeof shouldRenderParticles === "function"
              ? shouldRenderParticles()
              : !performanceSettings.disableParticles) &&
              [...Array(6)].map((_, i) => (
                <motion.div
                  key={`planet-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + ((i * 20) % 60)}%`,
                    width: `${30 + (i % 3) * 20}px`,
                    height: `${30 + (i % 3) * 20}px`,
                    background: [
                      "radial-gradient(circle at 30% 30%, #fbbf24, #f59e0b, #d97706)",
                      "radial-gradient(circle at 30% 30%, #3b82f6, #1d4ed8, #1e40af)",
                      "radial-gradient(circle at 30% 30%, #ef4444, #dc2626, #b91c1c)",
                      "radial-gradient(circle at 30% 30%, #10b981, #059669, #047857)",
                      "radial-gradient(circle at 30% 30%, #8b5cf6, #7c3aed, #6d28d9)",
                      "radial-gradient(circle at 30% 30%, #f97316, #ea580c, #c2410c)",
                    ][i],
                    boxShadow:
                      "0 0 30px rgba(59, 130, 246, 0.4), inset -10px -10px 20px rgba(0, 0, 0, 0.3)",
                  }}
                  animate={{
                    rotateZ: [0, 360],
                    y: [-10, 10, -10],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotateZ: {
                      duration: 20 + (i % 3) * 10,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    y: {
                      duration: 6 + (i % 2) * 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                    },
                    scale: {
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.7,
                    },
                  }}
                >
                  {/* Planet Ring */}
                  {i % 2 === 0 && (
                    <div
                      className="absolute border border-white/30 rounded-full"
                      style={{
                        left: "-20%",
                        top: "40%",
                        width: "140%",
                        height: "20%",
                        borderRadius: "50%",
                        transform: "rotateX(75deg)",
                      }}
                    />
                  )}
                </motion.div>
              ))}
          </div>

          {/* Nebula Clouds */}
          <div className="absolute inset-0">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`nebula-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${10 + i * 25}%`,
                  top: `${15 + ((i * 30) % 70)}%`,
                  width: `${100 + (i % 2) * 80}px`,
                  height: `${60 + (i % 2) * 40}px`,
                  background: [
                    "radial-gradient(ellipse, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 40%, rgba(59, 130, 246, 0.1) 70%, transparent)",
                    "radial-gradient(ellipse, rgba(236, 72, 153, 0.3) 0%, rgba(219, 39, 119, 0.2) 40%, rgba(190, 24, 93, 0.1) 70%, transparent)",
                    "radial-gradient(ellipse, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.2) 40%, rgba(21, 128, 61, 0.1) 70%, transparent)",
                    "radial-gradient(ellipse, rgba(251, 146, 60, 0.3) 0%, rgba(249, 115, 22, 0.2) 40%, rgba(234, 88, 12, 0.1) 70%, transparent)",
                  ][i],
                  filter: "blur(20px)",
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.7, 0.3],
                  rotateZ: [0, 30, 0],
                }}
                transition={{
                  duration: 12 + (i % 3) * 4,
                  repeat: Infinity,
                  delay: i * 2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating Communication Icons - Contact specific */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
          {[
            { icon: "✉️", delay: 0, x: 15, y: 20, size: 24, duration: 8 },
            { icon: "📧", delay: 2, x: 85, y: 15, size: 20, duration: 6 },
            { icon: "💬", delay: 4, x: 25, y: 80, size: 22, duration: 7 },
            { icon: "🌐", delay: 1, x: 75, y: 70, size: 26, duration: 9 },
            {
              icon: "📱",
              delay: 3,
              x: 10,
              y: 60,
              size: 18,
              duration: 8,
            },
            { icon: "📞", delay: 5, x: 90, y: 40, size: 20, duration: 7 },
          ].map((item, i) => (
            <motion.div
              key={`comm-icon-${i}`}
              className="absolute opacity-80"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontSize: `${item.size}px`,
              }}
              initial={{ opacity: 0, scale: 0, rotateZ: -45 }}
              animate={{
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.2, 1],
                rotateZ: [0, 10, -10, 0],
                y: [-10, 10, -10],
              }}
              transition={{
                duration: item.duration,
                delay: item.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {item.icon}
            </motion.div>
          ))}
        </div>

        {/* Animated Noise Texture - Enhanced for contact */}
        <div
          className="absolute inset-0 opacity-5 animate-noise gpu-accelerated"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Data Transmission Lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute w-full h-full" viewBox="0 0 1200 800">
            {[
              { path: "M100,100 Q300,200 500,150 T900,200", delay: 0 },
              { path: "M200,300 Q400,150 600,250 T1000,180", delay: 2 },
              { path: "M50,500 Q250,350 450,400 T800,350", delay: 4 },
            ].map((line, i) => (
              <g key={`data-line-${i}`}>
                <motion.path
                  d={line.path}
                  stroke="rgba(73, 146, 255, 0.4)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="10 5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0, 1, 0],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 5,
                    delay: line.delay,
                    repeat: Infinity,
                    repeatDelay: 6,
                  }}
                />
                <motion.circle
                  r="4"
                  fill="rgba(63, 186, 255, 0.8)"
                  animate={{
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 5,
                    delay: line.delay,
                    repeat: Infinity,
                    repeatDelay: 6,
                  }}
                  style={{
                    transformOrigin: "center",
                  }}
                />
                \n{" "}
              </g>
            ))}
          </svg>
        </div>

        {/* Floating Contact Cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { type: "email", x: 15, y: 35, icon: "✉️" },
            { type: "call", x: 75, y: 25, icon: "📞" },
            { type: "chat", x: 25, y: 70, icon: "💬" },
            { type: "meet", x: 80, y: 65, icon: "📹" },
          ].map((card, i) => (
            <motion.div
              key={`contact-card-${i}`}
              className="absolute w-16 h-16 bg-blue-500/10 backdrop-blur-sm rounded-xl border border-blue-300/20 flex items-center justify-center"
              style={{
                left: `${card.x}%`,
                top: `${card.y}%`,
              }}
              initial={{ opacity: 0, rotateX: -90, scale: 0.5 }}
              animate={{
                opacity: [0, 0.8, 0],
                rotateX: [-90, 0, 90],
                scale: [0.5, 1, 0.5],
                y: [-20, 0, 20],
              }}
              transition={{
                duration: 8,
                delay: i * 2,
                repeat: Infinity,
                repeatDelay: 10,
              }}
            >
              <span className="text-2xl">{card.icon}</span>
            </motion.div>
          ))}
        </div>

        {/* Colorful Floating Particles - Mobile Optimized */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            ...Array(
              window.innerWidth < 992 ? (window.innerWidth < 641 ? 2 : 3) : 15,
            ),
          ].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full opacity-70 gpu-accelerated"
              style={{
                left: `${5 + ((i * 60) % 95)}%`,
                top: `${10 + ((i * 35) % 85)}%`,
                width: `${3 + (i % 4)}px`,
                height: `${3 + (i % 4)}px`,
                background: (() => {
                  const colorPalettes = [
                    `radial-gradient(circle, rgba(255, 100, 200, 0.8) 0%, rgba(255, 150, 100, 0.4) 70%, transparent 90%)`, // Pink-Orange
                    `radial-gradient(circle, rgba(100, 255, 150, 0.8) 0%, rgba(100, 200, 255, 0.4) 70%, transparent 90%)`, // Green-Blue
                    `radial-gradient(circle, rgba(200, 100, 255, 0.8) 0%, rgba(255, 200, 100, 0.4) 70%, transparent 90%)`, // Purple-Yellow
                    `radial-gradient(circle, rgba(100, 200, 255, 0.8) 0%, rgba(200, 255, 150, 0.4) 70%, transparent 90%)`, // Blue-Green
                    `radial-gradient(circle, rgba(255, 200, 100, 0.8) 0%, rgba(200, 100, 255, 0.4) 70%, transparent 90%)`, // Orange-Purple
                    `radial-gradient(circle, rgba(255, 150, 200, 0.8) 0%, rgba(150, 255, 200, 0.4) 70%, transparent 90%)`, // Pink-Mint
                  ];
                  return colorPalettes[i % colorPalettes.length];
                })(),
                animation:
                  window.innerWidth < 992
                    ? `gentleFloat ${6 + (i % 2)}s ease-in-out infinite ${i * 0.8}s`
                    : `gentleFloat ${4 + (i % 3)}s ease-in-out infinite ${i * 0.4}s, sparkle ${8 + (i % 4)}s ease-in-out infinite ${i * 0.5}s`,
                filter:
                  window.innerWidth < 992
                    ? "none"
                    : `drop-shadow(0 0 4px currentColor) blur(0.5px)`,
                boxShadow:
                  window.innerWidth < 992
                    ? "none"
                    : `0 0 ${4 + (i % 3) * 2}px rgba(255, 255, 255, 0.3)`,
                transform: `translateZ(0) scale(${window.innerWidth < 992 ? 0.6 : 0.8 + (i % 2) * 0.4})`,
                willChange: window.innerWidth < 992 ? "auto" : "transform",
              }}
            />
          ))}
        </div>

        {/* Animated Geometric Patterns */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <svg className="absolute w-full h-full" viewBox="0 0 1200 800">
            {/* Animated hexagon grid - Full experience */}
            {[...Array(4)].map((_, i) => (
              <polygon
                key={`hex-${i}`}
                points="100,20 140,40 140,80 100,100 60,80 60,40"
                fill="none"
                stroke="rgba(73, 146, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="10 5"
                style={{
                  transform: `translate(${100 + i * 200}px, ${100 + (i % 2) * 150}px)`,
                  animation: `geometric-pulse ${8 + i}s ease-in-out infinite ${i * 0.5}s`,
                }}
              />
            ))}
            {/* Animated connecting lines - Full experience */}
            {[...Array(4)].map((_, i) => (
              <line
                key={`line-${i}`}
                x1={50 + i * 300}
                y1={200}
                x2={250 + i * 300}
                y2={400}
                stroke="rgba(63, 186, 255, 0.2)"
                strokeWidth="1"
                strokeDasharray="15 10"
                style={{
                  animation: `geometric-pulse ${10 + i * 2}s ease-in-out infinite ${i * 0.7}s`,
                }}
              />
            ))}
            {/* Animated circuit lines for Contact section - Full experience */}
            {[...Array(2)].map((_, i) => (
              <motion.path
                key={`circuit-${i}`}
                d={`M${100 + i * 200},100 L${200 + i * 200},200 L${150 + i * 200},300 L${250 + i * 200},400`}
                stroke="rgba(73, 146, 255, 0.5)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="10 5"
                initial={{ pathLength: 0 }}
                animate={isVisible ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 2, delay: i * 0.3 }}
              />
            ))}
          </svg>
        </div>

        {/* Breathing Orbs - Reduced for mobile */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={`breath-orb-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${15 + ((i * 80) % 70)}%`,
                top: `${20 + ((i * 60) % 60)}%`,
                width: `${20 + (i % 3) * 15}px`,
                height: `${20 + (i % 3) * 15}px`,
                background: `radial-gradient(circle, rgba(${73 + i * 10}, ${146 + i * 5}, 255, 0.3) 0%, transparent 70%)`,
                animation: `breath ${6 + (i % 4)}s ease-in-out infinite ${i * 0.4}s`,
                filter: `blur(${2 + (i % 3)}px)`,
              }}
            />
          ))}
        </div>

        {/* Dynamic Background Waves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                radial-gradient(circle at 20% 80%, rgba(73, 146, 255, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(63, 186, 255, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(57, 135, 227, 0.1) 0%, transparent 50%)
              `,
              animation: "subtle-glow 12s ease-in-out infinite alternate",
            }}
          />
        </div>

        {/* Aurora-like Moving Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden"></div>

        {/* Main Content Container */}
        <div className="relative min-h-screen py-2 sm:py-4 lg:py-6 section-container">
          <motion.div
            className="relative z-10 px-3 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto section-content min-h-[60vh] pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-12 flex flex-col justify-center"
            initial={{ opacity: 0, y: 80 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Contact Title */}
            <div className="text-center mb-2 sm:mb-4">
              <h1
                className={`contact-title font-poppins text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight relative mobile-lively-text ${theme === "light" ? "text-gray-900" : "text-white"}`}
              >
                <span className="warm-glow-text animate-warm-glow-pulse">
                  Contact
                </span>

                {/* Optimized sparkles for better performance */}
                {[
                  { x: 75, y: -30, size: 0.7, type: "star" },
                  { x: 55, y: -8, size: 0.5, type: "diamond" },
                  { x: 95, y: 40, size: 0.6, type: "plus" },
                  { x: 70, y: 70, size: 0.8, type: "star" },
                  { x: 18, y: 75, size: 0.4, type: "diamond" },
                  { x: -30, y: 50, size: 0.5, type: "plus" },
                ].map((sparkle, i) => (
                  <div
                    key={`contact-sparkle-${i}`}
                    className="absolute pointer-events-none gpu-accelerated"
                    style={{
                      left: `calc(50% + ${sparkle.x}px)`,
                      top: `calc(50% + ${sparkle.y}px)`,
                      animation: `sparkle-enhanced ${5 + (i % 3)}s ease-in-out infinite ${i * 0.4}s`,
                      transform: `translateZ(0) scale(${sparkle.size})`,
                      opacity: 0.5,
                      zIndex: -1,
                      willChange: "transform, opacity",
                    }}
                  >
                    {sparkle.type === "star" && (
                      <div
                        className="w-5 h-5"
                        style={{
                          background: [
                            "radial-gradient(circle, rgba(255, 140, 200, 0.8) 0%, rgba(140, 255, 160, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(160, 140, 255, 0.8) 0%, rgba(255, 160, 140, 0.5) 70%, transparent 90%)",
                            "radial-gradient(circle, rgba(140, 200, 255, 0.8) 0%, rgba(255, 140, 180, 0.5) 70%, transparent 90%)",
                          ][i % 3],
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                          animation: "spin-slow 11s linear infinite",
                          filter: "drop-shadow(0 0 6px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "diamond" && (
                      <div
                        className="w-3 h-3"
                        style={{
                          background: [
                            "linear-gradient(45deg, rgba(255, 160, 200, 0.7), rgba(160, 255, 140, 0.6))",
                            "linear-gradient(45deg, rgba(140, 160, 255, 0.7), rgba(255, 200, 140, 0.6))",
                            "linear-gradient(45deg, rgba(200, 255, 140, 0.7), rgba(140, 200, 255, 0.6))",
                          ][i % 3],
                          clipPath:
                            "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                          animation: "gentle-pulse 3s ease-in-out infinite",
                          filter: "drop-shadow(0 0 4px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "plus" && (
                      <div
                        className="w-4 h-4"
                        style={{
                          background: [
                            "conic-gradient(from 15deg, rgba(255, 160, 140, 0.7), rgba(140, 255, 200, 0.6), rgba(200, 140, 255, 0.7), rgba(255, 180, 160, 0.6))",
                            "conic-gradient(from 105deg, rgba(140, 255, 160, 0.7), rgba(255, 140, 180, 0.6), rgba(160, 200, 255, 0.7), rgba(255, 200, 140, 0.6))",
                            "conic-gradient(from 195deg, rgba(200, 160, 255, 0.7), rgba(255, 180, 140, 0.6), rgba(140, 255, 180, 0.7), rgba(255, 160, 200, 0.6))",
                          ][i % 3],
                          clipPath:
                            "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                          animation: "rotate-slow 8s linear infinite",
                          filter: "drop-shadow(0 0 7px currentColor)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </h1>
            </div>

            {/* Subtitle */}
            <div className="text-center mb-2 sm:mb-3">
              <h2
                className={`text-lg sm:text-xl md:text-2xl font-medium ${theme === "light" ? "text-gray-700" : "text-white/80"} mb-2`}
              >
                Have a great idea?
              </h2>
              <p
                className={`text-base sm:text-lg font-medium ${theme === "light" ? "text-gray-700" : "text-white/80"}`}
              >
                <span className="warm-glow-text animate-warm-glow-pulse text-smooth glow-120hz">
                  Tell us about it.
                </span>

                {/* Sparkles for subtitle */}
                {[
                  { x: 95, y: -20, size: 0.6, type: "star" },
                  { x: 70, y: 25, size: 0.5, type: "diamond" },
                  { x: -30, y: 15, size: 0.4, type: "plus" },
                  { x: 110, y: 5, size: 0.7, type: "star" },
                ].map((sparkle, i) => (
                  <div
                    key={`contact-subtitle-sparkle-${i}`}
                    className="absolute pointer-events-none gpu-accelerated"
                    style={{
                      left: `calc(50% + ${sparkle.x}px)`,
                      top: `calc(50% + ${sparkle.y}px)`,
                      animation: `sparkle-enhanced ${5 + (i % 2)}s ease-in-out infinite ${i * 0.4}s`,
                      transform: `translateZ(0) scale(${sparkle.size})`,
                      opacity: 0.4,
                      zIndex: -1,
                      willChange: "transform, opacity",
                    }}
                  >
                    {sparkle.type === "star" && (
                      <div
                        className="w-4 h-4"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(255, 160, 180, 0.8) 0%, rgba(160, 255, 140, 0.5) 70%, transparent 90%)",
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                          animation: "spin-slow 9s linear infinite",
                          filter: "drop-shadow(0 0 4px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "diamond" && (
                      <div
                        className="w-3 h-3"
                        style={{
                          background:
                            "linear-gradient(45deg, rgba(255, 140, 200, 0.7), rgba(140, 255, 180, 0.6))",
                          clipPath:
                            "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                          animation: "gentle-pulse 3.5s ease-in-out infinite",
                          filter: "drop-shadow(0 0 3px currentColor)",
                        }}
                      />
                    )}
                    {sparkle.type === "plus" && (
                      <div
                        className="w-3 h-3"
                        style={{
                          background:
                            "conic-gradient(from 225deg, rgba(140, 255, 180, 0.7), rgba(255, 140, 160, 0.6), rgba(180, 160, 255, 0.7), rgba(255, 180, 140, 0.6))",
                          clipPath:
                            "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
                          animation: "rotate-slow 8s linear infinite",
                          filter: "drop-shadow(0 0 5px currentColor)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </p>
            </div>

            {/* Contact Content Grid */}
            <div className="contact-grid max-w-5xl mx-auto px-1 sm:px-2 mt-1 sm:mt-2">
              {/* Desktop Layout - Form + Sidebar */}
              <div className="hidden lg:grid lg:grid-cols-5 gap-3 sm:gap-4 items-start">
                {/* Main Contact Form - Takes 3 columns */}
                <motion.div
                  className="lg:col-span-3"
                  initial={{ x: -50, opacity: 0 }}
                  animate={
                    isVisible ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }
                  }
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <div
                    className="p-2 sm:p-3 lg:p-4 rounded-xl backdrop-blur-lg border"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "2px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: "0 0 30px rgba(73, 146, 255, 0.2)",
                    }}
                  >
                    <form
                      onSubmit={handleSubmit}
                      className="contact-form space-y-2 sm:space-y-3"
                    >
                      {/* Name Fields Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <input
                            type="text"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                firstName: e.target.value,
                              })
                            }
                            className="w-full p-2 sm:p-3 rounded-lg border backdrop-blur-lg transition-all duration-200 focus:scale-[1.01] outline-none text-sm sm:text-base will-change-transform"
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "2px solid rgba(255, 255, 255, 0.15)",
                              color: theme === "light" ? "#1f2937" : "#e5e7eb",
                            }}
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                lastName: e.target.value,
                              })
                            }
                            className="w-full p-2 sm:p-3 rounded-lg border backdrop-blur-lg transition-all duration-200 focus:scale-[1.01] outline-none text-sm sm:text-base will-change-transform"
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "2px solid rgba(255, 255, 255, 0.15)",
                              color: theme === "light" ? "#1f2937" : "#e5e7eb",
                            }}
                            required
                          />
                        </div>
                      </div>

                      {/* Email row (phone removed) */}
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        <div>
                          <input
                            type="email"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="w-full p-2 sm:p-3 rounded-lg border backdrop-blur-lg transition-all duration-200 focus:scale-[1.01] outline-none text-sm sm:text-base will-change-transform"
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "2px solid rgba(255, 255, 255, 0.15)",
                              color: theme === "light" ? "#1f2937" : "#e5e7eb",
                            }}
                            required
                          />
                        </div>
                      </div>

                      {/* Interest Selection */}
                      <div>
                        <h3
                          className={`text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-white/80"}`}
                        >
                          I'm interested in...
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                          {interests.map((interest) => (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => handleInterestSelect(interest)}
                              className={`p-2 sm:p-2.5 text-sm rounded-md border transition-all duration-200 hover:scale-105 will-change-transform ${
                                selectedInterest === interest
                                  ? "border-blue-400 text-blue-400"
                                  : "border-white/20 hover:border-white/40"
                              }`}
                              style={{
                                background:
                                  selectedInterest === interest
                                    ? "rgba(59, 130, 246, 0.1)"
                                    : "rgba(255, 255, 255, 0.05)",
                                color:
                                  selectedInterest === interest
                                    ? theme === "light"
                                      ? "#2563eb"
                                      : "#60a5fa"
                                    : theme === "light"
                                      ? "#4b5563"
                                      : "#d1d5db",
                              }}
                            >
                              {interest}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Budget Selection */}
                      <div>
                        <h3
                          className={`text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-white/80"}`}
                        >
                          Project Budget (USD)
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
                          {budgets.map((budget) => (
                            <button
                              key={budget}
                              type="button"
                              onClick={() => handleBudgetSelect(budget)}
                              className={`p-2 sm:p-2.5 text-sm rounded-md border transition-all duration-200 hover:scale-105 will-change-transform ${
                                selectedBudget === budget
                                  ? "border-green-400 text-green-400"
                                  : "border-white/20 hover:border-white/40"
                              }`}
                              style={{
                                background:
                                  selectedBudget === budget
                                    ? "rgba(34, 197, 94, 0.1)"
                                    : "rgba(255, 255, 255, 0.05)",
                                color:
                                  selectedBudget === budget
                                    ? theme === "light"
                                      ? "#059669"
                                      : "#34d399"
                                    : theme === "light"
                                      ? "#4b5563"
                                      : "#d1d5db",
                              }}
                            >
                              {budget}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Project Description */}
                      <div>
                        <h3
                          className={`text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-white/80"}`}
                        >
                          Tell us more about your project
                        </h3>
                        <textarea
                          placeholder="Something about your great idea..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          className="w-full p-2 sm:p-3 rounded-lg border backdrop-blur-lg transition-all duration-200 focus:scale-[1.01] resize-none outline-none text-sm sm:text-base will-change-transform"
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "2px solid rgba(255, 255, 255, 0.15)",
                            color: theme === "light" ? "#1f2937" : "#e5e7eb",
                          }}
                          required
                        />
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={submitting || Date.now() < cooldownUntil}
                        className="w-full p-3 sm:p-4 rounded-xl text-white font-semibold flex items-center justify-center space-x-2 group transition-all duration-200 hover:scale-[1.02] text-sm sm:text-base will-change-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(73, 146, 255, 0.8), rgba(34, 211, 238, 0.8))",
                          boxShadow: "0 0 30px rgba(73, 146, 255, 0.4)",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        <span>
                          {submitting
                            ? "Sending..."
                            : Date.now() < cooldownUntil
                              ? `Please wait ${Math.ceil((cooldownUntil - Date.now()) / 1000)}s`
                              : "Submit Your Request"}
                        </span>
                      </motion.button>
                      {submitMessage && (
                        <p className="mt-3 text-sm text-center text-muted-foreground">
                          {submitMessage}
                        </p>
                      )}
                    </form>
                  </div>
                </motion.div>

                {/* Desktop Sidebar */}
                <motion.div
                  className="lg:col-span-2"
                  initial={{ x: 50, opacity: 0 }}
                  animate={
                    isVisible ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 }
                  }
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <div className="space-y-4">
                    {/* Message Us Header */}
                    <div>
                      <h3
                        className={`text-base font-semibold mb-3 ${theme === "light" ? "text-gray-900" : "text-white"}`}
                      >
                        Message us:
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          {
                            name: "Instagram",
                            url: "https://instagram.com/kor_services",
                            icon: "📷",
                            color: "from-pink-500 to-purple-500",
                          },
                          {
                            name: "Discord",
                            url: "https://discord.com/users/1111172734416850974",
                            icon: "💬",
                            color: "from-indigo-500 to-blue-500",
                          },
                          {
                            name: "Twitter/X",
                            url: "https://x.com/kor_services",
                            icon: "🐦",
                            color: "from-blue-400 to-blue-600",
                          }
                          /* {
                            name: "Telegram",
                            url: "https://telegram.org",
                            icon: "📱",
                            color: "from-blue-500 to-cyan-500",
                          }, */
                        ].map((social) => (
                          <motion.button
                            key={social.name}
                            onClick={() => protectedOpenLink(social.url)}
                            className="group relative p-2 rounded-lg backdrop-blur-lg border transition-all duration-200 hover:scale-[1.02] overflow-hidden will-change-transform text-left"
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "2px solid rgba(255, 255, 255, 0.1)",
                              boxShadow: "0 0 20px rgba(73, 146, 255, 0.1)",
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Animated background gradient */}
                            <div
                              className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${social.color}`}
                            />

                            {/* Scanning line effect */}
                            <div className="absolute inset-0 overflow-hidden rounded-xl">
                              <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                            </div>

                            <div className="flex items-center space-x-2 relative z-10">
                              <div
                                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${social.color} flex items-center justify-center`}
                              >
                                <span className="text-white text-sm">
                                  {social.icon}
                                </span>
                              </div>
                              <div>
                                <p
                                  className={`font-medium text-sm ${theme === "light" ? "text-gray-900" : "text-white"} group-hover:text-blue-300 transition-colors duration-300`}
                                >
                                  {social.name}
                                </p>
                                <p
                                  className={`text-sm ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}
                                >
                                  Message us on {social.name}
                                </p>
                              </div>
                            </div>

                            {/* Circuit decorations */}
                            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-all duration-500">
                              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                              <div
                                className="absolute bottom-1 left-1 w-1 h-1 bg-cyan-400 rounded-full"
                                style={{
                                  animation:
                                    "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 0.5s infinite",
                                }}
                              />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Contact Us Header */}
                    <div>
                      <h3
                        className={`text-base font-semibold mb-3 ${theme === "light" ? "text-gray-900" : "text-white"}`}
                      >
                        Contact us:
                      </h3>
                      <div
                        className="p-2 rounded-lg backdrop-blur-lg border"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "2px solid rgba(255, 255, 255, 0.1)",
                          boxShadow: "0 0 20px rgba(73, 146, 255, 0.1)",
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Mail className="w-3 h-3 text-white" />
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-sm font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}
                            >
                              Email us at
                            </p>
                            <p
                              className={`font-medium text-sm ${theme === "light" ? "text-gray-900" : "text-white"}`}
                            >
                              imakethingsandstuff@proton.me
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Mobile/Tablet Layout - Social Buttons Only */}
              <motion.div
                className="lg:hidden"
                initial={{ y: 50, opacity: 0 }}
                animate={
                  isVisible ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }
                }
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="space-y-6">
                  {/* Mobile Contact Header */}
                  <div className="text-center">
                    <h3
                      className={`text-lg sm:text-xl font-semibold mb-2 ${theme === "light" ? "text-gray-900" : "text-white"}`}
                    >
                      Get in touch
                    </h3>
                    <p
                      className={`text-sm sm:text-base ${theme === "light" ? "text-gray-600" : "text-white/60"}`}
                    >
                      Choose your preferred way to reach us
                    </p>
                  </div>

                  {/* Social Media Buttons - Redesigned for Mobile */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        name: "Instagram",
                        subtitle: "Follow us for updates",
                        url: "https://instagram.com/kor_services",
                        icon: "📷",
                        color: "from-pink-500 via-purple-500 to-indigo-500",
                        shadowColor: "rgba(236, 72, 153, 0.3)",
                      },
                      {
                        name: "Discord",
                        subtitle: "Join our community",
                        url: "https://discord.com/users/1111172734416850974",
                        icon: "💬",
                        color: "from-indigo-500 via-blue-500 to-purple-500",
                        shadowColor: "rgba(99, 102, 241, 0.3)",
                      },
                      // TELEGRAM HIDDEN FOR FUTURE USE
                      // {
                      //   name: "Telegram",
                      //   subtitle: "Quick messaging",
                      //   url: "https://telegram.org",
                      //   icon: "✈️",
                      //   color: "from-blue-500 via-cyan-500 to-teal-500",
                      //   shadowColor: "rgba(34, 211, 238, 0.3)",
                      // },
                      {
                        name: "Email",
                        subtitle: "imakethingsandstuff@proton.me",
                        url: "mailto:imakethingsandstuff@proton.me",
                        icon: "✉️",
                        color: "from-emerald-500 via-green-500 to-lime-500",
                        shadowColor: "rgba(16, 185, 129, 0.3)",
                      },
                    ].map((contact, index) => (
                      <motion.button
                        key={contact.name}
                        onClick={() => protectedOpenLink(contact.url)}
                        className="group relative rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] overflow-hidden will-change-transform p-4 sm:p-6 mobile-lively-float"
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "2px solid rgba(255, 255, 255, 0.15)",
                          boxShadow: `0 0 40px ${contact.shadowColor}`,
                        }}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Animated background gradient */}
                        <div
                          className={`absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-500 bg-gradient-to-br ${contact.color}`}
                        />

                        {/* Scanning line effect */}
                        <div className="absolute inset-0 overflow-hidden rounded-2xl">
                          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </div>

                        {/* Main Content - Responsive Layout */}
                        <div className="relative z-10">
                          {/* Unified Layout for all devices */}
                          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-2 sm:space-y-0 sm:space-x-4">
                            <div
                              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.color} flex items-center justify-center shadow-lg`}
                              style={{
                                boxShadow: `0 6px 20px ${contact.shadowColor}`,
                              }}
                            >
                              <span className="text-white text-lg animate-gentleBounce">
                                {contact.icon}
                              </span>
                            </div>
                            <div>
                              <h4
                                className={`font-bold text-sm ${theme === "light" ? "text-gray-900" : "text-white"} group-hover:text-blue-300 transition-colors duration-300`}
                              >
                                {contact.name}
                              </h4>
                              <p
                                className={`text-xs ${theme === "light" ? "text-gray-600" : "text-gray-400"} group-hover:text-blue-200 transition-colors duration-300 mt-1`}
                              >
                                {contact.name === "Email"
                                  ? "imakethingsandstuff@proton.me"
                                  : contact.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Unified Layout - now visible on all devices */}
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${contact.color} flex items-center justify-center shadow-lg`}
                              style={{
                                boxShadow: `0 8px 25px ${contact.shadowColor}`,
                              }}
                            >
                              <span className="text-white text-2xl animate-gentleBounce">
                                {contact.icon}
                              </span>
                            </div>
                            <div className="flex-1 text-left">
                              <h4
                                className={`font-bold text-lg ${theme === "light" ? "text-gray-900" : "text-white"} group-hover:text-blue-300 transition-colors duration-300`}
                              >
                                {contact.name}
                              </h4>
                              <p
                                className={`text-sm ${theme === "light" ? "text-gray-600" : "text-gray-400"} group-hover:text-blue-200 transition-colors duration-300`}
                              >
                                {contact.subtitle}
                              </p>
                            </div>
                            <div className="text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Circuit decorations */}
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-all duration-500">
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse" />
                          <div
                            className="absolute bottom-2 left-2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 rounded-full"
                            style={{
                              animation:
                                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 0.5s infinite",
                            }}
                          />
                          <div
                            className="absolute top-1/2 right-4 sm:right-6 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-purple-400 rounded-full"
                            style={{
                              animation:
                                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 1s infinite",
                            }}
                          />
                        </div>

                        {/* Glow effect */}
                        <div
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                          style={{
                            background: `radial-gradient(circle at center, ${contact.shadowColor}, transparent 70%)`,
                          }}
                        />
                      </motion.button>
                    ))}
                  </div>

                  {/* Additional Info for Mobile */}
                  <div className="text-center pt-4">
                    <p
                      className={`text-xs ${theme === "light" ? "text-gray-500" : "text-white/40"}`}
                    >
                      We typically respond within 24 hours
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  },
);
