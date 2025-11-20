import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeviceType } from "@/hooks/use-device-type";
import { useBrowserDetection } from "@/hooks/use-browser-detection";

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number; // Auto-dismiss duration in ms, 0 = no auto-dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface MobileNotificationContextType {
  notifications: MobileNotification[];
  addNotification: (notification: Omit<MobileNotification, "id">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  isHelpModalOpen?: boolean;
  setIsHelpModalOpen?: (isOpen: boolean) => void;
}

const MobileNotificationContext = createContext<
  MobileNotificationContextType | undefined
>(undefined);

export const useMobileNotifications = () => {
  const context = useContext(MobileNotificationContext);
  if (!context) {
    throw new Error(
      "useMobileNotifications must be used within MobileNotificationProvider",
    );
  }
  return context;
};

export const MobileNotificationProvider: React.FC<{
  children: React.ReactNode;
  isHelpModalOpen?: boolean;
  setIsHelpModalOpen?: (isOpen: boolean) => void;
}> = ({ children, isHelpModalOpen, setIsHelpModalOpen }) => {
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const deviceType = useDeviceType();

  const addNotification = useCallback(
    (notification: Omit<MobileNotification, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: MobileNotification = {
        id,
        duration: 0, // Default no auto-dismiss
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
    <MobileNotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        isHelpModalOpen,
        setIsHelpModalOpen,
      }}
    >
      {children}
      {deviceType !== "desktop" && <MobileNotificationContainer />}
    </MobileNotificationContext.Provider>
  );
};

const MobileNotificationContainer: React.FC = () => {
  const { notifications, removeNotification, isHelpModalOpen } =
    useMobileNotifications();
  const deviceType = useDeviceType();
  const { isSafari } = useBrowserDetection();

  const isMobile = deviceType === "mobile";
  const shouldPositionAtBottom = isMobile && !isSafari;

  // Hide notifications on mobile when help modal is open
  if (isMobile && isHelpModalOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "notification-container fixed z-[100] pointer-events-none",
        isMobile
          ? shouldPositionAtBottom
            ? "w-full flex max-h-screen flex-col p-4" // Bottom positioning for non-Safari mobile
            : "top-0 w-full flex max-h-screen flex-col-reverse p-4" // Top positioning for Safari mobile
          : "bottom-0 right-0 top-auto flex-col max-w-[420px] p-4", // Match original tablet positioning
      )}
      style={{
        // Position 100px from bottom for non-Safari mobile
        bottom: shouldPositionAtBottom ? "100px" : undefined,
        // Safe area handling for mobile devices
        paddingTop:
          isMobile && !shouldPositionAtBottom
            ? "env(safe-area-inset-top)"
            : undefined,
        paddingBottom: isMobile ? "env(safe-area-inset-bottom)" : undefined,
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {notifications.map((notification) => (
          <MobileNotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
            isMobile={isMobile}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface MobileNotificationItemProps {
  notification: MobileNotification;
  onClose: () => void;
  isMobile: boolean;
}

const MobileNotificationItem = React.forwardRef<
  HTMLDivElement,
  MobileNotificationItemProps
>(({ notification, onClose, isMobile }, ref) => {
  const handleClose = () => {
    // Immediate removal on mobile/tablet to avoid glitchy animation
    onClose();
  };

  const getTypeColors = (type: MobileNotification["type"]) => {
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
        scale: isMobile ? 0.95 : 0.8,
        x: isMobile ? 0 : 100,
        y: isMobile ? -10 : 0,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.98,
        transition: {
          duration: 0.2,
          ease: "easeOut",
        },
      }}
      transition={{
        type: "tween",
        duration: isMobile ? 0.15 : 0.2,
        ease: "easeOut",
      }}
      className={cn(
        "relative group notification-item pointer-events-auto",
        isMobile
          ? "mb-3 animate-enhanced-mobile-float-1"
          : "mb-3 animate-float",
      )}
      style={{
        willChange: "transform, opacity",
      }}
      ref={ref}
    >
      {/* Main notification content - matching original styling with integrated border */}
      <div
        className={cn(
          "relative rounded-xl shadow-2xl transition-all overflow-hidden",
          isMobile
            ? "backdrop-blur-md duration-200 p-3 pr-10"
            : "backdrop-blur-xl duration-300 p-4 pr-12",
        )}
        style={{
          background: isMobile
            ? "rgba(0, 0, 0, 0.95)" // Almost solid black for mobile to block background
            : "rgba(0, 0, 0, 0.85)", // Slightly less opaque for tablet
          backdropFilter: isMobile ? "blur(10px)" : "blur(20px)", // Reduced blur on mobile for performance
          border: `1px solid ${colors.border}`,
          boxShadow: `
            0 0 50px ${colors.glow},
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Minimal floating particles for mobile */}
        {isMobile ? (
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
        ) : null}

        {/* Desktop particles */}
        {!isMobile ? (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-30"
                style={{
                  left: `${10 + ((i * 20) % 80)}%`,
                  top: `${20 + ((i * 30) % 60)}%`,
                  width: `${1 + (i % 2)}px`,
                  height: `${1 + (i % 2)}px`,
                  background: colors.accent,
                  animation: `gentleFloat ${2 + (i % 2)}s ease-in-out infinite ${i * 0.5}s`,
                  filter: "blur(0.5px)",
                }}
              />
            ))}
          </div>
        ) : null}

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
          whileHover={isMobile ? undefined : { scale: 1.05, rotate: 45 }}
          whileTap={isMobile ? { scale: 0.95 } : { scale: 0.9, rotate: 90 }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <X className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
        </motion.button>

        {/* Content */}
        <div
          className={cn(
            "space-y-1 relative z-10",
            isMobile ? "space-y-0.5" : "space-y-1",
          )}
        >
          <motion.h4
            className={cn(
              "font-semibold text-white",
              isMobile
                ? "text-xs"
                : "text-sm sm:text-base animate-text-glow-pulse",
            )}
            initial={{ opacity: 0, y: isMobile ? 5 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: isMobile ? 0.05 : 0.1,
              duration: isMobile ? 0.15 : 0.2,
            }}
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
            initial={{ opacity: 0, y: isMobile ? 3 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: isMobile ? 0.08 : 0.2,
              duration: isMobile ? 0.15 : 0.2,
            }}
          >
            {notification.message}
          </motion.p>

          {/* Action button */}
          {notification.action ? (
            <motion.button
              onClick={notification.action.onClick}
              className={cn(
                "mt-2 text-xs font-medium rounded-md px-2 py-1",
                "bg-white/20 hover:bg-white/30 text-white",
                "transition-colors duration-150",
                "border border-white/20",
              )}
              whileTap={{ scale: isMobile ? 0.98 : 0.95 }}
            >
              {notification.action.label}
            </motion.button>
          ) : null}
        </div>

        {/* Accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
          }}
        />

        {/* Progress bar for timed notifications */}
        {notification.duration && notification.duration > 0 ? (
          <motion.div
            className="absolute bottom-0 left-0 h-1 rounded-b-xl"
            style={{
              background: colors.accent,
              transformOrigin: "left"
            }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{
              duration: notification.duration / 1000,
              ease: "linear",
            }}
          />
        ) : null}
      </div>
    </motion.div>
  );
});

MobileNotificationItem.displayName = "MobileNotificationItem";

// Helper hook for easy usage
export const useMobileNotificationHelpers = () => {
  const { addNotification, removeNotification, clearAll, notifications } =
    useMobileNotifications();

  const showSuccess = (
    title: string,
    description: string,
    duration: number = 0,
  ) => {
    addNotification({ title, message: description, type: "success", duration });
  };

  const showError = (
    title: string,
    description: string,
    duration: number = 0,
  ) => {
    addNotification({ title, message: description, type: "error", duration });
  };

  const showWarning = (
    title: string,
    description: string,
    duration: number = 0,
  ) => {
    addNotification({ title, message: description, type: "warning", duration });
  };

  const showInfo = (
    title: string,
    description: string,
    duration: number = 0,
  ) => {
    addNotification({ title, message: description, type: "info", duration });
  };

  const showWithAction = (
    title: string,
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    type: MobileNotification["type"] = "info",
  ) => {
    addNotification({
      title,
      message,
      type,
      action: {
        label: actionLabel,
        onClick: actionCallback,
      },
    });
  };

  const show = (notification: Omit<MobileNotification, "id">) => {
    addNotification(notification);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showWithAction,
    show,
    remove: removeNotification,
    clearAll,
    notifications,
    count: notifications.length,
  };
};
