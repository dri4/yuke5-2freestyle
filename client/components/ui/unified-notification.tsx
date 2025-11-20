import React from "react";
import { NotificationProvider } from "./floating-notification";
import { MobileNotificationProvider } from "./mobile-notification";
import { useDeviceType } from "@/hooks/use-device-type";

// Always provide both contexts to avoid timing issues
export const UnifiedNotificationProvider: React.FC<{
  children: React.ReactNode;
  isHelpModalOpen?: boolean;
  setIsHelpModalOpen?: (isOpen: boolean) => void;
}> = ({ children, isHelpModalOpen, setIsHelpModalOpen }) => {
  return (
    <NotificationProvider>
      <MobileNotificationProvider
        isHelpModalOpen={isHelpModalOpen}
        setIsHelpModalOpen={setIsHelpModalOpen}
      >
        {children}
      </MobileNotificationProvider>
    </NotificationProvider>
  );
};

// Import both notification systems
import { useFloatingNotifications } from "@/hooks/use-floating-notifications";
import { useMobileNotificationHelpers } from "./mobile-notification";

// Export a unified hook that works with both systems
export const useUnifiedNotifications = () => {
  const deviceType = useDeviceType();

  try {
    if (deviceType === "desktop") {
      return useFloatingNotifications();
    } else {
      return useMobileNotificationHelpers();
    }
  } catch (error) {
    // Fallback if any context is not available
    console.warn("Notification context not available, using fallback", error);
    return {
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
      remove: () => {},
      clearAll: () => {},
      notifications: [],
      count: 0,
    };
  }
};
