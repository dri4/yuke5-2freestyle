import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrowserDetection } from "@/hooks/use-browser-detection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDeviceType } from "@/hooks/use-device-type";
import { useRafThrottle } from "@/hooks/use-raf-throttle";

export interface FloatingNotification {
  id: string;
  title: string;
  description: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number; // Auto-dismiss duration in ms, 0 = no auto-dismiss
}

interface NotificationContextType {
  notifications: FloatingNotification[];
  addNotification: (notification: Omit<FloatingNotification, "id">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<FloatingNotification[]>(
    [],
  );

  const addNotification = useCallback(
    (notification: Omit<FloatingNotification, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: FloatingNotification = {
        id,
        duration: 0, // Default no auto-dismiss - user must click X
        type: "info",
        ...notification,
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-dismiss if duration is set
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }
    },
    [],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearAll }}
    >
      {children}
      <FloatingNotificationContainer />
    </NotificationContext.Provider>
  );
};

const FloatingNotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const { isSafari, isMobileSafari } = useBrowserDetection();
  const isMobile = useIsMobile();
  const deviceType = useDeviceType();

  // Don't show floating notifications on mobile/tablet - use mobile notification system instead
  if (deviceType !== "desktop") {
    return null;
  }

  // Position notifications at bottom for all browsers
  // For Safari (especially mobile Safari), add extra bottom margin to avoid search bar
  let positionClasses = "bottom-4 right-4";
  if (isSafari && isMobile) {
    positionClasses = "bottom-28 right-4"; // Much higher up on mobile Safari to avoid search bar
  } else if (isSafari) {
    positionClasses = "bottom-8 right-4"; // Slightly higher on desktop Safari
  }

  return (
    <div
      className={cn("notification-container", positionClasses)} // Use custom CSS class for better visibility control
      style={{
        // Add safe area padding for Safari mobile to avoid search bar
        paddingBottom:
          isSafari && isMobile
            ? "calc(env(safe-area-inset-bottom) + 60px)"
            : undefined,
      }}
    >
      <div
        className={cn(
          "flex flex-col w-full",
          isMobile ? "max-w-[280px] px-2 gap-2" : "max-w-sm sm:max-w-md gap-3",
        )}
      >
        <AnimatePresence
          mode="popLayout"
          initial={false}
          onExitComplete={() => {
            // Ensure smooth transitions when notifications exit
            if (typeof window !== "undefined") {
              window.requestAnimationFrame(() => {
                // Force layout recalculation for smooth animations
              });
            }
          }}
        >
          {notifications.map((notification, index) => (
            <FloatingNotificationItem
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
              isSafari={isSafari}
              isMobile={isMobile}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface FloatingNotificationItemProps {
  notification: FloatingNotification;
  onClose: () => void;
  isSafari?: boolean;
  isMobile?: boolean;
}

const FloatingNotificationItemInner = React.forwardRef<
  HTMLDivElement,
  FloatingNotificationItemProps
>(({ notification, onClose, isSafari = false, isMobile = false }, ref) => {
  const [isClosing, setIsClosing] = useState(false);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
    isNear: false,
  });
  const elementRef = React.useRef<HTMLDivElement>(null);

  // Forward the ref to elementRef
  React.useImperativeHandle(ref, () => elementRef.current as HTMLDivElement);

  const rawMouseMove = (clientX: number, clientY: number) => {
    // Disable mouse tracking on mobile for better performance
    if (isMobile || !elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;
    const distance = Math.sqrt(x * x + y * y);

    setMousePosition({
      x,
      y,
      isNear: distance < 150,
    });
  };

  // Throttle high-frequency events to RAF to avoid excessive re-renders
  const handleMouseMove = useRafThrottle(rawMouseMove);

  const handleMouseMoveEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseMove(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setMousePosition({ x: 0, y: 0, isNear: false });
  };

  const handleClose = () => {
    setIsClosing(true);
    // Optimized exit timing based on device type
    const exitDuration = isMobile ? 200 : 350;
    setTimeout(() => {
      onClose();
    }, exitDuration);
  };

  const getTypeColors = (type: FloatingNotification["type"]) => {
    switch (type) {
      case "success":
        return {
          border: "rgba(34, 197, 94, 0.3)",
          glow: "rgba(34, 197, 94, 0.2)",
          accent: "rgba(34, 197, 94, 0.6)",
        };
      case "warning":
        return {
          border: "rgba(245, 158, 11, 0.3)",
          glow: "rgba(245, 158, 11, 0.2)",
          accent: "rgba(245, 158, 11, 0.6)",
        };
      case "error":
        return {
          border: "rgba(239, 68, 68, 0.3)",
          glow: "rgba(239, 68, 68, 0.2)",
          accent: "rgba(239, 68, 68, 0.6)",
        };
      default:
        return {
          border: "rgba(73, 146, 255, 0.3)",
          glow: "rgba(73, 146, 255, 0.2)",
          accent: "rgba(73, 146, 255, 0.6)",
        };
    }
  };

  const colors = getTypeColors(notification.type);

  return (
    <motion.div
      layout="position"
      layoutId={notification.id}
      initial={{
        opacity: 0,
        scale: isMobile ? 0.9 : 0.8,
        x: isMobile ? 50 : 100,
        y: isMobile ? -20 : 0,
      }}
      animate={
        isClosing
          ? {
              opacity: 0,
              scale: isMobile ? 0.85 : 0.9,
              x: isMobile ? 30 : 60,
              y: isMobile ? -10 : 0,
            }
          : {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }
      }
      exit={{
        opacity: 0,
        scale: isMobile ? 0.75 : 0.8,
        x: isMobile ? 80 : 120,
        y: isMobile ? -15 : 0,
      }}
      transition={{
        type: isClosing ? "tween" : isMobile ? "tween" : "spring",
        ...(isClosing && {
          duration: isMobile ? 0.2 : 0.35,
          ease: "easeInOut",
        }),
        ...(isMobile &&
          !isClosing && {
            duration: 0.3,
            ease: "easeOut",
          }),
        ...(!isMobile &&
          !isClosing && {
            stiffness: 280,
            damping: 25,
          }),
      }}
      className="relative group notification-item"
      onMouseMove={handleMouseMoveEvent}
      onMouseLeave={handleMouseLeave}
      ref={elementRef}
      style={{
        willChange: "transform, opacity",
      }}
    >
      {/* Fixed Border Effect - only animates color, stays static */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-colors duration-300"
        style={{
          border: `1px solid ${mousePosition.isNear ? colors.accent : colors.border}`,
          borderRadius: "0.75rem", // Match rounded-xl exactly (12px)
        }}
      />

      {/* Main notification content - container stays static */}
      <div
        className={cn(
          "relative shadow-2xl transition-shadow",
          isMobile
            ? "backdrop-blur-md duration-200"
            : "backdrop-blur-xl duration-300 hover:shadow-glow-intense",
          "border border-transparent",
        )}
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(20px)",
          borderRadius: "0.75rem", // Exact match with border
          boxShadow: `
            0 0 50px ${colors.glow},
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Inner content wrapper that animates on hover */}
        <div
          className={cn(
            "relative transition-transform duration-300",
            isMobile ? "p-3 pr-10 text-sm" : "p-4 pr-12",
            !isMobile && "group-hover:scale-[1.02]",
          )}
        >
          {/* Floating particles effect - optimized for mobile */}
          {!isMobile && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full opacity-30"
                  style={{
                    left: `${10 + ((i * 15) % 80)}%`,
                    top: `${20 + ((i * 25) % 60)}%`,
                    width: `${1 + (i % 3)}px`,
                    height: `${1 + (i % 3)}px`,
                    background: colors.accent,
                    animation: `gentleFloat ${2 + (i % 3)}s ease-in-out infinite ${i * 0.5}s`,
                    filter: "blur(0.5px)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Mobile-optimized minimal particles */}
          {isMobile && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full opacity-20"
                  style={{
                    left: `${20 + i * 50}%`,
                    top: `${30 + i * 40}%`,
                    width: "2px",
                    height: "2px",
                    background: colors.accent,
                    animation: `enhanced-mobile-float-${i + 1} ${3 + i}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Close button - optimized for mobile touch */}
          <motion.button
            onClick={handleClose}
            className={cn(
              "absolute rounded-md",
              "text-white/60 transition-all",
              "focus:outline-none flex items-center justify-center",
              "touch-manipulation", // Improve touch responsiveness
              isMobile
                ? "top-1 right-1 p-2 min-w-[40px] min-h-[40px] hover:bg-white/20 duration-150 active:scale-90"
                : "top-2 right-2 p-2 min-w-[44px] min-h-[44px] hover:text-white hover:bg-white/10 duration-200",
              isMobile
                ? "focus:ring-2 focus:ring-white/30"
                : "focus:ring-2 focus:ring-white/20",
            )}
            whileHover={isMobile ? undefined : { scale: 1.1, rotate: 90 }}
            whileTap={isMobile ? { scale: 0.85 } : { scale: 0.8, rotate: 180 }}
            animate={
              isClosing
                ? {
                    scale: isMobile ? 0.7 : 0.8,
                    rotate: isMobile ? 180 : 360,
                    opacity: 0.3,
                    transition: { duration: isMobile ? 0.2 : 0.3 },
                  }
                : {}
            }
            // Prevent event bubbling that might interfere with touch
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <X className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
          </motion.button>

          {/* Content */}
          <div
            className={cn("space-y-1", isMobile ? "space-y-0.5" : "space-y-1")}
          >
            <motion.h4
              className={cn(
                "font-semibold text-white animate-text-glow-pulse",
                isMobile ? "text-xs" : "text-sm sm:text-base",
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {notification.title}
            </motion.h4>
            <motion.p
              className={cn(
                "text-white/80 leading-relaxed",
                isMobile
                  ? "text-xs leading-tight"
                  : "text-xs sm:text-sm leading-relaxed",
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {notification.description}
            </motion.p>
          </div>

          {/* Accent line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
              borderBottomLeftRadius: "0.75rem",
              borderBottomRightRadius: "0.75rem",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
});

const FloatingNotificationItem = React.memo(
  React.forwardRef((props: FloatingNotificationItemProps, ref) => (
    // @ts-ignore - forwardRef typing preserved via inner component
    <FloatingNotificationItemInner {...props} ref={ref} />
  )),
  (prevProps, nextProps) =>
    prevProps.notification.id === nextProps.notification.id &&
    prevProps.isMobile === nextProps.isMobile,
);

// Utility function for easy notification usage
export const showNotification = (
  notification: Omit<FloatingNotification, "id">,
) => {
  // This will be used with the context
  console.warn(
    "showNotification called outside of NotificationProvider. Use useNotifications().addNotification instead.",
  );
};
