import "./global.css";
import "./mobile-text-performance.css";
import "./performance-optimizations.css";

import React, { Suspense } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "@/hooks/use-theme";
import { RetroModeProvider } from "./hooks/use-retro-mode";
import { PinkThemeProvider } from "./hooks/use-pink-theme";
import { HelpModalProvider, useHelpModal } from "./hooks/use-help-modal";
import { UnifiedNotificationProvider } from "./components/ui/unified-notification";
import { ErrorBoundary } from "./components/ui/error-boundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Optimized QueryClient with performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component with reduced animation for better performance
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-lg text-gray-600 dark:text-gray-300">Loading KOR...</p>
    </div>
  </div>
);

// Wrapper component to connect help modal state to notifications
const NotificationWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isHelpModalOpen, setIsHelpModalOpen } = useHelpModal();

  return (
    <UnifiedNotificationProvider
      isHelpModalOpen={isHelpModalOpen}
      setIsHelpModalOpen={setIsHelpModalOpen}
    >
      {children}
    </UnifiedNotificationProvider>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PinkThemeProvider>
          <RetroModeProvider>
            <HelpModalProvider>
              <NotificationWrapper>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <Suspense fallback={<LoadingFallback />}>
                    <Index />
                  </Suspense>
                </TooltipProvider>
              </NotificationWrapper>
            </HelpModalProvider>
          </RetroModeProvider>
        </PinkThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
